import { defineProperties } from "figma:shaders"

export default function Effect() {}

export function setup(device, frame) {
  var wgsl = `diagnostic(off,derivative_uniformity);
struct Uniforms {
  a: vec4f, // width, height, pixelSize, softness
  b: vec4f, // pitch, tint, gapWidth, gapDark
  c: vec4f, // scanPitch, scanStrength, fringe, gain
  d: vec4f, // strength, pattern, 0, 0
  e: vec4f, // curvature, vignette, glow, glowRadius
};
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var inputTex: texture_2d<f32>;

struct VsIn { @location(0) pos: vec2f, @location(1) uv: vec2f };
struct VsOut { @builtin(position) position: vec4f, @location(0) uv: vec2f };

@vertex fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.position = vec4f(in.pos, 0.0, 1.0);
  out.uv = in.uv;
  return out;
}

fn tap(p: vec2f, dims: vec2f) -> vec4f {
  let t = clamp(p / dims, vec2f(0.0), vec2f(1.0));
  return textureSampleLevel(inputTex, samp, t, 0.0);
}

// Average colour of one virtual pixel cell (4 bilinear taps).
fn cellColor(ci: vec2f, cell: f32, dims: vec2f) -> vec4f {
  let base = ci * cell;
  let q = cell * 0.25;
  var acc = tap(base + vec2f(q, q), dims);
  acc = acc + tap(base + vec2f(3.0 * q, q), dims);
  acc = acc + tap(base + vec2f(q, 3.0 * q), dims);
  acc = acc + tap(base + vec2f(3.0 * q, 3.0 * q), dims);
  return acc * 0.25;
}

// Pixelated colour with a tunable soft transition between neighbouring cells.
fn softPixel(p: vec2f, cell: f32, soft: f32, dims: vec2f) -> vec4f {
  let g = p / cell - vec2f(0.5);
  let ci = floor(g);
  let f = g - ci;
  let k = 1.0 / max(soft, 0.001);
  let w = clamp((f - vec2f(0.5)) * k + vec2f(0.5), vec2f(0.0), vec2f(1.0));
  let c00 = cellColor(ci, cell, dims);
  let c10 = cellColor(ci + vec2f(1.0, 0.0), cell, dims);
  let c01 = cellColor(ci + vec2f(0.0, 1.0), cell, dims);
  let c11 = cellColor(ci + vec2f(1.0, 1.0), cell, dims);
  return mix(mix(c00, c10, w.x), mix(c01, c11, w.x), w.y);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let dims = u.a.xy;
  let cell = max(u.a.z, 1.0);
  let soft = clamp(u.a.w, 0.0, 1.0);
  let pitch = max(u.b.x, 3.0);
  let tintAmt = clamp(u.b.y, 0.0, 1.0);
  let gapW = clamp(u.b.z, 0.0, 0.9);
  let gapDark = clamp(u.b.w, 0.0, 1.0);
  let scanPitch = max(u.c.x, 1.0);
  let scanAmt = clamp(u.c.y, 0.0, 1.0);
  let fringe = u.c.z;
  let gain = max(u.c.w, 0.0);
  let strength = clamp(u.d.x, 0.0, 1.0);
  let pattern = u.d.y;
  let curv = max(u.e.x, 0.0);
  let vigAmt = clamp(u.e.y, 0.0, 1.0);
  let glowAmt = max(u.e.z, 0.0);
  let glowR = max(u.e.w, 0.5);

  let orig = textureSampleLevel(inputTex, samp, uv, 0.0);

  // Barrel curvature of the tube: pull the picture towards the centre.
  let cc = uv * 2.0 - vec2f(1.0);
  let r2 = dot(cc, cc);
  let wuv = (cc * (1.0 + curv * r2 * 0.15)) * 0.5 + vec2f(0.5);
  let bd = min(min(wuv.x, 1.0 - wuv.x) * dims.x, min(wuv.y, 1.0 - wuv.y) * dims.y);
  let inside = clamp(bd + 0.5, 0.0, 1.0);

  let px = wuv * dims;   // picture space (pixelation, fringe, glow)
  let spx = uv * dims;   // screen space (grille, scanlines)

  // Soft pixelation with horizontal colour fringing (R and B shifted apart).
  let sr = softPixel(px + vec2f(fringe, 0.0), cell, soft, dims);
  let sg = softPixel(px, cell, soft, dims);
  let sb = softPixel(px - vec2f(fringe, 0.0), cell, soft, dims);
  let a = max(max(sr.a, sg.a), sb.a);
  var col = vec3f(sr.r, sg.g, sb.b) / max(a, 0.0001);

  // Phosphor glow: wide, cheap bloom from the bright parts of the picture.
  var gl = tap(px + vec2f(glowR, glowR), dims);
  gl = gl + tap(px + vec2f(-glowR, glowR), dims);
  gl = gl + tap(px + vec2f(glowR, -glowR), dims);
  gl = gl + tap(px + vec2f(-glowR, -glowR), dims);
  gl = gl * 0.25;
  let gs = gl.rgb / max(gl.a, 0.0001);
  let glow = gs * gs * glowAmt * gl.a;

  // Aperture grille: three vertical subpixel columns per pitch.
  let sub = pitch / 3.0;
  let sx = spx.x / sub;
  let idx = floor(sx - 3.0 * floor(sx / 3.0));
  let fr = fract(sx);
  let low = 1.0 - tintAmt;
  var tint = vec3f(1.0);
  if (pattern < 0.5) {
    if (idx < 0.5) { tint = vec3f(1.0, low, low); }
    else if (idx < 1.5) { tint = vec3f(low, 1.0, low); }
    else { tint = vec3f(low, low, 1.0); }
  } else if (pattern < 1.5) {
    if (idx < 0.5) { tint = vec3f(low, low, 1.0); }
    else if (idx < 1.5) { tint = vec3f(low, 1.0, low); }
    else { tint = vec3f(1.0, low, low); }
  }
  let aa = 0.5 / sub;
  let gapMask = smoothstep(gapW - aa, gapW + aa, fr);
  let gapFactor = select(mix(1.0 - gapDark, 1.0, gapMask), 1.0, gapW < 0.001);

  // Horizontal scanlines.
  let sy = spx.y / scanPitch;
  let scan = 1.0 - scanAmt * (0.5 - 0.5 * cos(6.28318530718 * sy));

  // Vignette towards the tube corners.
  let vig = 1.0 - vigAmt * smoothstep(0.35, 1.45, length(cc));

  let masked = col * gain * tint * gapFactor * scan;
  col = clamp((masked + glow) * vig, vec3f(0.0), vec3f(1.0));
  let result = vec4f(col * a, a) * inside;
  return mix(orig, result, strength);
}
`
  frame.state.module = device.createShaderModule({ code: wgsl })
  frame.state.pipeline = null
  frame.state.pipelineFormat = null

  frame.state.quad = device.createBuffer({ size: 6 * 4 * 4, usage: GPUBufferUsage.VERTEX, mappedAtCreation: true })
  new Float32Array(frame.state.quad.getMappedRange()).set([
    -1, -1, 0, 1,  1, -1, 1, 1,  -1, 1, 0, 0,
    -1, 1, 0, 0,   1, -1, 1, 1,   1, 1, 1, 0,
  ])
  frame.state.quad.unmap()

  frame.state.uniforms = device.createBuffer({ size: 80, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  frame.state.sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })

  frame.state.placeholder = device.createTexture({ size: [1, 1, 1], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST })
  device.queue.writeTexture({ texture: frame.state.placeholder }, new Uint8Array([0, 0, 0, 0]), { bytesPerRow: 4 }, { width: 1, height: 1, depthOrArrayLayers: 1 })
}

