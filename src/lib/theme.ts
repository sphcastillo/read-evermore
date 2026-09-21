export const SPACE_COLORS = [
  {id: 'cloud', hex: '#efeae4', from: '#f7f2ec', to: '#e4d5c8', label: 'Cloud'},
  {id: 'blush', hex: '#e3b4c2', from: '#f3cdd6', to: '#d489b0', label: 'Blush'},
  {id: 'violet', hex: '#8a6b96', from: '#d2b7e4', to: '#a07cbc', label: 'Violet'},
  {id: 'clay', hex: '#c36b5c', from: '#f0b8a4', to: '#d87888', label: 'Clay'},
  {id: 'apricot', hex: '#d4945e', from: '#f0c48a', to: '#e08a68', label: 'Apricot'},
  {id: 'butter', hex: '#e0c96e', from: '#f3e08a', to: '#d4c060', label: 'Butter'},
  {id: 'mint', hex: '#8fd4a8', from: '#b6ebc8', to: '#78d0b0', label: 'Mint'},
  {id: 'sky', hex: '#6aa6d4', from: '#a8d8f0', to: '#68c8d8', label: 'Sky'},
  {id: 'navy', hex: '#3a4a72', from: '#8fa3c8', to: '#5a6a96', label: 'Navy'},
] as const

export type SpaceColorId = (typeof SPACE_COLORS)[number]['id']
export type SpaceColor = (typeof SPACE_COLORS)[number]

export const DEFAULT_SPACE_COLOR: SpaceColorId = 'sky'

const LEGACY: Record<string, SpaceColorId> = {
  periwinkle: 'sky',
  sage: 'mint',
  peach: 'apricot',
  rose: 'blush',
  lilac: 'violet',
  sand: 'cloud',
  slate: 'navy',
}

export function spaceById(id?: string | null): SpaceColor {
  const mapped = (id && LEGACY[id]) || id
  return SPACE_COLORS.find((item) => item.id === mapped) ?? SPACE_COLORS[7]
}

export function spaceHex(id?: string | null) {
  return spaceById(id).hex
}

export function spaceIndex(id?: string | null) {
  return SPACE_COLORS.findIndex((item) => item.id === spaceById(id).id)
}
