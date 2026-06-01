import { createFileRoute } from '@tanstack/react-router';
import { BlogLayout } from '@/components/blog-layout';
import { docPageHeadingClassName } from '@/lib/typography';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
  head: () => ({
    meta: [
      {
        title: 'Privacy Policy | Multigres',
      },
      {
        name: 'description',
        content: 'Multigres Privacy Policy - Last Modified September 11, 2025',
      },
    ],
    links: [
      {
        rel: 'canonical',
        href: 'https://multigres.com/privacy',
      },
    ],
  }),
});

function PrivacyPage() {
  return (
    <BlogLayout>
      <article className="prose prose-invert max-w-none prose-headings:font-heading">
        <h1 className={docPageHeadingClassName}>Multigres Privacy Policy</h1>
        <p>
          <strong>Last Modified: September 11, 2025</strong>
        </p>
        <p>
          Thank you for your interest in Multigres.com, a Supabase-owned website operated by
          Supabase, Inc. (&quot;Supabase,&quot; &quot;we,&quot; &quot;our,&quot; or
          &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and
          otherwise process information that identifies or can reasonably be linked to an individual
          (&quot;personal information&quot;) when you visit or interact with our website at
          https://multigres.com (the &quot;Site&quot;).
        </p>
        <p>
          This Privacy Policy applies only to the Site and any features, content, or communications
          offered through the Site (for example, contact forms, newsletter sign-ups, and marketing
          pages). If you use other Supabase products or services (for example, the Supabase platform
          at https://supabase.com), the privacy notices for those services apply. Where we process
          personal information on behalf of a customer in connection with a Supabase service, we act
          as a processor under our data processing addendum; that processing is governed by the
          customer&apos;s agreement with Supabase and is not covered by this Privacy Policy.
        </p>
        <p>
          We may provide additional privacy disclosures for specific features or interactions that
          supplement this Privacy Policy.
        </p>

        <h2>Region-Specific Disclosures</h2>
        <ul>
          <li>
            <strong>California (Shine the Light / CCPA/CPRA):</strong> We may use cookies and
            similar technologies for measurement and personalized advertising. You can manage
            preferences via your browser or applicable consent tools. You may also submit privacy
            requests at privacy@supabase.com.
          </li>
          <li>
            <strong>Nevada:</strong> We do not sell personal information as &quot;sale&quot; is
            defined by Nevada law. Nevada residents may still submit an opt-out request to
            privacy@supabase.com.
          </li>
          <li>
            <strong>EEA/UK/Switzerland:</strong> See the &quot;Privacy Disclosures for the European
            Economic Area, United Kingdom and Switzerland&quot; below for information on lawful
            bases, transfers, and your rights.
          </li>
        </ul>

        <h2>What We Collect and How We Use It</h2>
        <p>
          We collect personal information in three ways: (1) you provide it to us, (2) it is
          collected automatically, and (3) we receive it from third parties.
        </p>

        <h3>1) Information You Provide</h3>
        <ul>
          <li>
            <strong>Contact and communications:</strong> When you submit a form, sign up to receive
            updates, or contact us, we collect the information you choose to provide (e.g., name,
            email address, company, message contents). We use this information to respond, provide
            requested information, and operate and improve the Site.
          </li>
          <li>
            <strong>Newsletter and marketing preferences:</strong> If you subscribe to updates, we
            use your email to send communications consistent with your preferences. You can
            unsubscribe using the link in those emails.
          </li>
        </ul>

        <h3>2) Information Collected Automatically</h3>
        <p>
          When you visit the Site, we and our service providers automatically collect device and
          usage information using cookies, web beacons, pixels, and similar technologies. This may
          include IP address, general location (derived from IP), browser and device type, operating
          system, language, referring/exit pages, pages viewed, links clicked, and timestamps. We use
          this information to:
        </p>
        <ul>
          <li>operate, secure, and debug the Site;</li>
          <li>understand Site performance and usage (analytics);</li>
          <li>
            measure campaign performance and, where permitted by law and your settings, personalize
            or measure advertising.
          </li>
        </ul>
        <p>
          You can manage cookie preferences via your browser settings and (where offered) our
          consent tools. Disabling cookies may affect Site functionality.
        </p>

        <h3>3) Information from Third Parties</h3>
        <p>
          We may receive limited personal information from service providers and partners (e.g.,
          analytics, hosting, security, error monitoring, or marketing providers) and combine it with
          other information for the purposes described above.
        </p>

        <h2>How We Share Personal Information</h2>
        <p>We share personal information as follows:</p>
        <ul>
          <li>
            <strong>Service providers:</strong> With vendors that provide services such as hosting,
            security, analytics, communications, and marketing. These providers are bound by
            appropriate confidentiality and data protection commitments.
          </li>
          <li>
            <strong>Affiliates:</strong> With other entities owned or controlled by Supabase that
            use personal information consistent with this Policy.
          </li>
          <li>
            <strong>Legal, safety, and compliance:</strong> To comply with law or legal process; to
            protect the rights, safety, or property of Supabase, our users, or others; and to
            enforce our terms.
          </li>
          <li>
            <strong>Business transactions:</strong> In connection with a merger, acquisition,
            financing, reorganization, or sale of all or a portion of our business or assets.
          </li>
          <li>
            <strong>With your direction or consent:</strong> When you ask us to share information or
            otherwise consent to sharing.
          </li>
          <li>
            <strong>Aggregated/de-identified information:</strong> We may share information that
            does not identify you (e.g., aggregated statistics).
          </li>
        </ul>

        <h2>Your Choices and Controls</h2>
        <ul>
          <li>
            <strong>Marketing emails:</strong> You can unsubscribe by using the link in any email.
            We may still send you non-marketing messages (e.g., legal or security notices).
          </li>
          <li>
            <strong>Cookies/Tracking:</strong> Use your browser settings and any consent tools on
            the Site to manage cookies and similar technologies. Blocking cookies may impact
            functionality.
          </li>
          <li>
            <strong>Access/Deletion/Correction:</strong> You may request access to, deletion of, or
            correction of personal information by emailing privacy@supabase.com. We may take steps to
            verify your identity and may deny requests as permitted by law.
          </li>
        </ul>

        <h2>Data Retention</h2>
        <p>
          We retain personal information for as long as necessary to fulfill the purposes described
          in this Policy, including to comply with legal, accounting, or reporting obligations,
          resolve disputes, and enforce our agreements.
        </p>

        <h2>Security</h2>
        <p>
          We use commercially reasonable technical and organizational measures designed to protect
          personal information we process through the Site. However, no method of transmission over
          the Internet or method of electronic storage is completely secure.
        </p>

        <h2>Third-Party Links</h2>
        <p>
          The Site may link to third-party websites or services that we do not control. Their privacy
          practices are governed by their own policies. We encourage you to review those policies
          before providing personal information.
        </p>

        <h2>Children&apos;s Privacy</h2>
        <p>
          The Site is not directed to children under 13, and we do not knowingly collect personal
          information from children under 13. If we learn that we have collected such information, we
          will take reasonable steps to delete it.
        </p>

        <h2>International Transfers</h2>
        <p>
          We are a U.S. company and may process personal information in the United States and other
          countries that may not provide the same level of data protection as your home jurisdiction.
          Where required, we use appropriate safeguards (such as standard contractual clauses) for
          cross-border transfers.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will
          take appropriate steps to notify you (e.g., by posting a notice on the Site). The
          &quot;Last Modified&quot; date above reflects the latest changes.
        </p>

        <h2>Contact Us</h2>
        <p>For questions or requests, contact us at: privacy@supabase.com.</p>

        <hr />

        <h2>Privacy Disclosures for the European Economic Area, United Kingdom, and Switzerland</h2>
        <p>
          <strong>Controller:</strong> Supabase, Inc. is the controller for personal information
          collected via the Site.
        </p>
        <p>
          <strong>Lawful Bases:</strong> We process personal information for the following purposes
          and bases:
        </p>
        <ul>
          <li>
            To operate and secure the Site (performance of contract where you access requested
            content; otherwise our legitimate interests in running our Site).
          </li>
          <li>
            To respond to inquiries and send requested communications (performance of contract or our
            legitimate interests in communicating with you).
          </li>
          <li>To send marketing communications (consent, which you can withdraw at any time).</li>
          <li>
            To measure and improve the Site and campaigns (consent where required; otherwise our
            legitimate interests in analytics and improvement).
          </li>
          <li>To comply with legal obligations and protect rights (legal obligation; legitimate interests).</li>
        </ul>
        <p>
          <strong>Your Rights:</strong> Subject to applicable law, you may request access,
          correction, deletion, restriction, or portability of your personal information, or object to
          processing based on legitimate interests, and withdraw consent at any time without
          affecting prior processing. You may lodge a complaint with your local data protection
          authority.
        </p>
        <p>
          <strong>International Transfers:</strong> Where we transfer personal information outside
          the EEA/UK/Switzerland, we rely on appropriate safeguards such as European
          Commission/UK-approved standard contractual clauses.
        </p>
        <p>
          <strong>Retention:</strong> We retain personal information as described in &quot;Data
          Retention&quot; above and consistent with applicable laws and limitation periods.
        </p>
        <p>
          <strong>Contact (EEA/UK/CH requests):</strong> privacy@supabase.com
        </p>
      </article>
    </BlogLayout>
  );
}