export function render(device, frame) {
  var p = frame.params || {}

  // Собирает итоговые значения параметров. Приоритет: «Preset code» -> сдвинутый слайдер -> пресет -> слайдер.
  // Слайдер считается сдвинутым, если его значение отличается от дефолта: так пресет можно донастраивать.
  // Чтобы вернуть параметру значение из пресета, поставьте слайдер обратно на дефолт.
  // Код пресета: пары `ключ=значение` через запятую, точку с запятой или перенос строки,
  // например `algorithm=2, levels=3, cellSize=4, dark=#0F380F`. Ключи без учёта регистра.
  var resolveParams = function (p, presetList, defaults) {
    var num = function (v, d) { var n = Number(v); return Number.isFinite(n) ? n : d }
    var keys = Object.keys(defaults)
    var preset = {}
    var sel = Math.round(num(p.preset, 0))
    if (sel > 0 && presetList[sel - 1]) {
      var pv = presetList[sel - 1].values
      for (var k in pv) preset[k] = pv[k]
    }
    var code = {}
    var byLower = {}
    for (var i = 0; i < keys.length; i++) byLower[keys[i].toLowerCase()] = keys[i]
    var text = String(p.presetCode == null ? '' : p.presetCode)
    var parts = text.split(/[,;\n]+/)
    for (var j = 0; j < parts.length; j++) {
      var m = /^\s*([A-Za-z]+)\s*[=:]\s*(#[0-9A-Fa-f]{6}|-?[0-9]*\.?[0-9]+)\s*$/.exec(parts[j])
      if (!m) continue
      var key = byLower[m[1].toLowerCase()]
      if (!key) continue
      var raw = m[2]
      if (raw.charAt(0) === '#') {
        var n = parseInt(raw.slice(1), 16)
        code[key] = { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 }
      } else {
        code[key] = Number(raw)
      }
    }
    var isDefault = function (k) {
      var d = defaults[k]
      var v = p[k]
      if (v == null) return true
      if (typeof d === 'object') {
        if (typeof v !== 'object') return true
        return Math.abs(num(v.r, d.r) - d.r) < 0.002 && Math.abs(num(v.g, d.g) - d.g) < 0.002 && Math.abs(num(v.b, d.b) - d.b) < 0.002
      }
      return Math.abs(num(v, d) - d) < 0.0005
    }
    var pick = function (k) {
      if (code[k] !== undefined) return code[k]
      if (preset[k] !== undefined && isDefault(k)) return preset[k]
      return p[k]
    }
    return {
      num: function (k) { return num(pick(k), defaults[k]) },
      color: function (k) {
        var d = defaults[k]
        var c = pick(k)
        if (c == null || typeof c !== 'object') c = {}
        return [num(c.r, d.r), num(c.g, d.g), num(c.b, d.b), 1]
      },
    }
  }

  // PRESETS-BEGIN (генерируется из shaders/presets.json, не править руками)
  var presetList = [
    { name: "Trinitron", values: { pattern: 0, pixelSize: 2, softness: 0.5, pitch: 6, tint: 0.6, gapWidth: 0.2, gapDark: 0.5, scanlines: 0.1, scanPitch: 3, fringe: 1, glow: 0.3, glowRadius: 5, gain: 1.3, curvature: 0.05, vignette: 0.15, strength: 1 } },
    { name: "Arcade", values: { pattern: 0, pixelSize: 6, softness: 0.3, pitch: 9, tint: 0.85, gapWidth: 0.35, gapDark: 0.8, scanlines: 0.35, scanPitch: 6, fringe: 2, glow: 0.6, glowRadius: 8, gain: 1.5, curvature: 0.35, vignette: 0.4, strength: 1 } },
    { name: "Mono terminal", values: { pattern: 2, pixelSize: 3, softness: 0.4, pitch: 4, tint: 0.3, gapWidth: 0.15, gapDark: 0.5, scanlines: 0.4, scanPitch: 3, fringe: 0, glow: 0.7, glowRadius: 10, gain: 1.4, curvature: 0.2, vignette: 0.3, strength: 1 } },
    { name: "Old TV", values: { pattern: 0, pixelSize: 8, softness: 0.9, pitch: 12, tint: 0.5, gapWidth: 0.3, gapDark: 0.6, scanlines: 0.25, scanPitch: 8, fringe: 4, glow: 0.5, glowRadius: 12, gain: 1.25, curvature: 0.6, vignette: 0.5, strength: 1 } },
    { name: "Subtle", values: { pattern: 0, pixelSize: 1, softness: 1, pitch: 3, tint: 0.3, gapWidth: 0.1, gapDark: 0.3, scanlines: 0.08, scanPitch: 2, fringe: 0.5, glow: 0.2, glowRadius: 4, gain: 1.15, curvature: 0, vignette: 0.1, strength: 1 } },
    { name: "Clubs", values: { pattern: 0, pixelSize: 11, softness: 0, pitch: 8, tint: 0.62, gapWidth: 0.09, gapDark: 0.6, scanlines: 0.31, scanPitch: 4, fringe: 1.5, glow: 0.87, glowRadius: 1, gain: 1.35, curvature: 0, vignette: 0.25, strength: 1 } },
  ]
  // PRESETS-END

  // Дефолты должны совпадать с defaultValue в defineProperties ниже.
  var v = resolveParams(p, presetList, {
    pattern: 0, pixelSize: 4, softness: 0.6, pitch: 6, tint: 0.7, gapWidth: 0.25, gapDark: 0.6,
    scanlines: 0.15, scanPitch: 4, fringe: 1.5, glow: 0.4, glowRadius: 6, gain: 1.35, curvature: 0.15, vignette: 0.25, strength: 1,
  })

  device.queue.writeBuffer(frame.state.uniforms, 0, new Float32Array([
    frame.output.width, frame.output.height, v.num('pixelSize'), v.num('softness'),
    v.num('pitch'), v.num('tint'), v.num('gapWidth'), v.num('gapDark'),
    v.num('scanPitch'), v.num('scanlines'), v.num('fringe'), v.num('gain'),
    v.num('strength'), v.num('pattern'), 0, 0,
    v.num('curvature'), v.num('vignette'), v.num('glow'), v.num('glowRadius'),
  ]))

  var inputView = frame.input != null ? frame.input.createView() : frame.state.placeholder.createView()

  var outputFormat = frame.output.format
  if (frame.state.pipeline == null || frame.state.pipelineFormat !== outputFormat) {
    frame.state.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: frame.state.module, entryPoint: 'vs_main', buffers: [{ arrayStride: 16, attributes: [
        { shaderLocation: 0, format: 'float32x2', offset: 0 }, { shaderLocation: 1, format: 'float32x2', offset: 8 } ] }] },
      fragment: { module: frame.state.module, entryPoint: 'fs_main', targets: [{ format: outputFormat }] },
      primitive: { topology: 'triangle-list' },
    })
    frame.state.pipelineFormat = outputFormat
  }

  var bindGroup = device.createBindGroup({ layout: frame.state.pipeline.getBindGroupLayout(0), entries: [
    { binding: 0, resource: { buffer: frame.state.uniforms } },
    { binding: 1, resource: frame.state.sampler },
    { binding: 2, resource: inputView },
  ] })

  var encoder = device.createCommandEncoder()
  var pass = encoder.beginRenderPass({ colorAttachments: [{ view: frame.output.createView(), loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 0 }, storeOp: 'store' }] })
  pass.setPipeline(frame.state.pipeline)
  pass.setBindGroup(0, bindGroup)
  pass.setVertexBuffer(0, frame.state.quad)
  pass.draw(6)
  pass.end()
  device.queue.submit([encoder.finish()])
}

