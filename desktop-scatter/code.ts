// Desktop Scatter — плагин Figma.
// Раскидывает инстансы выбранного компонент-сета (по умолчанию «Desktop Icon»)
// по выделенному прямоугольнику или фрейму, как ярлыки по рабочему столу Win98.
// Хаос 0 — ярлыки аккуратно стоят столбцами от левого верхнего угла, как их
// расставляет Windows; хаос 100 — разлетаются по всему столу. Галка «по сетке»
// привязывает те же позиции к ячейкам. Раскладка детерминирована сидом: тот же
// сид и те же параметры дают тот же результат, поэтому сид можно «крутить».
//
// Исходник — этот файл. code.js рядом сгенерирован из него (`npm run build`
// в корне репозитория) и нужен для ручной установки через manifest.json.
// Библиотечная сборка Figma (через MCP) компилирует code.ts сама.

'use strict';

const SET_NAME = 'Desktop Icon';
const UI_SIZE = { width: 320, height: 596 };
const DATA_TARGET = 'desktopScatter.target';
const DATA_PARAMS = 'desktopScatter.params';
const DATA_SET = 'desktopScatter.setId';
const MAX_COUNT = 200;
const MAX_TRIES = 48;

// ---------------------------------------------------------------------------
// Параметры
// ---------------------------------------------------------------------------
interface Params {
  setId: string; // id компонент-сета; пусто — «Desktop Icon»
  seed: number;
  count: number;
  chaos: number; // 0 — столбцами от угла, 100 — по всему столу
  align: boolean; // привязать позиции к сетке ячеек
  scale: number; // проценты от размера компонента
  gap: number; // отступ между ярлыками, px
  margin: number; // отступ от края стола, px
  shortcut: boolean; // стрелка ярлыка
  selectOne: boolean; // один случайный ярлык выделен
  labels: string; // пул подписей через перенос строки; пусто — подписи компонентов
}

type UiMessage = { type: 'ready' } | { type: 'sets' } | { type: 'scatter'; params: Params };

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback;
  return Math.max(min, Math.min(max, n));
}

function normalizeParams(raw: unknown): Params {
  const p = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof Params, unknown>>;
  return {
    setId: typeof p.setId === 'string' ? p.setId : '',
    seed: clampInt(p.seed, 0, 999999, 1),
    count: clampInt(p.count, 1, MAX_COUNT, 12),
    chaos: clampInt(p.chaos, 0, 100, 60),
    align: p.align !== false,
    scale: clampInt(p.scale, 10, 400, 50),
    gap: clampInt(p.gap, 0, 400, 16),
    margin: clampInt(p.margin, 0, 400, 16),
    shortcut: p.shortcut !== false,
    selectOne: p.selectOne === true,
    labels: typeof p.labels === 'string' ? p.labels : '',
  };
}

function isUiMessage(value: unknown): value is UiMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as { type?: unknown };
  return message.type === 'ready' || message.type === 'sets' || message.type === 'scatter';
}

// ---------------------------------------------------------------------------
// Случайность: mulberry32 — маленький детерминированный генератор.
// ---------------------------------------------------------------------------
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rnd: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

// ---------------------------------------------------------------------------
// Компонент-сеты файла: список для выпадашки и выбор по id
// ---------------------------------------------------------------------------
interface SetInfo { id: string; name: string; page: string; variants: number }

function describeSet(set: ComponentSetNode, page: PageNode): SetInfo {
  return { id: set.id, name: set.name, page: page.name, variants: set.children.length };
}

async function listSets(): Promise<SetInfo[]> {
  const out: SetInfo[] = [];
  for (const page of figma.root.children) {
    await page.loadAsync();
    for (const set of page.findAllWithCriteria({ types: ['COMPONENT_SET'] })) out.push(describeSet(set, page));
  }
  // Сет ярлыков — первым, остальные по имени.
  out.sort((a, b) => (a.name === SET_NAME ? -1 : b.name === SET_NAME ? 1 : a.name.localeCompare(b.name)));
  return out;
}

