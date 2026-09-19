import Link from "next/link";
import { getOrCreateUser } from "@/lib/current-user";
import { getWorkoutHistory } from "@/lib/workout-history";

export default async function HistoryPage() {
  const user = await getOrCreateUser();
  const sessions = await getWorkoutHistory(user.id);

  return (
    <main>
      <h1>History</h1>

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