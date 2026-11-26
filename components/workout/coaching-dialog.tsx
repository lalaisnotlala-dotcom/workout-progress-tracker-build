'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { cn } from '@/lib/utils'
import {
  averageStrengthChange,
  checkpointFeedback,
  type ChoiceQuestion,
  type CoachingStage,
  EARLY_RESULTS_QUESTIONS,
  LEARNING_QUESTIONS,
  percentChange,
  STAGE_TITLES,
  type StrengthRow,
  strengthCheckFeedback,
} from '@/lib/coaching'
import type { StrengthComparison } from '@/lib/stats'
import type { CoachingAnswerInput, SessionType } from '@/lib/types'
import { TYPE_META } from '@/lib/workout-config'

export interface CoachingRequest {
  stage: CoachingStage
  type: SessionType
  sessionNumber: number
  sessionId: number | null
  prefill: StrengthComparison[]
}

interface CoachingDialogProps {
  request: CoachingRequest | null
  onClose: () => void
  onSave: (input: CoachingAnswerInput) => Promise<boolean>
}

function ChoiceGroup({
  question,
  value,
  onChange,
}: {
  question: ChoiceQuestion
  value: string | undefined
  onChange: (v: string) => void
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{question.text}</legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label={question.text}>
        {question.options.map((opt) => (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={value === opt}
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-lg border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring',
              value === opt ? 'border-foreground bg-muted font-medium' : 'hover:bg-muted',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function parseNum(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function StrengthTable({
  rows,
  setRows,
  idPrefix,
}: {
  rows: { key: number; name: string; first: string; current: string }[]
  setRows: React.Dispatch<React.SetStateAction<{ key: number; name: string; first: string; current: string }[]>>
  idPrefix: string
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-sm font-medium">Compare your lifts now vs. session 1 (kg)</legend>
      {rows.map((row, i) => {
        const pct = percentChange(parseNum(row.first), parseNum(row.current))
        return (
          <div key={row.key} className="grid grid-cols-[1fr_4.5rem_4.5rem_3.5rem_auto] items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${idPrefix}-n-${row.key}`} className="text-xs">Exercise</Label>
              <Input
                id={`${idPrefix}-n-${row.key}`}
                value={row.name}
                maxLength={100}
                onChange={(e) =>
                  setRows((p) => p.map((r) => (r.key === row.key ? { ...r, name: e.target.value } : r)))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${idPrefix}-f-${row.key}`} className="text-xs">First</Label>
              <Input
                id={`${idPrefix}-f-${row.key}`}
                type="number"
                inputMode="decimal"
                min={0}
                value={row.first}
                onChange={(e) =>
                  setRows((p) => p.map((r) => (r.key === row.key ? { ...r, first: e.target.value } : r)))
                }
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`${idPrefix}-c-${row.key}`} className="text-xs">Now</Label>
              <Input
                id={`${idPrefix}-c-${row.key}`}
                type="number"
                inputMode="decimal"
                min={0}
                value={row.current}
                onChange={(e) =>
                  setRows((p) => p.map((r) => (r.key === row.key ? { ...r, current: e.target.value } : r)))
                }
              />
            </div>
            <span
              className={cn(
                'pb-2 text-right font-mono text-sm tabular-nums',
                pct === null ? 'text-muted-foreground' : pct >= 0 ? 'text-success' : 'text-danger',
              )}
              aria-label={pct === null ? 'No change calculated' : `${pct.toFixed(0)} percent change`}
            >
              {pct === null ? '-' : `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setRows((p) => p.filter((r) => r.key !== row.key))}
              aria-label={`Remove lift ${i + 1}`}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        )
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => setRows((p) => [...p, { key: Date.now(), name: '', first: '', current: '' }])}
        disabled={rows.length >= 6}
      >
        <Plus aria-hidden="true" />
        Add lift
      </Button>
    </fieldset>
  )
}

export function CoachingDialog({ request, onClose, onSave }: CoachingDialogProps) {
  return (
    <Dialog open={request !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-xl">
        {request && <CoachingForm key={`${request.sessionId}-${request.stage}`} request={request} onClose={onClose} onSave={onSave} />}
      </DialogContent>
    </Dialog>
  )
}

function CoachingForm({
  request,
  onClose,
  onSave,
}: {
  request: CoachingRequest
  onClose: () => void
  onSave: (input: CoachingAnswerInput) => Promise<boolean>
}) {
  const idPrefix = useId()
  const [choices, setChoices] = useState<Record<string, string>>({})
  const [rows, setRows] = useState(() =>
    (request.prefill.length
      ? request.prefill
      : [{ exerciseName: '', firstKg: 0, currentKg: 0 }]
    ).map((p, i) => ({
      key: i,
      name: p.exerciseName,
      first: p.firstKg ? String(p.firstKg) : '',
      current: p.currentKg ? String(p.currentKg) : '',
    })),
  )
  const [measure, setMeasure] = useState({ chest: '', arms: '', waist: '', protein: '', sleep: '' })
  const [deficit, setDeficit] = useState(false)
  const [missed, setMissed] = useState(false)
  const [result, setResult] = useState<{ headline: string; actions: string[] } | null>(null)
  const [saving, setSaving] = useState(false)

  const { stage, type, sessionNumber } = request
  const color = TYPE_META[type].color
  const questions = stage === 'learning' ? LEARNING_QUESTIONS : stage === 'early_results' ? EARLY_RESULTS_QUESTIONS : []

  const strengthRows: StrengthRow[] = rows
    .filter((r) => r.name.trim())
    .map((r) => ({ exerciseName: r.name.trim(), firstKg: parseNum(r.first), currentKg: parseNum(r.current) }))

  const canSubmit =
    questions.length > 0 ? questions.every((q) => choices[q.id]) : strengthRows.length > 0 || stage === 'checkpoint'

  async function submit() {
    let answer: Record<string, unknown>
    let feedback: { headline: string; actions: string[] }

    if (stage === 'learning' || stage === 'early_results') {
      answer = { ...choices }
      const negative = ['Struggled', 'Had form issues', 'Too much pain', 'Not really', 'Not yet']
      const flagged = Object.values(choices).some((c) => negative.includes(c))
      feedback = flagged
        ? {
            headline: stage === 'learning' ? 'Normal in the learning phase.' : 'Results take time.',
            actions: [
              'Lower the weight slightly and focus on controlled reps.',
              'Slow the eccentric (lowering) part of each rep to 2-3 seconds.',
              'Too much pain? Take an extra rest day and prioritize sleep.',
            ],
          }
        : {
            headline: 'Great work, keep it up!',
            actions: ['Add a rep or a little weight next session when it feels easy.'],
          }
    } else if (stage === 'strength_check') {
      const avg = averageStrengthChange(strengthRows)
      answer = { lifts: strengthRows, averageChangePct: avg }
      feedback = { headline: strengthCheckFeedback(avg), actions: [] }
    } else {
      const avg = averageStrengthChange(strengthRows)
      const input = {
        strengthPct: avg,
        chestGainCm: parseNum(measure.chest),
        armsGainCm: parseNum(measure.arms),
        waistChangeCm: parseNum(measure.waist),
        proteinGrams: parseNum(measure.protein),
        sleepHours: parseNum(measure.sleep),
        calorieDeficit: deficit,
        missedSessions: missed,
      }
      const fb = checkpointFeedback(input)
      answer = { lifts: strengthRows, ...input, verdict: fb.verdict }
      feedback = fb
    }

    setSaving(true)
    const ok = await onSave({
      questionId: stage,
      questionText: STAGE_TITLES[stage],
      sessionType: type,
      sessionNumber,
      sessionId: request.sessionId,
      answer: { ...answer, feedback: feedback.headline, actions: feedback.actions },
    })
    setSaving(false)
    if (ok) setResult(feedback)
  }

  if (result) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Coach feedback</DialogTitle>
          <DialogDescription>
            {TYPE_META[type].label} session {sessionNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 rounded-lg p-4" style={{ backgroundColor: TYPE_META[type].light }}>
          <p className="text-lg font-semibold">{result.headline}</p>
          {result.actions.length > 0 && (
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
              {result.actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color }}>
          {TYPE_META[type].label} - Session {sessionNumber}
        </p>
        <DialogTitle>{STAGE_TITLES[stage]}</DialogTitle>
        <DialogDescription>
          {stage === 'checkpoint'
            ? "Let's evaluate your progress comprehensively. Answer what you can."
            : 'Quick check-in. Your answers help tailor feedback. You can skip.'}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-6">
        {questions.map((q) => (
          <ChoiceGroup
            key={q.id}
            question={q}
            value={choices[q.id]}
            onChange={(v) => setChoices((p) => ({ ...p, [q.id]: v }))}
          />
        ))}

        {(stage === 'strength_check' || stage === 'checkpoint') && (
          <StrengthTable rows={rows} setRows={setRows} idPrefix={idPrefix} />
        )}

        {stage === 'checkpoint' && (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">Measurement change since you started (cm)</legend>
              <div className="grid grid-cols-3 gap-2">
                {(['chest', 'arms', 'waist'] as const).map((k) => (
                  <div key={k} className="flex flex-col gap-1">
                    <Label htmlFor={`${idPrefix}-${k}`} className="text-xs capitalize">{k}</Label>
                    <Input
                      id={`${idPrefix}-${k}`}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min={-50}
                      max={50}
                      placeholder="+0.0"
                      value={measure[k]}
                      onChange={(e) => setMeasure((p) => ({ ...p, [k]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${idPrefix}-protein`}>Daily protein (g)</Label>
                <Input
                  id={`${idPrefix}-protein`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={500}
                  value={measure.protein}
                  onChange={(e) => setMeasure((p) => ({ ...p, protein: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor={`${idPrefix}-sleep`}>Sleep per night (hours)</Label>
                <Input
                  id={`${idPrefix}-sleep`}
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min={0}
                  max={24}
                  value={measure.sleep}
                  onChange={(e) => setMeasure((p) => ({ ...p, sleep: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id={`${idPrefix}-deficit`} checked={deficit} onCheckedChange={(c) => setDeficit(c === true)} />
                <Label htmlFor={`${idPrefix}-deficit`} className="font-normal">I have been eating in a calorie deficit</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id={`${idPrefix}-missed`} checked={missed} onCheckedChange={(c) => setMissed(c === true)} />
                <Label htmlFor={`${idPrefix}-missed`} className="font-normal">I missed many sessions or took long breaks</Label>
              </div>
            </div>
          </>
        )}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={saving}>
          Skip
        </Button>
        <Button
          onClick={submit}
          disabled={!canSubmit || saving}
          className="text-white hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          {saving ? 'Saving...' : 'Get feedback'}
        </Button>
      </DialogFooter>
    </>
  )
}
