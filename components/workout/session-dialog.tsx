'use client'

import { AlertTriangle, ChevronDown, Plus, Star, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { cairoDayKey, cairoLocalToDate, cairoTime } from '@/lib/time'
import type { LogSessionInput, SessionType, WeightUnit } from '@/lib/types'
import { ALL_TYPES, EXERCISE_TEMPLATES, TYPE_META } from '@/lib/workout-config'

interface ExerciseRow {
  key: number
  exerciseName: string
  sets: string
  reps: string
  weight: string
  unit: WeightUnit
}

interface SessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType: SessionType
  loggedTodayTypes: Set<SessionType>
  onSubmit: (input: LogSessionInput) => Promise<boolean>
}

let rowKey = 0
const newRow = (): ExerciseRow => ({
  key: ++rowKey,
  exerciseName: '',
  sets: '3',
  reps: '10',
  weight: '',
  unit: 'kg',
})

export function SessionDialog({
  open,
  onOpenChange,
  defaultType,
  loggedTodayTypes,
  onSubmit,
}: SessionDialogProps) {
  const formId = useId()
  const now = new Date()
  const todayKey = cairoDayKey(now)
  const [type, setType] = useState<SessionType>(defaultType)
  const [date, setDate] = useState(todayKey)
  const [time, setTime] = useState(cairoTime(now))
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState<number | null>(null)
  const [absTrained, setAbsTrained] = useState(true)
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<ExerciseRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const meta = TYPE_META[type]
  const duplicate = date === todayKey && loggedTodayTypes.has(type)

  function updateRow(key: number, patch: Partial<ExerciseRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!date || !time) return setError('Please choose a date and time.')
    const sessionDate = cairoLocalToDate(date, time)
    if (sessionDate.getTime() > Date.now() + 5 * 60 * 1000)
      return setError('Session date cannot be in the future.')

    const durationMinutes = duration ? Number(duration) : null
    if (durationMinutes !== null && (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600))
      return setError('Duration must be between 1 and 600 minutes.')

    const filled = rows.filter((r) => r.exerciseName.trim())
    for (const r of filled) {
      const sets = Number(r.sets)
      const reps = Number(r.reps)
      const weight = r.weight === '' ? 0 : Number(r.weight)
      if (!Number.isInteger(sets) || sets < 1 || sets > 50)
        return setError(`${r.exerciseName}: sets must be 1-50.`)
      if (!Number.isInteger(reps) || reps < 1 || reps > 500)
        return setError(`${r.exerciseName}: reps must be 1-500.`)
      if (!Number.isFinite(weight) || weight < 0 || weight > 2000)
        return setError(`${r.exerciseName}: weight must be 0-2000.`)
    }

    setSaving(true)
    const ok = await onSubmit({
      sessionType: type,
      sessionDate: sessionDate.toISOString(),
      durationMinutes,
      intensityRating: intensity,
      absTrained: type === 'abs' ? true : absTrained,
      notes: notes.trim() || null,
      exercises: filled.map((r) => ({
        exerciseName: r.exerciseName.trim(),
        sets: Number(r.sets),
        reps: Number(r.reps),
        weight: r.weight === '' ? 0 : Number(r.weight),
        unit: r.unit,
      })),
    })
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log this session?</DialogTitle>
          <DialogDescription>
            Confirm to add it to your counters right away. Details are optional. Times are in Cairo time.
          </DialogDescription>
        </DialogHeader>

        <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Session type</legend>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Session type">
              {ALL_TYPES.map((t) => {
                const selected = t === type
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setType(t)}
                    className={cn(
                      'rounded-lg border-2 px-2 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                      !selected && 'border-border text-muted-foreground hover:bg-muted',
                    )}
                    style={
                      selected
                        ? { borderColor: TYPE_META[t].color, backgroundColor: TYPE_META[t].light }
                        : undefined
                    }
                  >
                    {TYPE_META[t].label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-date`}>Date</Label>
              <Input
                id={`${formId}-date`}
                type="date"
                value={date}
                max={todayKey}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`${formId}-time`}>Time (Cairo)</Label>
              <Input
                id={`${formId}-time`}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {duplicate && (
            <p className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-foreground" role="status">
              <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden="true" />
              You already logged a {meta.label} session today. Log another anyway?
            </p>
          )}

          {type !== 'abs' && (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${formId}-abs`}
                checked={absTrained}
                onCheckedChange={(checked) => setAbsTrained(checked === true)}
              />
              <Label htmlFor={`${formId}-abs`} className="font-normal">
                I trained abs today (Abs +1)
              </Label>
            </div>
          )}

          <Collapsible>
            <CollapsibleTrigger
              render={<Button type="button" variant="outline" className="group w-full justify-between" />}
            >
              Add details (duration, intensity, exercises)
              <ChevronDown
                className="transition-transform group-data-[panel-open]:rotate-180"
                aria-hidden="true"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-5 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`${formId}-duration`}>Duration (minutes)</Label>
                  <Input
                    id={`${formId}-duration`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={600}
                    placeholder="e.g. 60"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <fieldset className="flex flex-col gap-1.5">
                  <legend className="mb-1.5 text-sm font-medium">Intensity</legend>
                  <div className="flex gap-1" role="radiogroup" aria-label="Intensity rating">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={intensity === n}
                        aria-label={`${n} star${n > 1 ? 's' : ''}`}
                        onClick={() => setIntensity(intensity === n ? null : n)}
                        className="rounded-md p-1 focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <Star
                          className={cn(
                            'size-7 transition-colors',
                            intensity !== null && n <= intensity
                              ? 'fill-warning text-warning'
                              : 'text-muted-foreground/50',
                          )}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-medium">Exercises</legend>
                <datalist id={`${formId}-exercises`}>
                  {EXERCISE_TEMPLATES[type].map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                {rows.length === 0 && (
                  <p className="text-sm text-muted-foreground">No exercises added yet.</p>
                )}
                {rows.map((row, index) => (
                  <div
                    key={row.key}
                    className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border p-3 sm:grid-cols-[2fr_4rem_4rem_6rem_auto_auto] sm:items-end"
                  >
                    <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
                      <Label htmlFor={`${formId}-ex-${row.key}`} className="text-xs">
                        Exercise {index + 1}
                      </Label>
                      <Input
                        id={`${formId}-ex-${row.key}`}
                        list={`${formId}-exercises`}
                        value={row.exerciseName}
                        maxLength={100}
                        placeholder="Start typing..."
                        onChange={(e) => updateRow(row.key, { exerciseName: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2 grid grid-cols-[1fr_1fr_1.5fr_auto_auto] items-end gap-2 sm:contents">
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`${formId}-sets-${row.key}`} className="text-xs">Sets</Label>
                        <Input
                          id={`${formId}-sets-${row.key}`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={50}
                          value={row.sets}
                          onChange={(e) => updateRow(row.key, { sets: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`${formId}-reps-${row.key}`} className="text-xs">Reps</Label>
                        <Input
                          id={`${formId}-reps-${row.key}`}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={500}
                          value={row.reps}
                          onChange={(e) => updateRow(row.key, { reps: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label htmlFor={`${formId}-weight-${row.key}`} className="text-xs">Weight</Label>
                        <Input
                          id={`${formId}-weight-${row.key}`}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={2000}
                          step="0.5"
                          placeholder="0"
                          value={row.weight}
                          onChange={(e) => updateRow(row.key, { weight: e.target.value })}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-12 font-mono"
                        onClick={() => updateRow(row.key, { unit: row.unit === 'kg' ? 'lb' : 'kg' })}
                        aria-label={`Weight unit: ${row.unit}. Switch to ${row.unit === 'kg' ? 'lb' : 'kg'}`}
                      >
                        {row.unit}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                        aria-label={`Remove exercise ${index + 1}`}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setRows((prev) => [...prev, newRow()])}
                  disabled={rows.length >= 30}
                >
                  <Plus aria-hidden="true" />
                  Add exercise
                </Button>
              </fieldset>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${formId}-notes`}>Notes</Label>
                <Textarea
                  id={`${formId}-notes`}
                  value={notes}
                  maxLength={2000}
                  placeholder="How did it go?"
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {error && (
            <p className="text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={saving}
            className="text-white hover:opacity-90"
            style={{ backgroundColor: meta.color }}
          >
            {saving ? 'Saving...' : `Log ${meta.label} session`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
