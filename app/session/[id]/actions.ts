"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function logSet(sessionId: string, exerciseId: string, weight: number, reps: number) {
  const count = await prisma.setLog.count({ where: { sessionId, exerciseId } });

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
