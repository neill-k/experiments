import { GRID_W, GRID_H, CELL_PX } from './constants';
import { CellType } from './types';
import type { SimState } from './types';

export interface InteractionCallbacks {
  onDropFood: (gridX: number, gridY: number) => void;
  onCaveIn: (gridX: number, gridY: number) => void;
  onRain: () => void;
  onSpeedChange: (speed: number) => void;
  onPauseToggle: () => void;
}

export function setupInteraction(
  canvas: HTMLCanvasElement,
  getState: () => SimState,
  callbacks: InteractionCallbacks
): () => void {
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let lastClickTime = 0;
  let pointerDown = false;

  function canvasToGrid(clientX: number, clientY: number): { gx: number; gy: number } {
    const rect = canvas.getBoundingClientRect();
    const scaleX = (GRID_W * CELL_PX) / rect.width;
    const scaleY = (GRID_H * CELL_PX) / rect.height;
    const px = (clientX - rect.left) * scaleX;
    const py = (clientY - rect.top) * scaleY;
    return { gx: Math.floor(px / CELL_PX), gy: Math.floor(py / CELL_PX) };
  }

  function handlePointerDown(e: PointerEvent) {
    pointerDown = true;
    const { gx, gy } = canvasToGrid(e.clientX, e.clientY);
    const state = getState();
    longPressTimer = setTimeout(() => {
      if (pointerDown) {
        const sy = state.surfaceY[gx] ?? 0;
        if (gy < sy) callbacks.onRain();
      }
    }, 800);
  }

  function handlePointerUp(e: PointerEvent) {
    pointerDown = false;
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    const { gx, gy } = canvasToGrid(e.clientX, e.clientY);
    if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return;
    const state = getState();
    const now = Date.now();
    if (now - lastClickTime < 350) {
      const cell = state.terrain[gy * GRID_W + gx];
      if (cell === CellType.AIR || cell === CellType.TUNNEL) callbacks.onCaveIn(gx, gy);
      lastClickTime = 0;
      return;
    }
    lastClickTime = now;
    callbacks.onDropFood(gx, gy);
  }

  function handleKeyDown(e: KeyboardEvent) {
    switch (e.key.toLowerCase()) {
      case 'r': callbacks.onRain(); break;
      case '1': callbacks.onSpeedChange(1); break;
      case '2': callbacks.onSpeedChange(2); break;
      case '3': callbacks.onSpeedChange(5); break;
      case ' ': e.preventDefault(); callbacks.onPauseToggle(); break;
    }
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('keydown', handleKeyDown);
    if (longPressTimer) clearTimeout(longPressTimer);
  };
}
