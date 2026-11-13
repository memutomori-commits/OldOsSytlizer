// Shader Presets — плагин Figma для шейдеров Dither и CRT Display.
// Кнопка «Копировать» собирает Preset code из настроек выделенного слоя
// (с учётом выбранного пресета и сдвинутых слайдеров), кнопка «Применить»
// записывает код в шейдеры выделенных слоёв прямыми значениями слайдеров.

const UI_SIZE = { width: 320, height: 440 };

type Rgb = { r: number; g: number; b: number };
type PresetValue = number | (Rgb & { a: number });
type PresetTable = Record<string, { name: string; values: Record<string, PresetValue> }[]>;

// Библиотечные id наших шейдеров: по ним плагин добавляет эффект на слой, где его ещё нет.
const SHADER_LIBRARY_IDS: Record<string, string> = {
  'CRT Display': '40021a79-a9cf-4bbc-bf79-130d5321027c',
  Dither: '1ec99a62-ff35-4e69-b133-f8c07e419d53',
};

// Служебные контролы шейдера: в код не попадают, при применении сбрасываются.
const PRESET_KEY = 'preset';
const CODE_KEY = 'presetCode';

// PRESETS-BEGIN (генерируется из shaders/presets.json, не править руками)
const PRESETS: PresetTable = {
  "CRT Display": [
    { name: "Trinitron", values: { pattern: 0, pixelSize: 2, softness: 0.5, pitch: 6, tint: 0.6, gapWidth: 0.2, gapDark: 0.5, scanlines: 0.1, scanPitch: 3, fringe: 1, glow: 0.3, glowRadius: 5, gain: 1.3, curvature: 0.05, vignette: 0.15, strength: 1 } },
    { name: "Arcade", values: { pattern: 0, pixelSize: 6, softness: 0.3, pitch: 9, tint: 0.85, gapWidth: 0.35, gapDark: 0.8, scanlines: 0.35, scanPitch: 6, fringe: 2, glow: 0.6, glowRadius: 8, gain: 1.5, curvature: 0.35, vignette: 0.4, strength: 1 } },
    { name: "Mono terminal", values: { pattern: 2, pixelSize: 3, softness: 0.4, pitch: 4, tint: 0.3, gapWidth: 0.15, gapDark: 0.5, scanlines: 0.4, scanPitch: 3, fringe: 0, glow: 0.7, glowRadius: 10, gain: 1.4, curvature: 0.2, vignette: 0.3, strength: 1 } },
    { name: "Old TV", values: { pattern: 0, pixelSize: 8, softness: 0.9, pitch: 12, tint: 0.5, gapWidth: 0.3, gapDark: 0.6, scanlines: 0.25, scanPitch: 8, fringe: 4, glow: 0.5, glowRadius: 12, gain: 1.25, curvature: 0.6, vignette: 0.5, strength: 1 } },
    { name: "Subtle", values: { pattern: 0, pixelSize: 1, softness: 1, pitch: 3, tint: 0.3, gapWidth: 0.1, gapDark: 0.3, scanlines: 0.08, scanPitch: 2, fringe: 0.5, glow: 0.2, glowRadius: 4, gain: 1.15, curvature: 0, vignette: 0.1, strength: 1 } },
    { name: "Clubs", values: { pattern: 0, pixelSize: 11, softness: 0, pitch: 8, tint: 0.62, gapWidth: 0.09, gapDark: 0.6, scanlines: 0.31, scanPitch: 4, fringe: 1.5, glow: 0.87, glowRadius: 1, gain: 1.35, curvature: 0, vignette: 0.25, strength: 1 } },
  ],
  "Dither": [
    { name: "Mac 1-bit", values: { algorithm: 1, mode: 2, cellSize: 1, levels: 2, strength: 1, angle: 0 } },
    { name: "Game Boy", values: { algorithm: 1, mode: 3, cellSize: 3, levels: 4, strength: 1, angle: 0, dark: {"r":0.058823529411764705,"g":0.2196078431372549,"b":0.058823529411764705,"a":1}, light: {"r":0.6078431372549019,"g":0.7372549019607844,"b":0.058823529411764705,"a":1} } },
    { name: "Win95 palette", values: { algorithm: 2, mode: 0, cellSize: 2, levels: 2, strength: 1, angle: 0 } },
    { name: "Newspaper", values: { algorithm: 5, mode: 2, cellSize: 4, levels: 2, strength: 1, angle: 45 } },
    { name: "Film grain", values: { algorithm: 4, mode: 1, cellSize: 1, levels: 6, strength: 0.8, angle: 0 } },
    { name: "Amber terminal", values: { algorithm: 3, mode: 3, cellSize: 2, levels: 4, strength: 1, angle: 0, dark: {"r":0.10196078431372549,"g":0.054901960784313725,"b":0,"a":1}, light: {"r":1,"g":0.6901960784313725,"b":0,"a":1} } },
    { name: "Clubs", values: { algorithm: 1, mode: 0, cellSize: 2, levels: 4, strength: 1, angle: 0, dark: {"r":0.058823529411764705,"g":0.10196078431372549,"b":0.2,"a":1}, light: {"r":0.9490196078431372,"g":0.9490196078431372,"b":0.8784313725490196,"a":1} } },
  ],
};
// PRESETS-END

