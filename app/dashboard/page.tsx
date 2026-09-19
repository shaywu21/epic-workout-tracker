import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import {
  getLastCompletedSession,
  getLatestWeight,
  getVolumeLast7Days,
  getWorkoutDotGrid,
} from "@/lib/dashboard";

async function startSession(formData: FormData) {
  "use server";
  const dayId = formData.get("dayId") as string;
  const user = await getOrCreateUser();

  // A user may only have one incomplete Session at a time (SOW 7.2 / 5).
  // If one already exists, resume it instead of creating a second one.
  const existing = await prisma.session.findFirst({
    where: { userId: user.id, completedAt: null },
    orderBy: { startedAt: "desc" },
  });

  const session =
    existing ??
    (await prisma.session.create({
      data: { userId: user.id, dayId },
    }));

  redirect(`/session/${session.id}`);
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function DashboardPage() {
  const user = await getOrCreateUser();

  const [days, activeSession, lastWorkout, latestWeight, volume7d, dotColumns] = await Promise.all([
    prisma.day.findMany({ where: { userId: user.id }, orderBy: { order: "asc" } }),
    prisma.session.findFirst({ where: { userId: user.id, completedAt: null }, orderBy: { startedAt: "desc" } }),
    getLastCompletedSession(user.id),
    getLatestWeight(user.id),
    getVolumeLast7Days(user.id),
    getWorkoutDotGrid(user.id, 12),
  ]);

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Workout Tracker</h1>
        <SignOutButton redirectUrl="/">
          <button className="btn-secondary" style={{ width: "auto", minHeight: 44, marginTop: 0, padding: "8px 14px" }}>
            Sign Out
          </button>
        </SignOutButton>
      </div>

      {activeSession && (
        <Link href={`/session/${activeSession.id}`} className="btn-primary">
          Resume in-progress session
        </Link>
      )}

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-card-label">Last workout</div>
          {lastWorkout ? (
            <>
              <div className="stat-card-value" style={{ fontSize: 22 }}>
                {lastWorkout.dayName}
              </div>
              <div className="stat-card-sub">{relativeTime(lastWorkout.completedAt)}</div>
            </>
          ) : (
            <div className="stat-card-sub">No workouts logged yet</div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-card-label">Body weight</div>
          {latestWeight ? (
            <>
              <div className="stat-card-value">
                {latestWeight.weight}
                <span className="stat-card-unit">kg</span>
              </div>
              <div className="stat-card-sub">{relativeTime(latestWeight.loggedAt)}</div>
            </>
          ) : (
            <div className="stat-card-sub">
              <Link href="/body" style={{ color: "var(--accent)" }}>
                Log your weight
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="stat-card stat-card-wide">
        <div className="dot-grid-header">
          {dotColumns.map((col, i) => {
            const firstDay = col[0].date;
            const isFirstOfMonth = firstDay.getDate() <= 7;
            const prevCol = dotColumns[i - 1];
            const monthChanged = !prevCol || prevCol[0].date.getMonth() !== firstDay.getMonth();
            return (
              <span key={i} className="dot-month-label">
                {isFirstOfMonth && monthChanged ? MONTH_LABELS[firstDay.getMonth()] : ""}
              </span>
            );
          })}
        </div>
        <div className="dot-grid">
          {dotColumns.map((col, i) => (
            <div key={i} className="dot-column">
              {col.map((day, j) => (
                <div
                  key={j}
                  className={`dot ${day.worked ? "dot-filled" : ""}`}
                  title={day.date.toDateString()}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="stat-card-sub" style={{ marginTop: 8 }}>
          Workouts over the last {dotColumns.length} weeks
        </div>
      </div>

      <div className="stat-card stat-card-wide" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="stat-card-label">Volume lifted</div>
          <div className="stat-card-sub">Last 7 days</div>
        </div>
        <div className="stat-card-value">
          {Math.round(volume7d).toLocaleString()}
          <span className="stat-card-unit">kg</span>
        </div>
      </div>

      <h2 style={{ marginTop: 24 }}>Pick a day</h2>
      {days.length === 0 && (
        <p>No days set up yet — add one to get started.</p>
      )}

      {days.map((day) => (
        <form action={startSession} key={day.id}>
          <input type="hidden" name="dayId" value={day.id} />
          <button className="day-card" type="submit">
            {day.name}
          </button>
        </form>
      ))}

      <Link href="/manage" className="btn-secondary">
        Manage days &amp; exercises
      </Link>
      <Link href="/history" className="btn-secondary">
        Workout history
      </Link>
      <Link href="/prs" className="btn-secondary">
        Personal records
      </Link>
      <Link href="/body" className="btn-secondary">
        Body stats
      </Link>
    </main>
  );
}