async function findIconSet(setId: string): Promise<ComponentSetNode | null> {
  const wanted = setId !== '' ? setId : figma.root.getPluginData(DATA_SET);
  if (wanted !== '') {
    const node = await figma.getNodeByIdAsync(wanted);
    if (node !== null && node.type === 'COMPONENT_SET') {
      figma.root.setPluginData(DATA_SET, node.id);
      return node;
    }
  }
  for (const page of figma.root.children) {
    await page.loadAsync();
    const found = page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((s) => s.name === SET_NAME);
    if (found !== undefined) {
      figma.root.setPluginData(DATA_SET, found.id);
      return found;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Цель: прямоугольник (результат ложится над ним) или фрейм (внутрь).
// Если выделен прошлый результат плагина — берём его цель, чтобы крутить сид.
// ---------------------------------------------------------------------------
type Desktop = { node: SceneNode; container: BaseNode & ChildrenMixin; index: number; inside: boolean };

function describeSelection(): { ok: boolean; text: string } {
  const sel = figma.currentPage.selection;
  if (sel.length !== 1) return { ok: false, text: 'Выделите прямоугольник или фрейм' };
  const n = sel[0];
  if (n.getPluginData(DATA_TARGET) !== '') return { ok: true, text: 'Результат: ' + n.name };
  if (n.type === 'RECTANGLE' || n.type === 'FRAME' || n.type === 'COMPONENT') return { ok: true, text: 'Стол: ' + n.name };
  return { ok: false, text: 'Нужен прямоугольник или фрейм' };
}

async function resolveDesktop(): Promise<Desktop | string> {
  const sel = figma.currentPage.selection;
  if (sel.length !== 1) return 'Выделите один прямоугольник или фрейм';
  let node: SceneNode = sel[0];
  const targetId = node.getPluginData(DATA_TARGET);
  if (targetId !== '') {
    const target = await figma.getNodeByIdAsync(targetId);
    if (target === null || target.removed || target.type === 'PAGE' || target.type === 'DOCUMENT') {
      return 'Стол этого результата удалён — выделите новый';
    }
    node = target as SceneNode;
  }
  if (node.type === 'FRAME' || node.type === 'COMPONENT') {
    return { node, container: node, index: node.children.length, inside: true };
  }
  if (node.type === 'RECTANGLE') {
    const parent = node.parent;
    if (parent === null || !('children' in parent)) return 'У прямоугольника нет родителя';
    return { node, container: parent, index: parent.children.indexOf(node) + 1, inside: false };
  }
  return 'Нужен прямоугольник или фрейм';
}

// Прошлый результат для той же цели удаляется — плагин владеет только своими слоями.
function removePrevious(desktop: Desktop): number {
  let index = desktop.index;
  const stale = desktop.container.children.filter((c) => c.getPluginData(DATA_TARGET) === desktop.node.id);
  for (const s of stale) {
    const i = desktop.container.children.indexOf(s);
    if (i < index) index -= 1;
    s.remove();
  }
  return Math.min(index, desktop.container.children.length);
}

// ---------------------------------------------------------------------------
// Раскладка
// ---------------------------------------------------------------------------
interface Cell { x: number; y: number }

// Каждый ярлык получает «аккуратную» позицию (столбцами сверху вниз от левого
// верхнего угла, как в Windows) и случайную точку на всём столе. Хаос смешивает
// их: 0 — только аккуратная, 100 — только случайная. Так при среднем хаосе
// ярлыки ещё тянутся к углу, а при полном равномерно покрывают стол.
function targets(w: number, h: number, cellW: number, cellH: number, p: Params, rnd: () => number): Cell[] {
  const rows = Math.max(1, Math.floor((h - 2 * p.margin + p.gap) / cellH));
  const maxX = Math.max(p.margin, w - p.margin - cellW + p.gap);
  const maxY = Math.max(p.margin, h - p.margin - cellH + p.gap);
  const k = p.chaos / 100;
  const out: Cell[] = [];
  for (let i = 0; i < p.count; i++) {
    const tidy = { x: p.margin + Math.floor(i / rows) * cellW, y: p.margin + (i % rows) * cellH };
    const wild = { x: p.margin + rnd() * (maxX - p.margin), y: p.margin + rnd() * (maxY - p.margin) };
    out.push({ x: tidy.x + (wild.x - tidy.x) * k, y: tidy.y + (wild.y - tidy.y) * k });
  }
  return out;
}

function overlaps(a: Cell, b: Cell, cellW: number, cellH: number, gap: number): boolean {
  return Math.abs(a.x - b.x) < cellW - gap && Math.abs(a.y - b.y) < cellH - gap;
}

// По сетке: цель округляется до ближайшей ячейки, занятые ячейки обходятся по
// кольцам вокруг неё. Свободно: вокруг цели ищется место без пересечений, радиус
// поиска растёт с каждой попыткой; если места нет — ярлык пропускается.
function place(goals: Cell[], w: number, h: number, cellW: number, cellH: number, p: Params, rnd: () => number): Cell[] {
  const cols = Math.max(1, Math.floor((w - 2 * p.margin + p.gap) / cellW));
  const rows = Math.max(1, Math.floor((h - 2 * p.margin + p.gap) / cellH));
  const placed: Cell[] = [];
  if (p.align) {
    const used = new Set<string>();
    for (const g of goals) {
      const c0 = Math.max(0, Math.min(cols - 1, Math.round((g.x - p.margin) / cellW)));
      const r0 = Math.max(0, Math.min(rows - 1, Math.round((g.y - p.margin) / cellH)));
      let found: Cell | null = null;
      for (let ring = 0; ring <= Math.max(cols, rows) && found === null; ring++) {
        for (let dc = -ring; dc <= ring && found === null; dc++) {
          for (let dr = -ring; dr <= ring; dr++) {
            if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring) continue;
            const c = c0 + dc;
            const r = r0 + dr;
            if (c < 0 || r < 0 || c >= cols || r >= rows || used.has(c + ':' + r)) continue;
            used.add(c + ':' + r);
            found = { x: p.margin + c * cellW, y: p.margin + r * cellH };
            break;
          }
        }
      }
      if (found === null) break; // сетка заполнена
      placed.push(found);
    }
    return placed;
  }
  const maxX = Math.max(p.margin, w - p.margin - cellW + p.gap);
  const maxY = Math.max(p.margin, h - p.margin - cellH + p.gap);
  for (const g of goals) {
    let found: Cell | null = null;
    for (let t = 0; t < MAX_TRIES && found === null; t++) {
      const radius = t * (cellW + cellH) / 8;
      const angle = rnd() * Math.PI * 2;
      const c = {
        x: Math.max(p.margin, Math.min(maxX, g.x + Math.cos(angle) * radius * rnd())),
        y: Math.max(p.margin, Math.min(maxY, g.y + Math.sin(angle) * radius * rnd())),
      };
      if (!placed.some((o) => overlaps(o, c, cellW, cellH, p.gap))) found = c;
    }
    if (found === null) continue;
    placed.push({ x: Math.round(found.x), y: Math.round(found.y) });
  }
  return placed;
}

// ---------------------------------------------------------------------------
// Генерация
// ---------------------------------------------------------------------------
function propertyKey(set: ComponentSetNode, name: string): string | undefined {
  return Object.keys(set.componentPropertyDefinitions).find((k) => k === name || k.startsWith(name + '#'));
}

async function setLabel(inst: InstanceNode, label: string): Promise<boolean> {
  const text = inst.findOne((n) => n.type === 'TEXT');
  if (text === null || text.type !== 'TEXT') return false;
  const font = text.fontName;
  if (font === figma.mixed) return false;
  try {
    await figma.loadFontAsync(font);
  } catch {
    return false;
  }
  text.characters = label;
  return true;
}

async function scatter(params: Params): Promise<string> {
  const desktop = await resolveDesktop();
  if (typeof desktop === 'string') throw new Error(desktop);
  const set = await findIconSet(params.setId);
  if (set === null) throw new Error('Не найден компонент-сет «' + SET_NAME + '» — выберите сет в списке');
  const variants = set.children.filter((c): c is ComponentNode => c.type === 'COMPONENT');
  if (variants.length === 0) throw new Error('В сете нет вариантов');

  const rnd = mulberry32(params.seed);
  const scale = params.scale / 100;
  const w = desktop.node.width;
  const h = desktop.node.height;
  const cellW = Math.max(...variants.map((v) => v.width)) * scale + params.gap;
  const cellH = Math.max(...variants.map((v) => v.height)) * scale + params.gap;
  const cells = place(targets(w, h, cellW, cellH, params, rnd), w, h, cellW, cellH, params, rnd);
  if (cells.length === 0) throw new Error('Стол слишком мал для такого масштаба');
  params.setId = set.id;

  const index = removePrevious(desktop);
  const result = figma.createFrame();
  result.name = 'Desktop scatter · seed ' + String(params.seed);
  result.fills = [];
  result.clipsContent = true;
  result.resize(w, h);
  desktop.container.insertChild(index, result);
  if (desktop.inside) {
    result.x = 0;
    result.y = 0;
  } else {
    result.x = desktop.node.x;
    result.y = desktop.node.y;
    if ('rotation' in desktop.node) result.rotation = desktop.node.rotation;
  }
  result.setPluginData(DATA_TARGET, desktop.node.id);
  result.setPluginData(DATA_PARAMS, JSON.stringify(params));
  result.setRelaunchData({ [figma.pluginId ?? '']: 'сид ' + String(params.seed) });

  const shortcutKey = propertyKey(set, 'Shortcut');
  const selectedKey = propertyKey(set, 'Selected');
  const labels = params.labels.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
  const selectedIndex = params.selectOne ? Math.floor(rnd() * cells.length) : -1;
  let labelFailures = 0;

  for (let i = 0; i < cells.length; i++) {
    const variant = variants[Math.floor(rnd() * variants.length)];
    const inst = variant.createInstance();
    result.appendChild(inst);
    if (scale !== 1) inst.rescale(scale);
    const props: { [key: string]: boolean } = {};
    if (shortcutKey !== undefined) props[shortcutKey] = params.shortcut;
    if (selectedKey !== undefined) props[selectedKey] = i === selectedIndex;
    if (Object.keys(props).length > 0) inst.setProperties(props);
    if (labels.length > 0) {
      const ok = await setLabel(inst, labels[Math.floor(rnd() * labels.length)]);
      if (!ok) labelFailures += 1;
    }
    // Ячейка считается по самому широкому варианту; ярлык центрируется в ней.
    inst.x = Math.round(cells[i].x + (cellW - params.gap - inst.width) / 2);
    inst.y = Math.round(cells[i].y);
  }

  figma.currentPage.selection = [result];
  figma.commitUndo();
  let text = 'Сид ' + String(params.seed) + ', ' + set.name + ': ' + String(cells.length) + ' ярлык' + plural(cells.length, '', 'а', 'ов');
  if (cells.length < params.count) text += ' (уместилось меньше)';
  if (labelFailures > 0) text += '; подписи не заменены — шрифт недоступен';
  return text;
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return String(error);
}

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
function sendSelection(): void {
  const info = describeSelection();
  let params: Params | null = null;
  const sel = figma.currentPage.selection;
  if (sel.length === 1) {
    const raw = sel[0].getPluginData(DATA_PARAMS);
    if (raw !== '') {
      try {
        params = normalizeParams(JSON.parse(raw));
      } catch {
        params = null;
      }
    }
  }
  figma.ui.postMessage({ type: 'selection', ok: info.ok, text: info.text, params });
}

async function sendSets(): Promise<void> {
  const sets = await listSets();
  const remembered = figma.root.getPluginData(DATA_SET);
  const preferred = sets.find((s) => s.id === remembered) ?? sets.find((s) => s.name === SET_NAME) ?? sets[0];
  figma.ui.postMessage({ type: 'sets', sets, current: preferred !== undefined ? preferred.id : '' });
}

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
figma.showUI(__html__, { width: UI_SIZE.width, height: UI_SIZE.height, title: 'Desktop Scatter' });

async function handleUiMessage(message: UiMessage): Promise<void> {
  switch (message.type) {
    case 'ready':
      sendSelection();
      await sendSets();
      break;
    case 'sets':
      await sendSets();
      break;
    case 'scatter':
      try {
        const text = await scatter(normalizeParams(message.params));
        figma.ui.postMessage({ type: 'status', text, error: false });
      } catch (error) {
        figma.ui.postMessage({ type: 'status', text: errorMessage(error), error: true });
      }
      break;
  }
}

figma.ui.onmessage = (message: unknown) => {
  if (isUiMessage(message)) void handleUiMessage(message);
};

figma.on('selectionchange', sendSelection);
figma.on('currentpagechange', sendSelection);
