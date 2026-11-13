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

## Id в библиотеке нового аккаунта (team «memut», `team::1702940310596284805`, 2026-11-13)

| Ресурс | Тип | id |
|---|---|---|
| Retro Bevel | plugin | `196132e8-a70f-4d80-a4d4-ec6915309cfc` |
| Desktop Scatter | plugin | `81e68fb2-31c0-4d3a-82a6-b4e9927a3624` |
| Window Frame | plugin | `d06c9de3-87f9-4480-bac7-43999ca6e8ae` |
| Shader Toggle | plugin | `32c5d7a4-7bfe-4251-93d8-ec3f2a87f2b9` |
| Shader Presets | plugin | `0f6a6cef-b906-4870-9ce7-fdb8593585cd` |
| KD Pixelize | plugin | `e0003f01-7e25-44c6-aa93-ade864dd5aed` |
| Dither | effect | `1ec99a62-ff35-4e69-b133-f8c07e419d53` |
| CRT Display | effect | `40021a79-a9cf-4bbc-bf79-130d5321027c` |

Ссылка «попробовать в новом файле»:
`https://www.figma.com/file/new?try-tool-resource-content-id=<id>&try-tool-resource-type=gen_tool&type=design&mode=design`
(для шейдеров `try-tool-resource-type=gen_effect`). Обновление кода: `update_generative_plugin` /
`update_shader` с этими id. Старые id (аккаунт developer@brickagency.email) больше не действуют.
