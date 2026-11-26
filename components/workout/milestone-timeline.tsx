import { Check, Lock } from 'lucide-react'
import type { TypeStats } from '@/lib/stats'
import { formatCairoDate } from '@/lib/time'
import type { MainType } from '@/lib/types'
import { MAIN_TYPES, MILESTONES, TYPE_META } from '@/lib/workout-config'

export function MilestoneTimeline({ byType }: { byType: Record<MainType, TypeStats> }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {MAIN_TYPES.map((type) => {
        const stats = byType[type]
        return (
          <div key={type} className="flex flex-col gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: TYPE_META[type].color }} aria-hidden="true" />
              {TYPE_META[type].label}
            </h3>
            <ol className="flex flex-col gap-3 border-l-2 border-border pl-4">
              {MILESTONES.map((m) => {
                const achieved = stats.count >= m.n
                const date = achieved ? stats.sessions[m.n - 1]?.sessionDate : null
                return (
                  <li key={m.n} className="relative flex flex-col">
                    <span
                      className="absolute top-0.5 -left-[1.6rem] flex size-5 items-center justify-center rounded-full border-2 bg-card"
                      style={achieved ? { backgroundColor: TYPE_META[type].color, borderColor: TYPE_META[type].color, color: 'white' } : undefined}
                      aria-hidden="true"
                    >
                      {achieved ? <Check className="size-3" /> : <Lock className="size-2.5 text-muted-foreground" />}
                    </span>
                    <span className={`text-sm font-medium ${achieved ? '' : 'text-muted-foreground'}`}>
                      {m.n} - {m.title}
                      <span className="sr-only">{achieved ? ' (achieved)' : ' (locked)'}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {date ? formatCairoDate(date, { month: 'short', day: 'numeric', year: 'numeric' }) : `${m.n - stats.count} to go`}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        )
      })}
    </div>
  )
}
