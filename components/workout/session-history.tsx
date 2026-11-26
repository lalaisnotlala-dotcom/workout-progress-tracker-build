'use client'

import { Clock, Star } from 'lucide-react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatCairoDate } from '@/lib/time'
import type { SessionType, WorkoutSession } from '@/lib/types'
import { ALL_TYPES, TYPE_META } from '@/lib/workout-config'

interface SessionHistoryProps {
  sessions: WorkoutSession[]
  sessionNumbers: Map<number, number>
  onDelete: (id: number) => Promise<void>
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">-</span>
  return (
    <span className="flex" role="img" aria-label={`Intensity ${rating} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn('size-3.5', n <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/40')}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

function TypeBadge({ type }: { type: SessionType }) {
  return (
    <span
      className="inline-flex w-14 justify-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: TYPE_META[type].light, color: 'var(--foreground)' }}
    >
      {TYPE_META[type].label}
    </span>
  )
}

export function SessionHistory({ sessions, sessionNumbers, onDelete }: SessionHistoryProps) {
  const [filter, setFilter] = useState<SessionType | 'all'>('all')
  const [showAll, setShowAll] = useState(false)
  const [viewing, setViewing] = useState<WorkoutSession | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered = [...sessions]
    .reverse()
    .filter((s) => filter === 'all' || s.sessionType === filter)
  const visible = showAll ? filtered : filtered.slice(0, 10)

  async function handleDelete() {
    if (!viewing) return
    setDeleting(true)
    await onDelete(viewing.id)
    setDeleting(false)
    setConfirmDelete(false)
    setViewing(null)
  }

  return (
    <section aria-labelledby="history-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="history-heading" className="text-lg font-semibold">
          Session history
        </h2>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter sessions">
          {(['all', ...ALL_TYPES] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={filter === t ? 'secondary' : 'ghost'}
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              {t === 'all' ? 'All' : TYPE_META[t].label}
            </Button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No sessions yet. Tap +1 on a counter to log your first one.
        </p>
      ) : (
        <ul className="flex flex-col divide-y">
          {visible.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setViewing(s)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-3 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="w-16 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatCairoDate(s.sessionDate)}
                </span>
                <TypeBadge type={s.sessionType} />
                <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                  #{sessionNumbers.get(s.id) ?? '-'}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {s.durationMinutes ? `${s.durationMinutes}min` : '-'}
                </span>
                <span className="ml-auto flex items-center gap-3">
                  <Stars rating={s.intensityRating} />
                  <span className="text-xs font-medium text-foreground underline-offset-2 hover:underline">
                    View
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {filtered.length > 10 && (
        <Button variant="ghost" size="sm" className="self-center" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show last 10' : `Show all ${filtered.length} sessions`}
        </Button>
      )}

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TypeBadge type={viewing.sessionType} />
                  Session #{sessionNumbers.get(viewing.id) ?? '-'}
                </DialogTitle>
                <DialogDescription>
                  {formatCairoDate(viewing.sessionDate, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  (Cairo)
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Duration</dt>
                  <dd className="font-mono">{viewing.durationMinutes ? `${viewing.durationMinutes} min` : '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Intensity</dt>
                  <dd><Stars rating={viewing.intensityRating} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Abs</dt>
                  <dd>{viewing.absTrained ? 'Trained' : 'Skipped'}</dd>
                </div>
              </dl>
              {viewing.exercises.length > 0 && (
                <table className="w-full text-sm">
                  <caption className="sr-only">Exercises</caption>
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th scope="col" className="py-2 font-medium">Exercise</th>
                      <th scope="col" className="py-2 text-right font-medium">Sets x Reps</th>
                      <th scope="col" className="py-2 text-right font-medium">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewing.exercises.map((e) => (
                      <tr key={e.id} className="border-b last:border-0">
                        <td className="py-2">{e.exerciseName}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{e.sets} x {e.reps}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{e.weight}{e.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {viewing.notes && (
                <p className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap">{viewing.notes}</p>
              )}
              <div className="flex justify-end">
                <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                  Delete session
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this session?</AlertDialogTitle>
            <AlertDialogDescription>
              Counters, rest periods and session numbers will be recalculated. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
