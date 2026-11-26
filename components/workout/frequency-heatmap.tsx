import { Fragment } from 'react'
import { addDaysToKey, cairoDayKey, dayKeyToUtcMs, formatDayKey } from '@/lib/time'
import type { SessionType, WorkoutSession } from '@/lib/types'
import { ALL_TYPES, TYPE_META } from '@/lib/workout-config'

const WEEKS = 12
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

interface FrequencyHeatmapProps {
  sessions: WorkoutSession[]
  todayKey: string
}

export function FrequencyHeatmap({ sessions, todayKey }: FrequencyHeatmapProps) {
  const byDay = new Map<string, SessionType[]>()
  for (const s of sessions) {
    const key = cairoDayKey(s.sessionDate)
    byDay.set(key, [...(byDay.get(key) ?? []), s.sessionType])
  }

  const weekday = (new Date(dayKeyToUtcMs(todayKey)).getUTCDay() + 6) % 7
  const start = addDaysToKey(todayKey, -weekday - (WEEKS - 1) * 7)
  const weeks = Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDaysToKey(start, w * 7 + d)),
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-1"
          style={{ gridTemplateColumns: `2rem repeat(${WEEKS}, 1.25rem)`, gridTemplateRows: 'repeat(7, 1.25rem)', gridAutoFlow: 'column' }}
          role="grid"
          aria-label={`Workout frequency over the last ${WEEKS} weeks`}
        >
          {DAY_LABELS.map((label, i) => (
            <span key={`l-${i}`} className="flex items-center text-[10px] text-muted-foreground" aria-hidden="true">
              {label}
            </span>
          ))}
          {weeks.map((days, w) => (
            <Fragment key={w}>
              {days.map((key) => {
                const types = byDay.get(key) ?? []
                const future = key > todayKey
                const main = types.find((t) => t !== 'abs') ?? types[0]
                const label = `${formatDayKey(key)}: ${types.length ? types.map((t) => TYPE_META[t].label).join(', ') : 'Rest'}`
                return (
                  <span
                    key={key}
                    role="gridcell"
                    aria-label={future ? undefined : label}
                    title={future ? undefined : label}
                    className={`rounded-sm ${future ? 'opacity-0' : ''} ${key === todayKey ? 'ring-2 ring-foreground/40 ring-offset-1 ring-offset-card' : ''}`}
                    style={{ backgroundColor: main ? TYPE_META[main].color : 'var(--muted)' }}
                  />
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legend">
        {ALL_TYPES.map((t) => (
          <li key={t} className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ backgroundColor: TYPE_META[t].color }} aria-hidden="true" />
            {TYPE_META[t].label}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-muted" aria-hidden="true" />
          Rest
        </li>
      </ul>
    </div>
  )
}
