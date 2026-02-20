export interface FoldCircuitPalette {
  background: string
  grid: string
  block: string
  source: string
  sink: string
  wire: string
  wirePowered: string
  wireDead: string
  focus: string
  text: string
  warning: string
  solved: string
}

export const FOLD_CIRCUIT_PALETTE: FoldCircuitPalette = {
  background: '#08080a',
  grid: '#252532',
  block: '#17171f',
  source: '#58b9ff',
  sink: '#f5ae5c',
  wire: '#a48dff',
  wirePowered: '#7ef7b8',
  wireDead: '#6a596b',
  focus: '#f0f0f5',
  text: '#ebebeb',
  warning: '#ff6f6f',
  solved: '#90fcb0',
}
