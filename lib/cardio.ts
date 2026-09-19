"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { CardioType } from "@prisma/client";

export async function logCardio(
  userId: string,
  type: CardioType,
  minutes: number,
  incline?: number,
  level?: number
) {
  await prisma.cardioLog.create({
    data: {
      userId,
      type,
      minutes,
      incline: type === "TREADMILL" ? incline ?? null : null,
      level: type === "ELLIPTICAL" ? level ?? null : null,
    },
  });
  revalidatePath("/cardio");
  revalidatePath("/dashboard");
}

export async function deleteCardioLog(id: string) {
  await prisma.cardioLog.delete({ where: { id } });
  revalidatePath("/cardio");
  revalidatePath("/dashboard");
}

export async function getCardioHistory(userId: string) {
  return prisma.cardioLog.findMany({
    where: { userId },
    orderBy: { loggedAt: "desc" },
    take: 30,
  });
}