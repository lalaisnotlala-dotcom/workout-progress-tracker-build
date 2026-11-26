'use client'

import { Check, Dumbbell, Flame, Link2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { DashboardStats } from '@/lib/stats'

export function DashboardHeader({ userCode, stats }: { userCode: string; stats: DashboardStats }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const items = [
    { label: 'Main sessions', value: `${stats.totalMain}/${stats.totalMainTarget}` },
    { label: 'Day streak', value: stats.streak, icon: Flame },
    { label: 'This week', value: stats.thisWeek },
  ]

  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-foreground text-background">
            <Dumbbell className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PPL Tracker</h1>
            <p className="text-xs text-muted-foreground">Push · Pull · Legs · Abs</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={copyLink} aria-label={`Copy your tracker link for ${userCode}`}>
          {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
          <span className="font-mono text-xs">{copied ? 'Link copied' : userCode}</span>
        </Button>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 rounded-xl border bg-card p-3 sm:p-4">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="flex items-center gap-1.5 font-mono text-xl font-bold tabular-nums sm:text-2xl">
              {item.icon && <item.icon className="size-5 text-warning" aria-hidden="true" />}
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </header>
  )
}
