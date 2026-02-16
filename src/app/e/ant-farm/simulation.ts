import {
  GRID_W, GRID_H, INITIAL_ANTS, MAX_ANTS, ANT_SPEED, ANT_TURN_RATE,
  ANT_ENERGY_MAX, ANT_ENERGY_DRAIN, PHERO_DECAY_FOOD, PHERO_DECAY_HOME,
  PHERO_DECAY_ALARM, PHERO_DIFFUSE, PHERO_DEPOSIT_FOOD, PHERO_DEPOSIT_HOME,
  PHERO_DEPOSIT_ALARM, PHERO_SENSE_RANGE, PHERO_WALK_DECAY,
  EGG_INTERVAL, HATCH_TIME, MATURE_TIME, FOOD_SPAWN_INTERVAL,
  WATER_EVAP_RATE, RAIN_DURATION,
} from './constants';
import { CellType } from './types';
import type { Ant, SimState } from './types';

let _seed = 42;
function seedRng(s: number) { _seed = s; }
function rng(): number {
  _seed = (_seed * 16807 + 0) % 2147483647;
  return (_seed - 1) / 2147483646;
}
function idx(x: number, y: number): number { return y * GRID_W + x; }
function inBounds(x: number, y: number): boolean {
  return x >= 0 && x < GRID_W && y >= 0 && y < GRID_H;
}
function isSolid(cell: number): boolean {
  return cell === CellType.DIRT || cell === CellType.HARD_DIRT ||
    cell === CellType.ROCK || cell === CellType.FOOD_SOURCE || cell === CellType.FOOD_STORE;
}
function isDiggable(cell: number): boolean {
  return cell === CellType.DIRT || cell === CellType.HARD_DIRT;
}
function noise1D(x: number, s: number): number {
  return Math.sin(x * 0.05 * s) * 0.5 + Math.sin(x * 0.12 * s + 1.3) * 0.3 + Math.sin(x * 0.03 * s + 2.7) * 0.2;
}
function hash2D(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = ((h ^ (h >> 13)) * 1274126177) | 0;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}
let _antId = 0;
function createAnt(x: number, y: number, role: Ant['role'], mature: boolean): Ant {
  return {
    id: _antId++, x, y, angle: rng() * Math.PI * 2,
    speed: role === 'queen' ? ANT_SPEED * 0.3 : ANT_SPEED,
    role, state: role === 'queen' ? 'resting' : 'wandering',
    stateTimer: 0, carrying: 'none', carryAmount: 0,
    energy: ANT_ENERGY_MAX, phFood: 0, phHome: 1.0,
    wanderAngle: rng() * Math.PI * 2, target: null,
    age: 0, mature, size: mature ? (role === 'queen' ? 1.6 : 1.0) : 0.5,
  };
}

