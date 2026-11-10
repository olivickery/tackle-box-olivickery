import type { Metadata } from 'next';
import { SUPPORT_EMAIL, LEGAL_UPDATED } from '../../../lib/site';
import { LegalTitle, Section, Bullets } from '../LegalSection';

export const metadata: Metadata = {
  title: 'Privacy Policy | Tacklebox IQ',
  description: 'How Tacklebox IQ collects, uses and protects your information.',
};

const mail = <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-400 hover:text-amber-300 font-mono">{SUPPORT_EMAIL}</a>;

export default function PrivacyPage() {
  return (
    <>
      <LegalTitle title="Privacy Policy" updated={LEGAL_UPDATED} />

      <Section n={1} title="Who we are">
        <p>
          Tacklebox IQ (tackleboxiq.com) is a gear management and trip-planning app for anglers, operated from New South
          Wales, Australia. We handle personal information in line with the Australian Privacy Principles in the Privacy Act
          1988 (Cth). You can contact us about privacy at {mail}.
        </p>
      </Section>

      <Section n={2} title="What we collect">
        <Bullets items={[
          ['Account details', 'your email address and password. Passwords are stored hashed by our authentication provider; we never see them.'],
          ['Your gear', 'photos you upload, and the item details, notes, locations, favourites and restock flags you save.'],
          ['Trip planner requests', 'the location, target species and conditions you enter, along with a summary of your gear list.'],
          ['Technical data', 'standard server logs (such as IP address, browser type and request times) kept by our hosting providers for security and troubleshooting.'],
        ]} />
        <p>
          We don&apos;t use advertising trackers or analytics tools, and we don&apos;t collect your device location.
        </p>
      </Section>

      <Section n={3} title="How we use it">
        <p>
          We use your information only to run the app: to sign you in, store and show your gear, read details from gear
          photos, generate trip plans, send account emails (such as confirmation and password reset), and keep the service
          secure. We don&apos;t sell your information or share it for marketing.
        </p>
      </Section>

      <Section n={4} title="Who can see your gear">
        <p>
          Your gear list, notes and settings are tied to your account, and our database only returns them to you when
          you&apos;re signed in. There are no public profiles, feeds or catch maps.
        </p>
        <p>
          Gear photos are stored at long, hard-to-guess web addresses so they load quickly. Anyone who has a photo&apos;s
          exact address could open it, so avoid photographing anything you wouldn&apos;t want seen (such as documents or
          your face).
        </p>
      </Section>

      <Section n={5} title="Service providers">
        <p>To run Tacklebox IQ, we use these providers, who process data on our behalf:</p>
        <Bullets items={[
          ['Supabase', 'account sign-in, database and photo storage.'],
          ['Google (Gemini API)', 'reads gear photos to fill in item details, and generates trip plans from your trip details and gear list. This is only sent when you use those features.'],
          ['Vercel', 'hosts the website and runs the app’s server code.'],
          ['Resend', 'sends account emails such as sign-up confirmations and password resets.'],
        ]} />
        <p>
          These providers may store or process data outside Australia, including in the United States. Each is bound by
          its own privacy and security commitments.
        </p>
      </Section>

      <Section n={6} title="Cookies and local storage">
        <p>
          We store your sign-in session in your browser&apos;s local storage so you stay signed in. We don&apos;t use
          advertising or tracking cookies.
        </p>
      </Section>

      <Section n={7} title="Keeping and deleting your data">
        <p>
          We keep your information while your account is open. You can delete individual items in the app at any time. To
          delete your account and everything in it, including photos, email {mail} from your account&apos;s email address
          and we&apos;ll remove it within 30 days.
        </p>
      </Section>

      <Section n={8} title="Your rights">
        <p>
          You can ask to access or correct the personal information we hold about you by emailing {mail}. If you have a
          privacy complaint, contact us first and we&apos;ll respond within 30 days. If you&apos;re not satisfied, you can
          complain to the Office of the Australian Information Commissioner (oaic.gov.au).
        </p>
      </Section>

      <Section n={9} title="Young anglers">
        <p>
          If you&apos;re under 18, please get a parent or guardian&apos;s permission before creating an account.
        </p>
      </Section>

      <Section n={10} title="Changes">
        <p>
          If we change this policy, we&apos;ll update the date at the top of this page. For significant changes, we&apos;ll
          let you know by email or in the app.
        </p>
      </Section>
    </>
  );
}
