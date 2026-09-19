# EPIC Workout Tracker

A mobile-first workout logging app. Pick a day, go through your exercises one at a
time, log sets with big buttons, done. Built with Next.js, Prisma, and Postgres
(Neon), auth via Clerk, deployed on Vercel.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Neon](https://img.shields.io/badge/Postgres-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white)](https://clerk.com/)

## Why this exists

I thought about tracking my workout progress in Google Sheets, then I realized
putting in values from the mobile app isn't intuitive at all, so I decided to make my
own solution. I wanted to be able to track my progress and everything else simply
from a mobile browser. Nothing is stored locally, and anyone can use it by signing in.

## What it does

You set up "days" (Push, Pull, Legs, whatever split you run), each with a list of
exercises and target sets/reps. Starting a session walks you through those exercises
one screen at a time. Weight and reps default to whatever you logged last time for
that exercise, so most sets are just tap Log Set and move on. If you beat your
previous best on something, it's flagged as a PR right there, no digging through old
workouts to check.

Everything you've logged is saved and browsable later: full session history with
notes, a PR list per exercise, and basic bodyweight/height tracking. History can be
cleared per day or entirely if you need to wipe test data (I ended up needing this
myself after setting the thing up).

A few things it deliberately doesn't do yet: no charts, no supersets, no offline mode.
Wasn't worth the complexity for a v1 I use myself. Might revisit some of it later.

## Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 14 (App Router, server actions instead of a separate API layer) |
| Language | TypeScript |
| Database | Postgres, hosted on Neon |
| ORM | Prisma |
| Auth | Clerk |
| Styling | Plain CSS, no framework, small enough UI that Tailwind felt unnecessary |
| Hosting | Vercel |

## Routes

- `/` home, pick a day or resume whatever's in progress
- `/manage` create, delete, and reorder your training days
- `/manage/[id]` add, remove, and reorder exercises within a day
- `/session/[id]` the actual workout flow
- `/history` past sessions, with notes and PR badges, plus a way to clear history
- `/prs` current best lift per exercise
- `/body` log bodyweight over time, set your height once

## Data model

Roughly:

```
User
 |- Day (ordered)
 |   |- Exercise (ordered, has target sets/reps)
 |       |- SetLog (weight, reps, timestamp)
 |- Session (belongs to a Day, has a completedAt and optional notes)
 |   |- SetLog
 |- WeightLog (bodyweight over time)
```

One thing worth calling out: PR status isn't stored anywhere. It's computed by
walking a user's set logs in order and checking whether each one beat everything
logged before it for that exercise. Slightly more work at read time, but it means
there's no PR-tracking state that can drift out of sync with the actual logs. The
logs are the only source of truth.

Also worth noting: a user can only have one session in progress at a time. Starting a
new one while something's unfinished just resumes the existing session instead of
creating a duplicate. Ran into this as an actual bug early on and fixed it at the data
layer rather than patching around it in the UI.

## Running it locally

You'll need a Postgres database (Neon works fine, any Postgres does) and a Clerk
application.

Clone it, install dependencies:

```
npm install
```

Copy `.env.example` to `.env` and fill in your own values:

```
DATABASE_URL="postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxxx.region.aws.neon.tech/dbname?sslmode=require"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
```

(`DIRECT_URL` is the unpooled connection string. Prisma needs it for migrations,
separate from the pooled one your app uses at runtime.)

Push the schema:

```
npx prisma db push
```

Then just:

```
npm run dev
```

Sign up, add a day, add some exercises, start a session, log a few sets, finish it,
then start a second session for the same day and check that it remembers your
numbers.

## Deploying

Push to GitHub, import into Vercel, add the same environment variables in the
project settings, deploy. `prisma generate` is wired into the `postinstall` script so
it runs automatically during the build, you don't need to do anything extra for that
part. The database schema itself only gets updated when you run `prisma db push`
locally against it, so if you change the schema, that step still has to happen by
hand before or after deploying.

## Project layout

```
app/
  page.tsx                  home
  manage/page.tsx           manage days
  manage/[id]/page.tsx      manage exercises for a day
  session/[id]/             the workout flow (server page, client component, actions)
  history/                  past workouts + clear-history controls
  prs/page.tsx              personal records
  body/page.tsx             bodyweight/height
  globals.css               all the styling, no CSS framework

lib/
  prisma.ts                 Prisma client, reused across hot reloads in dev
  current-user.ts           maps a Clerk session to the app's own User row
  workout-history.ts        history + PR calculations, history-clearing actions
  body-log.ts               weight/height actions

prisma/schema.prisma        the whole schema, one file
middleware.ts               Clerk route protection
```

## Things I'd still like to add

- Charts for weight and PR progress over time. The data's already there, just
  haven't built the view
- A rest timer between sets
- Superset/circuit support, if I ever start training that way
- Some kind of offline handling, since gym wifi is not reliable
- Nicer UI

## License

Not licensed for reuse right now. This is a personal project I'm still actively
changing.
