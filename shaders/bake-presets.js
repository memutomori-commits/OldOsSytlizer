// Вшивает пресеты из presets.json в main.ts обоих шейдеров.
// Запуск: node shaders/bake-presets.js
// Правит только текст между маркерами PRESETS-BEGIN / PRESETS-END.
'use strict'
const fs = require('fs')
const path = require('path')

const root = __dirname
const presets = JSON.parse(fs.readFileSync(path.join(root, 'presets.json'), 'utf8'))

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim())
  if (!m) throw new Error('Цвет должен быть в виде #RRGGBB, получено: ' + hex)
  const n = parseInt(m[1], 16)
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: 1 }
}

function literal(v) {
  if (typeof v === 'string') return JSON.stringify(hexToRgb(v))
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  throw new Error('Значение пресета должно быть числом или цветом #RRGGBB: ' + JSON.stringify(v))
}

function bake(file, list) {
  const src = fs.readFileSync(file, 'utf8')
  const tableBlock =
    '  // PRESETS-BEGIN (генерируется из shaders/presets.json, не править руками)\n' +
    '  var presetList = [\n' +
    list.map((p) => '    { name: ' + JSON.stringify(p.name) + ', values: { ' +
      Object.keys(p.values).map((k) => k + ': ' + literal(p.values[k])).join(', ') + ' } },').join('\n') +
    '\n  ]\n' +
    '  // PRESETS-END'
  const optionsBlock =
    '  // PRESET-OPTIONS-BEGIN (генерируется из shaders/presets.json, не править руками)\n' +
    '  preset: { type: \'number\', label: \'Preset\', defaultValue: 0, control: \'select\', options: [\n' +
    '    { label: \'Custom (sliders)\', value: 0 },\n' +
    list.map((p, i) => '    { label: ' + JSON.stringify(p.name) + ', value: ' + (i + 1) + ' },').join('\n') +
    '\n  ] },\n' +
    '  // PRESET-OPTIONS-END'
  let out = src.replace(/  \/\/ PRESETS-BEGIN[\s\S]*?\/\/ PRESETS-END/, tableBlock)
  out = out.replace(/  \/\/ PRESET-OPTIONS-BEGIN[\s\S]*?\/\/ PRESET-OPTIONS-END/, optionsBlock)
  if (out === src) console.log('без изменений: ' + file)
  else { fs.writeFileSync(file, out); console.log('обновлён: ' + file) }
}

bake(path.join(root, 'dither', 'main.ts'), presets.dither)
bake(path.join(root, 'crt', 'main.ts'), presets.crt)
