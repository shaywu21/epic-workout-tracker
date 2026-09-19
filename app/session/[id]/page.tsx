import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SessionClient from "./session-client";

export default async function SessionPage({ params }: { params: { id: string } }) {
  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      day: { include: { exercises: { orderBy: { order: "asc" } } } },
      setLogs: { orderBy: { loggedAt: "asc" } },
    },
  });

  if (!session) notFound();

  // For each exercise, pull every prior set (from earlier sessions) to derive
  // both the "last time" reference and the all-time max weight (for PR badges),
  // in one query per exercise instead of two.
  const priorSetsByExercise = await Promise.all(
    session.day.exercises.map(async (ex) => {
      const priorSets = await prisma.setLog.findMany({
        where: { exerciseId: ex.id, sessionId: { not: session.id } },
        orderBy: { loggedAt: "desc" },
      });
      const last = priorSets[0] ?? null;
      const maxWeight = priorSets.reduce((max, s) => Math.max(max, s.weight), 0);
      return { exerciseId: ex.id, last, maxWeight };
    })
  );

  const lastByExercise = Object.fromEntries(
    priorSetsByExercise.map((p) => [p.exerciseId, p.last])
  );
  const priorMaxByExercise = Object.fromEntries(
    priorSetsByExercise.map((p) => [p.exerciseId, p.maxWeight])
  );

  return (
    <SessionClient
      sessionId={session.id}
      dayName={session.day.name}
      exercises={session.day.exercises}
      existingSetLogs={session.setLogs}
      lastByExercise={lastByExercise}
      priorMaxByExercise={priorMaxByExercise}
      isCompleted={!!session.completedAt}
    />
  );
}