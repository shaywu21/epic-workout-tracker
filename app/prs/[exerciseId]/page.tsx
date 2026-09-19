import Link from "next/link";
import { getOrCreateUser } from "@/lib/current-user";
import { getExerciseProgress } from "@/lib/workout-history";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProgressChart from "./progress-chart";

export default async function ExerciseProgressPage({ params }: { params: { exerciseId: string } }) {
  const user = await getOrCreateUser();

  const exercise = await prisma.exercise.findUnique({ where: { id: params.exerciseId } });
  if (!exercise) notFound();

  const progress = await getExerciseProgress(user.id, params.exerciseId);

  return (
    <main>
      <h1>{exercise.name}</h1>
      <p style={{ opacity: 0.7 }}>Weight progression over time</p>

      <div className="stat-card stat-card-wide">
        <ProgressChart data={progress} />
      </div>

      <Link
        href="/prs"
        className="btn-secondary"
        style={{ display: "block", textAlign: "center", marginTop: 16, textDecoration: "none" }}
      >
        Back to PRs
      </Link>
    </main>
  );
}