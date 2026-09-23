export type SelectionDate = {
  month?: string | number | null
  year?: number | null
  selectionDate?: string | null
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

function monthIndex(month: string | number): number {
  if (typeof month === 'number') return month >= 1 && month <= 12 ? month - 1 : -1
  const normalized = month.trim().toLowerCase()
  return MONTH_NAMES.findIndex((name) => name.toLowerCase() === normalized || name.slice(0, 3).toLowerCase() === normalized.slice(0, 3))
}

export function formatSelectionDate(entry: SelectionDate): string | null {
  if (entry.year && entry.month != null && entry.month !== '') {
    const index = monthIndex(entry.month)
    if (index >= 0) return `${MONTH_SHORT[index]} ${entry.year}`
  }

  if (entry.selectionDate) {
    const parsed = Date.parse(entry.selectionDate)
    if (!Number.isNaN(parsed)) {
      return new Intl.DateTimeFormat('en-US', {month: 'short', year: 'numeric'}).format(new Date(parsed))
    }
  }

  return null
}

/** Month is 1–12. Mapped by club selection number, not publication date. */
export const OPRAH_SELECTION_DATES: Record<number, {month: number; year: number}> = {
  1: {month: 9, year: 1996},
  2: {month: 10, year: 1996},
  3: {month: 11, year: 1996},
  4: {month: 12, year: 1996},
  5: {month: 2, year: 1997},
  6: {month: 4, year: 1997},
  7: {month: 5, year: 1997},
  8: {month: 6, year: 1997},
  9: {month: 9, year: 1997},
  10: {month: 10, year: 1997},
  11: {month: 10, year: 1997},
  12: {month: 12, year: 1997},
  13: {month: 12, year: 1997},
  14: {month: 12, year: 1997},
  15: {month: 1, year: 1998},
  16: {month: 3, year: 1998},
  17: {month: 4, year: 1998},
  18: {month: 5, year: 1998},
  19: {month: 6, year: 1998},
  20: {month: 9, year: 1998},
  21: {month: 10, year: 1998},
  22: {month: 12, year: 1998},
  23: {month: 1, year: 1999},
  24: {month: 2, year: 1999},
  25: {month: 3, year: 1999},
  26: {month: 5, year: 1999},
  27: {month: 6, year: 1999},
  28: {month: 9, year: 1999},
  29: {month: 10, year: 1999},
  30: {month: 11, year: 1999},
  31: {month: 12, year: 1999},
  32: {month: 1, year: 2000},
  33: {month: 2, year: 2000},
  34: {month: 3, year: 2000},
  35: {month: 4, year: 2000},
  36: {month: 5, year: 2000},
  37: {month: 6, year: 2000},
  38: {month: 8, year: 2000},
  39: {month: 9, year: 2000},
  40: {month: 11, year: 2000},
  41: {month: 1, year: 2001},
  42: {month: 3, year: 2001},
  43: {month: 5, year: 2001},
  44: {month: 6, year: 2001},
  45: {month: 9, year: 2001},
  46: {month: 11, year: 2001},
  47: {month: 1, year: 2002},
  48: {month: 4, year: 2002},
  49: {month: 6, year: 2003},
  50: {month: 9, year: 2003},
  51: {month: 1, year: 2004},
  52: {month: 4, year: 2004},
  53: {month: 5, year: 2004},
  54: {month: 9, year: 2004},
  55: {month: 6, year: 2005},
  56: {month: 6, year: 2005},
  57: {month: 6, year: 2005},
  58: {month: 9, year: 2005},
  59: {month: 1, year: 2006},
  60: {month: 1, year: 2007},
  61: {month: 3, year: 2007},
  62: {month: 6, year: 2007},
  63: {month: 10, year: 2007},
  64: {month: 11, year: 2007},
  65: {month: 1, year: 2008},
  66: {month: 9, year: 2008},
  67: {month: 9, year: 2009},
  68: {month: 9, year: 2010},
  69: {month: 12, year: 2010},
  70: {month: 12, year: 2010},
  71: {month: 6, year: 2012},
  72: {month: 12, year: 2012},
  73: {month: 1, year: 2014},
  74: {month: 2, year: 2015},
  75: {month: 8, year: 2016},
  76: {month: 9, year: 2016},
  77: {month: 6, year: 2017},
  78: {month: 2, year: 2018},
  79: {month: 6, year: 2018},
  80: {month: 11, year: 2018},
  81: {month: 9, year: 2019},
  82: {month: 11, year: 2019},
  83: {month: 1, year: 2020},
  84: {month: 4, year: 2020},
  85: {month: 6, year: 2020},
  86: {month: 11, year: 2020},
  87: {month: 3, year: 2021},
  88: {month: 3, year: 2021},
  89: {month: 3, year: 2021},
  90: {month: 3, year: 2021},
  91: {month: 6, year: 2021},
  92: {month: 8, year: 2021},
  93: {month: 9, year: 2021},
  94: {month: 2, year: 2022},
  95: {month: 4, year: 2022},
  96: {month: 6, year: 2022},
  97: {month: 9, year: 2022},
  98: {month: 10, year: 2022},
  99: {month: 2, year: 2023},
  100: {month: 3, year: 2023},
  101: {month: 5, year: 2023},
  102: {month: 9, year: 2023},
  103: {month: 10, year: 2023},
  104: {month: 3, year: 2024},
  105: {month: 5, year: 2024},
  106: {month: 6, year: 2024},
  107: {month: 9, year: 2024},
  108: {month: 10, year: 2024},
  109: {month: 12, year: 2024},
  110: {month: 1, year: 2025},
  111: {month: 2, year: 2025},
  112: {month: 3, year: 2025},
  113: {month: 4, year: 2025},
  114: {month: 5, year: 2025},
  115: {month: 6, year: 2025},
  116: {month: 7, year: 2025},
  117: {month: 8, year: 2025},
  118: {month: 9, year: 2025},
  119: {month: 10, year: 2025},
  120: {month: 11, year: 2025},
  121: {month: 2, year: 2026},
  122: {month: 4, year: 2026},
  123: {month: 5, year: 2026},
  124: {month: 6, year: 2026},
}

/** Month is 1–12. February 2020 had no main-club pick. */
export const GMA_SELECTION_DATES: Record<number, {month: number; year: number}> = {
  1: {month: 10, year: 2019},
  2: {month: 11, year: 2019},
  3: {month: 12, year: 2019},
  4: {month: 1, year: 2020},
  5: {month: 3, year: 2020},
  6: {month: 4, year: 2020},
  7: {month: 5, year: 2020},
  8: {month: 6, year: 2020},
  9: {month: 7, year: 2020},
  10: {month: 8, year: 2020},
  11: {month: 9, year: 2020},
  12: {month: 10, year: 2020},
  13: {month: 11, year: 2020},
  14: {month: 12, year: 2020},
  15: {month: 1, year: 2021},
  16: {month: 2, year: 2021},
  17: {month: 3, year: 2021},
  18: {month: 4, year: 2021},
  19: {month: 5, year: 2021},
  20: {month: 6, year: 2021},
  21: {month: 7, year: 2021},
  22: {month: 8, year: 2021},
  23: {month: 9, year: 2021},
  24: {month: 10, year: 2021},
  25: {month: 11, year: 2021},
  26: {month: 12, year: 2021},
  27: {month: 1, year: 2022},
  28: {month: 2, year: 2022},
  29: {month: 3, year: 2022},
  30: {month: 4, year: 2022},
  31: {month: 5, year: 2022},
  32: {month: 6, year: 2022},
  33: {month: 7, year: 2022},
  34: {month: 8, year: 2022},
  35: {month: 9, year: 2022},
  36: {month: 10, year: 2022},
  37: {month: 11, year: 2022},
  38: {month: 12, year: 2022},
  39: {month: 1, year: 2023},
  40: {month: 2, year: 2023},
  41: {month: 3, year: 2023},
  42: {month: 4, year: 2023},
  43: {month: 5, year: 2023},
  44: {month: 6, year: 2023},
  45: {month: 7, year: 2023},
  46: {month: 8, year: 2023},
  47: {month: 9, year: 2023},
  48: {month: 10, year: 2023},
  49: {month: 11, year: 2023},
  50: {month: 12, year: 2023},
  51: {month: 1, year: 2024},
  52: {month: 2, year: 2024},
  53: {month: 3, year: 2024},
  54: {month: 4, year: 2024},
  55: {month: 5, year: 2024},
  56: {month: 6, year: 2024},
  57: {month: 7, year: 2024},
  58: {month: 8, year: 2024},
  59: {month: 9, year: 2024},
  60: {month: 10, year: 2024},
  61: {month: 11, year: 2024},
  62: {month: 12, year: 2024},
  63: {month: 1, year: 2025},
  64: {month: 2, year: 2025},
  65: {month: 3, year: 2025},
  66: {month: 4, year: 2025},
  67: {month: 5, year: 2025},
  68: {month: 6, year: 2025},
  69: {month: 7, year: 2025},
  70: {month: 8, year: 2025},
  71: {month: 9, year: 2025},
  72: {month: 10, year: 2025},
  73: {month: 11, year: 2025},
  74: {month: 12, year: 2025},
  75: {month: 1, year: 2026},
  76: {month: 2, year: 2026},
  77: {month: 3, year: 2026},
  78: {month: 4, year: 2026},
  79: {month: 5, year: 2026},
  80: {month: 6, year: 2026},
  81: {month: 7, year: 2026},
  82: {month: 8, year: 2026},
  83: {month: 9, year: 2026},
}

const CLUB_DATES: Record<string, Record<number, {month: number; year: number}>> = {
  'gma-book-club': GMA_SELECTION_DATES,
  'oprahs-book-club': OPRAH_SELECTION_DATES,
  'curatedCollection.gma-book-club': GMA_SELECTION_DATES,
  'curatedCollection.oprahs-book-club': OPRAH_SELECTION_DATES,
}

export function clubSelectionLabel(
  collection: {_id?: string; slug?: string | null},
  entry: SelectionDate & {selectionNumber?: number | null},
): string | null {
  const fromEntry = formatSelectionDate(entry)
  if (fromEntry) return fromEntry

  const dates = CLUB_DATES[collection.slug || ''] || CLUB_DATES[collection._id || '']
  const fallback = entry.selectionNumber ? dates?.[entry.selectionNumber] : null
  return fallback ? formatSelectionDate(fallback) : null
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month)
}
