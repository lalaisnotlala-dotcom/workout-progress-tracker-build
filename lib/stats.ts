import { addDaysToKey, cairoDayKey, dayKeyToUtcMs, daysBetweenKeys } from './time'
import type { MainType, SessionType, WorkoutSession } from './types'
import {
  ABS_TARGET,
  MAIN_TARGET,
  MAIN_TYPES,
  MILESTONES,
  MUSCLE_TREE,
  type MuscleGroup,
  normalizeExercise,
  toKg,
} from './workout-config'

export type RestQuality = 'short' | 'optimal' | 'acceptable' | 'warning'

export function restQuality(days: number): RestQuality {
  if (days < 2) return 'short'
  if (days <= 4) return 'optimal'
  if (days <= 7) return 'acceptable'
  return 'warning'
}

export const REST_COLORS: Record<RestQuality, string> = {
  short: 'var(--warning)',
  optimal: 'var(--success)',
  acceptable: 'var(--warning)',
  warning: 'var(--danger)',
}

export const REST_LABELS: Record<RestQuality, string> = {
  short: 'Short rest',
  optimal: 'Optimal',
  acceptable: 'Acceptable',
  warning: 'Overdue',
}

export interface RestGap {
  sessionNumber: number
  days: number
  quality: RestQuality
  toKey: string
}

export interface TypeStats {
  type: SessionType
  count: number
  target: number
  sessions: WorkoutSession[]
  lastKey: string | null
  daysSince: number | null
  avgRest: number | null
  gaps: RestGap[]
  status: RestQuality | 'none'
  nextMilestone: number | null
}

export interface DashboardStats {
  byType: Record<SessionType, TypeStats>
  sessionNumbers: Map<number, number>
  totalMain: number
  totalMainTarget: number
  streak: number
  thisWeek: number
  todayKey: string
}

function sortSessions(sessions: WorkoutSession[]): WorkoutSession[] {
  return [...sessions].sort(
    (a, b) =>
      new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime() || a.id - b.id,
  )
}

function buildTypeStats(
  type: SessionType,
  sessions: WorkoutSession[],
  target: number,
  todayKey: string,
): TypeStats {
  const keys = sessions.map((s) => cairoDayKey(s.sessionDate))
  const gaps: RestGap[] = []
  for (let i = 1; i < keys.length; i++) {
    const days = daysBetweenKeys(keys[i - 1], keys[i])
    gaps.push({ sessionNumber: i + 1, days, quality: restQuality(days), toKey: keys[i] })
  }
  const lastKey = keys.at(-1) ?? null
  const daysSince = lastKey ? Math.max(0, daysBetweenKeys(lastKey, todayKey)) : null
  const avgRest = gaps.length ? gaps.reduce((sum, g) => sum + g.days, 0) / gaps.length : null
  const count = sessions.length
  return {
    type,
    count,
    target,
    sessions,
    lastKey,
    daysSince,
    avgRest,
    gaps,
    status: daysSince === null ? 'none' : daysSince <= 4 ? 'optimal' : restQuality(daysSince),
    nextMilestone: MILESTONES.find((m) => m.n > count)?.n ?? null,
  }
}

