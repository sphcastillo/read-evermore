const LABELS: Record<string, string> = {
  celebrityBookClub: 'Celebrity book club',
  editorial: 'Editorial collection',
  discover: 'Discover shelf',
}

export function collectionTypeLabel(type?: string | null) {
  if (!type) return 'Collection'
  return LABELS[type] || type.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase())
}
