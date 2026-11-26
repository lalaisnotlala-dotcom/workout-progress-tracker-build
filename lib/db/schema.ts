import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const workoutSessions = pgTable('workout_sessions', {
  id: serial('id').primaryKey(),
  userCode: varchar('user_code', { length: 50 }).notNull(),
  sessionType: varchar('session_type', { length: 10 }).notNull(),
  sessionDate: timestamp('session_date', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes'),
  intensityRating: integer('intensity_rating'),
  absTrained: boolean('abs_trained').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessionExercises = pgTable('session_exercises', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .notNull()
    .references(() => workoutSessions.id, { onDelete: 'cascade' }),
  exerciseName: varchar('exercise_name', { length: 100 }).notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  weight: numeric('weight', { precision: 6, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 2 }).notNull().default('kg'),
})

export const coachingAnswers = pgTable('coaching_answers', {
  id: serial('id').primaryKey(),
  userCode: varchar('user_code', { length: 50 }).notNull(),
  questionId: varchar('question_id', { length: 50 }).notNull(),
  questionText: text('question_text').notNull(),
  sessionType: varchar('session_type', { length: 10 }).notNull(),
  sessionNumber: integer('session_number').notNull(),
  sessionId: integer('session_id').references(() => workoutSessions.id, {
    onDelete: 'set null',
  }),
  answer: jsonb('answer').notNull(),
  answeredAt: timestamp('answered_at', { withTimezone: true }).notNull().defaultNow(),
})