function generateTerrain(state: SimState): void {
  seedRng(12345);
  const { terrain, surfaceY } = state;
  const surfaceBase = Math.floor(GRID_H * 0.18);
  for (let x = 0; x < GRID_W; x++) {
    surfaceY[x] = Math.floor(surfaceBase + noise1D(x, 1.0) * 6 + noise1D(x, 2.3) * 3);
  }
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const sy = surfaceY[x]; const i = idx(x, y);
      if (y < sy) { terrain[i] = CellType.AIR; }
      else if (y < sy + Math.floor(GRID_H * 0.2)) { terrain[i] = CellType.DIRT; }
      else if (y < Math.floor(GRID_H * 0.92)) { terrain[i] = CellType.HARD_DIRT; }
      else { terrain[i] = CellType.ROCK; }
    }
  }
  for (let c = 0; c < 5 + Math.floor(rng() * 4); c++) {
    const cx = Math.floor(rng() * GRID_W), cy = Math.floor(GRID_H * 0.35 + rng() * GRID_H * 0.5);
    const r = 3 + Math.floor(rng() * 6);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (inBounds(nx, ny) && Math.sqrt(dx * dx + dy * dy) < r && hash2D(nx, ny) > 0.3 && terrain[idx(nx, ny)] !== CellType.AIR)
        terrain[idx(nx, ny)] = CellType.ROCK;
    }
  }
  for (let c = 0; c < 4 + Math.floor(rng() * 3); c++) {
    const cx = Math.floor(rng() * GRID_W), cy = Math.floor(GRID_H * 0.3 + rng() * GRID_H * 0.4);
    const r = 2 + Math.floor(rng() * 3);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (inBounds(nx, ny) && dx * dx + dy * dy < r * r) {
        const i = idx(nx, ny);
        if (terrain[i] === CellType.DIRT || terrain[i] === CellType.HARD_DIRT) terrain[i] = CellType.FOOD_SOURCE;
      }
    }
  }
  for (let c = 0; c < 2 + Math.floor(rng() * 2); c++) {
    const cx = Math.floor(rng() * GRID_W), cy = Math.floor(GRID_H * 0.72 + rng() * GRID_H * 0.15);
    const r = 3 + Math.floor(rng() * 3);
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = cx + dx, ny = cy + dy;
      if (inBounds(nx, ny) && dx * dx + dy * dy < r * r) {
        const i = idx(nx, ny);
        if (terrain[i] !== CellType.AIR && terrain[i] !== CellType.ROCK) terrain[i] = CellType.WATER;
      }
    }
  }
  const entranceX = Math.floor(GRID_W / 2);
  const entranceTop = surfaceY[entranceX];
  for (let dy = 0; dy < 30; dy++) for (let dx = -2; dx <= 1; dx++) {
    const nx = entranceX + dx, ny = entranceTop + dy;
    if (inBounds(nx, ny)) terrain[idx(nx, ny)] = CellType.TUNNEL;
  }
  const chamberX = entranceX - 5, chamberY = entranceTop + 30;
  for (let dy = 0; dy < 6; dy++) for (let dx = 0; dx < 10; dx++) {
    const nx = chamberX + dx, ny = chamberY + dy;
    if (inBounds(nx, ny)) terrain[idx(nx, ny)] = CellType.TUNNEL;
  }
  state.colony.centerX = entranceX;
  state.colony.centerY = chamberY + 3;
  state.terrainDirty = { minX: 0, minY: 0, maxX: GRID_W - 1, maxY: GRID_H - 1 };
}

function samplePheromone(phero: Float32Array, x: number, y: number): number {
  const gx = Math.floor(x), gy = Math.floor(y);
  if (!inBounds(gx, gy)) return 0;
  return phero[idx(gx, gy)];
}
function depositPheromone(phero: Float32Array, x: number, y: number, amount: number): void {
  const gx = Math.floor(x), gy = Math.floor(y);
  if (!inBounds(gx, gy)) return;
  phero[idx(gx, gy)] = Math.min(phero[idx(gx, gy)] + amount, 10);
}
function senseDirection(phero: Float32Array, x: number, y: number, angle: number, range: number) {
  const off = 0.52;
  let left = 0, center = 0, right = 0;
  for (let d = 1; d <= range; d++) {
    left += samplePheromone(phero, x + Math.cos(angle - off) * d, y + Math.sin(angle - off) * d);
    center += samplePheromone(phero, x + Math.cos(angle) * d, y + Math.sin(angle) * d);
    right += samplePheromone(phero, x + Math.cos(angle + off) * d, y + Math.sin(angle + off) * d);
  }
  return { left, center, right };
}
function markDirty(state: SimState, x: number, y: number): void {
  const pad = 2;
  if (!state.terrainDirty) {
    state.terrainDirty = { minX: Math.max(0, x - pad), minY: Math.max(0, y - pad),
      maxX: Math.min(GRID_W - 1, x + pad), maxY: Math.min(GRID_H - 1, y + pad) };
  } else {
    state.terrainDirty.minX = Math.min(state.terrainDirty.minX, Math.max(0, x - pad));
    state.terrainDirty.minY = Math.min(state.terrainDirty.minY, Math.max(0, y - pad));
    state.terrainDirty.maxX = Math.max(state.terrainDirty.maxX, Math.min(GRID_W - 1, x + pad));
    state.terrainDirty.maxY = Math.max(state.terrainDirty.maxY, Math.min(GRID_H - 1, y + pad));
  }
}

