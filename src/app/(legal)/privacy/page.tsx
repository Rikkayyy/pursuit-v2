import type { Metadata } from "next";
import LegalSection from "@/components/ui/LegalSection";
import { LEGAL_CONTACT_EMAIL, LEGAL_EFFECTIVE_DATE, LEGAL_OPERATOR } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy — Pursuit",
};

const SERVICE_PROVIDERS = [
  { name: "Supabase", purpose: "Database and account sign-in. Stores your account and everything you create in Pursuit." },
  { name: "Vercel", purpose: "Hosts the app. Keeps standard server logs (such as IP address and browser type) for security and reliability." },
  { name: "Anthropic", purpose: "Powers the AI Goal Planner. Receives only what you type into the planner form when you generate a plan." },
  { name: "Stripe", purpose: "Processes Pursuit Pro payments. Collects your card details directly — we never see or store them." },
  { name: "Google Fonts", purpose: "Serves the app's fonts. Your browser requests them from Google, which sees your IP address." },
  { name: "Iconify", purpose: "Serves the app's icons. Your browser requests them from Iconify, which sees your IP address." },
];

export default function PrivacyPolicyPage() {
  const mailto = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <article>
      <h1 className="text-3xl font-heading font-extrabold">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mt-2">Effective {LEGAL_EFFECTIVE_DATE}</p>

      <LegalSection title="The short version">
        <ul>
          <li>We collect what we need to run Pursuit: your email, the goals and tasks you create, and your subscription status.</li>
          <li>We don&apos;t sell your data, show you ads, or use third-party analytics or tracking.</li>
          <li>You can delete your account and data at any time from Settings.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Who we are">
        <p>
          Pursuit (&quot;Pursuit,&quot; &quot;we,&quot; &quot;us&quot;) is operated by {LEGAL_OPERATOR}. This policy explains
          what information we collect when you use the Pursuit website and mobile app, how we use it, and the choices
          you have. Questions can go to {mailto}.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p><strong>Account information.</strong> Your email address and password. Passwords are stored in hashed form by our authentication provider — we can&apos;t see them.</p>
        <p><strong>Content you create.</strong> Goals, descriptions, milestones, tasks, schedules, and the dates you mark tasks complete. Goals can be personal (for example, about health, fitness, money, or career), so only enter what you&apos;re comfortable storing.</p>
        <p><strong>AI Goal Planner input.</strong> If you use the AI Goal Planner, the goal description, timeline, experience level, available time, and constraints you enter are sent to our AI provider to generate a plan. We don&apos;t store that form input ourselves; if you activate the plan, the resulting goal, milestones, and tasks are saved like any other goal. We also keep a daily count of how many plans you&apos;ve generated to enforce usage limits.</p>
        <p><strong>Payment information.</strong> If you subscribe to Pursuit Pro, Stripe collects your payment details. We receive and store a Stripe customer ID, subscription ID, subscription status, and renewal date — never your card number.</p>
        <p><strong>Technical information.</strong> We use a small number of cookies that are necessary for the app to work (see below). Our hosting provider automatically logs basic request data such as IP address, browser type, and time of request.</p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>Pursuit only uses cookies needed for the app to function:</p>
        <ul>
          <li><strong>Sign-in cookies</strong> keep you logged in.</li>
          <li><strong><code>user_timezone</code></strong> stores your device&apos;s time zone so your daily tasks and streaks line up with your local day. It lasts one year.</li>
        </ul>
        <p>We don&apos;t use advertising, analytics, or cross-site tracking cookies.</p>
      </LegalSection>

      <LegalSection title="How we use your information">
        <ul>
          <li>To provide Pursuit: show your goals, track completions, calculate streaks and stats.</li>
          <li>To generate AI goal plans when you ask for one.</li>
          <li>To process subscriptions and manage access to Pursuit Pro.</li>
          <li>To send account emails, such as sign-up confirmation and password resets.</li>
          <li>To keep Pursuit secure, prevent abuse, and enforce our <a href="/terms">Terms of Service</a>.</li>
        </ul>
        <p>We don&apos;t sell your personal information, share it for targeted advertising, or use your goals to build advertising profiles.</p>
      </LegalSection>

      <LegalSection title="Service providers we share data with">
        <p>We share information only with the companies that help us run Pursuit, and only what each one needs:</p>
        <ul>
          {SERVICE_PROVIDERS.map((p) => (
            <li key={p.name}><strong>{p.name}</strong> — {p.purpose}</li>
          ))}
        </ul>
        <p>
          Under Anthropic&apos;s commercial terms, data sent through its API is not used to train its models by default.
          We may also disclose information if required by law, or as part of a sale or transfer of Pursuit (in which
          case this policy would continue to apply to your information).
        </p>
      </LegalSection>

      <LegalSection title="How long we keep your information">
        <p>
          We keep your information for as long as your account is active. When you delete your account, your goals,
          milestones, tasks, completion history, subscription record, and AI usage counts are deleted immediately, and any
          active Pursuit Pro subscription is canceled. Copies may remain in encrypted backups for up to 30 days before
          they&apos;re overwritten. Stripe keeps billing records for as long as it is legally required to.
        </p>
      </LegalSection>

      <LegalSection title="Your choices and rights">
        <ul>
          <li><strong>Access and correct:</strong> view and edit your goals and tasks directly in the app.</li>
          <li><strong>Delete:</strong> delete your account and data anytime in Settings → Delete Account.</li>
          <li><strong>Export or other requests:</strong> email {mailto} for a copy of your data or any other privacy request. We&apos;ll respond within 30 days.</li>
        </ul>
        <p>
          Depending on where you live (for example, California, Texas, or the EU/UK), you may have additional rights
          under local law, such as the right to know what we collect or to object to certain processing. We honor these
          requests for all users regardless of location, and we won&apos;t treat you differently for making one.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          Data is encrypted in transit (HTTPS) and at rest, and database access rules ensure each account can only read
          its own data. No system is perfectly secure, but we work to protect your information and will notify you as
          required by law if a breach affects it.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Pursuit is not intended for children under 13, and we don&apos;t knowingly collect information from them. If you
          believe a child under 13 has created an account, contact {mailto} and we&apos;ll delete it.
        </p>
      </LegalSection>

      <LegalSection title="International users">
        <p>Pursuit is based in the United States, and your information is processed and stored in the U.S.</p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          If we make meaningful changes, we&apos;ll update the effective date above and let you know in the app or by email
          before the changes take effect.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions or requests about your privacy: {mailto}</p>
      </LegalSection>
    </article>
  );
}