export function computeStats(sessions: WorkoutSession[], now = new Date()): DashboardStats {
  const todayKey = cairoDayKey(now)
  const sorted = sortSessions(sessions)
  const sessionNumbers = new Map<number, number>()

  const byTypeSessions: Record<SessionType, WorkoutSession[]> = {
    push: [],
    pull: [],
    legs: [],
    abs: [],
  }
  for (const s of sorted) {
    if (s.sessionType !== 'abs') {
      byTypeSessions[s.sessionType].push(s)
      sessionNumbers.set(s.id, byTypeSessions[s.sessionType].length)
    }
    if (s.absTrained || s.sessionType === 'abs') {
      byTypeSessions.abs.push(s)
      if (s.sessionType === 'abs') sessionNumbers.set(s.id, byTypeSessions.abs.length)
    }
  }

  const byType = {
    push: buildTypeStats('push', byTypeSessions.push, MAIN_TARGET, todayKey),
    pull: buildTypeStats('pull', byTypeSessions.pull, MAIN_TARGET, todayKey),
    legs: buildTypeStats('legs', byTypeSessions.legs, MAIN_TARGET, todayKey),
    abs: buildTypeStats('abs', byTypeSessions.abs, ABS_TARGET, todayKey),
  }

  const dayKeys = new Set(sorted.map((s) => cairoDayKey(s.sessionDate)))
  let streak = 0
  let cursor = dayKeys.has(todayKey) ? todayKey : addDaysToKey(todayKey, -1)
  while (dayKeys.has(cursor)) {
    streak++
    cursor = addDaysToKey(cursor, -1)
  }

  const weekday = new Date(dayKeyToUtcMs(todayKey)).getUTCDay()
  const weekStart = addDaysToKey(todayKey, -((weekday + 6) % 7))
  const thisWeek = sorted.filter((s) => {
    const key = cairoDayKey(s.sessionDate)
    return key >= weekStart && key <= todayKey
  }).length

  const totalMain = MAIN_TYPES.reduce((sum, t) => sum + byType[t].count, 0)

  return {
    byType,
    sessionNumbers,
    totalMain,
    totalMainTarget: MAIN_TARGET * MAIN_TYPES.length,
    streak,
    thisWeek,
    todayKey,
  }
}

export interface PartStats {
  name: string
  exercises: string[]
  count: number
  bestKg: number | null
}

export interface GroupStats {
  id: string
  name: string
  count: number
  parts: PartStats[]
}

export function computeGroupStats(sessions: WorkoutSession[], group: MuscleGroup): GroupStats {
  const groupNames = new Set(group.parts.flatMap((p) => p.exercises.map(normalizeExercise)))
  const count = sessions.filter(
    (s) =>
      s.exercises.length === 0 ||
      s.exercises.some((e) => groupNames.has(normalizeExercise(e.exerciseName))),
  ).length

  const parts = group.parts.map((part) => {
    const names = new Set(part.exercises.map(normalizeExercise))
    let partCount = 0
    let bestKg: number | null = null
    for (const s of sessions) {
      const matches = s.exercises.filter((e) => names.has(normalizeExercise(e.exerciseName)))
      if (matches.length) partCount++
      for (const e of matches) {
        const kg = toKg(e.weight, e.unit)
        if (bestKg === null || kg > bestKg) bestKg = kg
      }
    }
    return { name: part.name, exercises: part.exercises, count: partCount, bestKg }
  })

  return { id: group.id, name: group.name, count, parts }
}

export function muscleBalance(
  byType: Record<SessionType, TypeStats>,
): { muscle: string; type: MainType; count: number; percent: number }[] {
  return MAIN_TYPES.flatMap((type) =>
    MUSCLE_TREE[type].map((group) => {
      const { count } = computeGroupStats(byType[type].sessions, group)
      return {
        muscle: group.name,
        type,
        count,
        percent: Math.min(100, Math.round((count / MAIN_TARGET) * 100)),
      }
    }),
  )
}

export interface StrengthComparison {
  exerciseName: string
  firstKg: number
  currentKg: number
}

/** Best set weight in the first vs latest session that included each exercise. */
export function strengthComparisons(sessions: WorkoutSession[]): StrengthComparison[] {
  const map = new Map<string, { name: string; first: number; current: number; uses: number }>()
  for (const s of sessions) {
    const bestInSession = new Map<string, { name: string; kg: number }>()
    for (const e of s.exercises) {
      const key = normalizeExercise(e.exerciseName)
      const kg = toKg(e.weight, e.unit)
      const prev = bestInSession.get(key)
      if (!prev || kg > prev.kg) bestInSession.set(key, { name: e.exerciseName, kg })
    }
    for (const [key, { name, kg }] of bestInSession) {
      const entry = map.get(key)
      if (!entry) map.set(key, { name, first: kg, current: kg, uses: 1 })
      else {
        entry.current = kg
        entry.uses++
      }
    }
  }
  return [...map.values()]
    .filter((e) => e.uses > 1 && e.first > 0)
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 3)
    .map((e) => ({
      exerciseName: e.name,
      firstKg: Math.round(e.first * 10) / 10,
      currentKg: Math.round(e.current * 10) / 10,
    }))
}
