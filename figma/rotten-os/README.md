# Rotten OS — скрипты сборки страницы «CLUBS /  MAIN 4»

Страница **CLUBS /  MAIN 4** в файле Figma `nauetSvKmcBNlynjR3p4Rp` — перенос дизайна
MAIN 3 (Clubs Scan) в стиль 1-bit error-window: три цвета (чёрный, белый, синий #0112FD),
пиксельные шрифты, стопки окон-ошибок, штриховой дизеринг. Страница собрана через
Figma MCP (`use_figma`) этими скриптами; они сохранены, чтобы стиль можно было
воспроизвести, доработать или перенести на другую страницу.

## Как запускать

Каждый файл `0N-*.js` — тело одного вызова `use_figma`. Перед ним вставляется
содержимое `00-kit.js` (хелперы: палитра `C`, шрифты `F`, темы окон `TH`, `W` — окно,
`D` — диалог, `BTN`, `TAG`, `CB`, `FIELD`, `PROG`, `TASKBAR`, `DICON`, `TOOLBOX`,
`PHOTO` с дуотоном и `DITHER`). Порядок: 01 → 07. Id узлов (`890:7684` — страница,
`890:7694` — череп, `117:27` — ворона из DESIGN KIT, `847:7026` — маскот с MAIN 3)
зашиты в скрипты под текущий файл; для другого файла их нужно заменить.

Проверка синтаксиса без Figma:

    (echo "(async()=>{"; cat 00-kit.js 02-wallet-overview.js; echo "})()") > /tmp/chk.js && node --check /tmp/chk.js

## Что на странице

| Секция | Содержимое |
|---|---|
| 00 · README | описание палитры, шрифтов, окон, правил |
| 00 · KIT — Rotten OS | компоненты: Window ×5 тем, Dialog ×6, Button, Tag, Checkbox, Field, Progress, Toolbox, Taskbar, Desktop icons, Skull / Mac 5000 / Detective (1-bit) |
| 01–05 сети | Wallet Overview + Transaction Detail для ETH, SOL, POL, BTC, TRON (2079×1740) |
| 06 One Image Post | Paint-окно с тулбоксом и фото (1454×1454) |
| 07 Carousel Cover | TECTONIC EXPLOIT $75M (2175×2175) |
| 08 Carousel Post | Explorer 01–04 (1365) и Help Topics 01–04 (1454) |
| 09 Video Post | Media Player (1863×1290) |
| 10 Dossier | Arrest Dossier (2079×2286) |
| 11 Twitter Reposts | Single, Thread, Repost + comment (1651×1414) |
| 13 Assistant | 7 вариантов Clubs Code (760×980) |
| 14 Crow Run | квадрат 760 и полоса 2039 |

Секция 12 (Transactions Finding) с MAIN 3 не переносилась: это черновики, итог которых — экраны 01–05.

## Ограничения

- Шрифты PP Mondwest / PP NeueBit недоступны серверной сборке MCP, вместо них
  Press Start 2P, VT323, Doto Black, IBM Plex Mono.
- Паттерн-заливка (`PATTERN`) в этой версии Plugin API отклоняется, поэтому дизеринг —
  два пунктирных вектора (`DITHER`), а не тайл.
- `PHOTO`: ч/б + контраст, синий слой blend LIGHTEN, штриховка 28 %. Фото меняются заменой image fill
  у слоя «… — REPLACE HERE (fill)».
