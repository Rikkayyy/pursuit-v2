# Security Audit Report — Pursuit

**Date:** 2026-03-23
**Scope:** Full read-only code review of the Next.js + Supabase goal-tracking application
**Auditor:** Automated static analysis via Claude Code

---

## Executive Summary

**Overall Risk Rating: HIGH**

The application is a Next.js 16 PWA backed by Supabase. The codebase is lean (5 production dependencies), follows modern patterns in most areas, and shows good discipline around server-side auth checks in page components. However, two critical issues require immediate attention before this application is considered production-safe:

1. ~~**The Next.js middleware is misconfigured and never runs.**~~ **INVALID** — `src/proxy.ts` with `export function proxy()` is the correct Next.js 16 convention. The proxy runs correctly.

2. **Account deletion is incomplete.** The delete flow removes database rows but does not delete the Supabase auth user, meaning a "deleted" user can sign back in.

Additionally, there are no security response headers configured, and the application's entire authorization model depends on Supabase RLS policies that cannot be verified from this codebase (no migration files are committed).

| Severity | Count |
|----------|-------|
| Critical | 1 (1 invalidated) |
| High     | 3     |
| Medium   | 5     |
| Low      | 4     |
| Info     | 5     |

---

## Findings

### Area 1: Middleware & Session Management

---

#### ~~[CRITICAL] C1 — Middleware file never runs~~ — **INVALID (Next.js 16)**

**File:** `src/proxy.ts:1–12`

**Status:** This finding was incorrect. In Next.js 16, the `middleware.ts` file convention was deprecated and replaced with `proxy.ts`. The function export must be named `proxy`. The existing `src/proxy.ts` with `export function proxy()` is the correct and current convention. Next.js 16 emits a deprecation warning if you use `middleware.ts` instead.

The proxy runs correctly and `updateSession()` executes on every matched request. No action needed.

---

### Area 2: Authentication

---

#### ~~[CRITICAL] C2 — Account deletion does not delete the auth user~~ — **FIXED**

**File:** `src/components/ui/DeleteAccountButton.tsx:22–27`

**Description:**
The account deletion handler deletes the user's `goals` rows and then calls `signOut()`, but never deletes the Supabase auth user account itself.

```ts
await supabase.from("goals").delete().eq("user_id", user.id); // deletes DB data
await supabase.auth.signOut();                                 // ends session
router.push("/login");
// ← auth user still exists in Supabase; can sign in again immediately
```

**Impact:**
A user who clicks "Delete account" expects their account to be gone. They can sign back in using the same credentials, finding their data deleted but their auth account intact. This is a correctness issue with security implications: it contradicts user expectation and could be exploited if credentials are shared or compromised.

**Recommended Fix:**
Deleting a Supabase auth user from the client requires the service role key (which must never be in client code). The correct approach is a server action or API route:

```ts
// src/app/api/delete-account/route.ts  (server-side, uses SUPABASE_SERVICE_ROLE_KEY)
import { createClient } from "@supabase/supabase-js";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only, never NEXT_PUBLIC_
);

export async function DELETE(request: Request) {
  // Verify the caller's session first, then:
  await adminClient.auth.admin.deleteUser(userId);
}
```

The client button would call this route instead of directly mutating the database. RLS cascade deletes handle the data cleanup.

---

#### [MEDIUM] M3 — Signup redirects immediately without email confirmation

**File:** `src/app/(auth)/signup/page.tsx:29–31`

**Description:**
After `supabase.auth.signUp()` returns without error, the user is immediately pushed to `/`:

```ts
} else {
  router.push("/");  // ← no check for email confirmation status
}
```

If Supabase is configured to require email confirmation (a common production setting), the user's session will be limited until they confirm, but the app does not communicate this. Worse, if email confirmation is disabled, new accounts are immediately fully active without any identity verification.

**Recommended Fix:**
Check the `session` returned from `signUp()`. If it is `null` (confirmation required), show a "Check your email" message rather than redirecting:

