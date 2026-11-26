'use client'

import { ChevronRight } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { computeGroupStats } from '@/lib/stats'
import type { MainType, WorkoutSession } from '@/lib/types'
import {
  ABS_GROUP_BY_TYPE,
  ABS_TARGET,
  MAIN_TARGET,
  MUSCLE_TREE,
  TYPE_META,
} from '@/lib/workout-config'

interface MuscleTreeProps {
  type: MainType
  sessions: WorkoutSession[]
  absCount: number
}

export function MuscleTree({ type, sessions, absCount }: MuscleTreeProps) {
  const color = TYPE_META[type].color
  const groups = MUSCLE_TREE[type].map((g) => ({
    stats: computeGroupStats(sessions, g),
    target: MAIN_TARGET,
    nodeColor: color,
  }))
  const absStats = computeGroupStats(
    sessions.filter((s) => s.absTrained),
    ABS_GROUP_BY_TYPE[type],
  )
  groups.push({
    stats: { ...absStats, count: absCount },
    target: ABS_TARGET,
    nodeColor: TYPE_META.abs.color,
  })

  return (
    <ul className="flex flex-col gap-1 border-l-2 border-border pl-3" aria-label={`${TYPE_META[type].label} muscle breakdown`}>
      {groups.map(({ stats, target, nodeColor }) => {
        const pct = Math.min(100, (stats.count / target) * 100)
        return (
          <li key={stats.id} className="relative">
            <span
              className="absolute top-4 -left-3 h-0.5 w-2.5 bg-border"
              aria-hidden="true"
            />
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]:rotate-90"
                  aria-hidden="true"
                />
                <span className="flex-1 font-medium">{stats.name}</span>
                <span className="h-1.5 w-12 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: nodeColor }}
                  />
                </span>
                <span className="w-12 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {stats.count}/{target}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="ml-4 flex flex-col gap-1 border-l border-dashed border-border py-1 pl-3">
                  {stats.parts.map((part) => (
                    <li key={part.name} className="flex items-start justify-between gap-3 py-1 text-xs">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{part.name}</span>
                        <span className="text-muted-foreground">{part.exercises.join(', ')}</span>
                      </div>
                      <div className="flex shrink-0 flex-col items-end font-mono tabular-nums text-muted-foreground">
                        <span>
                          {part.count} {part.count === 1 ? 'session' : 'sessions'}
                        </span>
                        {part.bestKg !== null && part.bestKg > 0 && (
                          <span className="text-foreground">best {Math.round(part.bestKg * 10) / 10}kg</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </li>
        )
      })}
    </ul>
  )
}
