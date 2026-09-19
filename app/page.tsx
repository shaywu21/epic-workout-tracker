import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// A fixed, deterministic pattern (not random) so server and client render
// identically. Loosely traces an upward line, a quiet nod to progress.
const FILLED_DOTS = new Set([30, 24, 23, 17, 16, 10, 9, 3, 2]);

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <main className="landing">
      <div className="landing-decoration" aria-hidden="true">
        <div className="landing-dot-grid">
          {Array.from({ length: 35 }).map((_, i) => (
            <span
              key={i}
              className={`landing-dot${FILLED_DOTS.has(i) ? " filled" : ""}`}
              style={FILLED_DOTS.has(i) ? { animationDelay: `${i * 25}ms` } : undefined}
            />
          ))}
        </div>
      </div>

      <div className="landing-content">
        <h1 className="landing-title">Workout Tracker</h1>
        <p className="landing-subtitle">
          Log your sets, keep your last weights on hand, and watch your numbers move.
          Runs straight from your phone's browser, nothing to install.
        </p>

        <div className="landing-actions">
          <Link href="/sign-up" className="btn-primary">
            Get started
          </Link>
          <Link href="/sign-in" className="btn-secondary">
            Sign in
          </Link>
        </div>

        <p className="landing-note">Your data stays in your account. Nothing is stored on this device.</p>
      </div>
    </main>
  );
}
