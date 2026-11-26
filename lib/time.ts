export const CAIRO_TZ = 'Africa/Cairo'

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CAIRO_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: CAIRO_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CAIRO_TZ,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hourCycle: 'h23',
})

/** YYYY-MM-DD for the given instant, using Cairo's calendar day. */
export function cairoDayKey(date: Date | string): string {
  return dayKeyFormatter.format(new Date(date))
}

export function cairoTime(date: Date | string): string {
  return timeFormatter.format(new Date(date))
}

export function dayKeyToUtcMs(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function daysBetweenKeys(from: string, to: string): number {
  return Math.round((dayKeyToUtcMs(to) - dayKeyToUtcMs(from)) / 86_400_000)
}

export function addDaysToKey(key: string, days: number): string {
  const d = new Date(dayKeyToUtcMs(key) + days * 86_400_000)
  return d.toISOString().slice(0, 10)
}

function cairoOffsetMs(utcMs: number): number {
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]),
  )
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  )
  return asUtc - utcMs
}

/** Converts a Cairo wall-clock date + time (HH:MM) into a real instant, DST-aware. */
export function cairoLocalToDate(dayKey: string, hhmm: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number)
  const [h, min] = hhmm.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, h, min)
  const firstOffset = cairoOffsetMs(guess)
  let result = guess - firstOffset
  const secondOffset = cairoOffsetMs(result)
  if (secondOffset !== firstOffset) result = guess - secondOffset
  return new Date(result)
}

export function formatCairoDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: CAIRO_TZ, ...options }).format(
    new Date(date),
  )
}

export function formatDayKey(
  key: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' },
): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(
    new Date(dayKeyToUtcMs(key)),
  )
}

export function relativeDays(days: number | null): string {
  if (days === null) return 'Never'
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}
