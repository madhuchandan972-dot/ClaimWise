import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy & Terms',
  description: 'ClaimWise privacy policy and terms of use.',
};

export default function LegalPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Privacy &amp; Terms</h1>
        <p className="mt-2 text-sm text-gray-500">
          Plain-language summary of how ClaimWise handles your data. This page is not a substitute
          for legal review.
        </p>

        <section id="privacy" className="mt-12">
          <h2 className="text-xl font-bold text-gray-900">Privacy</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600">
            <p>
              <b>What we handle.</b> ClaimWise stores your account details (name and email from
              Supabase Auth), the vault records you create (documents, property, financial,
              insurance and emergency contacts), family invitations you send, and — if you use
              scholarship features — your education and category details.
            </p>
            <p>
              <b>How documents are protected.</b> Uploaded files are stored in a private Supabase
              Storage bucket. They are served only through an authorisation-checked route tied to
              your account, never through public URLs. A family member can read your files only
              after accepting an invitation you sent to their email.
            </p>
            <p>
              <b>What we never ask for.</b> We do not request banking passwords, PINs, CVVs or
              OTPs. The financial records feature has no fields for them. We do not request Gmail
              or portal passwords.
            </p>
            <p>
              <b>No demo data.</b> The application does not create demo accounts and does not insert
              sample family members, documents, property records or scholarships. Your vault starts
              empty and contains only what you enter.
            </p>
            <p>
              <b>Family access.</b> Access is read-only and invite-based. The owner can revoke it at
              any time. Automatic emergency access based on inactivity is not enabled in this MVP.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900">Terms of use</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600">
            <p>
              <b>Your responsibility.</b> You are responsible for the accuracy of the information you
              store and for keeping access to your email account secure. Use the platform only for
              information you are entitled to hold.
            </p>
            <p>
              <b>Scholarship information.</b> Listings come from the catalogue maintained by the
              site administrator. Always verify deadlines, amounts and eligibility on the official
              provider portal. ClaimWise does not guarantee any scholarship outcome.
            </p>
            <p>
              <b>Availability.</b> ClaimWise is an MVP. Features may change, and the service is
              provided without a guarantee of uninterrupted availability.
            </p>
            <p>
              <b>Security reporting.</b> Report a suspected security issue to{' '}
              <a href="mailto:contact@claimwise.in" className="font-semibold text-blue-700 hover:underline">
                contact@claimwise.in
              </a>
              . Please do not test against another person&apos;s account.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900">Security</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600">
            <p>
              Authentication is provided by Supabase Auth. Passwords are hashed by Supabase, and
              sessions live in HttpOnly cookies validated server-side. Every vault table has Row
              Level Security, and document bytes are served only after an ownership or family-access
              check. No service-role key is used in browser code.
            </p>
          </div>
        </section>

        <p className="mt-12 text-xs text-gray-400">
          © 2026 ClaimWise · <Link href="/" className="hover:text-gray-600">Back to homepage</Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
