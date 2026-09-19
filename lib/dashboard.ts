import { prisma } from "@/lib/prisma";

export type LastWorkout = { dayName: string; completedAt: Date } | null;
export type LatestWeight = { weight: number; loggedAt: Date } | null;

export async function getLastCompletedSession(userId: string): Promise<LastWorkout> {
  const session = await prisma.session.findFirst({
    where: { userId, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    include: { day: true },
  });
  if (!session) return null;
  return { dayName: session.day.name, completedAt: session.completedAt! };
}

export async function getLatestWeight(userId: string): Promise<LatestWeight> {
  const log = await prisma.weightLog.findFirst({
    where: { userId },
    orderBy: { loggedAt: "desc" },
  });
  if (!log) return null;
  return { weight: log.weight, loggedAt: log.loggedAt };
}

export async function getVolumeLast7Days(userId: string): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const logs = await prisma.setLog.findMany({
    where: { session: { userId }, loggedAt: { gte: sevenDaysAgo } },
    select: { weight: true, reps: true },
  });

  return logs.reduce((total, l) => total + l.weight * l.reps, 0);
}

// Completed sessions since the start of this calendar week (Monday, server's local time).
export async function getWorkoutsThisWeek(userId: string): Promise<number> {
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay(); // 0 = Sunday ... 6 = Saturday
  const diffToMonday = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  return prisma.session.count({
    where: { userId, completedAt: { gte: startOfWeek, not: null } },
  });
}

export type DotColumn = { date: Date; worked: boolean }[];

// Builds a GitHub-style grid of the last `weeks` weeks, one column per week,
// 7 dots per column, filled if a session was completed that day.
export async function getWorkoutDotGrid(userId: string, weeks = 12): Promise<DotColumn[]> {
  const totalDays = weeks * 7;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (totalDays - 1));

  const sessions = await prisma.session.findMany({
    where: { userId, completedAt: { gte: since, not: null } },
    select: { completedAt: true },
  });

  const workedDates = new Set(sessions.map((s) => s.completedAt!.toDateString()));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: { date: Date; worked: boolean }[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({ date: d, worked: workedDates.has(d.toDateString()) });
  }

  const columns: DotColumn[] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }
  return columns;
}
