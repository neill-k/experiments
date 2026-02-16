export enum CellType {
  AIR = 0,
  DIRT = 1,
  HARD_DIRT = 2,
  ROCK = 3,
  FOOD_SOURCE = 4,
  WATER = 5,
  FOOD_STORE = 6,
  TUNNEL = 7,
}

export type AntRole = 'queen' | 'worker' | 'scout' | 'nurse';
export type AntState = 'wandering' | 'foraging' | 'returning' | 'digging' | 'fleeing' | 'resting' | 'depositing';
export type CarryType = 'none' | 'food' | 'dirt' | 'egg';

export interface Ant {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  role: AntRole;
  state: AntState;
  stateTimer: number;
  carrying: CarryType;
  carryAmount: number;
  energy: number;
  phFood: number;
  phHome: number;
  wanderAngle: number;
  target: { x: number; y: number } | null;
  age: number;
  mature: boolean;
  size: number;
}

export interface Egg {
  x: number;
  y: number;
  timer: number;
}

export interface FoodItem {
  x: number;
  y: number;
  amount: number;
}

export interface Colony {
  centerX: number;
  centerY: number;
  foodStored: number;
  age: number;
  ants: Ant[];
  eggs: Egg[];
  foods: FoodItem[];
}

export interface SimState {
  terrain: Uint8Array;
  surfaceY: number[];
  pheroFood: Float32Array;
  pheroHome: Float32Array;
  pheroAlarm: Float32Array;
  colony: Colony;
  raining: boolean;
  rainTimer: number;
  speed: number;
  tick: number;
  paused: boolean;
  terrainDirty: { minX: number; minY: number; maxX: number; maxY: number } | null;
}
