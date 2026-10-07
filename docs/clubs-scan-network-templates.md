# Clubs Scan — шаблоны по сетям

Файл Figma `clubs_main`. Все готовые фреймы собраны на странице **CLUBS / MAIN 2** в секциях
по сетям (черновики и исходники остались на CLUBS / TEST). Фреймы 2079×1740, внутри секций
в ряд с отступом 160, секции с шагом 320 по вертикали.

| Секция | Фрейм (имя слоя) | node id | Сид Desktop Scatter |
|--------|------------------|---------|---------------------|
| 00 · README | текст с картой страницы и палитрой | `615:2` | — |
| 01 · Ethereum | Clubs Scan / 01 ETH — Wallet Overview (brick) | `490:1758` | 420 |
| 01 · Ethereum | Clubs Scan / 03 ETH — Wallet Overview · EVM victim (brick) | `547:4485` | 421 |
| 01 · Ethereum | Clubs Scan / 04 ETH — Transaction Detail (brick), эталон раскладки | `548:4684` | 422 |
| 02 · Solana | Clubs Scan / 05 SOL — Wallet Overview (brick) | `549:4902` | 423 |
| 02 · Solana | Clubs Scan / 06 SOL — Transaction Detail (brick) | `550:5101` | 424 |
| 03 · DAI on Polygon | Clubs Scan / 07 DAI — Transaction Detail · Polygon swap (brick) | `565:5319` | 425 |
| 04 · Bitcoin | Clubs Scan / 08 BTC — Wallet Overview (brick) | `601:5846` | 426 |
| 04 · Bitcoin | Clubs Scan / 09 BTC — Transaction Detail (brick) | `600:5628` | 427 |
| 05 · TRON | Clubs Scan / 10 TRX — Wallet Overview (brick) | `607:6263` | 428 |
| 05 · TRON | Clubs Scan / 11 TRX — Transaction Detail (brick) | `606:6045` | 429 |
| 06 · Desktop Cascade | Transaction Detail — Desktop Cascade (brick) | `584:5539` | 5 |
| 07 · Carousel Cover | Carousel Cover / Win95 Alert — Tectonic (brick) | `611:2328` | — |
| 08 · Carousel Post | Carousel Post / Explorer — 01…04 (окно Clubs Explorer, 1365×1367) | бывшая группа ONE IMAGE POST v2 | — |
| 08 · Carousel Post | Carousel Post / Help Topics — 01…04 (окно clubs system image view, 1454×1454) | бывшая группа ONE IMAGE POST v1 | — |
| 09 · Video Post | Video Post / Win98 Windows Media Player (brick) — заглушка под видео, 1863×1290 | `617:15391` | — |
| 10 · Dossier | Dossier / Katerini Crypto (2026-10) — Arrest Dossier (brick): поля Name / Alias / Case / Charges / Amount / Arrested / Status / Max sentence, кнопка COPY в тулбаре | `534:4448` | — |
| 11 · Transactions Finding | Transactions Finding / 01…06 — шесть ранних вариантов Transaction Detail и Wallet Overview (поиск формы), группы обёрнуты во фреймы | `625:6449` | — |
| 12 · One Image Post | One Image Post / Paint — arrest (1454×1454): Paint brick с фото, ворон в тайтл-баре, подписи CLUBS в статус-баре, стол с ярлыками, таскбар, Notepad, Processing, слой Dither | `634:4526` | 7 |

Фрейм 02 (TRON-исходник) удалён пользователем; его данные живут в 10 и 11.

## Что откуда

- **Retro Bevel** — бевели Win95 на окнах, полях, тегах и кнопках. Клон сохраняет эффекты
  исходника (inner shadows из пресетов Raised / Sunken), поэтому новые фреймы ничем не
  отличаются от шаблона; если править форму слоя, пресет накладывается плагином заново.
