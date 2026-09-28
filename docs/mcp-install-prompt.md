# Промт: установить Retro Bevel в Figma через Figma MCP

Скопируйте текст ниже в Claude, у которого подключён Figma MCP (инструменты `mcp__Figma__*`)
и открыт этот репозиторий. Плагин попадёт в библиотеку аккаунта Figma как generative plugin;
Figma Desktop и «Import plugin from manifest» не нужны. Манифест при этом генерирует Figma,
через MCP заменяются только `code.ts` и `ui.html`. Сборка Figma компилирует `code.ts` строгим
TypeScript и прогоняет ESLint (`@ts-nocheck` запрещён), поэтому в репозитории лежит именно
типизированный `code.ts`.

---

Установи или обнови плагин Retro Bevel из этого репозитория в моей учётной записи Figma через Figma MCP как generative plugin (в Figma это обычный плагин из библиотеки аккаунта). Исходники готовы: `code.ts` и `ui.html` в корне репозитория. Ничего в них не переписывай и не «улучшай»: `code.ts` уже на строгом TypeScript с типами `@figma/plugin-typings` и проходит `tsc --strict` и ESLint (typescript-eslint с проверкой типов плюс правила `@figma/eslint-plugin-figma-plugins`); стиль Win95 в `ui.html` намеренный, PropsKit-контролы (`fig-*`) не нужны; плагин должен оставаться открытым после применения.

Порядок:

1. Загрузи скилл `figma-generative-plugins` (`skill://figma/figma-generative-plugins/SKILL.md`) и его справочник `references/authoring.md`. Без этого инструменты создания и обновления плагина вызывать нельзя.
2. Вызови `list_generative_plugins` и найди плагин с именем `Retro Bevel`, владелец — мой аккаунт. Если он есть, возьми его id и переходи к шагу 3. Если нет, вызови `whoami`, возьми `planKey` из списка планов (если планов несколько и они разные, спроси меня) и вызови `create_generative_plugin` один раз: name `Retro Bevel`, description `Бевели Win95 для выделенных шейпов: Raised, Sunken, Pressed, Etched`. Запомни возвращённый id.
3. Вызови `get_generative_plugin` с этим id и прочитай файлы каркаса: `manifest.json`, `code.ts`, `ui.html`. Проверь, что в манифесте `editorType: ["figma"]`, `documentAccess: "dynamic-page"`, есть `ui` и `relaunchButtons` с командой, равной id плагина. Если манифест другой, остановись и сообщи мне: менять манифест через MCP нельзя.
4. Вызови `update_generative_plugin` с id, `files: [{ path: "code.ts", content: <наш code.ts без изменений> }, { path: "ui.html", content: <наш ui.html без изменений> }]` и commitMessage `Retro Bevel: Win95 bevel presets (Raised, Sunken, Pressed, Etched)`. Кнопку повторного запуска `code.ts` регистрирует сам через `figma.root.setRelaunchData({ [figma.pluginId]: '' })`, ничего добавлять не нужно. При ошибке сборки исправь минимально по тексту компилятора и повтори один раз; если не помогло, покажи мне ошибку целиком и не переписывай плагин.
5. Отчитайся: имя, id, версия (если вернулась) и ссылка на новый файл с плагином:
   `https://www.figma.com/file/new?try-tool-resource-content-id=<id>&try-tool-resource-type=gen_tool&type=design&mode=design`
   Напомни, что те же два query-параметра можно добавить к URL любого моего Design-файла, чтобы открыть плагин в нём.

Что должно получиться: плагин Retro Bevel в библиотеке аккаунта с панелью 300×240 в стиле Win95, четыре пресета с превью, кнопка «Сбросить», статус «Выделите шейп», пока нет подходящего выделения. Клик по пресету у выделенных шейпов выставляет cornerRadius 0, заливку пресета, Effect Style «Win95 / <name>» и целые x, y, width, height.

Если файлов репозитория у тебя нет, возьми их из GitHub:
- https://raw.githubusercontent.com/memutomori-commits/OldOsSytlizer/claude/figma-retro-bevel-plugin-d0x6g2/code.ts
- https://raw.githubusercontent.com/memutomori-commits/OldOsSytlizer/claude/figma-retro-bevel-plugin-d0x6g2/ui.html
