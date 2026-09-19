"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function logSet(sessionId: string, exerciseId: string, weight: number, reps: number) {
  const [count, priorSessionsBest, thisSessionBest] = await Promise.all([
    prisma.setLog.count({ where: { sessionId, exerciseId } }),
    prisma.setLog.aggregate({
      where: { exerciseId, sessionId: { not: sessionId } },
      _max: { weight: true },
    }),
    prisma.setLog.aggregate({
      where: { exerciseId, sessionId },
      _max: { weight: true },
    }),
  ]);

  const priorMax = Math.max(priorSessionsBest._max.weight ?? 0, thisSessionBest._max.weight ?? 0);
  const isPR = weight > priorMax;

  await prisma.setLog.create({
    data: { sessionId, exerciseId, weight, reps, setNumber: count + 1 },
  });

  revalidatePath(`/session/${sessionId}`);

  return { isPR };
}

export async function deleteSet(setLogId: string, sessionId: string) {
  await prisma.setLog.delete({ where: { id: setLogId } });
  revalidatePath(`/session/${sessionId}`);
}

export async function completeSession(sessionId: string, notes: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { completedAt: new Date(), notes: notes.trim() ? notes.trim().slice(0, 1000) : null },
  });
  revalidatePath("/dashboard");
  revalidatePath("/history");
}