export type MainType = 'push' | 'pull' | 'legs'
export type SessionType = MainType | 'abs'
export type WeightUnit = 'kg' | 'lb'

export interface ExerciseEntry {
  id: number
  exerciseName: string
  sets: number
  reps: number
  weight: number
  unit: WeightUnit
}

export interface WorkoutSession {
  id: number
  sessionType: SessionType
  sessionDate: string
  durationMinutes: number | null
  intensityRating: number | null
  absTrained: boolean
  notes: string | null
  exercises: ExerciseEntry[]
}

export interface CoachingAnswer {
  id: number
  questionId: string
  questionText: string
  sessionType: SessionType
  sessionNumber: number
  sessionId: number | null
  answer: Record<string, unknown>
  answeredAt: string
}

export interface DashboardData {
  sessions: WorkoutSession[]
  coachingAnswers: CoachingAnswer[]
}

export interface ExerciseInput {
  exerciseName: string
  sets: number
  reps: number
  weight: number
  unit: WeightUnit
}

export interface LogSessionInput {
  sessionType: SessionType
  sessionDate: string
  durationMinutes: number | null
  intensityRating: number | null
  absTrained: boolean
  notes: string | null
  exercises: ExerciseInput[]
}

export interface CoachingAnswerInput {
  questionId: string
  questionText: string
  sessionType: SessionType
  sessionNumber: number
  sessionId: number | null
  answer: Record<string, unknown>
}
