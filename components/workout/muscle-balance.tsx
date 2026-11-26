import { muscleBalance, type TypeStats } from '@/lib/stats'
import type { SessionType } from '@/lib/types'
import { TYPE_META } from '@/lib/workout-config'

export function MuscleBalance({ byType }: { byType: Record<SessionType, TypeStats> }) {
  const rows = muscleBalance(byType)
  const max = Math.max(...rows.map((r) => r.count))
  const min = Math.min(...rows.map((r) => r.count))
  const imbalanced = max > 0 && max - min >= 3

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.muscle} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 font-medium">{r.muscle}</span>
            <div
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={`${r.muscle} progress`}
              aria-valuenow={r.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${r.percent}%`, backgroundColor: TYPE_META[r.type].color }}
              />
            </div>
            <span className="w-16 text-right font-mono text-xs tabular-nums text-muted-foreground">
              {r.count} ({r.percent}%)
            </span>
          </li>
        ))}
      </ul>
      {imbalanced && (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm">
          Some muscle groups are falling behind. Prioritize your least trained groups next.
        </p>
      )}
    </div>
  )
}
