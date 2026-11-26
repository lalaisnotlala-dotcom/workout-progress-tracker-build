export type CoachingStage = 'learning' | 'strength_check' | 'early_results' | 'checkpoint'

export const STAGE_TITLES: Record<CoachingStage, string> = {
  learning: 'Learning phase check-in',
  strength_check: 'Session 10 strength check',
  early_results: 'Session 15 early results',
  checkpoint: 'Session 20 major checkpoint',
}

export function coachingStageFor(sessionNumber: number): CoachingStage | null {
  if (sessionNumber >= 1 && sessionNumber <= 5) return 'learning'
  if (sessionNumber === 10) return 'strength_check'
  if (sessionNumber === 15) return 'early_results'
  if (sessionNumber === 20) return 'checkpoint'
  return null
}

export interface ChoiceQuestion {
  id: string
  text: string
  options: string[]
}

export const LEARNING_QUESTIONS: ChoiceQuestion[] = [
  {
    id: 'feeling',
    text: 'How did you feel during this session?',
    options: ['Great!', 'Okay', 'Struggled', 'Had form issues'],
  },
  {
    id: 'soreness',
    text: 'Did you feel sore the day after your last session?',
    options: ['Yes, good soreness', 'Too much pain', 'No soreness'],
  },
]

export const EARLY_RESULTS_QUESTIONS: ChoiceQuestion[] = [
  {
    id: 'mind_muscle',
    text: 'Do you feel the target muscle working during exercises?',
    options: ['Yes, strong pump', 'Sometimes', 'Not really'],
  },
  {
    id: 'size_changes',
    text: 'Have you noticed any size changes?',
    options: ['Yes, clearly', 'Maybe slight', 'Not yet'],
  },
]

export interface StrengthRow {
  exerciseName: string
  firstKg: number | null
  currentKg: number | null
}

export function percentChange(first: number | null, current: number | null): number | null {
  if (!first || current === null || first <= 0) return null
  return ((current - first) / first) * 100
}

export function averageStrengthChange(rows: StrengthRow[]): number | null {
  const changes = rows
    .map((r) => percentChange(r.firstKg, r.currentKg))
    .filter((c): c is number => c !== null)
  if (!changes.length) return null
  return changes.reduce((a, b) => a + b, 0) / changes.length
}

export function strengthCheckFeedback(avgPct: number | null): string {
  if (avgPct === null) return 'Log weights on your sessions so we can track your strength.'
  if (avgPct >= 15) return 'Excellent progress!'
  if (avgPct >= 5) return 'Good progress, keep going.'
  return "Let's check your nutrition. Aim for enough protein and calories to fuel growth."
}

export interface CheckpointInput {
  strengthPct: number | null
  chestGainCm: number | null
  armsGainCm: number | null
  waistChangeCm: number | null
  proteinGrams: number | null
  sleepHours: number | null
  calorieDeficit: boolean
  missedSessions: boolean
}

export interface CheckpointFeedback {
  verdict: 'excellent' | 'good' | 'troubleshoot'
  headline: string
  actions: string[]
}

export function checkpointFeedback(input: CheckpointInput): CheckpointFeedback {
  const strength = input.strengthPct ?? 0
  const bestGain = Math.max(input.chestGainCm ?? 0, input.armsGainCm ?? 0)

  if (strength >= 20 || bestGain >= 1) {
    return {
      verdict: 'excellent',
      headline: 'Excellent progress! Continue to 30 sessions.',
      actions: ['Keep adding weight or reps each week.', 'Keep rest gaps at 2-4 days.'],
    }
  }
  if (strength >= 5) {
    return {
      verdict: 'good',
      headline: 'Good progress. Optimize nutrition for better results.',
      actions: [
        'Hit at least 120g of protein daily.',
        'Eat at maintenance or a small surplus on training days.',
      ],
    }
  }

  const actions: string[] = []
  if (input.proteinGrams !== null && input.proteinGrams < 120)
    actions.push('Raise protein to at least 120g per day (roughly 1.6-2.2 g per kg of bodyweight).')
  if (input.calorieDeficit)
    actions.push('A calorie deficit limits growth. Move to maintenance or a slight surplus.')
  if (input.sleepHours !== null && input.sleepHours < 7)
    actions.push('Get 7-9 hours of sleep. Most recovery happens overnight.')
  if (input.missedSessions)
    actions.push('Keep gaps between sessions of the same type to 2-4 days.')
  if (!actions.length)
    actions.push(
      'Focus on progressive overload: add one rep or 2.5kg each week on your main lifts.',
      'Film a set to check your form and range of motion.',
    )

  return { verdict: 'troubleshoot', headline: "Let's troubleshoot.", actions }
}