- **Desktop Scatter** — ярлыки на рабочем столе. В каждом клоне старый результат удалён и
  собран заново по алгоритму плагина (mulberry32 + раскладка столбцами) с параметрами
  шаблона: 7 ярлыков, масштаб 60 %, зазор 24, поля 40, хаос 0, по сетке, стрелка ярлыка.
  Сид у каждого фрейма свой (таблица выше), поэтому порядок ярлыков разный. Тот же результат
  получится, если выделить прямоугольник `Desktop` во фрейме и запустить плагин с этим сидом;
  плагин тогда положит свой слой рядом, старый `Desktop scatter · seed N` нужно удалить руками
  (у собранного скриптом слоя нет служебных plugin data).
- **Dither** (шейдер-эффект) — прямоугольник `Post_Shader — Dither` поверх всего фрейма, как в
  шаблоне скрыт (Bayer 4×4, cell 1, levels 6, strength 1). Включается видимостью слоя.
- Фрейм 07 — клон 04, заполненный по скриншоту Polygonscan: хеш `0x915ecc…8445b`, блок
  94869210, 80 691 подтверждение, 2026-10-03 06:29:15 UTC, from/to из скриншота, контракт
  DAI (PoS), 39 ERC-20 переводов; вместо hex-дампа — список из шести свопов DAI/MALT на
  QuickSwap. Монета DAI собрана из бевел-подложки ETH-иконки Win98 и глифа DAI из top 100.
- Монета SOL во фрейме 06 — клон `sol` из `Crypto icons — top 10 / Windows 98` (`161:98`),
  увеличена до 87 px; у USDT (EVM) оставлена монета шаблона.

## Что меняется по сети

| Элемент | EVM (Ethereum mainnet) | SOL (Solana mainnet-beta) |
|---------|------------------------|---------------------------|
| Адреса | `0x…` 42 символа, шрифт в полях 26 px | base58 44 символа, шрифт 25 px |
| Хеш транзакции | `0x…` 66 символов, 27 px | подпись 88 символов, 20.5 px, подпись «SIGNATURE» |
| Номер блока | `block 25981037` | `slot 440215633` |
| Статусы | SUCCESSFUL · CONFIRMED · 200+ BLOCKS | SUCCESSFUL · FINALIZED · 32+ CONFIRMATIONS |
| Контракт | `CONTRACT · USDT ERC-20` + адрес контракта Tether | `PROGRAM · SYSTEM TRANSFER` + `1111…1111` |
| Отправитель | FROM | SIGNER |
| Таблица кошелька | Txn hash · Method · Block · Age · To · Amount · Txn fee | Signature · Type · Slot · Age · To / Program · Amount · Fee (SOL) |
| Чекбоксы сети | ERC-20 · MAINNET · 200+ BLOCKS · GAS 65,012 | SYSTEM PROGRAM · MAINNET-BETA · 32+ SLOTS · 450 CU |
| Статус-бар | `EVM wallet · Ethereum mainnet (chain id 1) · etherscan.io` | `SOL wallet · Solana mainnet-beta · solscan.io` |

