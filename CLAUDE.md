# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Next.js dev server
npm run build      # Production build (also runs for Capacitor iOS export)
npm run lint       # ESLint
```

There are no tests in this project. There is no `test` script.

## Architecture Overview

Pursuit is a goal-tracking app built on the **GPS Method** (Goal → Plan → System). It runs as a Next.js web app and wraps into a native iOS app via Capacitor.

### Routing

The App Router has two route groups:
- `(auth)/` — unauthenticated pages: `welcome`, `login`, `signup`, `forgot-password`, `reset-password`
- `(dashboard)/` — protected pages: `/` (daily view), `/goals`, `/goals/[id]`, `/goals/new`, `/goals/ai`, `/settings`

Auth protection is enforced in `src/proxy.ts` (Next.js 16 uses `proxy.ts` + `export function proxy()` — `middleware.ts` is the deprecated convention) via `src/lib/supabase/middleware.ts` — unauthenticated users are redirected to `/welcome`.

### Data Layer

All database access goes through Supabase. The pattern is:
1. **`src/lib/supabase/server.ts`** — creates a server-side Supabase client (for Server Components and API routes)
2. **`src/lib/supabase/client.ts`** — creates a browser-side client (for Client Components)
3. **`src/lib/api/`** — thin wrappers around Supabase queries, each accepting a `SupabaseClient` instance

Data is fetched in Server Components and passed down as props. Client Components call Supabase directly (browser client) for mutations.

### Database Schema

| Table | Key columns |
|---|---|
| `goals` | `id`, `user_id`, `title`, `description`, `color`, `status` (`active`/`completed`/`archived`) |
| `milestones` | `id`, `goal_id`, `title`, `is_completed`, `due_date`, `sort_order` |
| `tasks` | `id`, `goal_id`, `title`, `type` (`recurring`/`one_time`), `frequency` (`daily`/`weekly`/`specific_days`), `scheduled_days` (int array for day-of-week), `due_date`, `sort_order` |
| `task_logs` | `id`, `task_id`, `user_id`, `date` (YYYY-MM-DD), `completed_at` |

All types are in `src/types/index.ts`.

### Timezone Handling

User timezone is stored in a cookie and threaded through all date-sensitive logic. `task_logs.date` stores a plain date string (e.g. `2024-03-15`) relative to the user's timezone — not UTC. `src/lib/streaks.ts` and `src/lib/weekly-stats.ts` both require a `timezone` parameter.

### AI Integration

`POST /api/ai/generate-goal` accepts `{ goalDescription, timeline, experience, dailyTime, constraints }` and calls Claude (`claude-sonnet-4-6`) to return a structured JSON plan with `title`, `description`, `milestones[]`, and `tasks[]`. The `/goals/ai` page handles the full UX flow: form → review/edit → activate (which bulk-inserts milestones and tasks). Gated behind a Pursuit Pro subscription (Stripe) and rate-limited to 15 generations/user/day — see `ARCHITECTURE_DECISIONS.md` for the reasoning.

### Capacitor / iOS

`capacitor.config.ts` points to the Next.js static export. When building for iOS:
1. `npm run build` (generates `out/`)
2. `npx cap sync ios`
3. Open `ios/` in Xcode

The web app uses `safe-area-inset` CSS variables for iOS notch/home bar spacing.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # Supabase "Secret key" — required for server-side auth user deletion
```
## Project Context

Pursuit is a personal goal-tracking web app built around the **GPS method** (Goal → Plan → System), inspired by Ali Abdaal's productivity philosophy. Goals break down into milestones and daily tasks (recurring + one-time), with consistency tracking, streaks, and a clean daily view.

## Architecture & Stack

- **Framework**: Next.js (App Router, TypeScript, `src/` directory)
- **Backend**: Supabase (Postgres + Auth + SDK)
- **Styling**: Tailwind CSS + `globals.css` with CSS custom properties
- **Components**: Sleek.design React component exports
- **Icons**: `@iconify/react` with Solar icon set
- **Deployment**: Vercel (PWA-configured with manifest + icons)
- **Future mobile**: Capacitor (web app wrapped for app stores)

## Design System

- **Primary color**: `#ff0055`
- **Headings font**: Poppins
- **Body font**: Inter
- **Aesthetic reference**: Linear
- **Philosophy**: Reward showing up over perfection — partial-day completions still get visual recognition

## Key Conventions

- **Timezone handling**: Timezone-aware dates via a cookie set by a client-side `TimezoneProvider`. Always respect this when working with date logic.
- **Weekly stats**: The hit rate bar chart always shows **Sunday–Saturday** (fixed calendar week), NOT a rolling 7-day window.
- **Bar chart colors**: Use hardcoded hex values, not CSS custom properties — custom properties can blend into backgrounds and cause invisible bars.
- **Goal statuses**: Active, Completed, Archived — filtered via goal status.
- **Anytime tasks**: One-time tasks with no specific date, displayed separately from daily tasks.
- **Date selector**: Supports backfilling missed logs for past dates.

## Development Principles

- **Function first, design later**: Ship working features, then polish based on real usage.
- **Bias toward action**: Don't over-engineer. Use existing strengths (React/Next.js/TS) for speed.
- **No premature complexity**: Supabase's at-rest encryption + RLS + HTTPS via Vercel is sufficient for this stage. No custom encryption layer.
- **Freemium sequencing**: Gate *new* features for paid tiers rather than removing existing free ones.

## Current State

MVP is built and deployed. Core features working:
- Auth (signup/login/signout/password reset)
- Goal CRUD with tasks and milestones
- Goals overview with weekly hit rate + milestone progress
- Goal detail with milestone toggling, add/delete
- Daily view with task completion grouped by goal
- Streak tracking with badges + 7-day activity visualization
- Consistency labels per goal, "Full Day" motivational nudge
- Anytime tasks, date selector, goal status filtering
- Settings page, bottom navigation

## In Progress

- Design pass using Sleek.design components (Home and Goals Overview partially styled, Goal Detail is next)
- **Security audit** (`SECURITY_AUDIT.md`) — working through findings on the `security-audit` branch:
  - ~~C1~~ — Invalid (proxy.ts is correct for Next.js 16)
  - ~~C2~~ — Fixed (`/api/delete-account` route now calls `adminClient.auth.admin.deleteUser()`)
  - **Next up: H1** — Add HTTP security headers to `next.config.ts`
  - Remaining: H2, H3, 5 Medium, 4 Low findings