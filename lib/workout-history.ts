"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type HistorySetLog = {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  isPR: boolean;
};

export type HistoryExercise = {
  id: string;
  name: string;
  sets: HistorySetLog[];
};

export type HistorySession = {
  id: string;
  dayId: string;
  dayName: string;
  startedAt: Date;
  completedAt: Date;
  notes: string | null;
  exercises: HistoryExercise[];
};

// PR = heaviest weight ever logged for that exercise, up to and including this set,
// walked chronologically across all completed sessions. No schema changes needed —
// this is computed on read.
export async function getWorkoutHistory(userId: string): Promise<HistorySession[]> {
  const sessions = await prisma.session.findMany({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "asc" },
    include: {
      day: true,
      setLogs: { include: { exercise: true }, orderBy: { loggedAt: "asc" } },
    },
  });

  const maxWeightByExercise = new Map<string, number>();
  const result: HistorySession[] = [];

  for (const session of sessions) {
    const exerciseMap = new Map<string, HistoryExercise>();

    for (const log of session.setLogs) {
      const priorMax = maxWeightByExercise.get(log.exerciseId) ?? 0;
      const isPR = log.weight > priorMax;
      if (isPR) maxWeightByExercise.set(log.exerciseId, log.weight);

      if (!exerciseMap.has(log.exerciseId)) {
        exerciseMap.set(log.exerciseId, { id: log.exerciseId, name: log.exercise.name, sets: [] });
      }
      exerciseMap.get(log.exerciseId)!.sets.push({
        id: log.id,
        setNumber: log.setNumber,
        weight: log.weight,
        reps: log.reps,
        isPR,
      });
    }

    result.push({
      id: session.id,
      dayId: session.dayId,
      dayName: session.day.name,
      startedAt: session.startedAt,
      completedAt: session.completedAt!,
      notes: session.notes,
      exercises: Array.from(exerciseMap.values()),
    });
  }

  return result.reverse(); // most recent first
}

export type ExercisePR = {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  reps: number;
  achievedAt: Date;
};

// Current all-time PR per exercise, for the dedicated PR view.
export async function getPRsByExercise(userId: string): Promise<ExercisePR[]> {
  const logs = await prisma.setLog.findMany({
    where: { session: { userId } },
    include: { exercise: true },
    orderBy: { loggedAt: "asc" },
  });

  const bestByExercise = new Map<string, ExercisePR>();

  for (const log of logs) {
    const current = bestByExercise.get(log.exerciseId);
    if (!current || log.weight > current.maxWeight) {
      bestByExercise.set(log.exerciseId, {
        exerciseId: log.exerciseId,
        exerciseName: log.exercise.name,
        maxWeight: log.weight,
        reps: log.reps,
        achievedAt: log.loggedAt,
      });
    }
  }

  return Array.from(bestByExercise.values()).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

// Deletes all completed+in-progress sessions (and their setLogs, via cascade)
// for a specific Day. Does NOT delete the Day or its Exercises.
export async function clearHistoryForDay(dayId: string) {
  await prisma.session.deleteMany({ where: { dayId } });
  revalidatePath("/history");
  revalidatePath("/");
}

// Deletes all sessions (and their setLogs) for the given user, across every Day.
export async function clearAllHistory(userId: string) {
  await prisma.session.deleteMany({ where: { userId } });
  revalidatePath("/history");
  revalidatePath("/");
}

// Deletes all sessions (and their setLogs) completed on a specific calendar date,
// across all days. `date` should be a Date representing any moment on the target day;
// this computes the day's start/end in the server's local timezone.
export async function clearHistoryForDate(userId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  await prisma.session.deleteMany({
    where: {
      userId,
      completedAt: { gte: startOfDay, lte: endOfDay },
    },
  });

  revalidatePath("/history");
  revalidatePath("/");
}