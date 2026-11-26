'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceArea, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { REST_COLORS, REST_LABELS, type RestQuality, type TypeStats } from '@/lib/stats'
import type { MainType } from '@/lib/types'
import { MAIN_TYPES, TYPE_META } from '@/lib/workout-config'

const config = { days: { label: 'Rest days' } } satisfies ChartConfig

export function RestChart({ byType }: { byType: Record<MainType, TypeStats> }) {
  const [type, setType] = useState<MainType>('push')
  const stats = byType[type]
  const data = stats.gaps.map((g) => ({ session: `#${g.sessionNumber}`, days: g.days, quality: g.quality }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1" role="group" aria-label="Session type">
          {MAIN_TYPES.map((t) => (
            <Button key={t} size="sm" variant={type === t ? 'secondary' : 'ghost'} aria-pressed={type === t} onClick={() => setType(t)}>
              <span className="size-2 rounded-full" style={{ backgroundColor: TYPE_META[t].color }} aria-hidden="true" />
              {TYPE_META[t].label}
            </Button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Average:{' '}
          <span className="font-mono tabular-nums text-foreground">
            {stats.avgRest === null ? '-' : `${stats.avgRest.toFixed(1)} days`}
          </span>
        </p>
      </div>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Log at least two {TYPE_META[type].label} sessions to see rest periods.
        </p>
      ) : (
        <ChartContainer config={config} className="aspect-auto h-56 w-full">
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <ReferenceArea y1={2} y2={4} fill="var(--success)" fillOpacity={0.08} />
            <XAxis dataKey="session" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="days" radius={4}>
              {data.map((d) => (
                <Cell key={d.session} fill={REST_COLORS[d.quality]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
      <ul className="flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Legend">
        {(['optimal', 'acceptable', 'warning'] as RestQuality[]).map((q) => (
          <li key={q} className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm" style={{ backgroundColor: REST_COLORS[q] }} aria-hidden="true" />
            {REST_LABELS[q]} {q === 'optimal' ? '(2-4d)' : q === 'acceptable' ? '(5-7d or under 2d)' : '(8d+)'}
          </li>
        ))}
      </ul>
    </div>
  )
}