```ts
const { data, error } = await supabase.auth.signUp({ email, password });
if (error) { ... }
else if (!data.session) {
  setMessage("Check your email to confirm your account.");
} else {
  router.push("/");
}
```

---

#### [MEDIUM] M1 — Weak password requirements

**File:** `src/app/(auth)/signup/page.tsx` (HTML `minLength={6}`)

**Description:**
The only password constraint is an HTML `minLength={6}` attribute on the input field. This is client-side only and trivially bypassed. Supabase's default minimum is also 6 characters with no complexity rules.

**Recommended Fix:**
- Configure Supabase Auth settings (in dashboard) to enforce a minimum password length of at least 8–12 characters.
- Add client-side complexity feedback (uppercase, number, or special character) to encourage stronger passwords.
- Consider adding a password confirmation field.

---

#### [MEDIUM] M4 — Raw Supabase error messages exposed to users

**Files:**
- `src/app/(auth)/login/page.tsx:27`
- `src/app/(auth)/signup/page.tsx:27`

**Description:**
Internal error messages from Supabase are rendered directly in the UI:

```ts
setError(error.message); // ← raw Supabase error string rendered in JSX
```

Supabase error messages may reveal internal implementation details (e.g., "User already registered", "Invalid login credentials", rate-limit internals).

**Recommended Fix:**
Map Supabase error codes to user-friendly messages:

```ts
const userMessage = {
  "Invalid login credentials": "Incorrect email or password.",
  "User already registered": "An account with this email already exists.",
}[error.message] ?? "Something went wrong. Please try again.";
setError(userMessage);
```

---

#### [LOW] L4 — No password reset flow

**Description:**
No password reset UI or route was found in the codebase. Users who forget their password have no way to recover their account.

**Recommended Fix:**
Add a "Forgot password?" link on the login page that calls `supabase.auth.resetPasswordForEmail(email)` and handles the redirect flow.

---

### Area 3: Row Level Security & Client Mutations

---

#### [HIGH] H2 — Client mutations use no ownership checks; entirely depend on RLS

**Files:**
- `src/components/features/goals/GoalActions.tsx:21–27, 37–40, 48–51, 59–62`
- `src/components/features/goals/MilestoneList.tsx:22–24, 34`
- `src/components/features/daily/DailyTaskList.tsx:45–49`

**Description:**
All write operations (update, archive, delete) from client components filter only by the row `id`, with no explicit `user_id` check in the query:

```ts
// GoalActions.tsx — update
await supabase.from("goals").update({ title, description }).eq("id", goal.id);

// GoalActions.tsx — delete
await supabase.from("goals").delete().eq("id", goal.id);

// MilestoneList.tsx — delete
await supabase.from("milestones").delete().eq("id", id);

// DailyTaskList.tsx — delete task_log
await supabase.from("task_logs").delete()
  .eq("task_id", task.task.id)
  .eq("date", today);  // no user_id filter
```

If Supabase RLS policies are not correctly configured for all four tables (`goals`, `milestones`, `tasks`, `task_logs`), any authenticated user could modify or delete another user's data by supplying a known row ID.

**Recommended Fix (defense-in-depth):**
Even if RLS is properly configured, add explicit `user_id` filters in client queries as a second layer:

```ts
// Example — GoalActions.tsx
const { data: { user } } = await supabase.auth.getUser();
await supabase.from("goals").delete()
  .eq("id", goal.id)
  .eq("user_id", user.id);   // ← explicit ownership check
```

**For task_logs specifically**, the delete query has no user-level filter at all; add `.eq("user_id", user.id)`.

---

#### [HIGH] H3 — RLS policies not verifiable from repo (no migration files)

**Description:**
There are no `supabase/migrations/` files or SQL policy definitions in this repository. The entire authorization model depends on RLS policies configured in the Supabase dashboard, but these cannot be audited or version-controlled.

