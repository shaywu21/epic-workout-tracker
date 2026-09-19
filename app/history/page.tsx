import Link from "next/link";
import { getOrCreateUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import {
  getWorkoutHistory,
  clearHistoryForDay,
  clearAllHistory,
} from "@/lib/workout-history";
import { ClearDayButton, ClearAllButton } from "./clear-history-buttons";

export default async function HistoryPage() {
  const user = await getOrCreateUser();
  const [sessions, days] = await Promise.all([
    getWorkoutHistory(user.id),
    prisma.day.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } }),
  ]);

  async function clearDayAction(formData: FormData) {
    "use server";
    const dayId = formData.get("dayId") as string;
    await clearHistoryForDay(dayId);
  }

  async function clearAllAction() {
    "use server";
    await clearAllHistory(user.id);
  }

  return (
    <main>
      <h1>History</h1>

      <details className="clear-history-panel">
        <summary>Clear history</summary>

        <p style={{ marginTop: 8 }}>
          This permanently deletes logged workouts. This cannot be undone.
        </p>

        {days.map((day) => (
          <ClearDayButton key={day.id} dayId={day.id} dayName={day.name} action={clearDayAction} />
        ))}

        <ClearAllButton action={clearAllAction} />
      </details>

      {sessions.length === 0 && <p>No completed workouts yet.</p>}

      {sessions.map((session) => (
        <div key={session.id} className="history-card">
          <div className="history-header">
            <span className="history-day-name">{session.dayName}</span>
            <span className="history-date">
              {session.completedAt.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {session.exercises.map((ex) => (
            <div key={ex.id} className="history-exercise">
              <div className="history-exercise-name">{ex.name}</div>
              {ex.sets.map((s) => (
                <div key={s.id} className="history-set-row">
                  <span>
                    Set {s.setNumber}: {s.weight}kg × {s.reps}
                  </span>
                  {s.isPR && <span className="pr-badge">🏆 PR</span>}
                </div>
              ))}
            </div>
          ))}

          {session.notes && (
            <div className="history-notes">
              <span className="history-notes-label">Notes:</span> {session.notes}
            </div>
          )}
        </div>
      ))}

      <Link
        href="/"
        className="btn-secondary"
        style={{ display: "block", textAlign: "center", marginTop: 16, textDecoration: "none" }}
      >
        Back home
      </Link>
    </main>
  );
}