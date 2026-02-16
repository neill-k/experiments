import { GRID_W, GRID_H, CELL_PX, COLORS, PHERO_RENDER_SCALE } from './constants';
import { CellType } from './types';
import type { SimState } from './types';

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function hash2D(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

const COL_TOPSOIL = hexToRgb(COLORS.topsoil);
const COL_CLAY = hexToRgb(COLORS.clay);
const COL_DEEP = hexToRgb(COLORS.deepEarth);
const COL_BEDROCK = hexToRgb(COLORS.bedrock);
const COL_ROCK = hexToRgb(COLORS.rock);
const COL_FOOD = hexToRgb(COLORS.foodLeaf);
const COL_WATER = hexToRgb(COLORS.water);
const COL_SKY_TOP = hexToRgb(COLORS.skyTop);
const COL_SKY_BOT = hexToRgb(COLORS.skyBottom);
const COL_GRASS = hexToRgb(COLORS.grass);
const COL_TUNNEL_BG = hexToRgb('#0d0a06');

export function renderTerrain(
  ctx: CanvasRenderingContext2D,
  state: SimState,
  dirtyRect?: { minX: number; minY: number; maxX: number; maxY: number } | null
): void {
  const { terrain, surfaceY } = state;
  const minX = dirtyRect ? dirtyRect.minX : 0;
  const minY = dirtyRect ? dirtyRect.minY : 0;
  const maxX = dirtyRect ? dirtyRect.maxX : GRID_W - 1;
  const maxY = dirtyRect ? dirtyRect.maxY : GRID_H - 1;
  const pw = (maxX - minX + 1) * CELL_PX;
  const ph = (maxY - minY + 1) * CELL_PX;
  if (pw <= 0 || ph <= 0) return;
  const imgData = ctx.createImageData(pw, ph);
  const data = imgData.data;
  for (let gy = minY; gy <= maxY; gy++) {
    for (let gx = minX; gx <= maxX; gx++) {
      const cell = terrain[gy * GRID_W + gx];
      const noise = hash2D(gx, gy);
      const noiseOffset = (noise - 0.5) * 16;
      let r: number, g: number, b: number, a = 255;
      const depthFrac = gy / GRID_H;
      switch (cell) {
        case CellType.AIR: {
          const sy = surfaceY[gx] ?? 0;
          if (gy < sy) {
            const skyFrac = gy / Math.max(sy, 1);
            r = COL_SKY_TOP[0] + (COL_SKY_BOT[0] - COL_SKY_TOP[0]) * skyFrac;
            g = COL_SKY_TOP[1] + (COL_SKY_BOT[1] - COL_SKY_TOP[1]) * skyFrac;
            b = COL_SKY_TOP[2] + (COL_SKY_BOT[2] - COL_SKY_TOP[2]) * skyFrac;
          } else {
            r = COL_TUNNEL_BG[0] + noiseOffset * 0.3;
            g = COL_TUNNEL_BG[1] + noiseOffset * 0.2;
            b = COL_TUNNEL_BG[2] + noiseOffset * 0.1;
          }
          break;
        }
        case CellType.TUNNEL: {
          r = COL_TUNNEL_BG[0] + noiseOffset * 0.3;
          g = COL_TUNNEL_BG[1] + noiseOffset * 0.2;
          b = COL_TUNNEL_BG[2] + noiseOffset * 0.1;
          break;
        }
        case CellType.DIRT: {
          r = COL_TOPSOIL[0] + noiseOffset; g = COL_TOPSOIL[1] + noiseOffset * 0.8; b = COL_TOPSOIL[2] + noiseOffset * 0.5;
          break;
        }
        case CellType.HARD_DIRT: {
          if (depthFrac < 0.72) { r = COL_CLAY[0] + noiseOffset; g = COL_CLAY[1] + noiseOffset * 0.7; b = COL_CLAY[2] + noiseOffset * 0.4; }
          else { r = COL_DEEP[0] + noiseOffset * 0.6; g = COL_DEEP[1] + noiseOffset * 0.4; b = COL_DEEP[2] + noiseOffset * 0.3; }
          break;
        }
        case CellType.ROCK: {
          if (depthFrac > 0.92) { r = COL_BEDROCK[0] + noiseOffset * 0.4; g = COL_BEDROCK[1] + noiseOffset * 0.4; b = COL_BEDROCK[2] + noiseOffset * 0.4; }
          else { r = COL_ROCK[0] + noiseOffset * 0.5; g = COL_ROCK[1] + noiseOffset * 0.5; b = COL_ROCK[2] + noiseOffset * 0.5; }
          break;
        }
        case CellType.FOOD_SOURCE: { r = COL_FOOD[0] + noiseOffset; g = COL_FOOD[1] + noiseOffset * 0.5; b = COL_FOOD[2] + noiseOffset * 0.3; break; }
        case CellType.FOOD_STORE: { r = COL_FOOD[0] * 0.8 + noiseOffset; g = COL_FOOD[1] * 0.8 + noiseOffset * 0.5; b = COL_FOOD[2] * 0.5 + noiseOffset * 0.3; break; }
        case CellType.WATER: { r = COL_WATER[0] + noiseOffset * 0.3; g = COL_WATER[1] + noiseOffset * 0.3; b = COL_WATER[2] + noiseOffset * 0.6; a = 200; break; }
        default: { r = 0; g = 0; b = 0; }
      }
      r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
      const basePixX = (gx - minX) * CELL_PX;
      const basePixY = (gy - minY) * CELL_PX;
      for (let py = 0; py < CELL_PX; py++) {
        for (let px = 0; px < CELL_PX; px++) {
          const pi = ((basePixY + py) * pw + (basePixX + px)) * 4;
          data[pi] = r; data[pi + 1] = g; data[pi + 2] = b; data[pi + 3] = a;
        }
      }
    }
  }
  ctx.putImageData(imgData, minX * CELL_PX, minY * CELL_PX);
  for (let gx = minX; gx <= maxX; gx++) {
    const sy = surfaceY[gx];
    if (sy < minY || sy > maxY + 1 || sy <= 0 || sy >= GRID_H) continue;
    if (terrain[sy * GRID_W + gx] !== CellType.DIRT) continue;
    const px = gx * CELL_PX + CELL_PX / 2;
    const pyBase = sy * CELL_PX;
    const h = hash2D(gx, 999);
    if (h > 0.3) {
      const bladeH = 2 + h * 4;
      ctx.fillStyle = `rgb(${COL_GRASS[0] + h * 20},${COL_GRASS[1] + h * 30},${COL_GRASS[2] + h * 10})`;
      ctx.beginPath(); ctx.moveTo(px - 1, pyBase); ctx.lineTo(px + (h - 0.5) * 3, pyBase - bladeH); ctx.lineTo(px + 1, pyBase); ctx.fill();
    }
  }
}

export function renderEntities(ctx: CanvasRenderingContext2D, state: SimState, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  const { colony } = state;
  for (const food of colony.foods) {
    const px = food.x * CELL_PX; const py = food.y * CELL_PX;
    const size = Math.min(food.amount, 10) * 0.3 + 1;
    ctx.fillStyle = COLORS.foodLeaf;
    ctx.fillRect(px - size, py - size, size * 2, size * 2);
  }
  for (const egg of colony.eggs) {
    const px = egg.x * CELL_PX; const py = egg.y * CELL_PX;
    ctx.fillStyle = 'rgba(255, 255, 230, 0.8)';
    ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
  }
  for (const ant of colony.ants) {
    const px = ant.x * CELL_PX; const py = ant.y * CELL_PX;
    const s = ant.size * CELL_PX * 0.5;
    const isQueen = ant.role === 'queen';
    const bodyColor = isQueen ? '#d4823a' : COLORS.antBody;
    const darkColor = isQueen ? '#a05020' : COLORS.antDark;
    ctx.save(); ctx.translate(px, py); ctx.rotate(ant.angle);
    ctx.fillStyle = darkColor; ctx.beginPath(); ctx.ellipse(-s * 1.2, 0, s * 0.7, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = bodyColor; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.35, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = darkColor; ctx.beginPath(); ctx.arc(s * 0.8, 0, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = darkColor; ctx.lineWidth = 0.5;
    for (let leg = 0; leg < 3; leg++) {
      const lx = -s * 0.4 + leg * s * 0.5; const legLen = s * 0.6;
      ctx.beginPath(); ctx.moveTo(lx, -s * 0.2); ctx.lineTo(lx - s * 0.2, -legLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lx, s * 0.2); ctx.lineTo(lx - s * 0.2, legLen); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(s * 0.9, -s * 0.1); ctx.lineTo(s * 1.4, -s * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(s * 0.9, s * 0.1); ctx.lineTo(s * 1.4, s * 0.5); ctx.stroke();
    if (ant.carrying === 'food') { ctx.fillStyle = COLORS.foodLeaf; ctx.beginPath(); ctx.arc(s * 0.3, 0, s * 0.2, 0, Math.PI * 2); ctx.fill(); }
    else if (ant.carrying === 'dirt') { ctx.fillStyle = COLORS.topsoil; ctx.beginPath(); ctx.arc(s * 0.3, 0, s * 0.2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  if (state.raining) {
    ctx.strokeStyle = 'rgba(100, 160, 220, 0.4)'; ctx.lineWidth = 1;
    const t = state.tick * 0.1;
    for (let i = 0; i < 80; i++) {
      const dx = ((hash2D(i, 0) * width + t * (30 + hash2D(i, 1) * 20)) % width);
      const dy = ((hash2D(i, 2) * height + t * (80 + hash2D(i, 3) * 40)) % height);
      const maxSy = (state.surfaceY[Math.floor(dx / CELL_PX)] ?? GRID_H * 0.2) * CELL_PX;
      if (dy < maxSy) { ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx - 1, dy + 6); ctx.stroke(); }
    }
  }
}

export function renderPheromones(ctx: CanvasRenderingContext2D, state: SimState, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  const scale = PHERO_RENDER_SCALE;
  const sw = Math.ceil(GRID_W * scale); const sh = Math.ceil(GRID_H * scale);
  const imgData = ctx.createImageData(sw, sh); const data = imgData.data;
  for (let sy = 0; sy < sh; sy++) {
    const gy = Math.floor(sy / scale);
    for (let sx = 0; sx < sw; sx++) {
      const gx = Math.floor(sx / scale);
      if (gx >= GRID_W || gy >= GRID_H) continue;
      const i = gy * GRID_W + gx;
      const food = state.pheroFood[i]; const home = state.pheroHome[i]; const alarm = state.pheroAlarm[i];
      if (food < 0.01 && home < 0.01 && alarm < 0.01) continue;
      let r = 0, g = 0, b = 0, a = 0;
      if (food > 0.01) { const fa = Math.min(food * 0.15, 0.6); g += 200 * fa; b += 255 * fa; a = Math.max(a, fa); }
      if (home > 0.01) { const ha = Math.min(home * 0.1, 0.4); r += 255 * ha; g += 170 * ha; a = Math.max(a, ha); }
      if (alarm > 0.01) { const aa = Math.min(alarm * 0.2, 0.8); r += 255 * aa; g += 50 * aa; b += 50 * aa; a = Math.max(a, aa); }
      const pi = (sy * sw + sx) * 4;
      data[pi] = Math.min(255, r); data[pi + 1] = Math.min(255, g); data[pi + 2] = Math.min(255, b); data[pi + 3] = Math.min(255, a * 255);
    }
  }
  const tempCanvas = new OffscreenCanvas(sw, sh);
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return;
  tempCtx.putImageData(imgData, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(tempCanvas, 0, 0, width, height);
}
