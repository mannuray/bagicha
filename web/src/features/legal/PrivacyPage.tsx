import { Link } from 'react-router';
import { H2, LegalLayout, List, P, Table } from './LegalLayout';

/** Draft privacy policy (owner's doc "Budtale privacy policy and terms"); bracketed items are still to be filled in. */
export function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy policy"
      lead="Budtale collects only what it needs to help you look after your garden, never sells your data and shows no ads."
    >
      <P>
        Budtale is run by [OWNER NAME / COMPANY], [ADDRESS], India ("we"). This policy covers the Budtale website and app. Last
        updated: [DATE].
      </P>

      <H2>What we collect and why</H2>
      <Table
        head={['What', 'Why we need it', 'Who else can see it']}
        rows={[
          ['Phone number', 'To sign you in with a one-time code', 'Nobody; never shown to other gardeners'],
          ['Name and profile photo (optional)', 'To show who you are in the community and chats', 'Other Budtale gardeners'],
          ['District, region and garden types', 'To time care reminders, season tips and sowing advice for your climate', 'Nobody'],
          [
            'Location, if you tap "Use my location" (rounded to about 100 m)',
            'To find your district and local weather',
            'Nobody; weather providers get a point rounded to about 11 km',
          ],
          ['Your plants, journal entries, harvests and photos', 'To keep your garden record and suggest care', 'Nobody, unless you post them'],
          ['Plant photos you scan or ask about', 'To identify plants and diagnose problems', 'Google (Gemini AI), only to answer that request'],
          ['Community posts, comments, reports and chat messages', 'To run the community and chats', 'The gardeners you post to or chat with'],
          ['Premium payments', 'To give you premium features', 'Razorpay handles the payment; we only keep the plan and payment reference'],
          ['Language choice and sign-in token', 'To keep you signed in and show the app in English or Hindi', 'Stored in your browser or on your phone'],
          [
            'Phone notification token and reminder times (Android app only)',
            'To send your morning and evening garden reminders at the times you pick',
            'Google (Firebase Cloud Messaging) delivers each reminder; it sees the token and the reminder text (task and plant names)',
          ],
          [
            'Technical logs and crash reports',
            'To keep the service running and fix bugs',
            'Our hosting and error-reporting providers; we strip phone numbers, exact locations and request contents',
          ],
        ]}
      />
      <P>We do not use advertising or analytics trackers, and we do not sell or rent your data.</P>

      <H2>Service providers</H2>
      <P>These companies process data for us, only to run Budtale:</P>
      <Table
        head={['Provider', 'What it does', 'Where']}
        rows={[
          ['Neon', 'Database', 'Singapore'],
          ['Render', 'Servers and short-term cache', 'Singapore'],
          ['Amazon Web Services (S3)', 'Photo storage', 'Mumbai, India'],
          ['Vercel', 'Website hosting', 'Global network'],
          ['Google (Gemini)', 'Plant identification and diagnosis from photos', 'Google servers'],
          ['Google (Firebase Cloud Messaging)', 'Delivers reminder notifications to your phone', 'Google servers'],
          ['Open-Meteo', 'Weather forecasts (gets a rounded point only)', 'Europe'],
          ['Razorpay', 'Payments', 'India'],
          ['Sentry', 'Crash reports (no personal details)', '[REGION OF YOUR SENTRY ACCOUNT]'],
          ['[SMS or Google sign-in provider]', 'Sign-in', '[REGION]'],
        ]}
      />
      <P>Some of your data is stored outside India (Singapore). We transfer it as Indian law allows.</P>

      <H2>How long we keep it</H2>
      <List
        items={[
          'Your account, garden record, posts and chats: while your account exists.',
          'After you ask to delete your account: everything is erased for good 30 days after you ask. During those 30 days your posts, replies and profile are hidden from others, and signing in lets you keep the account. After erasure we keep only payment records (tax law, up to 8 years) and a security log (one year); neither holds anything you wrote. Database backups expire on their own within [BACKUP DAYS] days.',
          'Weather lookups: cached for 1 hour, with no link to you.',
          'Notification tokens: removed when you sign out of all devices, ask to delete your account, or the phone goes 60 days without opening the app. The record of which reminders were sent: 30 days.',
          'Server logs: [30 days].',
        ]}
      />

      <H2>Your choices and rights</H2>
      <List
        items={[
          'See and correct your profile in the app at any time.',
          'Turn reminders off or change their times in Profile → Reminders, or block Budtale’s notifications in your phone’s settings.',
          <>
            Delete your account yourself: Profile → "Delete my account". The steps are also at{' '}
            <Link to="/delete-account" className="font-bold text-secondary underline">
              budtale.vercel.app/delete-account
            </Link>{' '}
            (no app needed). If you cannot sign in, email [GRIEVANCE EMAIL] with your phone number.
          </>,
          'Ask for a copy of your data: email [GRIEVANCE EMAIL]. We reply within 30 days.',
          'Withdraw consent by deleting your account; we then stop processing your data.',
          'Nominate someone to act for you if you die or cannot act, as the DPDP Act allows.',
          'Complain to us first; if unhappy, to the Data Protection Board of India.',
        ]}
      />

      <H2>Children</H2>
      <P>Budtale is for people aged 18 and over. We do not knowingly collect data from children.</P>

      <H2>Security</H2>
      <P>
        Data is encrypted in transit (HTTPS). Photos are private and shown only through short-lived links. Access to our systems is
        limited to the people who run Budtale.
      </P>

      <H2>Changes</H2>
      <P>If we change this policy in a way that matters, we will tell you in the app before it takes effect.</P>

      <H2>Contact and grievances</H2>
      <P>Grievance officer: [NAME], [GRIEVANCE EMAIL]. We acknowledge complaints within 7 days and resolve them within 30 days.</P>
    </LegalLayout>
  );
}
