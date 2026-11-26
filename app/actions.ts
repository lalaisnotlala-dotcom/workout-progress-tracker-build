'use server'

import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { coachingAnswers, sessionExercises, workoutSessions } from '@/lib/db/schema'
import type {
  CoachingAnswerInput,
  DashboardData,
  ExerciseEntry,
  LogSessionInput,
  SessionType,
  WeightUnit,
  WorkoutSession,
} from '@/lib/types'
import { isValidUserCode } from '@/lib/user-code'

const SESSION_TYPES: SessionType[] = ['push', 'pull', 'legs', 'abs']

function assertUser(userCode: string) {
  if (!isValidUserCode(userCode)) throw new Error('Invalid user code')
}

function optionalInt(value: unknown, min: number, max: number, label: string): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    throw new Error(`${label} must be a whole number between ${min} and ${max}`)
  return value
}

function requiredNumber(value: unknown, min: number, max: number, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error(`${label} must be between ${min} and ${max}`)
  return value
}

export async function getDashboard(userCode: string): Promise<DashboardData> {
  assertUser(userCode)

  const [sessionRows, exerciseRows, answerRows] = await Promise.all([
    db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.userCode, userCode))
      .orderBy(asc(workoutSessions.sessionDate), asc(workoutSessions.id)),
    db
      .select({
        id: sessionExercises.id,
        sessionId: sessionExercises.sessionId,
        exerciseName: sessionExercises.exerciseName,
        sets: sessionExercises.sets,
        reps: sessionExercises.reps,
        weight: sessionExercises.weight,
        unit: sessionExercises.unit,
      })
      .from(sessionExercises)
      .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
      .where(eq(workoutSessions.userCode, userCode))
      .orderBy(asc(sessionExercises.id)),
    db
      .select()
      .from(coachingAnswers)
      .where(eq(coachingAnswers.userCode, userCode))
      .orderBy(desc(coachingAnswers.answeredAt)),
  ])

  const exercisesBySession = new Map<number, ExerciseEntry[]>()
  for (const e of exerciseRows) {
    const list = exercisesBySession.get(e.sessionId) ?? []
    list.push({
      id: e.id,
      exerciseName: e.exerciseName,
      sets: e.sets,
      reps: e.reps,
      weight: Number(e.weight),
      unit: e.unit as WeightUnit,
    })
    exercisesBySession.set(e.sessionId, list)
  }

  const sessions: WorkoutSession[] = sessionRows.map((s) => ({
    id: s.id,
    sessionType: s.sessionType as SessionType,
    sessionDate: s.sessionDate.toISOString(),
    durationMinutes: s.durationMinutes,
    intensityRating: s.intensityRating,
    absTrained: s.absTrained,
    notes: s.notes,
    exercises: exercisesBySession.get(s.id) ?? [],
  }))

  return {
    sessions,
    coachingAnswers: answerRows.map((a) => ({
      id: a.id,
      questionId: a.questionId,
      questionText: a.questionText,
      sessionType: a.sessionType as SessionType,
      sessionNumber: a.sessionNumber,
      sessionId: a.sessionId,
      answer: a.answer as Record<string, unknown>,
      answeredAt: a.answeredAt.toISOString(),
    })),
  }
}

export async function logSession(
  userCode: string,
  input: LogSessionInput,
): Promise<{ id: number }> {
  assertUser(userCode)
  if (!SESSION_TYPES.includes(input.sessionType)) throw new Error('Invalid session type')

  const sessionDate = new Date(input.sessionDate)
  if (Number.isNaN(sessionDate.getTime())) throw new Error('Invalid session date')
  if (sessionDate.getTime() > Date.now() + 60 * 60 * 1000)
    throw new Error('Session date cannot be in the future')
  if (sessionDate.getFullYear() < 2000) throw new Error('Session date is too far in the past')

  const durationMinutes = optionalInt(input.durationMinutes, 1, 600, 'Duration')
  const intensityRating = optionalInt(input.intensityRating, 1, 5, 'Intensity')
  const notes = typeof input.notes === 'string' ? input.notes.trim().slice(0, 2000) || null : null

  if (!Array.isArray(input.exercises) || input.exercises.length > 30)
    throw new Error('Too many exercises')
  const exercises = input.exercises.map((e) => {
    const name = typeof e.exerciseName === 'string' ? e.exerciseName.trim() : ''
    if (!name || name.length > 100) throw new Error('Exercise name is required (max 100 chars)')
    if (e.unit !== 'kg' && e.unit !== 'lb') throw new Error('Invalid weight unit')
    return {
      exerciseName: name,
      sets: optionalInt(e.sets, 1, 50, 'Sets') ?? 1,
      reps: optionalInt(e.reps, 1, 500, 'Reps') ?? 1,
      weight: requiredNumber(e.weight, 0, 2000, 'Weight').toFixed(2),
      unit: e.unit,
    }
  })

  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(workoutSessions)
      .values({
        userCode,
        sessionType: input.sessionType,
        sessionDate,
        durationMinutes,
        intensityRating,
        absTrained: input.sessionType === 'abs' ? true : Boolean(input.absTrained),
        notes,
      })
      .returning({ id: workoutSessions.id })

    if (exercises.length) {
      await tx
        .insert(sessionExercises)
        .values(exercises.map((e) => ({ ...e, sessionId: row.id })))
    }
    return { id: row.id }
  })
}

export async function deleteSession(userCode: string, sessionId: number): Promise<void> {
  assertUser(userCode)
  if (!Number.isInteger(sessionId)) throw new Error('Invalid session id')
  await db
    .delete(workoutSessions)
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userCode, userCode)))
}

export async function saveCoachingAnswer(
  userCode: string,
  input: CoachingAnswerInput,
): Promise<void> {
  assertUser(userCode)
  if (!SESSION_TYPES.includes(input.sessionType)) throw new Error('Invalid session type')
  if (typeof input.questionId !== 'string' || !/^[a-z_]{1,50}$/.test(input.questionId))
    throw new Error('Invalid question id')
  const questionText = String(input.questionText ?? '').slice(0, 500)
  const sessionNumber = optionalInt(input.sessionNumber, 1, 10_000, 'Session number') ?? 1
  const answerJson = JSON.stringify(input.answer ?? {})
  if (answerJson.length > 10_000) throw new Error('Answer is too large')

  let sessionId: number | null = null
  if (input.sessionId !== null && Number.isInteger(input.sessionId)) {
    const [owned] = await db
      .select({ id: workoutSessions.id })
      .from(workoutSessions)
      .where(
        and(eq(workoutSessions.id, input.sessionId), eq(workoutSessions.userCode, userCode)),
      )
    sessionId = owned?.id ?? null
  }

  await db.insert(coachingAnswers).values({
    userCode,
    questionId: input.questionId,
    questionText,
    sessionType: input.sessionType,
    sessionNumber,
    sessionId,
    answer: JSON.parse(answerJson),
  })
}