Сюжет у всех четырёх один — address poisoning: кошелёк-жертва, bait-перевод с адреса-двойника
за минуту до основного и сам перевод на двойника (тег `BAIT ADDRESS`). Входящие строки в
таблице помечены зелёным тегом `IN` (#007A3D), исходящие — красным `OUT` из шаблона.
Колонка Amount расширена со 110 до 160 px, чтобы влезали суммы вида `499,000 USDT`.

## Ограничения

Шрифты PP Mondwest и PP NeueBit в сборке Figma MCP недоступны, поэтому тексты на них
(`CLUBS SCAN`, `[WALLET OVERVIEW]`, `[TRANSACTION DETAIL]`, `FROM (Sender)`, `TO (Receiver)`)
не редактировались и остались как в шаблоне. Адреса, хеши и подписи в новых фреймах —
выдуманные, кроме публичных контрактов (USDT ERC-20, System Program Solana).

## Цвета сетей (после утверждения фрейма 04)

Фрейм 04 (EVM) утверждён как эталон раскладки Transaction Detail: сумма в утопленном поле над
стрелками, без заголовка TRANSFER. Контент окна TOKEN TRANSFER в 06 и 07 — клон контента 04 с
данными своих сетей. Исходный красный эталона (#C1281A / #8B0002 / #C52317 / #CD0003 / #B51316) перекрашивается по таблице; остальные
красные заливки (если появятся) — поворотом hue с сохранением S/L.

| Роль | Ethereum (01, 03, 04) | Solana (05, 06) | DAI (07) | Bitcoin (08, 09) | TRON (10, 11) |
|------|------------------|-----------------|----------|------------------|---------------|
| Тайтл-бар окна | градиент #4F67E8 → #9FB0F7 | #8A3CF2 | #E09A1E | #E07E12 | #A91013 |
| Фон шапки | #1E2B6B | #2E0F6B | #7A4D00 | #7A3E00 | #8B0002 |
| Win95 / Title Bar (инстанс) | тот же градиент | #8F40F5 | #E39F22 | #E6831A | #A91013 |
| Теги, сегменты прогресса | #627EEA | #9945FF | #F5AC37 | #F7931A | #CD0003 |
| Сумма, пунктир, стрелки | #4C64D9 | #7A2DE6 | #D9901C | #D9780F | #B51316 |

Зелёные теги IN / VERIFIED CONTRACT (#007A3D) не перекрашиваются. Фрейм 02 (TRON) удалён
из файла пользователем. Фрейм 07 (своп DAI на Polygon) окрашен в цвет токена DAI, а не сети.
Пара BTC (08, 09) собрана клонами 03 и 04: bech32-адреса, комиссии в sat, SegWit, монета ₿ из
набора Win98.

Solana (05, 06): градиент #BC00FF → #48F3C2 (слева направо) только на тайтл-барах: внешнем
баре окна и инстансах Win95 / Title Bar. Фон шапки, теги, суммы, сегменты и стрелки — сплошные
(#2E0F6B, #9945FF, #7A2DE6).

Ethereum (01, 03, 04): как у Solana, градиент #4F67E8 → #9FB0F7 только на тайтл-барах окон,
остальное сплошное.

TRON (10, 11): пара собрана заново клонами 03 и 04 из данных удалённого фрейма 02 (хеш 0ffeb0ee…,
USDT TRC-20, OWNER TBUhr4R4…, bait TSdu6x…). Цвета взяты с «Transaction Detail — Desktop Cascade»:
тайтл-бары сплошные #A91013 без градиента, рабочий стол — вертикальный градиент #A91013 → #6E0002
вместо синего.

Кирпичи на CLUBS / SKILL TEST: `Win95 / Paint (brick) — free resize` (629:91, 648×600, из Notepad brick) и
компонент-сет `Win95 / Paint Tool Icon (pixel)` (632:466) — 16 пиксельных иконок инструментов 16×16,
плейсхолдеры, variant Tool.

## Шейдер Palette Swatches (эффект)

Палитра в Paint подстраивается под картинку холста автоматически. Схема: холст — мастер-компонент
`Canvas — REPLACE IMAGE HERE (main component, drives the palette)`, а в рамке свотчей лежит его
инстанс `Canvas instance — sampled by Palette Swatches`, уменьшенный по ширине полосы, с шейдер-эффектом
`Palette Swatches` (библиотека аккаунта, id `1e03d724-82c7-433c-8582-5171995e2f40`). Шейдер усредняет
cols×rows участков всей картинки и рисует ячейки в верхних Strip height px слоя; рамка свотчей обрезает
остальное. Параметры: Columns, Rows, Strip height, Order (Sorted by luminance — тёмный ряд сверху,
светлый снизу / Image order), Saturation, Gap, Border, Border color, Samples per cell.

Как менять картинку: выделить холст и заменить **заливку** (Fill → Image → Choose image, или
перетащить файл на слой). Плагины, которые вставляют новый слой вместо холста, рвут связь — тогда
инстанс в палитре нужно пересоздать из нового компонента.
Применение из плагина: `figma.importShaderById('<id>/<version>')`, затем effects
`{ type: 'SHADER', id, properties }`; ключи properties берутся из `propertyDefinitions` импорта.
