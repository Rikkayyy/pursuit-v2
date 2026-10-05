import type { Metadata } from "next";
import LegalSection from "@/components/ui/LegalSection";
import { DAILY_AI_GENERATION_LIMIT } from "@/lib/api/ai-usage";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_GOVERNING_STATE,
  LEGAL_OPERATOR,
} from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service — Pursuit",
};

export default function TermsPage() {
  const mailto = <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>;

  return (
    <article>
      <h1 className="text-3xl font-heading font-extrabold">Terms of Service</h1>
      <p className="text-sm text-muted-foreground mt-2">Effective {LEGAL_EFFECTIVE_DATE}</p>

      <LegalSection title="1. Agreement">
        <p>
          These Terms of Service (&quot;Terms&quot;) are an agreement between you and {LEGAL_OPERATOR}, who operates
          Pursuit (&quot;Pursuit,&quot; &quot;we,&quot; &quot;us&quot;). By creating an account or using Pursuit, you agree to
          these Terms and our <a href="/privacy">Privacy Policy</a>. If you don&apos;t agree, please don&apos;t use Pursuit.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be at least 13 years old to use Pursuit. If you&apos;re under 18, you need a parent or guardian&apos;s
          permission, and a parent or guardian must agree to these Terms and handle any purchase of Pursuit Pro.
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <p>
          You&apos;re responsible for keeping your login credentials secure and for activity under your account. Let us
          know at {mailto} if you think your account has been accessed without your permission.
        </p>
      </LegalSection>

      <LegalSection title="4. Your content">
        <p>
          You own the goals, tasks, and other content you put into Pursuit. You give us permission to store, process,
          and display that content only as needed to provide Pursuit to you — including sending your AI Goal Planner
          input to our AI provider when you request a plan.
        </p>
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>Break the law or use Pursuit to harm others.</li>
          <li>Try to access other users&apos; data, or bypass security measures, subscription checks, or usage limits.</li>
          <li>Overload, disrupt, scrape, or reverse-engineer the service.</li>
          <li>Use the AI Goal Planner to generate content unrelated to personal goal planning, or content that is unlawful or harmful.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Pursuit Pro subscriptions">
        <ul>
          <li><strong>Billing.</strong> Pursuit Pro is a paid subscription billed monthly at the price shown at checkout. Payments are processed by Stripe.</li>
          <li><strong>Automatic renewal.</strong> Your subscription renews automatically each month and your payment method is charged until you cancel.</li>
          <li><strong>Cancel anytime.</strong> Cancel in Settings → Manage Subscription. You&apos;ll keep Pro access until the end of the current billing period, and you won&apos;t be charged again.</li>
          <li><strong>No refunds.</strong> Payments are non-refundable, and we don&apos;t provide refunds or credits for partial months, except where required by law.</li>
          <li><strong>Price changes.</strong> We&apos;ll notify you before any price change takes effect, and you can cancel before it applies to you.</li>
          <li><strong>Usage limits.</strong> The AI Goal Planner is limited to {DAILY_AI_GENERATION_LIMIT} generations per day to keep the service fair and sustainable.</li>
          <li><strong>Account deletion.</strong> Deleting your account cancels your subscription immediately, without a refund for the remaining period.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. AI-generated plans">
        <p>
          The AI Goal Planner uses artificial intelligence to suggest goals, milestones, and tasks based on what you
          enter. Please understand:
        </p>
        <ul>
          <li><strong>Plans are suggestions, not professional advice.</strong> Nothing in Pursuit is medical, health, fitness, nutrition, mental-health, financial, legal, or other professional advice.</li>
          <li><strong>Check with a professional first.</strong> Talk to a doctor or qualified professional before starting any exercise, diet, or health-related plan, or making significant financial decisions.</li>
          <li><strong>AI can be wrong.</strong> Generated plans may be inaccurate, incomplete, unrealistic, or not suited to your situation. Review and edit every plan before activating it.</li>
          <li><strong>You&apos;re in control.</strong> You decide whether and how to follow any plan, and you do so at your own risk.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. No guarantee of results">
        <p>
          Pursuit is a tool to help you plan and stay consistent. Achieving a goal depends on your own effort,
          circumstances, and many factors outside our control. We don&apos;t promise or guarantee that using Pursuit — or
          following any plan, streak, or suggestion in it — will lead to any particular result, within any timeline.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes and termination">
        <p>
          We may update, change, or discontinue features of Pursuit. You can stop using Pursuit and delete your account
          at any time. We may suspend or terminate accounts that violate these Terms. If we discontinue Pursuit Pro
          entirely, we&apos;ll give reasonable notice and stop future billing.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimer of warranties">
        <p>
          Pursuit is provided <strong>&quot;as is&quot; and &quot;as available,&quot;</strong> without warranties of any
          kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose,
          accuracy, and non-infringement. We don&apos;t warrant that Pursuit will be uninterrupted, error-free, or that
          data will never be lost.
        </p>
      </LegalSection>

      <LegalSection title="11. Limitation of liability">
        <p>
          To the fullest extent permitted by law, Pursuit and its operator will not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or for any loss of data, profits, or goodwill, or
          for any injury or loss resulting from following any plan or suggestion in Pursuit. Our total liability for
          any claim relating to Pursuit is limited to the greater of the amount you paid us in the 12 months before the
          claim or $50.
        </p>
        <p>Some jurisdictions don&apos;t allow certain limitations, so some of the above may not apply to you.</p>
      </LegalSection>

      <LegalSection title="12. Indemnity">
        <p>
          You agree to indemnify and hold harmless Pursuit and its operator from claims arising out of your misuse of
          Pursuit or your violation of these Terms.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing law">
        <p>
          These Terms are governed by the laws of the State of {LEGAL_GOVERNING_STATE}, without regard to conflict-of-law
          rules. Any dispute will be resolved in the state or federal courts located in {LEGAL_GOVERNING_STATE}, and you
          consent to their jurisdiction. Before filing a claim, please contact us at {mailto} so we can try to resolve it
          informally.
        </p>
      </LegalSection>

      <LegalSection title="14. Changes to these Terms">
        <p>
          If we make meaningful changes, we&apos;ll update the effective date above and notify you in the app or by email
          before they take effect. Continuing to use Pursuit after that means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="15. Contact">
        <p>Questions about these Terms: {mailto}</p>
      </LegalSection>
    </article>
  );
}
