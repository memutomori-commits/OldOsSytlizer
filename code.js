// Retro Bevel — плагин Figma.
// Применяет к выделенным шейпам бевели в духе Windows 95: заливку, обводку,
// Effect Style «Win95 / <name>» из теней и выравнивание по пиксельной сетке.
//
// Исходник — этот файл. code.js рядом сгенерирован из него (`npm run build`:
// только tsc, без сборщика) и нужен для ручной установки через manifest.json.
// Библиотечная сборка Figma (через MCP) компилирует code.ts сама.
'use strict';
const STYLE_PREFIX = 'Win95 / ';
const UI_SIZE = { width: 300, height: 240 };
// Тени перечислены как в CSS box-shadow: первая — самая верхняя. Внешние линии
// бевела (±1) идут перед внутренними (±2) и перекрывают их. У всех теней
// blur 0, spread 0, непрозрачность 100 % (см. toFigmaEffect).
// fill: null — без заливки. stroke есть только там, где нужен (Etched).
const PRESETS = [
    {
        id: 'raised',
        name: 'Raised',
        fill: '#C0C0C0',
        effects: [
            { type: 'INNER_SHADOW', x: -1, y: -1, color: '#0A0A0A' },
            { type: 'INNER_SHADOW', x: 1, y: 1, color: '#FFFFFF' },
            { type: 'INNER_SHADOW', x: -2, y: -2, color: '#808080' },
            { type: 'INNER_SHADOW', x: 2, y: 2, color: '#DFDFDF' },
        ],
    },
    {
        id: 'sunken',
        name: 'Sunken',
        fill: '#FFFFFF',
        effects: [
            { type: 'INNER_SHADOW', x: -1, y: -1, color: '#FFFFFF' },
            { type: 'INNER_SHADOW', x: 1, y: 1, color: '#808080' },
            { type: 'INNER_SHADOW', x: -2, y: -2, color: '#DFDFDF' },
            { type: 'INNER_SHADOW', x: 2, y: 2, color: '#0A0A0A' },
        ],
    },
    {
        id: 'pressed',
        name: 'Pressed',
        fill: '#C0C0C0',
        effects: [
            { type: 'INNER_SHADOW', x: -1, y: -1, color: '#FFFFFF' },
            { type: 'INNER_SHADOW', x: 1, y: 1, color: '#0A0A0A' },
            { type: 'INNER_SHADOW', x: -2, y: -2, color: '#DFDFDF' },
            { type: 'INNER_SHADOW', x: 2, y: 2, color: '#808080' },
        ],
    },
    {
        id: 'etched',
        name: 'Etched',
        fill: null,
        stroke: { color: '#808080', weight: 1, align: 'INSIDE' },
        effects: [
            { type: 'DROP_SHADOW', x: 1, y: 1, color: '#FFFFFF' },
        ],
    },
];
// ---------------------------------------------------------------------------
// Цвета и эффекты
// ---------------------------------------------------------------------------
function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3)
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function solidPaint(hex) {
    return { type: 'SOLID', color: hexToRgb(hex), opacity: 1 };
}
// spread не задаётся: по умолчанию он 0, а на векторах и полигонах Figma его не принимает.
function toFigmaEffect(effect) {
    const color = { ...hexToRgb(effect.color), a: 1 };
    const offset = { x: effect.x, y: effect.y };
    if (effect.type === 'DROP_SHADOW') {
        // Фигура без заливки отбрасывает тень только от кольца обводки. Чтобы линия
        // была видна и внутри контура (рамка Etched), тень рисуется и за узлом.
        return {
            type: 'DROP_SHADOW',
            color,
            offset,
            radius: 0,
            visible: true,
            blendMode: 'NORMAL',
            showShadowBehindNode: true,
        };
    }
    return { type: 'INNER_SHADOW', color, offset, radius: 0, visible: true, blendMode: 'NORMAL' };
}
// Figma рисует эффекты снизу вверх: последний элемент массива оказывается сверху
// (как у fills). В пресете первой идёт верхняя тень, поэтому порядок разворачивается.
function toFigmaEffects(effects) {
    return effects.map(toFigmaEffect).reverse();
}
// ---------------------------------------------------------------------------
// Effect Styles
// ---------------------------------------------------------------------------
async function getEffectStyle(preset) {
    const name = STYLE_PREFIX + preset.name;
    const styles = await figma.getLocalEffectStylesAsync();
    let style = styles.find((s) => s.name === name);
    if (style === undefined) {
        style = figma.createEffectStyle();
        style.name = name;
    }
    // Стили «Win95 / …» принадлежат плагину: их эффекты всегда соответствуют пресету.
    style.effects = toFigmaEffects(preset.effects);
    return style;
}
function isStyleable(node) {
    return node.type !== 'TEXT' && 'effects' in node && 'fills' in node;
}
function getTargets() {
    return figma.currentPage.selection.filter(isStyleable);
}
async function applyPaintAndShape(node, preset) {
    if ('cornerRadius' in node)
        node.cornerRadius = 0;
    if ('strokes' in node) {
        if (node.strokeStyleId !== '')
            await node.setStrokeStyleIdAsync('');
        if (preset.stroke) {
            node.strokes = [solidPaint(preset.stroke.color)];
            node.strokeWeight = preset.stroke.weight;
            if ('strokeAlign' in node)
                node.strokeAlign = preset.stroke.align;
            if ('dashPattern' in node)
                node.dashPattern = [];
        }
        else {
            node.strokes = [];
        }
    }
    if (node.fillStyleId !== '')
        await node.setFillStyleIdAsync('');
    node.fills = preset.fill === null ? [] : [solidPaint(preset.fill)];
}
function roundSize(value) {
    return Math.max(1, Math.round(value));
}
// Округляет x, y, width, height до целых, не ломая авто-лейаут: позицию детей
// авто-лейаута задаёт родитель, а размеры HUG/FILL — содержимое или родитель.
function snapToPixelGrid(node) {
    const parent = node.parent;
    const positionedByParent = parent !== null && 'layoutMode' in parent && parent.layoutMode !== 'NONE' &&
        node.layoutPositioning !== 'ABSOLUTE';
    if (!positionedByParent) {
        node.x = Math.round(node.x);
        node.y = Math.round(node.y);
    }
    const width = node.layoutSizingHorizontal === 'FIXED' ? roundSize(node.width) : node.width;
    // У линии высота всегда 0.
    const height = node.type !== 'LINE' && node.layoutSizingVertical === 'FIXED' ? roundSize(node.height) : node.height;
    if (width !== node.width || height !== node.height)
        node.resize(width, height);
}
// ---------------------------------------------------------------------------
// Команды
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
function countLayers(n) {
    return String(n) + ' ' + plural(n, 'слой', 'слоя', 'слоёв');
}
function errorMessage(error) {
    if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }
    return String(error);
}
function notifyResult(message, failed) {
    if (failed > 0) {
        figma.notify(message + '; не удалось: ' + String(failed), { error: true });
    }
    else {
        figma.notify(message);
    }
}
async function applyPreset(presetId) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset === undefined)
        return;
    const targets = getTargets();
    if (targets.length === 0) {
        figma.notify('Выделите шейп', { error: true });
        return;
    }
    const style = await getEffectStyle(preset);
    let done = 0;
    let failed = 0;
    for (const node of targets) {
        try {
            await applyPaintAndShape(node, preset);
            await node.setEffectStyleIdAsync(style.id);
            try {
                snapToPixelGrid(node);
            }
            catch (error) {
                // Например, слой внутри инстанса двигать нельзя — стиль при этом уже применён.
                console.warn('Retro Bevel: не удалось выровнять «' + node.name + '»', error);
            }
            done += 1;
        }
        catch (error) {
            failed += 1;
            console.error('Retro Bevel: «' + node.name + '»', error);
        }
    }
    figma.commitUndo();
    notifyResult(style.name + ': ' + countLayers(done), failed);
}
async function resetEffects() {
    const targets = getTargets();
    if (targets.length === 0) {
        figma.notify('Выделите шейп', { error: true });
        return;
    }
    let done = 0;
    let failed = 0;
    for (const node of targets) {
        try {
            await node.setEffectStyleIdAsync('');
            node.effects = [];
            done += 1;
        }
        catch (error) {
            failed += 1;
            console.error('Retro Bevel: «' + node.name + '»', error);
        }
    }
    figma.commitUndo();
    notifyResult('Эффекты убраны: ' + countLayers(done), failed);
}
function isUiMessage(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const message = value;
    if (message.type === 'ready' || message.type === 'reset')
        return true;
    return message.type === 'apply' && typeof message.presetId === 'string';
}
function sendSelection() {
    const selection = figma.currentPage.selection;
    figma.ui.postMessage({
        type: 'selection',
        count: selection.filter(isStyleable).length,
        total: selection.length,
    });
}
// Кнопка повторного запуска в панели свойств. Команда должна быть объявлена
// в relaunchButtons манифеста; и в manifest.json, и в библиотечной сборке Figma
// она равна id плагина.
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
figma.showUI(__html__, { width: UI_SIZE.width, height: UI_SIZE.height, title: 'Retro Bevel' });
async function handleUiMessage(message) {
    try {
        switch (message.type) {
            case 'ready':
                figma.ui.postMessage({ type: 'init', presets: PRESETS, stylePrefix: STYLE_PREFIX });
                sendSelection();
                break;
            case 'apply':
                await applyPreset(message.presetId);
                break;
            case 'reset':
                await resetEffects();
                break;
        }
    }
    catch (error) {
        figma.notify('Retro Bevel: ' + errorMessage(error), { error: true });
    }
}
figma.ui.onmessage = (message) => {
    if (isUiMessage(message))
        void handleUiMessage(message);
};
figma.on('selectionchange', sendSelection);
figma.on('currentpagechange', sendSelection);
