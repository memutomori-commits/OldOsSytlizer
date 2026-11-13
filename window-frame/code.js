// Window Frame — плагин Figma.
// Превращает выделенный прямоугольник в адаптивное окно-рамку в духе Windows:
// бевель по периметру, тёмная плашка заголовка с редактируемым текстом и
// кнопками «?» и «X», прозрачная середина — чтобы обвести человека или деталь
// на фото. Образец — слой «Window — freely editable» из Carousel Post / Explorer — 5
// в файле clubs_main. Позиция и размер прямоугольника сохраняются, сам
// прямоугольник удаляется (один шаг отмены возвращает его).
//
// Структура результата — «кирпичи» по скиллу brick (образец Window (Classic Mac)):
//   Window — free resize                 VERTICAL auto-layout, FIXED×FIXED, без заливки
//   ├ Title bar — resize height freely   HORIZONTAL auto-layout, W FILL, H FIXED
//   │ ├ Title — fills, truncates         текст, W FILL, TRUNCATE
//   │ ├ Control button ? — follows bar height   H FILL + lock aspect ratio
//   │ └ Control button X — follows bar height
//   ├ Content — fills the rest           FILL×FILL, прозрачный
//   └ Bevel / …                          absolute-прямоугольники на констрейнтах
//
// Все размеры заданы в «пикселях» U (единица пиксель-арта, в Carousel — 3.68 px):
// бевель 2U, внутренняя тень 1U, плашка 18U, кнопка 18×15U, кегль 12U.
//
// Исходник — этот файл. code.js рядом сгенерирован из него (`npm run build`
// в корне репозитория) и нужен для ручной установки через manifest.json.
// Библиотечная сборка Figma (через MCP) компилирует code.ts сама.
'use strict';
const UI_SIZE = { width: 300, height: 262 };
const STORAGE_KEY = 'windowFrame.params.v1';
const FONT = { family: 'Inter', style: 'Regular' };
// Палитра образца.
const COLOR = {
    light: '#F7F7F7', // верхний и левый бевель, текст заголовка
    face: '#C4C4C4', // лицо кнопки
    shade: '#868A8E', // внутренняя тень справа и снизу
    dark: '#000000', // внешняя тень, глиф
    titleFrom: '#000000', // градиент плашки: слева направо
    titleTo: '#571415',
};
const DEFAULT_PARAMS = { title: 'WHO??', unit: 4, help: true, close: true };
const UNIT_MIN = 0.5;
const UNIT_MAX = 64;
const TITLE_MAX = 200;
function normalizeParams(raw) {
    const p = (typeof raw === 'object' && raw !== null ? raw : {});
    const unit = typeof p.unit === 'number' && Number.isFinite(p.unit) ? p.unit : DEFAULT_PARAMS.unit;
    return {
        title: typeof p.title === 'string' ? p.title.slice(0, TITLE_MAX) : DEFAULT_PARAMS.title,
        unit: Math.max(UNIT_MIN, Math.min(UNIT_MAX, Math.round(unit * 100) / 100)),
        help: typeof p.help === 'boolean' ? p.help : DEFAULT_PARAMS.help,
        close: typeof p.close === 'boolean' ? p.close : DEFAULT_PARAMS.close,
    };
}
const GLYPHS = {
    help: {
        label: '?',
        rows: ['.####.', '#....#', '#....#', '.....#', '...##.', '..#...', '..#...', '......', '..#...'],
    },
    close: {
        label: 'X',
        rows: ['#....#', '.#..#.', '..##..', '..##..', '..##..', '.#..#.', '#....#'],
    },
};
const GLYPH_COLS = 6;
const GLYPH_BOX_ROWS = 9;
// Каждый горизонтальный отрезок закрашенных клеток — отдельный замкнутый
// подконтур, как у исходных векторов.
function glyphPathData(glyph, u) {
    const parts = [];
    glyph.rows.forEach((row, y) => {
        let x = 0;
        while (x < row.length) {
            if (row[x] !== '#') {
                x += 1;
                continue;
            }
            let end = x;
            while (end < row.length && row[end] === '#')
                end += 1;
            const x0 = x * u;
            const x1 = end * u;
            const y0 = y * u;
            const y1 = (y + 1) * u;
            parts.push('M ' + String(x0) + ' ' + String(y0) + ' L ' + String(x1) + ' ' + String(y0) + ' L ' + String(x1) + ' ' +
                String(y1) + ' L ' + String(x0) + ' ' + String(y1) + ' Z');
            x = end;
        }
    });
    return parts.join(' ');
}
// ---------------------------------------------------------------------------
// Цвета и примитивы
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function solidPaint(hex) {
    return { type: 'SOLID', color: hexToRgb(hex), opacity: 1 };
}
function titleGradient() {
    return {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [
            [1, 0, 0],
            [0, 1, 0],
        ],
        gradientStops: [
            { position: 0, color: { ...hexToRgb(COLOR.titleFrom), a: 1 } },
            { position: 1, color: { ...hexToRgb(COLOR.titleTo), a: 1 } },
        ],
    };
}
// Прямоугольник на констрейнтах внутри обычного фрейма или absolute в авто-лейауте.
function addRect(parent, name, x, y, w, h, hex, horizontal, vertical) {
    const r = figma.createRectangle();
    r.name = name;
    r.fills = [solidPaint(hex)];
    parent.appendChild(r);
    if (parent.layoutMode !== 'NONE')
        r.layoutPositioning = 'ABSOLUTE';
    r.resize(Math.max(0.01, w), Math.max(0.01, h));
    r.x = x;
    r.y = y;
    r.constraints = { horizontal, vertical };
    return r;
}
function plainFrame(name, w, h) {
    const f = figma.createFrame();
    f.name = name;
    f.fills = [];
    f.clipsContent = false;
    f.resize(Math.max(0.01, w), Math.max(0.01, h));
    return f;
}
// ---------------------------------------------------------------------------
// Кирпичи: кнопка, плашка, окно
// ---------------------------------------------------------------------------
// Кнопка 18×15U: тень 1U вправо-вниз, лицо 17×14U, бевель 2U сверху-слева и 1U
// внутренней тени справа-снизу, глиф 6×9U в клетке (6U, 3U). Лицо и тень —
// STRETCH, бевель — прижат к своему краю, глиф — SCALE/SCALE, чтобы расти вместе
// с кнопкой, когда она следует за высотой плашки.
function buildButton(kind, u) {
    const glyph = GLYPHS[kind];
    const w = 18 * u;
    const h = 15 * u;
    const b = plainFrame('Control button ' + glyph.label + ' — follows bar height', w, h);
    addRect(b, 'Shadow', u, u, 17 * u, 14 * u, COLOR.dark, 'STRETCH', 'STRETCH');
    addRect(b, 'Face', 0, 0, 17 * u, 14 * u, COLOR.face, 'STRETCH', 'STRETCH');
    addRect(b, 'Bevel / Top highlight', 0, 0, 17 * u, 2 * u, COLOR.light, 'STRETCH', 'MIN');
    addRect(b, 'Bevel / Left highlight', 0, 0, 2 * u, 14 * u, COLOR.light, 'MIN', 'STRETCH');
    addRect(b, 'Bevel / Right inner shadow', 16 * u, 2 * u, u, 12 * u, COLOR.shade, 'MAX', 'STRETCH');
    addRect(b, 'Bevel / Bottom inner shadow', 2 * u, 13 * u, 15 * u, u, COLOR.shade, 'STRETCH', 'MAX');
    const box = plainFrame('Control glyph', GLYPH_COLS * u, GLYPH_BOX_ROWS * u);
    box.clipsContent = true;
    b.appendChild(box);
    box.x = 6 * u;
    box.y = 3 * u;
    box.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    const v = figma.createVector();
    v.name = 'Glyph ' + glyph.label;
    v.vectorPaths = [{ windingRule: 'NONZERO', data: glyphPathData(glyph, u) }];
    v.strokes = [];
    v.fills = [solidPaint(COLOR.dark)];
    box.appendChild(v);
    v.x = 0;
    v.y = 0;
    v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
    return b;
}
// Плашка заголовка 18U высотой: градиент слева направо, отступы 2U/1U/1U/3U,
// зазор 1U, дети по центру по вертикали. Заголовок тянется (FILL) и обрезается
// многоточием, кнопки берут высоту плашки и держат пропорцию 18:15.
function buildTitleBar(p, u, innerWidth) {
    const bar = figma.createFrame();
    bar.name = 'Title bar — resize height freely';
    bar.layoutMode = 'HORIZONTAL';
    bar.primaryAxisSizingMode = 'FIXED';
    bar.counterAxisSizingMode = 'FIXED';
    bar.primaryAxisAlignItems = 'MIN';
    bar.counterAxisAlignItems = 'CENTER';
    bar.paddingTop = 2 * u;
    bar.paddingRight = u;
    bar.paddingBottom = u;
    bar.paddingLeft = 3 * u;
    bar.itemSpacing = u;
    bar.clipsContent = true;
    bar.fills = [titleGradient()];
    bar.resize(Math.max(0.01, innerWidth), 18 * u);
    const title = figma.createText();
    title.name = 'Title — fills, truncates';
    title.fontName = FONT;
    title.characters = p.title;
    title.fontSize = 12 * u;
    title.fills = [solidPaint(COLOR.light)];
    title.textAlignHorizontal = 'LEFT';
    title.textAlignVertical = 'CENTER';
    bar.appendChild(title);
    title.textAutoResize = 'TRUNCATE';
    title.resize(Math.max(0.01, innerWidth / 2), 14 * u);
    title.layoutSizingHorizontal = 'FILL';
    const kinds = [];
    if (p.help)
        kinds.push('help');
    if (p.close)
        kinds.push('close');
    for (const kind of kinds) {
        const button = buildButton(kind, u);
        bar.appendChild(button);
        button.layoutSizingVertical = 'FILL';
        button.lockAspectRatio();
    }
    return bar;
}
// Окно: вертикальный авто-лейаут без заливки. Отступы — толщина бевеля: 2U сверху
// и слева, 3U справа и снизу (2U внешней тени + 1U внутренней). Плашка и контент
// идут потоком, бевель лежит absolute поверх и тянется констрейнтами.
function buildWindow(p, width, height) {
    const u = p.unit;
    const win = figma.createFrame();
    win.name = 'Window / ' + (p.title.trim() || 'Highlight') + ' — free resize';
    win.layoutMode = 'VERTICAL';
    win.primaryAxisSizingMode = 'FIXED';
    win.counterAxisSizingMode = 'FIXED';
    win.primaryAxisAlignItems = 'MIN';
    win.counterAxisAlignItems = 'MIN';
    win.paddingTop = 2 * u;
    win.paddingLeft = 2 * u;
    win.paddingRight = 3 * u;
    win.paddingBottom = 3 * u;
    win.itemSpacing = 0;
    win.fills = [];
    win.strokes = [];
    win.clipsContent = true;
    win.resize(Math.max(0.01, width), Math.max(0.01, height));
    const innerWidth = width - 5 * u;
    const bar = buildTitleBar(p, u, innerWidth);
    win.appendChild(bar);
    bar.layoutSizingHorizontal = 'FILL';
    bar.layoutSizingVertical = 'FIXED';
    const content = plainFrame('Content — fills the rest', innerWidth, Math.max(0.01, height - 23 * u));
    win.appendChild(content);
    content.layoutSizingHorizontal = 'FILL';
    content.layoutSizingVertical = 'FILL';
    const W = win.width;
    const H = win.height;
    addRect(win, 'Bevel / Top highlight', 0, 0, W - 2 * u, 2 * u, COLOR.light, 'STRETCH', 'MIN');
    addRect(win, 'Bevel / Left highlight', 0, 0, 2 * u, H - 2 * u, COLOR.light, 'MIN', 'STRETCH');
    addRect(win, 'Bevel / Right shadow', W - 2 * u, 0, 2 * u, H, COLOR.dark, 'MAX', 'STRETCH');
    addRect(win, 'Bevel / Bottom shadow', 0, H - 2 * u, W, 2 * u, COLOR.dark, 'STRETCH', 'MAX');
    addRect(win, 'Bevel / Right inner shadow', W - 3 * u, 2 * u, u, H - 4 * u, COLOR.shade, 'MAX', 'STRETCH');
    addRect(win, 'Bevel / Bottom inner shadow', 2 * u, H - 3 * u, W - 5 * u, u, COLOR.shade, 'STRETCH', 'MAX');
    // Минимумы (формула brick §5): отступы окна и плашки, кнопки с зазорами и
    // 8U на заголовок; по высоте — бевель, плашка и 8U контента.
    const buttons = (p.help ? 1 : 0) + (p.close ? 1 : 0);
    win.minWidth = Math.ceil(5 * u + 4 * u + buttons * 19 * u + 8 * u);
    win.minHeight = Math.ceil(5 * u + 18 * u + 8 * u);
    return win;
}
// ---------------------------------------------------------------------------
// Замена прямоугольника
// ---------------------------------------------------------------------------
function isTarget(node) {
    return node.type === 'RECTANGLE';
}
function getTargets() {
    return figma.currentPage.selection.filter(isTarget);
}
// Окно встаёт на место прямоугольника: тот же родитель, тот же слой в списке,
// та же матрица (позиция и поворот), те же констрейнты. В авто-лейауте позицию
// задаёт родитель, поэтому матрица не копируется, а absolute-положение и
// FILL-размеры переносятся.
function replaceRectangle(rect, p) {
    const parent = rect.parent;
    if (parent === null || !('children' in parent))
        throw new Error('у прямоугольника нет родителя');
    const win = buildWindow(p, rect.width, rect.height);
    const index = parent.children.indexOf(rect);
    parent.insertChild(index + 1, win);
    const parentIsAutoLayout = 'layoutMode' in parent && parent.layoutMode !== 'NONE';
    const flows = parentIsAutoLayout && rect.layoutPositioning !== 'ABSOLUTE';
    if (parentIsAutoLayout && rect.layoutPositioning === 'ABSOLUTE')
        win.layoutPositioning = 'ABSOLUTE';
    if (flows) {
        if (rect.layoutSizingHorizontal === 'FILL')
            win.layoutSizingHorizontal = 'FILL';
        if (rect.layoutSizingVertical === 'FILL')
            win.layoutSizingVertical = 'FILL';
    }
    else {
        win.relativeTransform = rect.relativeTransform;
        win.constraints = rect.constraints;
    }
    win.opacity = rect.opacity;
    win.visible = rect.visible;
    win.locked = rect.locked;
    rect.remove();
    return win;
}
// ---------------------------------------------------------------------------
// Команда
// ---------------------------------------------------------------------------
function plural(n, one, few, many) {
    const m10 = n % 10;
    const m100 = n % 100;
    if (m10 === 1 && m100 !== 11)
        return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14))
        return few;
    return many;
}
function errorMessage(error) {
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return String(error);
}
function sendStatus(text, error = false) {
    figma.ui.postMessage({ type: 'status', text, error });
}
async function build(raw) {
    const params = normalizeParams(raw);
    const targets = getTargets();
    if (targets.length === 0) {
        sendStatus('Выделите прямоугольник', true);
        return;
    }
    try {
        await figma.loadFontAsync(FONT);
    }
    catch {
        sendStatus('Нет шрифта Inter Regular', true);
        return;
    }
    await figma.clientStorage.setAsync(STORAGE_KEY, params);
    const created = [];
    let failed = 0;
    for (const rect of targets) {
        try {
            created.push(replaceRectangle(rect, params));
        }
        catch (error) {
            failed += 1;
            console.error('Window Frame: «' + rect.name + '»', error);
        }
    }
    if (created.length > 0)
        figma.currentPage.selection = created;
    figma.commitUndo();
    const n = created.length;
    let text = n + ' ' + plural(n, 'окно', 'окна', 'окон') + ' из ' + String(targets.length);
    if (failed > 0)
        text += '; не удалось: ' + String(failed);
    sendStatus(text, failed > 0);
    figma.notify(failed > 0 ? text : 'Window Frame: ' + text, { error: failed > 0 });
}
function isUiMessage(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const message = value;
    return message.type === 'ready' || message.type === 'build';
}
function sendSelection() {
    const selection = figma.currentPage.selection;
    figma.ui.postMessage({ type: 'selection', count: selection.filter(isTarget).length, total: selection.length });
}
// Кнопка повторного запуска в панели свойств: команда объявлена в relaunchButtons
// манифеста и равна id плагина — и в manifest.json, и в библиотечной сборке Figma.
function registerRelaunchButton() {
    const command = figma.pluginId;
    if (command === undefined)
        return;
    try {
        figma.root.setRelaunchData({ [command]: '' });
    }
    catch {
        // Манифест без такой команды: кнопка просто не появится.
    }
}
registerRelaunchButton();
figma.showUI(__html__, { width: UI_SIZE.width, height: UI_SIZE.height, title: 'Window Frame' });
async function handleUiMessage(message) {
    try {
        switch (message.type) {
            case 'ready': {
                const stored = await figma.clientStorage.getAsync(STORAGE_KEY);
                figma.ui.postMessage({ type: 'init', params: normalizeParams(stored), limits: { unitMin: UNIT_MIN, unitMax: UNIT_MAX, titleMax: TITLE_MAX } });
                sendSelection();
                break;
            }
            case 'build':
                await build(message.params);
                break;
        }
    }
    catch (error) {
        sendStatus(errorMessage(error), true);
        figma.notify('Window Frame: ' + errorMessage(error), { error: true });
    }
}
figma.ui.onmessage = (message) => {
    if (isUiMessage(message))
        void handleUiMessage(message);
};
figma.on('selectionchange', sendSelection);
figma.on('currentpagechange', sendSelection);