// ---------------------------------------------------------------------------
// Разбор и сборка Preset code (тот же формат, что понимает поле Preset code шейдера)
// ---------------------------------------------------------------------------
type ParsedCode = { shader: string | null; values: Record<string, PresetValue> };

function hexToRgba(hex: string): Rgb & { a: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 };
}

function rgbToHex(c: Rgb): string {
  const h = (v: number): string => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0').toUpperCase();
  return '#' + h(c.r) + h(c.g) + h(c.b);
}

function parseCode(text: string): ParsedCode {
  const result: ParsedCode = { shader: null, values: {} };
  for (const part of text.split(/[,;\n]+/)) {
    const tag = /^\s*shader\s*[=:]\s*(.+?)\s*$/i.exec(part);
    if (tag) {
      result.shader = tag[1];
      continue;
    }
    const m = /^\s*([A-Za-z]+)\s*[=:]\s*(#[0-9A-Fa-f]{6}|-?[0-9]*\.?[0-9]+)\s*$/.exec(part);
    if (!m) continue;
    result.values[m[1]] = m[2].charAt(0) === '#' ? hexToRgba(m[2]) : Number(m[2]);
  }
  return result;
}

function formatNumber(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

function buildCode(shaderName: string, values: Record<string, PresetValue>): string {
  const parts: string[] = ['shader=' + shaderName];
  for (const key of Object.keys(values)) {
    const v = values[key];
    parts.push(key + '=' + (typeof v === 'number' ? formatNumber(v) : rgbToHex(v)));
  }
  return parts.join(', ');
}

// ---------------------------------------------------------------------------
// Чтение шейдеров со слоя
// ---------------------------------------------------------------------------
type ShaderOnNode = {
  index: number;
  name: string;
  shader: Shader;
  defs: { [defId: string]: ShaderPropertyDefinition };
  effect: ShaderEffect;
};

function hasEffects(node: SceneNode): node is SceneNode & { effects: ReadonlyArray<Effect> } {
  return 'effects' in node;
}

function isRgb(v: unknown): v is Rgb {
  return typeof v === 'object' && v !== null && 'r' in v && 'g' in v && 'b' in v;
}

function toPresetValue(v: ShaderPropertyValue | undefined): PresetValue | null {
  if (typeof v === 'number') return v;
  if (isRgb(v)) return { r: v.r, g: v.g, b: v.b, a: 1 };
  return null;
}

function nearlyDefault(value: PresetValue | null, def: PresetValue | null): boolean {
  if (value === null || def === null) return true;
  if (typeof value === 'number' && typeof def === 'number') return Math.abs(value - def) < 0.0005;
  if (typeof value === 'object' && typeof def === 'object') {
    return Math.abs(value.r - def.r) < 0.002 && Math.abs(value.g - def.g) < 0.002 && Math.abs(value.b - def.b) < 0.002;
  }
  return false;
}

async function readShaders(node: SceneNode): Promise<ShaderOnNode[]> {
  const result: ShaderOnNode[] = [];
  if (!hasEffects(node)) return result;
  for (let index = 0; index < node.effects.length; index++) {
    const effect = node.effects[index];
    if (effect.type !== 'SHADER') continue;
    const shader = await figma.importShaderById(effect.id);
    const defs = shader.propertyDefinitions;
    if (!defs) continue;
    result.push({ index, name: shader.name, shader, defs, effect });
  }
  return result;
}

function defIdByName(defs: { [defId: string]: ShaderPropertyDefinition }, name: string): string | null {
  for (const id of Object.keys(defs)) if (defs[id].name === name) return id;
  return null;
}

// Итоговые значения так же, как их считает шейдер:
// Preset code -> сдвинутый слайдер -> пресет -> слайдер.
function effectiveValues(entry: ShaderOnNode): Record<string, PresetValue> {
  const props = entry.effect.properties || {};
  const current: Record<string, PresetValue | null> = {};
  const defaults: Record<string, PresetValue | null> = {};
  let presetIndex = 0;
  let code = '';
  for (const id of Object.keys(entry.defs)) {
    const def = entry.defs[id];
    if (def.name === PRESET_KEY) {
      const v = props[id];
      presetIndex = typeof v === 'number' ? Math.round(v) : 0;
      continue;
    }
    if (def.name === CODE_KEY) {
      const v = props[id];
      code = typeof v === 'string' ? v : '';
      continue;
    }
    if (def.type !== 'NUMBER' && def.type !== 'COLOR') continue;
    current[def.name] = toPresetValue(props[id]);
    defaults[def.name] = toPresetValue(def.defaultValue);
  }
  const table = PRESETS[entry.name] || [];
  const preset = presetIndex > 0 && table[presetIndex - 1] ? table[presetIndex - 1].values : {};
  const fromCode = parseCode(code).values;

  const out: Record<string, PresetValue> = {};
  for (const key of Object.keys(current)) {
    let v: PresetValue | null = current[key];
    if (fromCode[key] !== undefined) v = fromCode[key];
    else if (preset[key] !== undefined && nearlyDefault(current[key], defaults[key])) v = preset[key];
    if (v === null) v = defaults[key];
    if (v !== null) out[key] = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Применение кода к выделению
// ---------------------------------------------------------------------------
async function findLibraryShader(name: string): Promise<Shader | null> {
  const libraryId = SHADER_LIBRARY_IDS[name];
  const shaders = await figma.listAvailableShaders();
  let found: Shader | null = null;
  for (const s of shaders) {
    if (s.type !== 'effect' || s.name !== name) continue;
    if (libraryId && s.id.indexOf(libraryId) === 0) return s;
    if (!found) found = s;
  }
  return found;
}

function matchCount(defs: { [defId: string]: ShaderPropertyDefinition }, values: Record<string, PresetValue>): number {
  let n = 0;
  for (const key of Object.keys(values)) if (defIdByName(defs, key) !== null) n++;
  return n;
}

async function applyToNode(node: SceneNode, parsed: ParsedCode, addMissing: boolean): Promise<boolean> {
  if (!hasEffects(node)) return false;
  const onNode = await readShaders(node);

  // Целевой шейдер: по тегу shader=…, иначе тот, где совпало больше ключей.
  let target: ShaderOnNode | null = null;
  if (parsed.shader) {
    for (const entry of onNode) if (entry.name === parsed.shader) target = entry;
  } else {
    let best = 0;
    for (const entry of onNode) {
      const n = matchCount(entry.defs, parsed.values);
      if (n > best) {
        best = n;
        target = entry;
      }
    }
  }

  const effects = node.effects.slice();
  let defs: { [defId: string]: ShaderPropertyDefinition };
  let properties: { [defId: string]: ShaderPropertyValue };
  let index: number;
  let shaderId: string;
  let visible = true;

  if (target) {
    defs = target.defs;
    properties = Object.assign({}, target.effect.properties || {});
    index = target.index;
    shaderId = target.effect.id;
    visible = target.effect.visible;
  } else {
    if (!addMissing || !parsed.shader) return false;
    const library = await findLibraryShader(parsed.shader);
    if (!library) return false;
    const imported = await figma.importShaderById(library.id);
    if (!imported.propertyDefinitions) return false;
    defs = imported.propertyDefinitions;
    properties = {};
    index = effects.length;
    shaderId = imported.id;
  }

  let written = 0;
  for (const key of Object.keys(parsed.values)) {
    const id = defIdByName(defs, key);
    if (id === null) continue;
    const def = defs[id];
    const value = parsed.values[key];
    if (def.type === 'NUMBER' && typeof value === 'number') {
      properties[id] = value;
      written++;
    } else if (def.type === 'COLOR' && typeof value === 'object') {
      properties[id] = value;
      written++;
    }
  }
  if (written === 0) return false;

  // Значения легли в слайдеры, пресет и код больше не нужны.
  const presetId = defIdByName(defs, PRESET_KEY);
  if (presetId !== null) properties[presetId] = 0;
  const codeId = defIdByName(defs, CODE_KEY);
  if (codeId !== null) properties[codeId] = '';

  const effect: ShaderEffect = { type: 'SHADER', visible, id: shaderId, properties };
  effects[index] = effect;
  node.effects = effects;
  return true;
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
type UiMessage =
  | { type: 'ready' }
  | { type: 'apply'; code: string; addMissing: boolean };

function isUiMessage(value: unknown): value is UiMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as { type?: unknown; code?: unknown; addMissing?: unknown };
  if (message.type === 'ready') return true;
  return message.type === 'apply' && typeof message.code === 'string' && typeof message.addMissing === 'boolean';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

let readToken = 0;

async function sendSelection(): Promise<void> {
  const token = ++readToken;
  const selection = figma.currentPage.selection;
  const source = selection.find(hasEffects) || null;
  const shaders: { name: string; code: string }[] = [];
  if (source) {
    try {
      for (const entry of await readShaders(source)) {
        shaders.push({ name: entry.name, code: buildCode(entry.name, effectiveValues(entry)) });
      }
    } catch (error) {
      figma.notify('Shader Presets: ' + errorMessage(error), { error: true });
    }
  }
  if (token !== readToken) return; // выделение успело поменяться
  figma.ui.postMessage({
    type: 'selection',
    total: selection.length,
    layerName: source ? source.name : '',
    shaders,
  });
}

async function applyCode(code: string, addMissing: boolean): Promise<void> {
  const parsed = parseCode(code);
  if (Object.keys(parsed.values).length === 0) {
    figma.notify('Shader Presets: в коде нет ни одного параметра', { error: true });
    return;
  }
  let changed = 0;
  for (const node of figma.currentPage.selection) {
    if (await applyToNode(node, parsed, addMissing)) changed++;
  }
  if (changed === 0) {
    figma.notify('Shader Presets: на выделенных слоях нет подходящего шейдера', { error: true });
  } else {
    figma.notify('Shader Presets: применено к ' + changed + ' сло' + (changed === 1 ? 'ю' : 'ям'));
    figma.commitUndo();
  }
  await sendSelection();
}

function registerRelaunchButton(): void {
  const command = figma.pluginId;
  if (command === undefined) return;
  try {
    figma.root.setRelaunchData({ [command]: '' });
  } catch {
    // Манифест без такой команды: кнопка просто не появится.
  }
}

registerRelaunchButton();
figma.showUI(__html__, { width: UI_SIZE.width, height: UI_SIZE.height, title: 'Shader Presets' });

async function handleUiMessage(message: UiMessage): Promise<void> {
  try {
    switch (message.type) {
      case 'ready':
        await sendSelection();
        break;
      case 'apply':
        await applyCode(message.code, message.addMissing);
        break;
    }
  } catch (error) {
    figma.notify('Shader Presets: ' + errorMessage(error), { error: true });
  }
}

figma.ui.onmessage = (message: unknown) => {
  if (isUiMessage(message)) void handleUiMessage(message);
};

figma.on('selectionchange', () => {
  void sendSelection();
});
figma.on('currentpagechange', () => {
  void sendSelection();
});