function updateAnt(ant: Ant, state: SimState): void {
  const { terrain, colony } = state;
  ant.age++;
  if (!ant.mature) {
    if (ant.age > MATURE_TIME) { ant.mature = true; ant.size = ant.role === 'queen' ? 1.6 : 1.0; ant.speed = ant.role === 'queen' ? ANT_SPEED * 0.3 : ANT_SPEED; }
    else { ant.x += (rng() - 0.5) * 0.3; ant.y += (rng() - 0.5) * 0.3; return; }
  }
  ant.energy -= ANT_ENERGY_DRAIN;
  if (ant.energy < 0) ant.energy = 0;
  ant.stateTimer++;
  const gx = Math.floor(ant.x), gy = Math.floor(ant.y);
  if (inBounds(gx, gy) && terrain[idx(gx, gy)] === CellType.WATER) {
    ant.state = 'fleeing'; ant.stateTimer = 0;
    depositPheromone(state.pheroAlarm, ant.x, ant.y, PHERO_DEPOSIT_ALARM);
  }
  if (ant.role === 'queen') {
    ant.state = 'resting';
    ant.x += (rng() - 0.5) * 0.2; ant.y += (rng() - 0.5) * 0.2;
    ant.x += (colony.centerX - ant.x) * 0.01; ant.y += (colony.centerY - ant.y) * 0.01;
    depositPheromone(state.pheroHome, ant.x, ant.y, PHERO_DEPOSIT_HOME * 2);
    return;
  }
  if (ant.energy < 20 && ant.state !== 'fleeing' && ant.state !== 'returning') {
    ant.state = colony.foodStored > 0 ? 'returning' : 'resting'; ant.stateTimer = 0;
  }
  switch (ant.state) {
    case 'wandering': {
      depositPheromone(state.pheroHome, ant.x, ant.y, PHERO_DEPOSIT_HOME * ant.phHome);
      ant.phHome *= PHERO_WALK_DECAY;
      const foodS = senseDirection(state.pheroFood, ant.x, ant.y, ant.angle, PHERO_SENSE_RANGE);
      if (foodS.left + foodS.center + foodS.right > 0.5) { ant.state = 'foraging'; ant.stateTimer = 0; break; }
      ant.wanderAngle += (rng() - 0.5) * ANT_TURN_RATE * 4;
      ant.angle += (ant.wanderAngle - ant.angle) * 0.1;
      if (rng() < 0.01) ant.wanderAngle = Math.PI / 2 + (rng() - 0.5) * 0.5;
      const fwdX = Math.floor(ant.x + Math.cos(ant.angle) * 1.5);
      const fwdY = Math.floor(ant.y + Math.sin(ant.angle) * 1.5);
      if (inBounds(fwdX, fwdY)) {
        const fc = terrain[idx(fwdX, fwdY)];
        if (isDiggable(fc)) {
          const prob = fc === CellType.DIRT ? 0.08 : 0.03;
          if (rng() < prob) { ant.state = 'digging'; ant.stateTimer = 0; ant.target = { x: fwdX, y: fwdY }; break; }
        }
      }
      break;
    }
    case 'foraging': {
      const foodS = senseDirection(state.pheroFood, ant.x, ant.y, ant.angle, PHERO_SENSE_RANGE);
      depositPheromone(state.pheroHome, ant.x, ant.y, PHERO_DEPOSIT_HOME * ant.phHome);
      ant.phHome *= PHERO_WALK_DECAY;
      ant.angle += (foodS.right - foodS.left) * 0.3 + (rng() - 0.5) * ANT_TURN_RATE;
      if (inBounds(gx, gy) && terrain[idx(gx, gy)] === CellType.FOOD_SOURCE) {
        ant.carrying = 'food'; ant.carryAmount = 1; ant.state = 'returning'; ant.stateTimer = 0; ant.phFood = 1.0;
        if (rng() < 0.1) { terrain[idx(gx, gy)] = CellType.TUNNEL; markDirty(state, gx, gy); }
        break;
      }
      for (let fi = colony.foods.length - 1; fi >= 0; fi--) {
        const food = colony.foods[fi];
        if (Math.hypot(ant.x - food.x, ant.y - food.y) < 2) {
          ant.carrying = 'food'; ant.carryAmount = 1; food.amount--;
          if (food.amount <= 0) colony.foods.splice(fi, 1);
          ant.state = 'returning'; ant.stateTimer = 0; ant.phFood = 1.0; break;
        }
      }
      if (ant.stateTimer > 500) { ant.state = 'wandering'; ant.stateTimer = 0; }
      break;
    }
    case 'returning': {
      if (ant.carrying === 'food') { depositPheromone(state.pheroFood, ant.x, ant.y, PHERO_DEPOSIT_FOOD * ant.phFood); ant.phFood *= PHERO_WALK_DECAY; }
      const homeS = senseDirection(state.pheroHome, ant.x, ant.y, ant.angle, PHERO_SENSE_RANGE);
      ant.angle += (homeS.right - homeS.left) * 0.3 + (rng() - 0.5) * ANT_TURN_RATE * 0.5;
      const tca = Math.atan2(colony.centerY - ant.y, colony.centerX - ant.x);
      ant.angle += Math.sin(tca - ant.angle) * 0.05;
      if (Math.hypot(ant.x - colony.centerX, ant.y - colony.centerY) < 5) {
        if (ant.carrying === 'food') colony.foodStored += ant.carryAmount;
        ant.carrying = 'none'; ant.carryAmount = 0; ant.state = 'wandering'; ant.stateTimer = 0; ant.phHome = 1.0;
        if (colony.foodStored > 0 && ant.energy < ANT_ENERGY_MAX * 0.8) {
          ant.energy = Math.min(ANT_ENERGY_MAX, ant.energy + 30);
          colony.foodStored = Math.max(0, colony.foodStored - 0.5);
        }
      }
      break;
    }
    case 'digging': {
      if (ant.target) {
        const tx = Math.floor(ant.target.x), ty = Math.floor(ant.target.y);
        if (inBounds(tx, ty) && isDiggable(terrain[idx(tx, ty)])) { terrain[idx(tx, ty)] = CellType.TUNNEL; markDirty(state, tx, ty); ant.carrying = 'dirt'; ant.carryAmount = 1; }
        ant.target = null;
      }
      ant.state = 'wandering'; ant.stateTimer = 0;
      depositPheromone(state.pheroHome, ant.x, ant.y, PHERO_DEPOSIT_HOME);
      break;
    }
    case 'fleeing': {
      ant.angle = -Math.PI / 2 + (rng() - 0.5) * 0.5;
      depositPheromone(state.pheroAlarm, ant.x, ant.y, PHERO_DEPOSIT_ALARM);
      if (inBounds(gx, gy) && terrain[idx(gx, gy)] !== CellType.WATER && ant.stateTimer > 30) { ant.state = 'wandering'; ant.stateTimer = 0; }
      break;
    }
    case 'resting': {
      ant.energy = Math.min(ANT_ENERGY_MAX, ant.energy + 0.1);
      ant.x += (rng() - 0.5) * 0.1; ant.y += (rng() - 0.5) * 0.1;
      if (ant.energy > 60) { ant.state = 'wandering'; ant.stateTimer = 0; }
      return;
    }
    case 'depositing': { ant.carrying = 'none'; ant.carryAmount = 0; ant.state = 'wandering'; ant.stateTimer = 0; break; }
  }
  if ((ant.state as string) === 'resting') return;
  const spd = ant.speed * (ant.mature ? 1 : 0.4);
  let newX = ant.x + Math.cos(ant.angle) * spd;
  let newY = ant.y + Math.sin(ant.angle) * spd;
  const cx = Math.floor(newX), cy = Math.floor(newY);
  if (inBounds(cx, cy) && isSolid(terrain[idx(cx, cy)])) {
    const la = ant.angle - Math.PI / 4;
    const lx = Math.floor(ant.x + Math.cos(la) * spd), ly = Math.floor(ant.y + Math.sin(la) * spd);
    if (inBounds(lx, ly) && !isSolid(terrain[idx(lx, ly)])) { ant.angle = la; newX = ant.x + Math.cos(ant.angle) * spd; newY = ant.y + Math.sin(ant.angle) * spd; }
    else { const ra = ant.angle + Math.PI / 4;
      const rx = Math.floor(ant.x + Math.cos(ra) * spd), ry = Math.floor(ant.y + Math.sin(ra) * spd);
      if (inBounds(rx, ry) && !isSolid(terrain[idx(rx, ry)])) { ant.angle = ra; newX = ant.x + Math.cos(ant.angle) * spd; newY = ant.y + Math.sin(ant.angle) * spd; }
      else { ant.angle += Math.PI; newX = ant.x + Math.cos(ant.angle) * spd * 0.5; newY = ant.y + Math.sin(ant.angle) * spd * 0.5; }
    }
  }
  newX = Math.max(1, Math.min(GRID_W - 2, newX));
  newY = Math.max(1, Math.min(GRID_H - 2, newY));
  const fx = Math.floor(newX), fy = Math.floor(newY);
  if (inBounds(fx, fy) && !isSolid(terrain[idx(fx, fy)])) { ant.x = newX; ant.y = newY; }
}

