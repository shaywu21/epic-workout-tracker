import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

async function addExercise(formData: FormData) {
  "use server";
  const dayId = formData.get("dayId") as string;
  const trimmedName = (formData.get("name") as string)?.trim();
  if (!trimmedName) return;
  const name = trimmedName.slice(0, 50);

  const rawSets = parseInt(formData.get("targetSets") as string, 10);
  const targetSets = Number.isFinite(rawSets) ? Math.min(20, Math.max(1, rawSets)) : 3;

  const rawReps = (formData.get("targetReps") as string)?.trim();
  const targetReps = (rawReps || "8-12").slice(0, 20);

  const count = await prisma.exercise.count({ where: { dayId } });
  await prisma.exercise.create({
    data: { dayId, name, order: count, targetSets, targetReps },
  });
  revalidatePath(`/manage/${dayId}`);
}

async function deleteExercise(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const dayId = formData.get("dayId") as string;
  await prisma.exercise.delete({ where: { id } });
  revalidatePath(`/manage/${dayId}`);
}

async function moveExercise(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const dayId = formData.get("dayId") as string;
  const direction = formData.get("direction") as string;

  const exercise = await prisma.exercise.findUnique({ where: { id } });
  if (!exercise) return;

  const neighbor = await prisma.exercise.findFirst({
    where: {
      dayId: exercise.dayId,
      order: direction === "up" ? { lt: exercise.order } : { gt: exercise.order },
    },
    orderBy: { order: direction === "up" ? "desc" : "asc" },
  });
  if (!neighbor) return; // already at the boundary

  await prisma.$transaction([
    prisma.exercise.update({ where: { id: exercise.id }, data: { order: neighbor.order } }),
    prisma.exercise.update({ where: { id: neighbor.id }, data: { order: exercise.order } }),
  ]);

  revalidatePath(`/manage/${dayId}`);
}

export default async function ManageDayPage({ params }: { params: { id: string } }) {
  const day = await prisma.day.findUnique({
    where: { id: params.id },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  if (!day) notFound();

  return (
    <main>
      <h1>{day.name}</h1>
      <p style={{ opacity: 0.7 }}>Exercises, in order</p>

      {day.exercises.map((ex, i) => (
        <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <form action={moveExercise}>
              <input type="hidden" name="id" value={ex.id} />
              <input type="hidden" name="dayId" value={day.id} />
              <input type="hidden" name="direction" value="up" />
              <button type="submit" className="btn-reorder" disabled={i === 0}>
                ▲
              </button>
            </form>
            <form action={moveExercise}>
              <input type="hidden" name="id" value={ex.id} />
              <input type="hidden" name="dayId" value={day.id} />
              <input type="hidden" name="direction" value="down" />
              <button type="submit" className="btn-reorder" disabled={i === day.exercises.length - 1}>
                ▼
              </button>
            </form>
          </div>
          <div className="day-card" style={{ flex: 1 }}>
            <div>{i + 1}. {ex.name}</div>
            <div style={{ fontSize: 14, opacity: 0.6, fontWeight: 400 }}>
              {ex.targetSets} sets × {ex.targetReps} reps
            </div>
          </div>
          <form action={deleteExercise}>
            <input type="hidden" name="id" value={ex.id} />
            <input type="hidden" name="dayId" value={day.id} />
            <button type="submit" className="btn-delete">
              ✕
            </button>
          </form>
        </div>
      ))}

      <form action={addExercise} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        <input type="hidden" name="dayId" value={day.id} />
        <input name="name" placeholder="Exercise name" required maxLength={50} className="text-input" />
        <input name="targetSets" type="number" placeholder="Target sets (e.g. 3)" defaultValue={3} min={1} max={20} className="text-input" />
        <input name="targetReps" placeholder="Target reps (e.g. 8-12)" defaultValue="8-12" maxLength={20} className="text-input" />
        <button className="btn-primary" type="submit">
          Add Exercise
        </button>
      </form>

      <Link href="/manage" className="btn-secondary" style={{ display: "block", textAlign: "center", marginTop: 16, textDecoration: "none" }}>
        Back to Days
      </Link>
    </main>
  );
}
