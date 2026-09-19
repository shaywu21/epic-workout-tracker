import { prisma } from "@/lib/prisma";

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
  dayName: string;
  startedAt: Date;
  completedAt: Date;
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
      dayName: session.day.name,
      startedAt: session.startedAt,
      completedAt: session.completedAt!,
      exercises: Array.from(exerciseMap.values()),
    });
  }

  return result.reverse(); // most recent first
}