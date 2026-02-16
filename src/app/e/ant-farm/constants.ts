export const GRID_W = 400;
export const GRID_H = 250;
export const CELL_PX = 3;
export const CANVAS_W = GRID_W * CELL_PX;
export const CANVAS_H = GRID_H * CELL_PX;
export const INITIAL_ANTS = 15;
export const MAX_ANTS = 300;
export const ANT_SPEED = 1.2;
export const ANT_TURN_RATE = 0.15;
export const ANT_ENERGY_MAX = 100;
export const ANT_ENERGY_DRAIN = 0.02;
export const PHERO_DECAY_FOOD = 0.997;
export const PHERO_DECAY_HOME = 0.995;
export const PHERO_DECAY_ALARM = 0.97;
export const PHERO_DIFFUSE = 0.01;
export const PHERO_DEPOSIT_FOOD = 1.0;
export const PHERO_DEPOSIT_HOME = 0.8;
export const PHERO_DEPOSIT_ALARM = 2.0;
export const PHERO_SENSE_RANGE = 5;
export const PHERO_WALK_DECAY = 0.995;
export const EGG_INTERVAL = 600;
export const HATCH_TIME = 900;
export const MATURE_TIME = 600;
export const FOOD_SPAWN_INTERVAL = 2700;
export const WATER_EVAP_RATE = 0.0003;
export const RAIN_DURATION = 300;
export const PHERO_RENDER_SKIP = 3;
export const PHERO_RENDER_SCALE = 0.25;
export const MOBILE_MAX_ANTS = 200;
export const MAX_DPR = 2;

export const COLORS = {
  bg: '#08080a',
  text: '#ebebeb',
  topsoil: '#2a1f14',
  clay: '#3d2b1a',
  sand: '#4a3c28',
  deepEarth: '#1a1209',
  bedrock: '#0f0f0f',
  tunnel: '#110d08',
  antBody: '#c4722a',
  antDark: '#8b4513',
  queen: '#d4823a',
  grass: '#2d4a1c',
  skyTop: '#0a0e1a',
  skyBottom: '#1a1530',
  foodLeaf: '#5fa33e',
  foodBerry: '#c43a3a',
  water: '#1a4a6e',
  rock: '#3a3a3a',
  foodStore: '#8b6914',
  pheroFood: '#00c8ff',
  pheroHome: '#ffaa00',
  pheroAlarm: '#ff3333',
} as const;
