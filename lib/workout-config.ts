import type { MainType, SessionType } from './types'

export const MAIN_TYPES: MainType[] = ['push', 'pull', 'legs']
export const ALL_TYPES: SessionType[] = ['push', 'pull', 'legs', 'abs']

export const MAIN_TARGET = 20
export const ABS_TARGET = 60

export const TYPE_META: Record<
  SessionType,
  { label: string; target: number; focus: string; color: string; light: string }
> = {
  push: {
    label: 'Push',
    target: MAIN_TARGET,
    focus: 'Chest · Shoulders · Triceps',
    color: 'var(--push)',
    light: 'color-mix(in oklab, var(--push) 14%, transparent)',
  },
  pull: {
    label: 'Pull',
    target: MAIN_TARGET,
    focus: 'Back · Biceps',
    color: 'var(--pull)',
    light: 'color-mix(in oklab, var(--pull) 14%, transparent)',
  },
  legs: {
    label: 'Legs',
    target: MAIN_TARGET,
    focus: 'Quads · Hamstrings · Glutes · Calves',
    color: 'var(--legs)',
    light: 'color-mix(in oklab, var(--legs) 16%, transparent)',
  },
  abs: {
    label: 'Abs',
    target: ABS_TARGET,
    focus: 'Trained every gym day',
    color: 'var(--abs)',
    light: 'color-mix(in oklab, var(--abs) 14%, transparent)',
  },
}

export interface MusclePart {
  name: string
  exercises: string[]
}

export interface MuscleGroup {
  id: string
  name: string
  parts: MusclePart[]
}

export const ABS_GROUP_BY_TYPE: Record<MainType, MuscleGroup> = {
  push: {
    id: 'abs',
    name: 'Abs',
    parts: [
      { name: 'Cable Crunch', exercises: ['Cable Crunch'] },
      { name: 'Plank', exercises: ['Plank'] },
      { name: 'Hanging variations', exercises: ['Hanging Knee Raises'] },
    ],
  },
  pull: {
    id: 'abs',
    name: 'Abs',
    parts: [{ name: 'Hanging Leg Raises', exercises: ['Hanging Leg Raises'] }],
  },
  legs: {
    id: 'abs',
    name: 'Abs',
    parts: [
      { name: 'Ab Wheel', exercises: ['Ab Wheel'] },
      { name: 'Decline Situps', exercises: ['Decline Situps'] },
    ],
  },
}

export const MUSCLE_TREE: Record<MainType, MuscleGroup[]> = {
  push: [
    {
      id: 'chest',
      name: 'Chest',
      parts: [
        { name: 'Upper Chest', exercises: ['Incline Press'] },
        { name: 'Mid Chest', exercises: ['Bench Press'] },
        { name: 'Lower Chest', exercises: ['Decline Press', 'Dips'] },
      ],
    },
    {
      id: 'shoulders',
      name: 'Shoulders',
      parts: [
        { name: 'Front Deltoid', exercises: ['Overhead Press'] },
        { name: 'Side Deltoid', exercises: ['Lateral Raises'] },
        { name: 'Rear Deltoid', exercises: ['Face Pulls'] },
      ],
    },
    {
      id: 'triceps',
      name: 'Triceps',
      parts: [
        { name: 'Long Head', exercises: ['Overhead Extensions'] },
        { name: 'Lateral Head', exercises: ['Tricep Pushdowns'] },
        { name: 'Medial Head', exercises: ['Close-Grip Press'] },
      ],
    },
  ],
  pull: [
    {
      id: 'back',
      name: 'Back',
      parts: [
        { name: 'Lats (Width)', exercises: ['Pull-ups', 'Lat Pulldown'] },
        { name: 'Mid-Back (Thickness)', exercises: ['Barbell Row', 'Cable Row'] },
        { name: 'Lower Back', exercises: ['Deadlift'] },
        { name: 'Traps', exercises: ['Shrugs'] },
      ],
    },
    {
      id: 'biceps',
      name: 'Biceps',
      parts: [
        { name: 'Long Head', exercises: ['Incline Curls'] },
        { name: 'Short Head', exercises: ['Close-Grip Curls', 'Barbell Curl'] },
        { name: 'Brachialis', exercises: ['Hammer Curl'] },
      ],
    },
  ],
  legs: [
    {
      id: 'quads',
      name: 'Quadriceps',
      parts: [{ name: 'Quads', exercises: ['Squat', 'Leg Press', 'Leg Extensions'] }],
    },
    {
      id: 'hamstrings',
      name: 'Hamstrings',
      parts: [{ name: 'Hamstrings', exercises: ['RDL', 'Leg Curl', 'Deadlift'] }],
    },
    {
      id: 'glutes',
      name: 'Glutes',
      parts: [{ name: 'Glutes', exercises: ['Hip Thrust', 'Squat', 'Lunges'] }],
    },
    {
      id: 'calves',
      name: 'Calves',
      parts: [{ name: 'Calves', exercises: ['Standing Calf Raises', 'Seated Calf Raises'] }],
    },
  ],
}

export const EXERCISE_TEMPLATES: Record<SessionType, string[]> = {
  push: [
    'Bench Press',
    'Incline Press',
    'Decline Press',
    'Dips',
    'Overhead Press',
    'Lateral Raises',
    'Face Pulls',
    'Overhead Extensions',
    'Tricep Pushdowns',
    'Close-Grip Press',
    'Cable Crunch',
    'Plank',
    'Hanging Knee Raises',
  ],
  pull: [
    'Barbell Row',
    'Cable Row',
    'Pull-ups',
    'Lat Pulldown',
    'Deadlift',
    'Shrugs',
    'Face Pulls',
    'Barbell Curl',
    'Incline Curls',
    'Close-Grip Curls',
    'Hammer Curl',
    'Hanging Leg Raises',
  ],
  legs: [
    'Squat',
    'RDL',
    'Leg Press',
    'Leg Extensions',
    'Leg Curl',
    'Hip Thrust',
    'Lunges',
    'Standing Calf Raises',
    'Seated Calf Raises',
    'Ab Wheel',
    'Decline Situps',
  ],
  abs: [
    'Cable Crunch',
    'Plank',
    'Hanging Knee Raises',
    'Hanging Leg Raises',
    'Ab Wheel',
    'Decline Situps',
  ],
}

export interface Milestone {
  n: number
  title: string
  message: string
}

export const MILESTONES: Milestone[] = [
  {
    n: 5,
    title: 'Foundation Built',
    message: 'Form improving, confidence building. Muscle growth comes later!',
  },
  {
    n: 10,
    title: 'Strength Emerging',
    message: 'Expect a 10-15% strength increase. Visual changes are minimal but coming.',
  },
  {
    n: 15,
    title: 'Growth Phase',
    message: 'Muscle pump is noticeable. 0.5-1cm of growth is possible.',
  },
  {
    n: 20,
    title: 'First Goal Achieved',
    message:
      'Realistic to see 1-2cm of growth plus a 20-35% strength gain. This is just the beginning!',
  },
  {
    n: 30,
    title: 'Transformation Visible',
    message: 'Consistency is compounding. Changes are now visible to you and others.',
  },
]

export const LB_TO_KG = 0.453592

export function toKg(weight: number, unit: 'kg' | 'lb'): number {
  return unit === 'lb' ? weight * LB_TO_KG : weight
}

export function normalizeExercise(name: string): string {
  return name.trim().toLowerCase()
}
