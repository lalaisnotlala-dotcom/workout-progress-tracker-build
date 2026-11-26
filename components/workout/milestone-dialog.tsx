'use client'

import confetti from 'canvas-confetti'
import { Dumbbell, Flame, Sprout, Star, Trophy } from 'lucide-react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SessionType } from '@/lib/types'
import { MILESTONES, TYPE_META } from '@/lib/workout-config'

const ICONS: Record<number, typeof Trophy> = {
  5: Sprout,
  10: Dumbbell,
  15: Flame,
  20: Trophy,
  30: Star,
}

interface MilestoneDialogProps {
  milestone: { type: SessionType; n: number } | null
  onClose: () => void
}

export function MilestoneDialog({ milestone, onClose }: MilestoneDialogProps) {
  const info = milestone ? MILESTONES.find((m) => m.n === milestone.n) : null

  useEffect(() => {
    if (!milestone) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const colors = ['#FF6B6B', '#4A90E2', '#F5A623', '#9B59B6', '#10B981']
    confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 }, colors, zIndex: 9999 })
    const t = setTimeout(
      () => confetti({ particleCount: 80, spread: 110, origin: { y: 0.5 }, colors, zIndex: 9999 }),
      300,
    )
    return () => clearTimeout(t)
  }, [milestone])

  const Icon = milestone ? (ICONS[milestone.n] ?? Trophy) : Trophy
  const color = milestone ? TYPE_META[milestone.type].color : undefined

  return (
    <Dialog open={milestone !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="text-center sm:max-w-md">
        {milestone && info && (
          <>
            <div
              className="mx-auto flex size-20 items-center justify-center rounded-full motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500"
              style={{ backgroundColor: TYPE_META[milestone.type].light, color }}
            >
              <Icon className="size-10" aria-hidden="true" />
            </div>
            <DialogHeader className="items-center text-center">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color }}>
                {TYPE_META[milestone.type].label} - Session {milestone.n}
              </p>
              <DialogTitle className="text-2xl">{info.title}</DialogTitle>
              <DialogDescription className="text-base">{info.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button onClick={onClose} className="text-white hover:opacity-90" style={{ backgroundColor: color }}>
                Keep going
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
