// Shader Toggle — одной кнопкой выключает и включает все шейдерные эффекты
// (и шейдерные заливки) на текущей странице или в выделении. На слоях-линзах
// вместе с шейдером переключается и эффект Glass, чтобы слой гас целиком.
// Слои, у которых эффекты приходят из Effect Style, не трогаются (стиль общий),
// плагин только сообщает, сколько их.

'use strict';

const PANEL_WIDTH = 280;

type Scope = 'page' | 'selection';

type UiMessage =
  | { type: 'resize'; height: number }
  | { type: 'count'; scope: Scope }
  | { type: 'toggle'; scope: Scope; force: 'on' | 'off' | 'auto' };

interface State { total: number; on: number; styled: number; selection: number }

function isUiMessage(value: unknown): value is UiMessage {
  if (typeof value !== 'object' || value === null) return false;
  const t = (value as { type?: unknown }).type;
  return t === 'resize' || t === 'count' || t === 'toggle';
}

function typeOf(item: Effect | Paint): string {
  return (item as { type: string }).type;
}

function isShaderEffect(e: Effect): boolean { return typeOf(e) === 'SHADER'; }
function isGlassEffect(e: Effect): boolean { return typeOf(e) === 'GLASS'; }
function isShaderPaint(p: Paint): boolean { return typeOf(p).indexOf('SHADER') >= 0; }

function hasShader(node: SceneNode): boolean {
  if ('effects' in node && node.effects.some(isShaderEffect)) return true;
  if ('fills' in node && Array.isArray(node.fills) && node.fills.some(isShaderPaint)) return true;
  return false;
}

// Слои с шейдерами: вся страница или выделение вместе с потомками.
function collect(scope: Scope): SceneNode[] {
  if (scope === 'page') return figma.currentPage.findAll(hasShader);
  const out: SceneNode[] = [];
  for (const n of figma.currentPage.selection) {
    if (hasShader(n)) out.push(n);
    if ('findAll' in n) for (const d of n.findAll(hasShader)) out.push(d);
  }
  return out;
}

function measure(scope: Scope): State {
  const state: State = { total: 0, on: 0, styled: 0, selection: figma.currentPage.selection.length };
  for (const n of collect(scope)) {
    if ('effects' in n) {
      const styled = n.effectStyleId !== '';
      for (const e of n.effects) {
        if (!isShaderEffect(e)) continue;
        state.total += 1;
        if (e.visible) state.on += 1;
        if (styled) state.styled += 1;
      }
    }
    if ('fills' in n && Array.isArray(n.fills)) {
      const styled = typeof n.fillStyleId === 'string' && n.fillStyleId !== '';
      for (const p of n.fills) {
        if (!isShaderPaint(p)) continue;
        state.total += 1;
        if (p.visible !== false) state.on += 1;
        if (styled) state.styled += 1;
      }
    }
  }
  return state;
}

function toggle(scope: Scope, force: 'on' | 'off' | 'auto'): State {
  const before = measure(scope);
  const turnOn = force === 'auto' ? before.on === 0 : force === 'on';
  for (const n of collect(scope)) {
    if ('effects' in n && n.effectStyleId === '' && n.effects.some(isShaderEffect)) {
      n.effects = n.effects.map((e) => (isShaderEffect(e) || isGlassEffect(e) ? { ...e, visible: turnOn } : e));
    }
    if ('fills' in n && Array.isArray(n.fills) && !(typeof n.fillStyleId === 'string' && n.fillStyleId !== '') && n.fills.some(isShaderPaint)) {
      n.fills = n.fills.map((p) => (isShaderPaint(p) ? { ...p, visible: turnOn } : p));
    }
  }
  figma.commitUndo();
  return measure(scope);
}

function send(scope: Scope, state: State, note: string): void {
  figma.ui.postMessage({ type: 'state', scope, state, note });
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
figma.showUI(__html__, { width: PANEL_WIDTH, height: 180, title: 'Shader Toggle' });

let lastScope: Scope = 'page';

function handle(message: UiMessage): void {
  switch (message.type) {
    case 'resize':
      figma.ui.resize(PANEL_WIDTH, Math.max(48, Math.min(900, Math.round(message.height))));
      break;
    case 'count':
      lastScope = message.scope;
      send(lastScope, measure(lastScope), '');
      break;
    case 'toggle': {
      lastScope = message.scope;
      try {
        const state = toggle(lastScope, message.force);
        send(lastScope, state, state.total === 0 ? 'Шейдеров не найдено' : state.on > 0 ? 'Шейдеры включены' : 'Шейдеры выключены');
      } catch (error) {
        send(lastScope, measure(lastScope), 'Ошибка: ' + String(error));
      }
      break;
    }
  }
}

figma.ui.onmessage = (message: unknown) => {
  if (isUiMessage(message)) handle(message);
};

figma.on('selectionchange', () => { send(lastScope, measure(lastScope), ''); });
figma.on('currentpagechange', () => { send(lastScope, measure(lastScope), ''); });
