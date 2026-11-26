import { formatCairoDate } from '@/lib/time'
import type { CoachingAnswer } from '@/lib/types'
import { TYPE_META } from '@/lib/workout-config'

const LABELS: Record<string, string> = {
  feeling: 'Feeling',
  soreness: 'Soreness',
  mind_muscle: 'Mind-muscle',
  size_changes: 'Size changes',
}

export function CoachingHistory({ answers }: { answers: CoachingAnswer[] }) {
  if (!answers.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Coaching check-ins appear after sessions 1-5, 10, 15 and 20 of each type.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {answers.map((a) => {
        const answer = a.answer
        const choices = Object.entries(answer).filter(([k]) => k in LABELS)
        const avg = typeof answer.averageChangePct === 'number' ? answer.averageChangePct : typeof answer.strengthPct === 'number' ? answer.strengthPct : null
        return (
          <li key={a.id} className="flex flex-col gap-2 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{a.questionText}</p>
              <span className="text-xs text-muted-foreground">
                <span style={{ color: TYPE_META[a.sessionType].color }} className="font-semibold">
                  {TYPE_META[a.sessionType].label} #{a.sessionNumber}
                </span>{' '}
                · {formatCairoDate(a.answeredAt)}
              </span>
            </div>
            {choices.length > 0 && (
              <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                {choices.map(([k, v]) => (
                  <div key={k} className="flex gap-1">
                    <dt className="text-muted-foreground">{LABELS[k]}:</dt>
                    <dd className="font-medium">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            )}
            {avg !== null && (
              <p className="text-xs text-muted-foreground">
                Strength change: <span className="font-mono text-foreground">{avg >= 0 ? '+' : ''}{avg.toFixed(0)}%</span>
              </p>
            )}
            {typeof answer.feedback === 'string' && <p className="text-sm">{answer.feedback}</p>}
          </li>
        )
      })}
    </ul>
  )
}