defineProperties(Effect, {
  // PRESET-OPTIONS-BEGIN (генерируется из shaders/presets.json, не править руками)
  preset: { type: 'number', label: 'Preset', defaultValue: 0, control: 'select', options: [
    { label: 'Custom (sliders)', value: 0 },
    { label: "Trinitron", value: 1 },
    { label: "Arcade", value: 2 },
    { label: "Mono terminal", value: 3 },
    { label: "Old TV", value: 4 },
    { label: "Subtle", value: 5 },
    { label: "Clubs", value: 6 },
  ] },
  // PRESET-OPTIONS-END
  pattern: { type: 'number', label: 'Grille', defaultValue: 0, control: 'select', options: [
    { label: 'RGB stripes', value: 0 }, { label: 'BGR stripes', value: 1 }, { label: 'Mono stripes', value: 2 } ] },
  pixelSize: { type: 'number', label: 'Pixel size', defaultValue: 4, control: 'slider', min: 1, max: 32, step: 1, unit: 'px' },
  softness: { type: 'number', label: 'Pixel softness', defaultValue: 0.6, control: 'slider', min: 0, max: 1, step: 0.01 },
  pitch: { type: 'number', label: 'Grille pitch', defaultValue: 6, control: 'slider', min: 3, max: 24, step: 1, unit: 'px' },
  tint: { type: 'number', label: 'Grille tint', defaultValue: 0.7, control: 'slider', min: 0, max: 1, step: 0.01 },
  gapWidth: { type: 'number', label: 'Gap width', defaultValue: 0.25, control: 'slider', min: 0, max: 0.8, step: 0.01 },
  gapDark: { type: 'number', label: 'Gap darkness', defaultValue: 0.6, control: 'slider', min: 0, max: 1, step: 0.01 },
  scanlines: { type: 'number', label: 'Scanlines', defaultValue: 0.15, control: 'slider', min: 0, max: 1, step: 0.01 },
  scanPitch: { type: 'number', label: 'Scanline pitch', defaultValue: 4, control: 'slider', min: 1, max: 16, step: 1, unit: 'px' },
  fringe: { type: 'number', label: 'Color fringe', defaultValue: 1.5, control: 'slider', min: 0, max: 8, step: 0.1, unit: 'px' },
  glow: { type: 'number', label: 'Phosphor glow', defaultValue: 0.4, control: 'slider', min: 0, max: 2, step: 0.01 },
  glowRadius: { type: 'number', label: 'Glow radius', defaultValue: 6, control: 'slider', min: 1, max: 24, step: 1, unit: 'px' },
  gain: { type: 'number', label: 'Brightness', defaultValue: 1.35, control: 'slider', min: 0.5, max: 2.5, step: 0.01 },
  curvature: { type: 'number', label: 'Screen curvature', defaultValue: 0.15, control: 'slider', min: 0, max: 1, step: 0.01 },
  vignette: { type: 'number', label: 'Vignette', defaultValue: 0.25, control: 'slider', min: 0, max: 1, step: 0.01 },
  strength: { type: 'number', label: 'Strength', defaultValue: 1, control: 'slider', min: 0, max: 1, step: 0.01 },
  presetCode: { type: 'string', label: 'Preset code', defaultValue: '' },
})
