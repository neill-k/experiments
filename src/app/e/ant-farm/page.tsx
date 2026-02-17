'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createSimState, tickSimulation, triggerRain, dropFood, caveIn } from './simulation';
import {
  GRID_W, GRID_H, CELL_PX, CANVAS_W, CANVAS_H,
  PHERO_RENDER_SKIP, PHERO_RENDER_SCALE, MAX_DPR, MOBILE_MAX_ANTS, MAX_ANTS, COLORS,
} from './constants';
import { CellType } from './types';
import type { SimState, Ant } from './types';
import { Comments } from '@/components/comments/Comments';

/* ── terrain colour helpers ── */
function terrainColor(cell: number, y: number): string {
  const depth = y / GRID_H;
  switch (cell) {
    case CellType.AIR: return depth < 0.18 ? lerpColor(COLORS.skyTop, COLORS.skyBottom, depth / 0.18) : COLORS.bg;
    case CellType.DIRT: return depth < 0.35 ? COLORS.topsoil : COLORS.clay;
    case CellType.HARD_DIRT: return depth < 0.6 ? COLORS.sand : COLORS.deepEarth;
    case CellType.ROCK: return COLORS.rock;
    case CellType.FOOD_SOURCE: return COLORS.foodLeaf;
    case CellType.WATER: return COLORS.water;
    case CellType.FOOD_STORE: return COLORS.foodStore;
    case CellType.TUNNEL: return COLORS.tunnel;
    default: return COLORS.bg;
  }
}

function lerpColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t), g = Math.round(ag + (bg - ag) * t), bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

const PH_FOOD_RGB = hexToRgb(COLORS.pheroFood);
const PH_HOME_RGB = hexToRgb(COLORS.pheroHome);
const PH_ALARM_RGB = hexToRgb(COLORS.pheroAlarm);

/* ── grass drawing ── */
function drawGrass(ctx: CanvasRenderingContext2D, surfaceY: number[], px: number) {
  ctx.strokeStyle = COLORS.grass;
  ctx.lineWidth = 1;
  for (let x = 0; x < GRID_W; x += 2) {
    const sy = surfaceY[x];
    if (sy <= 0) continue;
    const bx = x * px, by = sy * px;
    const h = 3 + Math.sin(x * 0.7) * 2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.sin(x * 0.3) * 2, by - h * px * 0.3);
    ctx.stroke();
  }
}

/* ── render terrain to offscreen canvas ── */
function renderTerrain(
  terrainCtx: CanvasRenderingContext2D,
  state: SimState,
) {
  const { terrain, terrainDirty } = state;
  const px = CELL_PX;

  const minX = terrainDirty ? terrainDirty.minX : 0;
  const minY = terrainDirty ? terrainDirty.minY : 0;
  const maxX = terrainDirty ? terrainDirty.maxX : GRID_W - 1;
  const maxY = terrainDirty ? terrainDirty.maxY : GRID_H - 1;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const cell = terrain[y * GRID_W + x];
      terrainCtx.fillStyle = terrainColor(cell, y);
      terrainCtx.fillRect(x * px, y * px, px, px);
    }
  }

  // grass on surface
  if (!terrainDirty || terrainDirty.minY <= Math.max(...state.surfaceY) + 2) {
    drawGrass(terrainCtx, state.surfaceY, px);
  }

  state.terrainDirty = null;
}

/* ── render pheromones ── */
function renderPheromones(ctx: CanvasRenderingContext2D, state: SimState) {
  const px = CELL_PX;
  const skip = PHERO_RENDER_SKIP;
  const scale = PHERO_RENDER_SCALE;

  for (let y = 0; y < GRID_H; y += skip) {
    for (let x = 0; x < GRID_W; x += skip) {
      const i = y * GRID_W + x;
      const f = state.pheroFood[i] * scale;
      const h = state.pheroHome[i] * scale;
      const a = state.pheroAlarm[i] * scale;
      if (f < 0.01 && h < 0.01 && a < 0.01) continue;

      const r = Math.min(255, Math.round(PH_FOOD_RGB[0] * f + PH_HOME_RGB[0] * h + PH_ALARM_RGB[0] * a));
      const g = Math.min(255, Math.round(PH_FOOD_RGB[1] * f + PH_HOME_RGB[1] * h + PH_ALARM_RGB[1] * a));
      const b = Math.min(255, Math.round(PH_FOOD_RGB[2] * f + PH_HOME_RGB[2] * h + PH_ALARM_RGB[2] * a));
      const alpha = Math.min(0.6, (f + h + a) * 0.3);

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(x * px, y * px, px * skip, px * skip);
    }
  }
}

