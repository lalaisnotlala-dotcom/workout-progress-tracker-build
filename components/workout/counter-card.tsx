'use client'

import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { REST_COLORS, REST_LABELS, type TypeStats } from '@/lib/stats'
import { relativeDays } from '@/lib/time'
import type { MainType } from '@/lib/types'
import { TYPE_META } from '@/lib/workout-config'
import { MuscleTree } from './muscle-tree'
import { ProgressRing } from './progress-ring'

interface CounterCardProps {
  stats: TypeStats
  absCount: number
  onLog: () => void
}

export function CounterCard({ stats, absCount, onLog }: CounterCardProps) {
  const meta = TYPE_META[stats.type]
  const isAbs = stats.type === 'abs'
  const overdue = stats.status === 'warning'
  const pct = Math.min(100, (stats.count / stats.target) * 100)

  return (
    <article
      className={cn(
        'flex flex-col gap-5 rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md',
        overdue && 'border-danger/50',
      )}
      aria-labelledby={`counter-${stats.type}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={`counter-${stats.type}`} className="flex items-center gap-2 text-lg font-semibold">
            <span className="size-3 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden="true" />
            {meta.label}
          </h2>
          <p className="text-xs text-muted-foreground">{meta.focus}</p>
        </div>
        {stats.status !== 'none' && !isAbs && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
            style={{ color: REST_COLORS[stats.status] }}
          >
            <span
              className={cn('size-2 rounded-full', overdue && 'motion-safe:animate-pulse')}
              style={{ backgroundColor: REST_COLORS[stats.status] }}
              aria-hidden="true"
            />
            {stats.status === 'optimal' ? 'On track' : REST_LABELS[stats.status]}
          </span>
        )}
      </header>

      <div className="flex items-center gap-5">
        <ProgressRing value={stats.count} target={stats.target} color={meta.color} label={meta.label} />
        <dl className="grid flex-1 grid-cols-1 gap-2 text-sm">
          <div className="flex flex-col">
            <dt className="text-xs text-muted-foreground">Last trained</dt>
            <dd className="font-medium">{relativeDays(stats.daysSince)}</dd>
          </div>
          {!isAbs && (
            <div className="flex flex-col">
              <dt className="text-xs text-muted-foreground">Average rest</dt>
              <dd className="font-mono font-medium tabular-nums">
                {stats.avgRest === null ? '-' : `${stats.avgRest.toFixed(1)} days`}
              </dd>
            </div>
          )}
          <div className="flex flex-col">
            <dt className="text-xs text-muted-foreground">
              {isAbs ? 'Remaining' : 'Next milestone'}
            </dt>
            <dd className="font-mono font-medium tabular-nums">
              {isAbs
                ? Math.max(0, stats.target - stats.count)
                : stats.nextMilestone
                  ? `Session ${stats.nextMilestone}`
                  : 'All reached'}
            </dd>
          </div>
        </dl>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%`, backgroundColor: meta.color }}
        />
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Button
          onClick={onLog}
          size="lg"
          className="h-11 w-full text-base font-semibold text-white hover:opacity-90"
          style={{ backgroundColor: meta.color }}
          aria-label={`Log a ${meta.label} session`}
        >
          <Plus aria-hidden="true" />1 {meta.label}
        </Button>
        {!isAbs && (
          <Collapsible>
            <CollapsibleTrigger
              render={<Button variant="ghost" size="sm" className="group w-full text-muted-foreground" />}
            >
              Muscle details
              <ChevronDown
                className="transition-transform group-data-[panel-open]:rotate-180"
                aria-hidden="true"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <MuscleTree type={stats.type as MainType} sessions={stats.sessions} absCount={absCount} />
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </article>
  )
}
