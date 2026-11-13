# Перенос инструментов Figma на новый аккаунт

Ветка `claude/project-thread-0xicii` собирает код всех инструментов из разных веток в одно место,
чтобы поставить их на любой аккаунт Figma.

## Плагины (6)

| Папка              | Плагин         | Что делает                                                              |
|--------------------|----------------|-------------------------------------------------------------------------|
| `.` (корень)       | Retro Bevel    | Бевели Win95 (Raised / Sunken / Pressed / Etched) через Effect Style     |
| `desktop-scatter/` | Desktop Scatter| Раскладка иконок/окон по «рабочему столу»                                |
| `window-frame/`    | Window Frame   | Окно-рамка «WHO??» (тайтл-бар с градиентом, пиксельные кнопки) вокруг слоя|
| `shader-toggle/`   | Shader Toggle  | Выключить/включить все шейдерные эффекты на странице или в выделении     |
| `shader-presets/`  | Shader Presets | Копировать/применять Preset code шейдеров Dither и CRT Display           |
| `kd-pixelize/`     | KD Pixelize    | KD-tree пикселизация людей на фото (TensorFlow.js + BodyPix из CDN)      |

Каждая папка самодостаточна: `manifest.json`, `code.js` (собран и закоммичен), `ui.html`.

### Ручная установка (Figma Desktop, любой seat)

1. Склонировать репозиторий или скачать ветку zip-архивом.
2. В Figma Desktop: **Plugins → Development → Import plugin from manifest…**
3. Выбрать `manifest.json` нужной папки. Повторить для каждого плагина.
4. Плагины появятся в **Plugins → Development**. Они привязаны к этому компьютеру, а не к аккаунту.

Id в манифестах уникальны (`…645` … `…650`), поэтому все шесть можно держать одновременно.
После правок в `code.ts` — `npm ci && npm run build`.

### Установка через Figma MCP (нужен Full seat)

Создание generative plugin и шейдера через MCP (`create_generative_plugin`, `create_shader`)
на seat **View** отклоняется: «You don't seem to have permission to do that». Со seat Full:
`create_generative_plugin` → `update_generative_plugin` с полным `code.ts` + `ui.html` из папки.
Manifest при этом генерирует Figma, папочный `manifest.json` не нужен.

## Шейдеры (2)

`shaders/dither/main.ts` и `shaders/crt/main.ts` — эффекты Dither и CRT Display с пресетами
(`shaders/presets.json`, `node shaders/bake-presets.js`). Шейдеры живут только в библиотеке
аккаунта Figma и ставятся только через MCP (`create_shader kind: effect` → `update_shader`
с `main.ts`). Ручного импорта шейдеров в Figma нет. Подробности в `shaders/README.md`.

## Старый аккаунт

Id ресурсов старого аккаунта (developer@brickagency.email) перечислены в README каждой папки
и в `shaders/README.md`; на новом аккаунте id будут другие — после создания впишите их туда.
