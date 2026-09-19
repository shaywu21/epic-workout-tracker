# Workout Tracker

Mobile-first workout logging app. Pick a Day, step through your exercises one
at a time, log sets with big +/- buttons, done.

## Status

- `.env` is already populated with your Neon + Clerk credentials.
- Code has been reconciled against SOW Section 6 (colors/type/touch-target
  tokens) and against the Section 7/9 screen spec (single-active-session
  rule, field validation/caps, sign-out button, disabled stepper states,
  inline error text, empty-state copy). See "What changed" below.
- **Nothing has been run yet.** This container has no network access, so
  `npm install`, `prisma db push`, `npm run dev`, and the Vercel deploy all
  still need to happen on your machine. Steps below are in order.

## Setup — run these on your own machine

1. **Verify `DIRECT_URL`**
   `.env` includes a `DIRECT_URL` derived by stripping `-pooler` from the
   host in the connection string you gave me. Open your Neon dashboard →
   Connection Details and confirm the non-pooled string matches; if not,
   paste the correct one in.

2. **Install dependencies**
   ```
   npm install
   ```

3. **Push the schema to your database**
   ```
   npx prisma db push
   ```
   Verify tables via `npx prisma studio` or the Neon dashboard.

4. **Run locally**
   ```
   npm run dev
   ```
   Walk through: sign up → create a Day → add Exercises → start a session →
   log sets → finish → start a second session and confirm "last time" shows
   the values you just logged.

5. **Deploy**
   - Push this repo to GitHub
   - Import into Vercel
   - Add the same env vars from `.env` into the Vercel project settings
   - Deploy; confirm `prisma generate` runs during build (already wired via
     the `postinstall`/`build` scripts) and the live app works end to end

## What changed from the original scaffold

- Fixed a bug where starting a Day while another session was already
  in-progress created a second session instead of resuming the existing one
  (SOW 5 / 7.2 / acceptance criteria).
- Rewrote `app/globals.css` to use the exact Section 6 tokens (colors, type
  scale, 56px/64px touch targets, disabled-state colors) instead of the
  placeholder styling from the first pass.
- Added server-side validation caps that were missing: Day/Exercise name
  50-char limit, target sets clamped 1–20, target reps 20-char limit.
- Added a Sign Out button on Home (SOW 7.1).
- Added disabled state on stepper `−` buttons at 0 (SOW 6.1/7.5).
- Added inline "Couldn't save — check your connection and try again." error
  text on failed Log Set / Next / Finish actions (SOW 7.5), without losing
  the current stepper values.
- Matched the exact empty-state and zero-exercise copy from SOW Section 11
  and 7.5.
- Named the fallback defaults `DEFAULT_FALLBACK_WEIGHT`/`DEFAULT_FALLBACK_REPS`
  explicitly per SOW 7.5.

## Still worth a human pass before you call this done

- I haven't run this code — no npm/TypeScript compiler was available in this
  environment, so give `npm run dev` and `tsc` a look for anything I missed.
- Section 7.7's "Loading…" state for server-component navigation isn't wired
  up (would need a `loading.tsx` per route) — small addition if you want it.
- On-device testing (SOW Step 6.3, actual phone browser) still needs to
  happen; I can't verify tap-target feel from here.

## What's here (v1 scope)

- Manage Days (Push/Pull/Legs/Rest) and their Exercises
- Start a session for a Day, log sets one exercise at a time
- Shows your last logged weight/reps per exercise as reference
- Skip exercises, delete a logged set, resume an in-progress session
- No editing of past sessions, no charts/analytics yet — by design, to ship fast

## Known rough edges to revisit later

- No exercise reordering UI yet (edit `order` directly in DB if needed)
- No history page yet — data's all there in `SetLog`, just needs a view
- Styling is plain CSS, not Tailwind — fine for v1, swap in `frontend-design`
  skill guidance if you want to make it look sharper later
