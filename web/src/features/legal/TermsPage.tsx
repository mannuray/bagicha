import { Link } from 'react-router';
import { H2, LegalLayout, List, P } from './LegalLayout';

/** Draft terms of use (owner's doc "Budtale privacy policy and terms"); bracketed items are still to be filled in. */
export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of use"
      lead="By using Budtale you agree to these terms; gardening advice in the app is guidance, not a guarantee, and you decide what to do in your garden."
    >
      <P>Last updated: [DATE]. Budtale is run by [OWNER NAME / COMPANY], [ADDRESS], India.</P>

      <H2>1. The service</H2>
      <P>
        Budtale helps home gardeners in India keep a record of their plants and get reminders, season tips, weather tips, plant
        identification and a community to ask questions. We may add, change or remove features.
      </P>

      <H2>2. Your account</H2>
      <List
        items={[
          'You must be 18 or older.',
          'Give a phone number you control and keep your sign-in to yourself.',
          'One person, one account. You are responsible for what happens under your account.',
        ]}
      />

      <H2>3. Advice is guidance, not a guarantee</H2>
      <List
        items={[
          'Care reminders, season tips and weather tips are general guidance based on public sources (such as IMD and ICAR advisories) and your district. Your plants, soil and weather may differ.',
          'Plant identification and diagnosis use AI (Google Gemini) and can be wrong. Check before you act, especially before using any spray or chemical.',
          'Always follow the label and local rules for any pesticide or fertiliser. We list organic options first.',
          'Weather data comes from Open-Meteo and may be inaccurate or late. For warnings that affect safety, follow IMD and local authorities.',
          'Answers from other gardeners are their own opinions.',
        ]}
      />

      <H2>4. Your content</H2>
      <List
        items={[
          'You own the photos, notes and posts you add.',
          'You let us store, show and process them to run Budtale (for example, to show your post to other gardeners or to send a photo to the AI you asked to look at it). This permission ends when you delete the content or your account, except copies others have already reshared or that we must keep by law.',
        ]}
      />

      <H2>5. Community rules</H2>
      <P>
        Do not post anything that is illegal, abusive, hateful, sexual, misleading, spam or someone else's private information, or
        that promotes banned pesticides. Do not sell in the community. We may remove content or suspend accounts that break these
        rules. You can report a post or a person in the app.
      </P>

      <H2>6. Premium</H2>
      <List
        items={[
          'Premium plans are paid through Razorpay at the price shown when you buy.',
          '[Refunds: state your policy, e.g. "No refunds after purchase, except where the law requires" or "Full refund within 7 days".]',
          'If we stop offering premium, you keep it until the end of the period you paid for, or get a pro-rata refund.',
        ]}
      />

      <H2>7. Ending use</H2>
      <P>
        You can stop using Budtale and delete your account at any time (see the{' '}
        <Link to="/privacy" className="font-bold text-secondary underline">
          privacy policy
        </Link>
        ). We may suspend or close an account that breaks these terms, after a warning where reasonable.
      </P>

      <H2>8. Liability</H2>
      <P>
        Budtale is provided as is. To the extent the law allows, we are not liable for crop loss, plant damage or other indirect loss
        from using the app or its advice. Our total liability to you is limited to what you paid us in the last 12 months. Nothing
        here limits rights you have under Indian consumer law.
      </P>

      <H2>9. Changes to these terms</H2>
      <P>We will tell you in the app before material changes take effect. If you keep using Budtale after that, the new terms apply.</P>

      <H2>10. Law and disputes</H2>
      <P>
        These terms follow Indian law. Courts in [CITY] have jurisdiction. Please contact us first at [CONTACT EMAIL]; most problems
        can be solved that way.
      </P>
    </LegalLayout>
  );
}
