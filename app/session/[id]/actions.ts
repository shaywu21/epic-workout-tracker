"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function logSet(sessionId: string, exerciseId: string, weight: number, reps: number) {
  const count = await prisma.setLog.count({ where: { sessionId, exerciseId } });
const [priorSessionsBest, thisSessionBest] = await Promise.all([
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
}

export async function deleteSet(setLogId: string, sessionId: string) {
  await prisma.setLog.delete({ where: { id: setLogId } });
  revalidatePath(`/session/${sessionId}`);
}

export async function completeSession(sessionId: string) {
  await prisma.session.update({
    where: { id: sessionId },
    data: { completedAt: new Date() },
  });
  revalidatePath("/");
}
