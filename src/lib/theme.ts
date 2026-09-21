export const SPACE_COLORS = [
  {id: 'cloud', hex: '#efeae4', label: 'Cloud'},
  {id: 'blush', hex: '#e3b4c2', label: 'Blush'},
  {id: 'violet', hex: '#8a6b96', label: 'Violet'},
  {id: 'clay', hex: '#c36b5c', label: 'Clay'},
  {id: 'apricot', hex: '#d4945e', label: 'Apricot'},
  {id: 'butter', hex: '#e0c96e', label: 'Butter'},
  {id: 'mint', hex: '#8fd4a8', label: 'Mint'},
  {id: 'sky', hex: '#6aa6d4', label: 'Sky'},
  {id: 'navy', hex: '#3a4a72', label: 'Navy'},
] as const

export type SpaceColorId = (typeof SPACE_COLORS)[number]['id']

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

export function spaceHex(id?: string | null) {
  const mapped = (id && LEGACY[id]) || id
  return SPACE_COLORS.find((item) => item.id === mapped)?.hex ?? SPACE_COLORS[7].hex
}

export function spaceIndex(id?: string | null) {
  const mapped = (id && LEGACY[id]) || id
  const index = SPACE_COLORS.findIndex((item) => item.id === mapped)
  return index >= 0 ? index : 7
}
