# ClaimWise — Emergency Family Vault

ClaimWise is a secure emergency family vault for documents, property details, financial
obligations, insurance records and emergency contacts. It also includes a scholarship finder
for students.

**Landing headline:** Your Family's Important Information, Protected in One Place.

---

## 1. What is built

| Area | Status |
| --- | --- |
| Landing page | ✅ Built |
| Supabase Auth: email/password signup, login, logout, email verification, password reset | ✅ Working |
| Google sign-in through Supabase OAuth | ✅ Wired (needs the provider enabled in Supabase) |
| Session persistence, protected dashboard routes | ✅ Working (`@supabase/ssr` HttpOnly cookies + middleware) |
| Family Vault overview with real counts and empty states | ✅ Working |
| Documents: title, category, description, upload, view, download, delete | ✅ Working (private Supabase Storage) |
| Property details: add, edit, delete, link documents | ✅ Working |
| Financial information: loans, debts, obligations, bank references, notes | ✅ Working |
| Insurance: provider, policy type/number, policyholder, expiry, linked documents | ✅ Working |
| Emergency contacts: add, edit, delete | ✅ Working |
| Family access: invite by email, accept, view status, revoke, read-only shared vault | ✅ Working |
| Scholarship catalogue: search, filters, details, verification status | ✅ Working (catalogue starts empty) |
| Eligibility checker and saved scholarships | ✅ Working |

No demo accounts are created. No sample family members, documents, property records or
scholarships are inserted by the application. Every new account starts with an empty vault.

## 2. Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Supabase Auth (email/password + optional Google OAuth)
- Supabase Postgres with Row Level Security
- Supabase Storage (private `documents` bucket)
- lucide-react icons
- Vercel-compatible deployment

Documents can also be found without scanning: the **Official records (RD lookup)** tab in
the Documents page takes a state + registration (RD) number and returns a reference card
linking only to official government portals (Kaveri, IGRS, TNREGINET, Bhulekh, e-District…).
ClaimWise never scrapes, proxies or hosts these files — the user downloads the document
directly from the government's own server, and can save the reference in the vault.

## 3. Setup

```bash
npm install
cp .env.example .env.local   # fill the two required Supabase values
```

Run these SQL files **in order** in Supabase → SQL editor:

1. `supabase/migrations/001_claimwise_init.sql` — profiles, documents, applications,
   notifications, scholarships, the private storage bucket and base RLS.
2. `supabase/migrations/002_storage_bucket_readable.sql` — bucket metadata readability.
3. `supabase/migrations/003_family_vault.sql` — **required for this version**: properties,
   financial records, insurance, emergency contacts, family members/invitations, saved
   scholarships, family read access and scholarship verification columns.
4. `supabase/migrations/006_record_references.sql` — **required for the RD-number lookup**:
   the `record_references` table (with RLS) that stores saved official-portal references.

Restart the dev server after the migrations so the schema cache refreshes.

### Supabase Auth settings

- **Authentication → URL Configuration**: set the Site URL and add
  `http://localhost:3000/auth/callback` (and the production equivalent) to the redirect list.
- **Confirm email**: keep it ON in production. Signup then shows a "verify your email" screen;
  the emailed link lands on `/auth/callback` and continues to the dashboard.
- **Google (optional)**: enable Google under Authentication → Providers, add the Google client
  ID/secret there, and add the Supabase callback URL to Google Cloud. The app's Google button
  uses `supabase.auth.signInWithOAuth`; if the provider is not enabled, the login page shows a
  clear message instead of failing silently.
- With email confirmation OFF, signup signs the user in immediately. Both flows are supported.

## 4. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (public by design). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable/anon key (public by design; RLS is the enforcement layer). |
| `GOOGLE_GEMINI_API_KEY` | Optional | Legacy document-intelligence module only. Not used by the vault. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Legacy Gmail integration placeholder. |

Never add the Supabase `service_role` key to any `NEXT_PUBLIC_` variable or frontend code.

Existing `.env.local` values are not modified by this project.

## 5. Commands

```bash
npm run dev      # local development
npm run build    # production build
npm run start    # serve the production build
npx tsc --noEmit # typecheck
npm run lint     # eslint
```

## 6. Security model

- **Supabase Auth only.** No custom password handling, no localStorage auth.
- **Server-side session checks.** Every API route calls `supabase.auth.getUser()` and takes the
  user id from the verified session, never from the request body.
- **Row Level Security** on `profiles`, `documents`, `properties`, `financial_records`,
  `insurance_records`, `emergency_contacts`, `family_members`, `family_invitations` and
  `saved_scholarships`.
- **Private storage.** Uploaded files live in the private `documents` bucket. Bytes are served
  only through `/api/documents/[id]/file` after an ownership/family-access check, with
  `Cache-Control: private, no-store`.
- **Family access is read-only and invite-based.** The invitation is tied to an email. The
  `accept_family_invitation` SQL function verifies the signed-in user's `auth.users` email,
  then grants read access. Owners can revoke at any time.
- **Upload validation.** Server-side magic-number sniffing accepts only PDF/JPEG/PNG and caps
  files at 5 MB.
- **No banking secrets.** The financial forms never ask for passwords, PINs, CVVs or OTPs, and
  the database has no columns for them.

Automatic emergency access based on inactivity is intentionally not implemented in this MVP.

## 7. Scholarship data policy

The `scholarships` table starts empty. The UI does not fabricate listings, amounts, deadlines or
application links.

Add verified entries through the Supabase SQL editor (or a trusted admin process), including:

- `name`, `provider`, `description`, `amount`
- `eligibility` (JSON), `state`, `education_level`, `course`, `category_requirements`,
  `max_income`, `family_income_criteria`
- `open_date`, `deadline`, `required_documents`, `application_instructions`
- `official_link`, `source_url`, `verification_status` (`verified` or `needs_verification`),
  `last_verified_at`

The details page shows the verification status and last-verified date. An official application
link is displayed only for verified rows with an `https://` URL. Rows marked
`needs_verification` are shown as unverified rather than presented as confirmed.

`supabase/seed-demo.sql` is legacy sample content from the previous project; **do not run it**.
No app code or migration inserts sample rows.

## 8. Vercel deployment

1. Push the repository and import it into Vercel (Next.js is auto-detected).
2. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production and
   Preview.
3. Run migrations 001–003 on the production Supabase project.
4. Set the Supabase Site URL to the deployed URL and allow-list
   `https://<your-app>/auth/callback`.
5. Deploy.

## 9. Known limitations

- Migration `003_family_vault.sql` must be applied before the vault APIs work; until then the
  dashboard shows an actionable schema error rather than fake data.
- Family invitations are in-app/authenticated. No invitation email is sent by the app itself;
  the owner shares the invitation with the family member, who signs in with that email and
  accepts it from Family Access.
- The legacy document-intelligence, application-assistant and notification pages remain in the
  repository but are not part of the vault navigation.