/* ── render ants ── */
function renderAnts(ctx: CanvasRenderingContext2D, state: SimState) {
  const px = CELL_PX;
  const { ants } = state.colony;

  for (const ant of ants) {
    const sx = ant.x * px;
    const sy = ant.y * px;
    const size = ant.size * px * 0.6;

    // body
    ctx.fillStyle = ant.role === 'queen' ? COLORS.queen : COLORS.antBody;
    ctx.beginPath();
    ctx.ellipse(sx, sy, size, size * 0.6, ant.angle, 0, Math.PI * 2);
    ctx.fill();

    // head
    const headX = sx + Math.cos(ant.angle) * size;
    const headY = sy + Math.sin(ant.angle) * size;
    ctx.fillStyle = COLORS.antDark;
    ctx.beginPath();
    ctx.arc(headX, headY, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // carry indicator
    if (ant.carrying === 'food') {
      ctx.fillStyle = COLORS.foodLeaf;
      ctx.beginPath();
      ctx.arc(sx - Math.cos(ant.angle) * size * 0.5, sy - Math.sin(ant.angle) * size * 0.5, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/* ── render food items on surface ── */
function renderSurfaceFood(ctx: CanvasRenderingContext2D, state: SimState) {
  const px = CELL_PX;
  for (const food of state.colony.foods) {
    const size = Math.min(food.amount, 10) * 0.3 + 1;
    ctx.fillStyle = COLORS.foodBerry;
    ctx.beginPath();
    ctx.arc(food.x * px, food.y * px, size * px * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ── render eggs ── */
function renderEggs(ctx: CanvasRenderingContext2D, state: SimState) {
  const px = CELL_PX;
  ctx.fillStyle = '#e8dcc8';
  for (const egg of state.colony.eggs) {
    ctx.beginPath();
    ctx.arc(egg.x * px, egg.y * px, px * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ── rain particles ── */
function renderRain(ctx: CanvasRenderingContext2D, state: SimState) {
  if (!state.raining) return;
  ctx.strokeStyle = 'rgba(100,160,220,0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * CANVAS_W;
    const y = Math.random() * CANVAS_H * 0.3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 1, y + 8);
    ctx.stroke();
  }
}

/* ── HUD overlay ── */
function renderHUD(ctx: CanvasRenderingContext2D, state: SimState) {
  const { colony } = state;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textBaseline = 'top';

  const lines = [
    `ants: ${colony.ants.length}  eggs: ${colony.eggs.length}`,
    `food: ${Math.floor(colony.foodStored)}  tick: ${state.tick}`,
    `speed: ${state.speed}x${state.paused ? '  ⏸ PAUSED' : ''}`,
  ];

  const x = 8, y = 8;
  ctx.fillStyle = 'rgba(8,8,10,0.7)';
  ctx.fillRect(x - 4, y - 4, 200, lines.length * 16 + 8);

  ctx.fillStyle = COLORS.text;
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * 16));
}

/* ── main page component ── */
export default function AntFarmPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<SimState | null>(null);
  const rafRef = useRef<number>(0);
  const [showComments, setShowComments] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const terrainCanvas = terrainCanvasRef.current;
    const sim = simRef.current;
    if (!canvas || !terrainCanvas || !sim) return;

    const ctx = canvas.getContext('2d');
    const tCtx = terrainCanvas.getContext('2d');
    if (!ctx || !tCtx) return;

    // tick simulation
    if (!sim.paused) {
      const steps = sim.speed;
      for (let i = 0; i < steps; i++) tickSimulation(sim);
    }

    // render terrain to offscreen (dirty rects)
    if (sim.terrainDirty) renderTerrain(tCtx, sim);

    // composite
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.drawImage(terrainCanvas, 0, 0);
    renderPheromones(ctx, sim);
    renderSurfaceFood(ctx, sim);
    renderEggs(ctx, sim);
    renderAnts(ctx, sim);
    renderRain(ctx, sim);
    renderHUD(ctx, sim);

    rafRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    // init simulation
    const sim = createSimState();
    simRef.current = sim;

    // offscreen terrain canvas
    const tc = document.createElement('canvas');
    tc.width = CANVAS_W;
    tc.height = CANVAS_H;
    terrainCanvasRef.current = tc;

    // force full terrain draw
    sim.terrainDirty = { minX: 0, minY: 0, maxX: GRID_W - 1, maxY: GRID_H - 1 };

    // DPR scaling
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = CANVAS_W * dpr;
      canvas.height = CANVAS_H * dpr;
      tc.width = CANVAS_W * dpr;
      tc.height = CANVAS_H * dpr;
      const ctx = canvas.getContext('2d');
      const tCtx = tc.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      if (tCtx) tCtx.scale(dpr, dpr);
      // force redraw after scale
      sim.terrainDirty = { minX: 0, minY: 0, maxX: GRID_W - 1, maxY: GRID_H - 1 };
    }

    rafRef.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  // keyboard controls
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const sim = simRef.current;
      if (!sim) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          sim.paused = !sim.paused;
          setIsPaused(sim.paused);
          break;
        case '1': sim.speed = 1; setSpeed(1); break;
        case '2': sim.speed = 2; setSpeed(2); break;
        case '3': sim.speed = 4; setSpeed(4); break;
        case 'r':
        case 'R':
          triggerRain(sim);
          break;
        case '?':
          setShowHelp((h) => !h);
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // mouse/touch interaction
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    if (!sim || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const gx = Math.floor(px / CELL_PX);
    const gy = Math.floor(py / CELL_PX);

    dropFood(sim, gx, gy);
  }, []);

  const handleCanvasDblClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    if (!sim || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const gx = Math.floor(px / CELL_PX);
    const gy = Math.floor(py / CELL_PX);

    caveIn(sim, gx, gy);
  }, []);

  return (
    <div className="relative min-h-dvh" style={{ background: COLORS.bg }}>
      {/* canvas container - responsive */}
      <div className="flex items-center justify-center px-2 py-4 sm:py-8">
        <div className="w-full" style={{ maxWidth: CANVAS_W }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 'auto', aspectRatio: `${CANVAS_W}/${CANVAS_H}`, imageRendering: 'pixelated', cursor: 'crosshair' }}
            width={CANVAS_W}
            height={CANVAS_H}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDblClick}
          />

          {/* help tooltip */}
          {showHelp && (
            <div className="mt-3 border border-white/10 bg-white/[0.03] p-3 sm:p-4 text-[11px] font-[family-name:var(--font-mono)] text-white/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs uppercase tracking-widest">Controls</span>
                <button
                  onClick={() => setShowHelp(false)}
                  className="text-white/30 hover:text-white/60 transition-colors text-xs"
                >
                  dismiss
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mt-2">
                <span>Click - drop food</span>
                <span>Double-click - cave-in</span>
                <span>R - trigger rain</span>
                <span>Space - pause/resume</span>
                <span>1 / 2 / 3 - speed (1x / 2x / 4x)</span>
                <span>? - toggle this help</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#08080a]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-3 py-2 gap-2">
          {/* control buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const sim = simRef.current;
                if (!sim) return;
                sim.paused = !sim.paused;
                setIsPaused(sim.paused);
              }}
              className={`font-[family-name:var(--font-mono)] text-[11px] px-2 py-1 border transition-colors ${
                isPaused
                  ? 'border-amber-500/40 text-amber-400/80 bg-amber-500/10'
                  : 'border-white/10 text-white/40 hover:text-white/70'
              }`}
              title="Pause / Resume (Space)"
            >
              {isPaused ? '▶' : '⏸'}
            </button>
            {([1, 2, 4] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  const sim = simRef.current;
                  if (!sim) return;
                  sim.speed = s;
                  setSpeed(s);
                }}
                className={`font-[family-name:var(--font-mono)] text-[11px] px-2 py-1 border transition-colors ${
                  speed === s
                    ? 'border-white/30 text-white/70 bg-white/[0.06]'
                    : 'border-white/10 text-white/30 hover:text-white/60'
                }`}
                title={`Speed ${s}x`}
              >
                {s}x
              </button>
            ))}
            <button
              onClick={() => {
                const sim = simRef.current;
                if (sim) triggerRain(sim);
              }}
              className="font-[family-name:var(--font-mono)] text-[11px] px-2 py-1 border border-white/10 text-white/30 hover:text-blue-400/80 hover:border-blue-500/30 transition-colors"
              title="Trigger Rain (R)"
            >
              🌧
            </button>
          </div>
          {/* right side */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline font-[family-name:var(--font-mono)] text-[11px] text-white/20">
              Ant Farm
            </span>
            <button
              onClick={() => setShowHelp((h) => !h)}
              className={`font-[family-name:var(--font-mono)] text-[11px] px-1.5 py-0.5 border transition-colors ${
                showHelp
                  ? 'border-white/30 text-white/70 bg-white/[0.06]'
                  : 'border-white/10 text-white/25 hover:text-white/50'
              }`}
              title="Toggle controls help (?)"
            >
              ?
            </button>
            <a
              href="https://github.com/neill-k/experiments/tree/main/src/app/e/ant-farm"
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-[11px] text-white/15 hover:text-white/40 transition-colors"
            >
              &lt;/&gt;
            </a>
            <button
              onClick={() => setShowComments((s) => !s)}
              className="font-[family-name:var(--font-mono)] text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              {showComments ? 'hide comments' : 'comments'}
            </button>
          </div>
        </div>
      </div>

      {/* comments slide-out */}
      {showComments && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-white/10 bg-[#08080a]/95 backdrop-blur-md overflow-y-auto pt-16 pb-16 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-white/80">Comments</h2>
            <button
              onClick={() => setShowComments(false)}
              className="text-white/30 hover:text-white/60 transition-colors text-sm"
            >
              ✕
            </button>
          </div>
          <Comments slug="ant-farm" />
        </div>
      )}
    </div>
  );
}
