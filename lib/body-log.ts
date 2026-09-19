"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function logWeight(userId: string, weight: number) {
  await prisma.weightLog.create({ data: { userId, weight } });
  revalidatePath("/body");
}

export async function updateHeight(userId: string, heightCm: number) {
  await prisma.user.update({ where: { id: userId }, data: { heightCm } });
  revalidatePath("/body");
}