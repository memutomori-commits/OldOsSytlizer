// KD Pixelize — плагин Figma: пикселизация картинки KD-деревом (адаптивные блоки,
// мелкие там, где много деталей) и детект людей, чтобы пикселизировать только
// выбранного человека. Вся обработка идёт в UI (canvas + TensorFlow.js), здесь —
// только выгрузка выделенного слоя в PNG и вставка результата на холст.

const UI_SIZE = { width: 392, height: 640 };
// Длинная сторона выгружаемой картинки: больше — дольше считать, а Figma всё равно
// не принимает изображения крупнее 4096 px.
const MAX_EXPORT_SIDE = 2048;
const NEW_LAYER_GAP = 40;

type UiMessage =
  | { type: 'ready' }
  | { type: 'resize'; height: number }
  | { type: 'export'; nodeId: string }
  | { type: 'apply'; bytes: Uint8Array; nodeId: string | null; mode: 'new' | 'replace'; width: number; height: number };

function isUiMessage(value: unknown): value is UiMessage {
  if (typeof value !== 'object' || value === null) return false;
  const m = value as { type?: unknown; nodeId?: unknown; bytes?: unknown; mode?: unknown; height?: unknown; width?: unknown };
  switch (m.type) {
    case 'ready':
      return true;
    case 'resize':
      return typeof m.height === 'number';
    case 'export':
      return typeof m.nodeId === 'string';
    case 'apply':
      return (
        m.bytes instanceof Uint8Array &&
        (typeof m.nodeId === 'string' || m.nodeId === null) &&
        (m.mode === 'new' || m.mode === 'replace') &&
        typeof m.width === 'number' &&
        typeof m.height === 'number'
      );
    default:
      return false;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hasFills(node: SceneNode): node is SceneNode & { fills: ReadonlyArray<Paint> | PluginAPI['mixed'] } {
  return 'fills' in node;
}

function hasImageFill(node: SceneNode): boolean {
  if (!hasFills(node) || node.fills === figma.mixed) return false;
  for (const paint of node.fills) if (paint.type === 'IMAGE' && paint.visible !== false) return true;
  return false;
}

// Слой, который можно выгрузить картинкой: любой SceneNode с exportAsync и размером.
function isExportable(node: SceneNode): node is SceneNode & ExportMixin & DimensionAndPositionMixin {
  return 'exportAsync' in node && 'width' in node && node.width > 0 && node.height > 0;
}

// ---------------------------------------------------------------------------
// Выделение -> UI
// ---------------------------------------------------------------------------
function sendSelection(): void {
  const selection = figma.currentPage.selection;
  const node = selection.find(isExportable) || null;
  figma.ui.postMessage({
    type: 'selection',
    total: selection.length,
    nodeId: node ? node.id : null,
    name: node ? node.name : '',
    width: node ? Math.round(node.width) : 0,
    height: node ? Math.round(node.height) : 0,
    hasImage: node ? hasImageFill(node) : false,
    canReplace: node ? hasFills(node) : false,
  });
}

async function exportNode(nodeId: string): Promise<void> {
  const node = await figma.getNodeByIdAsync(nodeId);
  if (!node || node.type === 'DOCUMENT' || node.type === 'PAGE' || !isExportable(node as SceneNode)) {
    figma.ui.postMessage({ type: 'export-error', message: 'Слой не найден или его нельзя выгрузить' });
    return;
  }
  const scene = node as SceneNode & ExportMixin & DimensionAndPositionMixin;
  const longest = Math.max(scene.width, scene.height);
  const scale = Math.min(1, MAX_EXPORT_SIDE / longest);
  const bytes = await scene.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
  figma.ui.postMessage({
    type: 'image',
    nodeId: scene.id,
    name: scene.name,
    width: Math.round(scene.width),
    height: Math.round(scene.height),
    bytes,
  });
}

// ---------------------------------------------------------------------------
// Результат -> холст
// ---------------------------------------------------------------------------
function imagePaint(hash: string): ImagePaint {
  return { type: 'IMAGE', scaleMode: 'FILL', imageHash: hash, visible: true, opacity: 1, blendMode: 'NORMAL' };
}

function markRelaunch(node: SceneNode): void {
  const command = figma.pluginId;
  if (command === undefined) return;
  try {
    node.setRelaunchData({ [command]: '' });
  } catch {
    // Манифест без такой команды: кнопка просто не появится.
  }
}

async function applyResult(message: Extract<UiMessage, { type: 'apply' }>): Promise<void> {
  const image = figma.createImage(message.bytes);
  const source = message.nodeId ? await figma.getNodeByIdAsync(message.nodeId) : null;
  const sourceScene =
    source && source.type !== 'DOCUMENT' && source.type !== 'PAGE' && isExportable(source as SceneNode)
      ? (source as SceneNode & ExportMixin & DimensionAndPositionMixin)
      : null;

  if (message.mode === 'replace') {
    if (!sourceScene || !hasFills(sourceScene)) {
      figma.notify('KD Pixelize: у слоя нет заливки, вставляю новый слой', { timeout: 3000 });
    } else {
      sourceScene.fills = [imagePaint(image.hash)];
      markRelaunch(sourceScene);
      figma.commitUndo();
      figma.notify('KD Pixelize: заливка слоя «' + sourceScene.name + '» заменена');
      return;
    }
  }

  const rect = figma.createRectangle();
  rect.fills = [imagePaint(image.hash)];
  if (sourceScene) {
    const parent = sourceScene.parent;
    rect.name = sourceScene.name + ' — pixelized';
    rect.resize(sourceScene.width, sourceScene.height);
    if (parent && parent.type !== 'DOCUMENT' && 'appendChild' in parent) {
      parent.appendChild(rect);
      rect.x = sourceScene.x + sourceScene.width + NEW_LAYER_GAP;
      rect.y = sourceScene.y;
    } else {
      rect.x = sourceScene.absoluteTransform[0][2] + sourceScene.width + NEW_LAYER_GAP;
      rect.y = sourceScene.absoluteTransform[1][2];
    }
  } else {
    rect.name = 'Pixelized image';
    rect.resize(message.width, message.height);
    rect.x = Math.round(figma.viewport.center.x - message.width / 2);
    rect.y = Math.round(figma.viewport.center.y - message.height / 2);
  }
  markRelaunch(rect);
  figma.currentPage.selection = [rect];
  figma.commitUndo();
  figma.notify('KD Pixelize: добавлен слой «' + rect.name + '»');
}

// ---------------------------------------------------------------------------
// Запуск
// ---------------------------------------------------------------------------
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
figma.showUI(__html__, { width: UI_SIZE.width, height: UI_SIZE.height, title: 'KD Pixelize' });

async function handleUiMessage(message: UiMessage): Promise<void> {
  try {
    switch (message.type) {
      case 'ready':
        sendSelection();
        break;
      case 'resize':
        figma.ui.resize(UI_SIZE.width, Math.max(300, Math.min(900, Math.round(message.height))));
        break;
      case 'export':
        await exportNode(message.nodeId);
        break;
      case 'apply':
        await applyResult(message);
        break;
    }
  } catch (error) {
    figma.notify('KD Pixelize: ' + errorMessage(error), { error: true });
    figma.ui.postMessage({ type: 'export-error', message: errorMessage(error) });
  }
}

figma.ui.onmessage = (message: unknown) => {
  if (isUiMessage(message)) void handleUiMessage(message);
};

figma.on('selectionchange', () => {
  sendSelection();
});
figma.on('currentpagechange', () => {
  sendSelection();
});