function updatePheromones(state: SimState): void {
  const len = GRID_W * GRID_H;
  for (let i = 0; i < len; i++) {
    state.pheroFood[i] *= PHERO_DECAY_FOOD; state.pheroHome[i] *= PHERO_DECAY_HOME; state.pheroAlarm[i] *= PHERO_DECAY_ALARM;
    if (state.pheroFood[i] < 0.001) state.pheroFood[i] = 0;
    if (state.pheroHome[i] < 0.001) state.pheroHome[i] = 0;
    if (state.pheroAlarm[i] < 0.001) state.pheroAlarm[i] = 0;
  }
  if (state.tick % 4 === 0) { diffuse(state.pheroFood); diffuse(state.pheroHome); }
}
function diffuse(phero: Float32Array): void {
  const temp = new Float32Array(phero.length);
  const d = PHERO_DIFFUSE; const sw = 1 - d * 4;
  for (let y = 1; y < GRID_H - 1; y++) {
    for (let x = 1; x < GRID_W - 1; x++) {
      const i = idx(x, y);
      temp[i] = phero[i] * sw + (phero[idx(x - 1, y)] + phero[idx(x + 1, y)] + phero[idx(x, y - 1)] + phero[idx(x, y + 1)]) * d;
    }
  }
  phero.set(temp);
}
function updateWater(state: SimState): void {
  const { terrain } = state;
  if (state.raining) {
    state.rainTimer--;
    if (state.rainTimer <= 0) state.raining = false;
    else if (state.tick % 10 === 0) {
      for (let x = 0; x < GRID_W; x++) {
        const sy = state.surfaceY[x];
        if (sy >= 0 && sy < GRID_H) {
          const i = idx(x, sy);
          if ((terrain[i] === CellType.TUNNEL || terrain[i] === CellType.AIR) && rng() < 0.02) { terrain[i] = CellType.WATER; markDirty(state, x, sy); }
        }
      }
    }
  }
  if (state.tick % 3 === 0) {
    for (let y = GRID_H - 2; y >= 0; y--) {
      for (let x = 0; x < GRID_W; x++) {
        const i = idx(x, y);
        if (terrain[i] !== CellType.WATER) continue;
        if (y + 1 < GRID_H) {
          const below = idx(x, y + 1);
          if (terrain[below] === CellType.AIR || terrain[below] === CellType.TUNNEL) { terrain[below] = CellType.WATER; terrain[i] = CellType.AIR; markDirty(state, x, y); markDirty(state, x, y + 1); continue; }
        }
        const dir = rng() < 0.5 ? -1 : 1; const sx = x + dir;
        if (inBounds(sx, y)) { const si = idx(sx, y);
          if (terrain[si] === CellType.AIR || terrain[si] === CellType.TUNNEL) { terrain[si] = CellType.WATER; terrain[i] = CellType.AIR; markDirty(state, x, y); markDirty(state, sx, y); continue; }
        }
        if (rng() < WATER_EVAP_RATE) { terrain[i] = CellType.AIR; markDirty(state, x, y); }
      }
    }
  }
}
function updateColony(state: SimState): void {
  const { colony } = state;
  colony.age++;
  const queen = colony.ants.find(a => a.role === 'queen');
  if (queen && colony.age % EGG_INTERVAL === 0 && colony.ants.length < MAX_ANTS)
    colony.eggs.push({ x: queen.x + (rng() - 0.5) * 3, y: queen.y + (rng() - 0.5) * 2, timer: HATCH_TIME });
  for (let i = colony.eggs.length - 1; i >= 0; i--) {
    colony.eggs[i].timer--;
    if (colony.eggs[i].timer <= 0) { const egg = colony.eggs[i]; colony.ants.push(createAnt(egg.x, egg.y, 'worker', false)); colony.eggs.splice(i, 1); }
  }
  if (state.tick % FOOD_SPAWN_INTERVAL === 0 && state.tick > 0) {
    const fx = Math.floor(rng() * GRID_W); const sy = state.surfaceY[fx];
    if (sy > 0) { colony.foods.push({ x: fx, y: sy - 1, amount: 5 + Math.floor(rng() * 10) }); depositPheromone(state.pheroFood, fx, sy - 1, 3); }
  }
}