**Impact:**
- A misconfigured or missing RLS policy on any table is undetectable from code review.
- Policy changes are not tracked in git; regressions are invisible.
- Onboarding new environments requires manual dashboard configuration.

**Recommended Fix:**
- Enable the Supabase CLI and commit migration files: `supabase db pull` to capture existing policies.
- Minimum required RLS policies for each table should enforce:
  ```sql
  -- Example for goals table
  CREATE POLICY "Users can only access their own goals"
  ON goals FOR ALL
  USING (auth.uid() = user_id);
  ```
- Add RLS verification to CI (e.g., `supabase test db`).

---

### Area 4: Security Headers

---

#### [HIGH] H1 — No HTTP security headers configured

**File:** `next.config.ts:1–8`

**Description:**
The Next.js config contains only `reactCompiler: true`. No security headers are configured:

```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  // ← no headers() export
};
```

Missing headers:
| Header | Risk |
|--------|------|
| `Content-Security-Policy` | XSS, data injection |
| `X-Frame-Options` | Clickjacking |
| `X-Content-Type-Options` | MIME sniffing |
| `Referrer-Policy` | Information leakage |
| `Permissions-Policy` | Feature abuse (camera, microphone, etc.) |
| `Strict-Transport-Security` | Protocol downgrade / MITM |

**Recommended Fix:**

```ts
// next.config.ts
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",   // tighten after testing
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

---

### Area 5: Client-Side Data Exposure

---

#### [LOW] L1 — User ID rendered in settings UI

**File:** `src/app/(dashboard)/settings/page.tsx:27`

**Description:**
The user's Supabase UUID is displayed directly in the settings page:

```tsx
<p className="text-sm font-mono text-gray-600">{user.id}</p>
```

On its own this is low risk, but UUIDs in the DOM increase attack surface if combined with other vulnerabilities (e.g., IDOR via a future API route that accepts a `user_id` parameter).

**Recommended Fix:**
Remove or hide the UUID display unless it serves a specific debugging purpose. If kept, ensure it is never used as an authorization token in any API call.

---

#### [MEDIUM] M2 — User-controlled timezone cookie used in server-side queries without validation

**Files:**
- `src/components/ui/TimzeonProvider.tsx:10` — sets `user_timezone` cookie via `document.cookie`
- `src/app/(dashboard)/page.tsx:24` — reads cookie value directly into query logic

**Description:**
The timezone value is set client-side and read server-side without validation:

```ts
// page.tsx
const timezone = cookieStore.get("user_timezone")?.value || "America/Chicago";
```

A user could set `user_timezone` to an arbitrary string. While the IANA timezone list is finite and JavaScript's `Intl` API would throw on an invalid value, there is no explicit allowlist check. An injected malformed timezone string could cause unexpected behavior in date calculations.

**Recommended Fix:**
Validate the timezone against the IANA database on the server before use:

```ts
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const rawTz = cookieStore.get("user_timezone")?.value ?? "";
const timezone = isValidTimezone(rawTz) ? rawTz : "America/Chicago";
```

---

### Area 6: Input Validation & Injection

---

#### [MEDIUM] M5 — Silent cookie error suppression in server Supabase client

**File:** `src/lib/supabase/server.ts:20–22`

**Description:**
Cookie write errors are silently swallowed:

```ts
try {
  cookiesToSet.forEach(({ name, value, options }) =>
    cookieStore.set(name, value, options)
  );
} catch {
  // Can be ignored if middleware is refreshing sessions
}
```

The comment assumes the middleware is refreshing sessions — but as noted in C1, the middleware never runs. If token refresh cookies fail to set (e.g., inside a React Server Component where cookie mutation is not allowed), the failure is invisible and the session degrades silently.

**Recommended Fix:**
This pattern is safe only when middleware is running correctly. Once C1 is fixed, this suppression is appropriate for the specific case of RSC cookie writes. Add a comment clarifying the dependency:

```ts
} catch {
  // Safe to ignore: middleware.ts handles cookie refresh on every request.
  // Requires src/middleware.ts to be correctly configured (see C1).
}
```

---

#### [INFO] I6 — No raw SQL usage; parameterized queries throughout

**Description:**
All database access uses the Supabase JavaScript client, which uses parameterized queries internally. No raw SQL strings with user input were found. SQL injection risk is negligible.

---

### Area 7: Dependencies & Configuration

---

#### [INFO] I1 — Minimal dependency surface

**File:** `package.json`

The application has only 5 production dependencies:
- `@supabase/ssr@^0.9.0`
- `@supabase/supabase-js@^2.98.0`
- `next@16.1.6`
- `react@19.2.3`
- `react-dom@19.2.3`

No obviously vulnerable packages. No pinned version mismatches. The small dependency surface minimizes supply chain risk.

---

#### [INFO] I2 — `.env*` correctly gitignored

**File:** `.gitignore:34`

All `.env*` files are excluded from version control. No secrets were found committed in the repository.

---

#### [LOW] L2 — No rate limiting at application layer

**Description:**
Login and signup routes have no application-level rate limiting. Protection relies entirely on Supabase's built-in rate limits (configurable in the dashboard). If Supabase rate limits are not configured, these endpoints are open to brute-force attacks.

**Recommended Fix:**
Verify Supabase Auth rate limits are enabled in the project dashboard. For additional hardening, consider adding an IP-based rate limiter (e.g., `@upstash/ratelimit` with Vercel KV) in the middleware once C1 is fixed.

---

#### [LOW] L3 — No explicit CSRF protection

**Description:**
The app relies on Supabase cookies having `SameSite=Lax` or `SameSite=Strict` attributes (set by the Supabase SSR library). There is no explicit CSRF token validation. This is acceptable for `SameSite` cookies but is not documented or verified.

**Recommended Fix:**
Confirm Supabase SSR sets `SameSite=Lax` (or stricter) on session cookies. No additional action required if confirmed, but document the assumption.

---

## Positive Findings

These practices were observed and should be preserved:

| ID | Finding |
|----|---------|
| I3 | All dashboard server components call `supabase.auth.getUser()` and redirect on null user |
| I4 | Server-side queries include `.eq("user_id", user.id)` — defense-in-depth beyond RLS |
| I5 | No service role key used anywhere in client-side code; only `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| I1 | Minimal production dependency tree (5 packages) |
| I2 | All `.env*` files properly gitignored |

