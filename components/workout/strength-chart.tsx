'use client'

import { useState } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCairoDate } from '@/lib/time'
import type { SessionType, WorkoutSession } from '@/lib/types'
import { normalizeExercise, toKg, TYPE_META } from '@/lib/workout-config'

interface StrengthChartProps {
  sessions: WorkoutSession[]
}

export function StrengthChart({ sessions }: StrengthChartProps) {
  const exerciseMap = new Map<string, { name: string; uses: number; type: SessionType }>()
  for (const s of sessions) {
    const seen = new Set<string>()
    for (const e of s.exercises) {
      const key = normalizeExercise(e.exerciseName)
      if (seen.has(key)) continue
      seen.add(key)
      const entry = exerciseMap.get(key)
      if (entry) entry.uses++
      else exerciseMap.set(key, { name: e.exerciseName, uses: 1, type: s.sessionType })
    }
  }
  const options = [...exerciseMap.entries()].sort((a, b) => b[1].uses - a[1].uses)
  const [selected, setSelected] = useState<string | null>(options[0]?.[0] ?? null)
  const current = selected && exerciseMap.has(selected) ? selected : (options[0]?.[0] ?? null)

  if (!current) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Add exercises with weights when logging sessions to see your strength progression.
      </p>
    )
  }

  const meta = exerciseMap.get(current)!
  const data = sessions
    .map((s) => {
      const matches = s.exercises.filter((e) => normalizeExercise(e.exerciseName) === current)
      if (!matches.length) return null
      const best = Math.max(...matches.map((e) => toKg(e.weight, e.unit)))
      return { date: formatCairoDate(s.sessionDate), weight: Math.round(best * 10) / 10 }
    })
    .filter((d): d is { date: string; weight: number } => d !== null)

  const first = data[0]?.weight ?? 0
  const last = data.at(-1)?.weight ?? 0
  const change = first > 0 ? ((last - first) / first) * 100 : null
  const config = { weight: { label: 'Best set (kg)', color: TYPE_META[meta.type].color } } satisfies ChartConfig

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select value={current} onValueChange={(v) => v && setSelected(v)}>
          <SelectTrigger className="w-56" aria-label="Choose exercise">
            <SelectValue>{meta.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map(([key, o]) => (
              <SelectItem key={key} value={key}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{first}kg</span> to{' '}
          <span className="font-mono tabular-nums text-foreground">{last}kg</span>
          {change !== null && (
            <span className={change >= 0 ? 'ml-2 font-mono text-success' : 'ml-2 font-mono text-danger'}>
              {change >= 0 ? '+' : ''}
              {change.toFixed(0)}%
            </span>
          )}
        </p>
      </div>
      <ChartContainer config={config} className="aspect-auto h-60 w-full">
        <LineChart data={data} margin={{ left: 0, right: 12, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} width={40} unit="kg" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Line
            dataKey="weight"
            type="monotone"
            stroke="var(--color-weight)"
            strokeWidth={2.5}
            dot={{ r: 4, fill: 'var(--color-weight)' }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
