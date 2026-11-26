'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { deleteSession, getDashboard, logSession, saveCoachingAnswer } from '@/app/actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { coachingStageFor } from '@/lib/coaching'
import { computeStats, strengthComparisons } from '@/lib/stats'
import { cairoDayKey } from '@/lib/time'
import type { CoachingAnswerInput, DashboardData, LogSessionInput, SessionType } from '@/lib/types'
import { ALL_TYPES, MILESTONES, TYPE_META } from '@/lib/workout-config'
import { CoachingDialog, type CoachingRequest } from './coaching-dialog'
import { CoachingHistory } from './coaching-history'
import { CounterCard } from './counter-card'
import { DashboardHeader } from './dashboard-header'
import { FrequencyHeatmap } from './frequency-heatmap'
import { MilestoneDialog } from './milestone-dialog'
import { MilestoneTimeline } from './milestone-timeline'
import { MuscleBalance } from './muscle-balance'
import { RestChart } from './rest-chart'
import { SessionDialog } from './session-dialog'
import { SessionHistory } from './session-history'
import { StrengthChart } from './strength-chart'

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function Dashboard({ userCode, initialData }: { userCode: string; initialData: DashboardData }) {
  const { data, mutate } = useSWR(['dashboard', userCode], () => getDashboard(userCode), {
    fallbackData: initialData,
    revalidateOnFocus: false,
  })
  const [dialogType, setDialogType] = useState<SessionType | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [milestone, setMilestone] = useState<{ type: SessionType; n: number } | null>(null)
  const [pendingCoaching, setPendingCoaching] = useState<CoachingRequest | null>(null)
  const [coaching, setCoaching] = useState<CoachingRequest | null>(null)

  const stats = computeStats(data.sessions)
  const loggedTodayTypes = new Set(
    data.sessions.filter((s) => cairoDayKey(s.sessionDate) === stats.todayKey).map((s) => s.sessionType),
  )

  function openDialog(type: SessionType) {
    setDialogKey((k) => k + 1)
    setDialogType(type)
  }

  async function handleLog(input: LogSessionInput): Promise<boolean> {
    try {
      const { id } = await logSession(userCode, input)
      const fresh = await mutate()
      const next = computeStats(fresh?.sessions ?? data.sessions)
      const typeStats = next.byType[input.sessionType]
      const sessionNumber = typeStats.sessions.findIndex((s) => s.id === id) + 1
      const isLatest = sessionNumber === typeStats.count

      toast.success(`${TYPE_META[input.sessionType].label} session ${sessionNumber} logged`, {
        description: input.absTrained && input.sessionType !== 'abs' ? `Abs +1 (${next.byType.abs.count}/60)` : undefined,
      })

      const hitMilestone = input.sessionType !== 'abs' && isLatest && MILESTONES.some((m) => m.n === sessionNumber)
      const stage = input.sessionType !== 'abs' ? coachingStageFor(sessionNumber) : null
      const coachingRequest: CoachingRequest | null = stage
        ? {
            stage,
            type: input.sessionType,
            sessionNumber,
            sessionId: id,
            prefill: strengthComparisons(typeStats.sessions),
          }
        : null

      if (hitMilestone) {
        setPendingCoaching(coachingRequest)
        setMilestone({ type: input.sessionType, n: sessionNumber })
      } else if (coachingRequest) {
        setTimeout(() => setCoaching(coachingRequest), 250)
      }
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the session')
      return false
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteSession(userCode, id)
      await mutate()
      toast.success('Session deleted')
    } catch {
      toast.error('Could not delete the session')
    }
  }

  async function handleCoachingSave(input: CoachingAnswerInput): Promise<boolean> {
    try {
      await saveCoachingAnswer(userCode, input)
      await mutate()
      return true
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save your answers')
      return false
    }
  }

  function closeMilestone() {
    setMilestone(null)
    if (pendingCoaching) {
      const next = pendingCoaching
      setPendingCoaching(null)
      setTimeout(() => setCoaching(next), 250)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-10">
      <DashboardHeader userCode={userCode} stats={stats} />

      <Tabs defaultValue="dashboard" className="flex flex-col gap-6">
        <TabsList className="self-start">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {ALL_TYPES.map((type) => (
              <CounterCard
                key={type}
                stats={stats.byType[type]}
                absCount={stats.byType.abs.count}
                onLog={() => openDialog(type)}
              />
            ))}
          </div>
          <SessionHistory sessions={data.sessions} sessionNumbers={stats.sessionNumbers} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="analytics" className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Strength progression" description="Best set weight per session, converted to kg.">
            <StrengthChart sessions={data.sessions} />
          </Panel>
          <Panel title="Rest periods" description="Days between sessions of the same type. 2-4 days is optimal.">
            <RestChart byType={stats.byType} />
          </Panel>
          <Panel title="Workout frequency" description="Last 12 weeks, Cairo time.">
            <FrequencyHeatmap sessions={data.sessions} todayKey={stats.todayKey} />
          </Panel>
          <Panel title="Muscle balance" description="Sessions per muscle group toward the 20-session goal.">
            <MuscleBalance byType={stats.byType} />
          </Panel>
          <div className="lg:col-span-2">
            <Panel title="Milestones">
              <MilestoneTimeline byType={stats.byType} />
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex flex-col gap-6">
          <Panel title="Coaching check-ins" description="Your answers and feedback over time.">
            <CoachingHistory answers={data.coachingAnswers} />
          </Panel>
        </TabsContent>
      </Tabs>

      {dialogType && (
        <SessionDialog
          key={dialogKey}
          open
          onOpenChange={(open) => !open && setDialogType(null)}
          defaultType={dialogType}
          loggedTodayTypes={loggedTodayTypes}
          onSubmit={handleLog}
        />
      )}
      <MilestoneDialog milestone={milestone} onClose={closeMilestone} />
      <CoachingDialog request={coaching} onClose={() => setCoaching(null)} onSave={handleCoachingSave} />
    </main>
  )
}