---

## Prioritized Remediation Checklist

| Priority | ID | Action |
|----------|----|--------|
| P0 — Fix immediately | C1 | Rename `src/proxy.ts` → `src/middleware.ts`, export `middleware` |
| P0 — Fix immediately | C2 | Add a server-side route to call `auth.admin.deleteUser()` |
| P1 — Fix before production | H1 | Add security headers in `next.config.ts` |
| P1 — Fix before production | H2 | Add `.eq("user_id", user.id)` to all client-side mutations |
| P1 — Fix before production | H3 | Commit Supabase migration files with RLS policies |
| P2 — Fix soon | M1 | Enforce stronger password requirements in Supabase dashboard |
| P2 — Fix soon | M2 | Validate `user_timezone` cookie against IANA allowlist |
| P2 — Fix soon | M3 | Check `session` after signup; show email confirmation prompt if null |
| P2 — Fix soon | M4 | Map Supabase error codes to user-friendly messages |
| P2 — Fix soon | M5 | Confirm comment in `server.ts` reflects correct middleware dependency |
| P3 — Nice to have | L1 | Remove user UUID from settings UI |
| P3 — Nice to have | L2 | Verify Supabase rate limits; add app-layer rate limiting if needed |
| P3 — Nice to have | L3 | Document `SameSite` cookie assumption |
| P3 — Nice to have | L4 | Implement password reset flow |
