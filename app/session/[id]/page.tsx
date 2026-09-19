import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SessionClient from "./session-client";

export default async function SessionPage({ params }: { params: { id: string } }) {
  const session = await prisma.session.findUnique({
    where: { id: params.id },
    include: {
      day: { include: { exercises: { orderBy: { order: "asc" } } } },
      setLogs: true,
    },
  });

  if (!session) notFound();

  // For each exercise, find the most recent prior logged set (from any
  // earlier session) to show as "last time" reference.
  const lastSets = await Promise.all(
    session.day.exercises.map(async (ex) => {
      const last = await prisma.setLog.findFirst({
        where: { exerciseId: ex.id, sessionId: { not: session.id } },
        orderBy: { loggedAt: "desc" },
      });
      return { exerciseId: ex.id, last };
    })
  );

  const lastByExercise = Object.fromEntries(lastSets.map((l) => [l.exerciseId, l.last]));

  return (
    <SessionClient
      sessionId={session.id}
      dayName={session.day.name}
      exercises={session.day.exercises}
      existingSetLogs={session.setLogs}
      lastByExercise={lastByExercise}
      isCompleted={!!session.completedAt}
    />
  );
}
