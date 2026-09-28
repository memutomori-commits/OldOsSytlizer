# Промт: установить Retro Bevel в Figma через Figma MCP

Скопируйте текст ниже в Claude, у которого подключён Figma MCP (инструменты `mcp__Figma__*`)
и открыт этот репозиторий. Плагин попадёт в библиотеку аккаунта Figma как generative plugin;
Figma Desktop и «Import plugin from manifest» не нужны. Манифест при этом генерирует Figma,
через MCP заменяются только `code.ts` и `ui.html`.

---

Установи плагин Retro Bevel из этого репозитория в мою учётную запись Figma через Figma MCP как generative plugin (в Figma это обычный плагин из библиотеки аккаунта). Исходники готовы: `code.js` и `ui.html` в корне репозитория. Ничего в них не переписывай и не «улучшай»: стиль Win95 в `ui.html` намеренный, PropsKit-контролы (`fig-*`) не нужны, плагин должен оставаться открытым после применения.

Порядок:

1. Загрузи скилл `figma-generative-plugins` (`skill://figma/figma-generative-plugins/SKILL.md`) и его справочник `references/authoring.md`. Без этого инструменты создания и обновления плагина вызывать нельзя.
2. Вызови `whoami` и возьми `planKey` из списка планов. Если планов несколько и они разные, спроси меня, какой использовать.
3. Вызови `create_generative_plugin` один раз: name `Retro Bevel`, description `Бевели Win95 для выделенных шейпов: Raised, Sunken, Pressed, Etched`, planKey из шага 2. Запомни возвращённый id.
4. Вызови `get_generative_plugin` с этим id и прочитай все файлы каркаса: `manifest.json`, `code.ts`, `ui.html`. Проверь, что в манифесте `editorType: ["figma"]`, `documentAccess: "dynamic-page"` и есть поле `ui`. Если манифест несовместим, остановись и сообщи мне: менять манифест через MCP нельзя.
5. Собери содержимое для замены:
   - `code.ts` = первая строка `// @ts-nocheck`, перевод строки, затем содержимое `code.js` без изменений. Код написан на чистом JS, без этой строки строгая типизация TypeScript даёт ошибки implicit any; с ней файл проверен под `tsc --strict` с типами `@figma/plugin-typings`.
   - Если манифест каркаса объявляет `relaunchButtons`, перенеси из каркасного `code.ts` вызов `figma.root.setRelaunchData(...)` с той же командой в начало нашего `code.ts`, сразу после `'use strict';`. Если `relaunchButtons` нет, ничего не добавляй.
   - `ui.html` = содержимое нашего `ui.html` без изменений.
6. Вызови `update_generative_plugin` с id, `files: [{ path: "code.ts", content: <code.ts> }, { path: "ui.html", content: <ui.html> }]` и commitMessage `Retro Bevel: Win95 bevel presets (Raised, Sunken, Pressed, Etched)`. При ошибке сборки исправь минимально по тексту компилятора и повтори один раз; если не помогло, покажи мне ошибку целиком и не переписывай плагин.
7. Отчитайся: имя, id, версия (если вернулась) и ссылка на новый файл с плагином:
   `https://www.figma.com/file/new?try-tool-resource-content-id=<id>&try-tool-resource-type=gen_tool&type=design&mode=design`
   Напомни, что те же два query-параметра можно добавить к URL любого моего Design-файла, чтобы открыть плагин в нём.

Что должно получиться: плагин Retro Bevel в библиотеке аккаунта с панелью 300×240 в стиле Win95, четыре пресета с превью, кнопка «Сбросить», статус «Выделите шейп», пока нет подходящего выделения. Клик по пресету у выделенных шейпов выставляет cornerRadius 0, заливку пресета, Effect Style «Win95 / <name>» и целые x, y, width, height.

Если файлов репозитория у тебя нет, возьми их из GitHub:
- https://raw.githubusercontent.com/memutomori-commits/OldOsSytlizer/claude/figma-retro-bevel-plugin-d0x6g2/code.js
- https://raw.githubusercontent.com/memutomori-commits/OldOsSytlizer/claude/figma-retro-bevel-plugin-d0x6g2/ui.html
