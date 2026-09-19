import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/current-user";
import { redirect } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";

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

export default async function HomePage() {
  const user = await getOrCreateUser();

  const [days, activeSession] = await Promise.all([
    prisma.day.findMany({
      where: { userId: user.id },
      orderBy: { order: "asc" },
    }),
    prisma.session.findFirst({
      where: { userId: user.id, completedAt: null },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Workout Tracker</h1>
        <SignOutButton>
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
