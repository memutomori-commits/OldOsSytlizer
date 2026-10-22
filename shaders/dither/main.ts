import { defineProperties } from "figma:shaders"

export default function Effect() {}

export function setup(device, frame) {
  var wgsl = `diagnostic(off,derivative_uniformity);
struct Uniforms {
  size: vec4f,   // width, height, cellSize, levels
  ctrl: vec4f,   // strength, mode, algorithm, angle(rad)
  dark: vec4f,
  light: vec4f,
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

fn bayer(p: vec2i, bits: i32) -> f32 {
  var v: i32 = 0;
  var n: f32 = 1.0;
  for (var k: i32 = 0; k < 3; k = k + 1) {
    if (k < bits) {
      let xb = (p.x >> u32(k)) & 1;
      let yb = (p.y >> u32(k)) & 1;
      v = v * 4 + ((xb ^ yb) * 2) + yb;
      n = n * 4.0;
    }
  }
  return (f32(v) + 0.5) / n - 0.5;
}

fn hash2(p: vec2f) -> f32 {
  let h = dot(p, vec2f(127.1, 311.7));
  return fract(sin(h) * 43758.5453123);
}

fn ign(p: vec2f) -> f32 {
  return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let dims = u.size.xy;
  let cell = max(u.size.z, 1.0);
  let levels = max(u.size.w, 2.0);
  let strength = clamp(u.ctrl.x, 0.0, 1.0);
  let mode = u.ctrl.y;
  let algo = u.ctrl.z;
  let ang = u.ctrl.w;

  let px = uv * dims;
  let c = cos(ang); let s = sin(ang);
  let ctr = dims * 0.5;
  let rp = vec2f(c * (px.x - ctr.x) - s * (px.y - ctr.y), s * (px.x - ctr.x) + c * (px.y - ctr.y)) + ctr;
  let cellIdx = floor(rp / cell);
  let cellCenterR = cellIdx * cell + vec2f(cell * 0.5);
  let d = cellCenterR - ctr;
  let sp = vec2f(c * d.x + s * d.y, -s * d.x + c * d.y) + ctr;
  let centerUv = clamp(sp / dims, vec2f(0.0), vec2f(1.0));

  let src = textureSampleLevel(inputTex, samp, centerUv, 0.0);
  let orig = textureSampleLevel(inputTex, samp, uv, 0.0);

  let a = max(src.a, 0.0001);
  let straight = src.rgb / a;

  var t: f32 = 0.0;
  let ci = vec2i(cellIdx);
  if (algo < 0.5) {
    t = bayer(ci, 1);
  } else if (algo < 1.5) {
    t = bayer(ci, 2);
  } else if (algo < 2.5) {
    t = bayer(ci, 3);
  } else if (algo < 3.5) {
    t = ign(cellIdx) - 0.5;
  } else if (algo < 4.5) {
    t = hash2(cellIdx) - 0.5;
  } else {
    let f = fract(cellIdx / 8.0) - vec2f(0.5);
    let dist = length(f) / 0.7071;
    t = clamp(dist, 0.0, 1.0) - 0.5;
  }

  let steps = levels - 1.0;
  let lum = dot(straight, vec3f(0.299, 0.587, 0.114));
  let ql = clamp(floor(lum * steps + t + 0.5) / steps, 0.0, 1.0);

  var q = vec3f(0.0);
  if (mode < 0.5) {
    q = floor(straight * steps + t + 0.5) / steps;
  } else if (mode < 1.5) {
    q = straight * (ql / max(lum, 0.0001));
  } else if (mode < 2.5) {
    q = vec3f(ql);
  } else {
    q = mix(u.dark.rgb, u.light.rgb, ql);
  }
  q = clamp(q, vec3f(0.0), vec3f(1.0));
  let dithered = vec4f(q * src.a, src.a);
  return mix(orig, dithered, strength);
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

  frame.state.uniforms = device.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST })
  frame.state.sampler = device.createSampler({ magFilter: 'nearest', minFilter: 'nearest', addressModeU: 'clamp-to-edge', addressModeV: 'clamp-to-edge' })

  frame.state.placeholder = device.createTexture({ size: [1, 1, 1], format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST })
  device.queue.writeTexture({ texture: frame.state.placeholder }, new Uint8Array([0, 0, 0, 0]), { bytesPerRow: 4 }, { width: 1, height: 1, depthOrArrayLayers: 1 })
}

export function render(device, frame) {
  var p = frame.params || {}

  // Собирает итоговые значения параметров: слайдеры -> выбранный пресет -> «Preset code».
  // Код пресета: пары `ключ=значение` через запятую, точку с запятой или перенос строки,
  // например `algorithm=2, levels=3, cellSize=4, dark=#0F380F`. Ключи без учёта регистра.
  var resolveParams = function (p, presetList, keys) {
    var num = function (v, d) { var n = Number(v); return Number.isFinite(n) ? n : d }
    var ov = {}
    var sel = Math.round(num(p.preset, 0))
    if (sel > 0 && presetList[sel - 1]) {
      var pv = presetList[sel - 1].values
      for (var k in pv) ov[k] = pv[k]
    }
    var byLower = {}
    for (var i = 0; i < keys.length; i++) byLower[keys[i].toLowerCase()] = keys[i]
    var code = String(p.presetCode == null ? '' : p.presetCode)
    var parts = code.split(/[,;\n]+/)
    for (var j = 0; j < parts.length; j++) {
      var m = /^\s*([A-Za-z]+)\s*[=:]\s*(#[0-9A-Fa-f]{6}|-?[0-9]*\.?[0-9]+)\s*$/.exec(parts[j])
      if (!m) continue
      var key = byLower[m[1].toLowerCase()]
      if (!key) continue
      var raw = m[2]
      if (raw.charAt(0) === '#') {
        var n = parseInt(raw.slice(1), 16)
        ov[key] = { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 }
      } else {
        ov[key] = Number(raw)
      }
    }
    return {
      num: function (k, d) { return num(ov[k] !== undefined ? ov[k] : p[k], d) },
      color: function (k, dr, dg, db) {
        var c = ov[k] !== undefined ? ov[k] : p[k]
        if (c == null || typeof c !== 'object') c = {}
        return [num(c.r, dr), num(c.g, dg), num(c.b, db), 1]
      },
    }
  }

  // PRESETS-BEGIN (генерируется из shaders/presets.json, не править руками)
  var presetList = [
    { name: "Mac 1-bit", values: { algorithm: 1, mode: 2, cellSize: 1, levels: 2, strength: 1, angle: 0 } },
    { name: "Game Boy", values: { algorithm: 1, mode: 3, cellSize: 3, levels: 4, strength: 1, angle: 0, dark: {"r":0.058823529411764705,"g":0.2196078431372549,"b":0.058823529411764705,"a":1}, light: {"r":0.6078431372549019,"g":0.7372549019607844,"b":0.058823529411764705,"a":1} } },
    { name: "Win95 palette", values: { algorithm: 2, mode: 0, cellSize: 2, levels: 2, strength: 1, angle: 0 } },
    { name: "Newspaper", values: { algorithm: 5, mode: 2, cellSize: 4, levels: 2, strength: 1, angle: 45 } },
    { name: "Film grain", values: { algorithm: 4, mode: 1, cellSize: 1, levels: 6, strength: 0.8, angle: 0 } },
    { name: "Amber terminal", values: { algorithm: 3, mode: 3, cellSize: 2, levels: 4, strength: 1, angle: 0, dark: {"r":0.10196078431372549,"g":0.054901960784313725,"b":0,"a":1}, light: {"r":1,"g":0.6901960784313725,"b":0,"a":1} } },
  ]
  // PRESETS-END

  var v = resolveParams(p, presetList, ['algorithm', 'mode', 'cellSize', 'levels', 'strength', 'angle', 'dark', 'light'])
  var dark = v.color('dark', 0.06, 0.1, 0.2)
  var light = v.color('light', 0.95, 0.95, 0.88)

  device.queue.writeBuffer(frame.state.uniforms, 0, new Float32Array([
    frame.output.width, frame.output.height, v.num('cellSize', 2), v.num('levels', 4),
    v.num('strength', 1), v.num('mode', 0), v.num('algorithm', 1), v.num('angle', 0) * Math.PI / 180,
    dark[0], dark[1], dark[2], 1,
    light[0], light[1], light[2], 1,
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
    { label: "Mac 1-bit", value: 1 },
    { label: "Game Boy", value: 2 },
    { label: "Win95 palette", value: 3 },
    { label: "Newspaper", value: 4 },
    { label: "Film grain", value: 5 },
    { label: "Amber terminal", value: 6 },
  ] },
  // PRESET-OPTIONS-END
  algorithm: { type: 'number', label: 'Algorithm', defaultValue: 1, control: 'select', options: [
    { label: 'Bayer 2×2', value: 0 }, { label: 'Bayer 4×4', value: 1 }, { label: 'Bayer 8×8', value: 2 },
    { label: 'Gradient noise', value: 3 }, { label: 'White noise', value: 4 }, { label: 'Halftone', value: 5 } ] },
  mode: { type: 'number', label: 'Output', defaultValue: 0, control: 'select', options: [
    { label: 'Color', value: 0 }, { label: 'Luma', value: 1 }, { label: 'Mono', value: 2 }, { label: 'Two-tone', value: 3 } ] },
  cellSize: { type: 'number', label: 'Cell size', defaultValue: 2, control: 'slider', min: 1, max: 12, step: 1, unit: 'px' },
  levels: { type: 'number', label: 'Levels', defaultValue: 4, control: 'slider', min: 2, max: 16, step: 1 },
  strength: { type: 'number', label: 'Strength', defaultValue: 1, control: 'slider', min: 0, max: 1, step: 0.01 },
  angle: { type: 'number', label: 'Grid angle', defaultValue: 0, control: 'slider', min: 0, max: 90, step: 1, unit: '°' },
  dark: { type: 'color', label: 'Two-tone dark', defaultValue: { r: 0.06, g: 0.1, b: 0.2, a: 1 } },
  light: { type: 'color', label: 'Two-tone light', defaultValue: { r: 0.95, g: 0.95, b: 0.88, a: 1 } },
  presetCode: { type: 'string', label: 'Preset code', defaultValue: '' },
})