export function createSimState(): SimState {
  _antId = 0;
  const len = GRID_W * GRID_H;
  const state: SimState = {
    terrain: new Uint8Array(len), surfaceY: new Array(GRID_W).fill(0),

    pheroFood: new Float32Array(len), pheroHome: new Float32Array(len), pheroAlarm: new Float32Array(len),
    colony: { centerX: Math.floor(GRID_W / 2), centerY: Math.floor(GRID_H * 0.3), foodStored: 20, age: 0, ants: [], eggs: [], foods: [] },
    raining: false, rainTimer: 0, speed: 1, tick: 0, paused: false, terrainDirty: null,
  };
  generateTerrain(state);
  state.colony.ants.push(createAnt(state.colony.centerX, state.colony.centerY, 'queen', true));
  for (let i = 0; i < INITIAL_ANTS; i++) {
    state.colony.ants.push(createAnt(state.colony.centerX + (rng() - 0.5) * 8, state.colony.centerY + (rng() - 0.5) * 4, 'worker', true));
  }
  return state;
}
export function triggerRain(state: SimState): void { state.raining = true; state.rainTimer = RAIN_DURATION; }
export function dropFood(state: SimState, gridX: number, gridY: number): void {
  state.colony.foods.push({ x: gridX, y: gridY, amount: 8 });
  depositPheromone(state.pheroFood, gridX, gridY, 5);
}
export function caveIn(state: SimState, gridX: number, gridY: number): void {
  const radius = 4;
  for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
    const nx = gridX + dx, ny = gridY + dy;
    if (!inBounds(nx, ny)) continue;
    if (dx * dx + dy * dy < radius * radius) {
      const i = idx(nx, ny);
      if (state.terrain[i] === CellType.AIR || state.terrain[i] === CellType.TUNNEL) { state.terrain[i] = CellType.DIRT; markDirty(state, nx, ny); }
    }
  }
}
export function tickSimulation(state: SimState): void {
  state.tick++;
  for (const ant of state.colony.ants) updateAnt(ant, state);
  updatePheromones(state);
  updateWater(state);
  updateColony(state);
}
