-- ============================================================
-- 005 — Admin-verified, currently-open scholarships (Nov 2026)
--
-- Every row below was verified against an official source on
-- 2026-11-08. ClaimWise does not invent scholarships.
--
-- source = 'admin' + verification_status = 'verified'
-- (distinct from AI 'live' rows, which are needs_verification).
--
-- Idempotent: safe to run multiple times (upsert on id).
-- ============================================================

insert into public.scholarships (
  id, name, provider, amount, category, eligibility, deadline, open_date,
  status, description, required_documents, official_link, is_demo, source,
  last_checked_at, state, education_level, course, category_requirements,
  family_income_criteria, max_income, scholarship_type,
  application_instructions, source_url, verification_status, last_verified_at
) values

-- ------------------------------------------------------------
-- 1. PM YASASVI  (OBC / EBC / DNT) — extended to 30 Nov 2026
-- ------------------------------------------------------------
(
  'admin-pm-yasasvi-2026-27',
  'PM YASASVI — Top Class Education for OBC, EBC & DNT Students (2026-27)',
  'Ministry of Social Justice and Empowerment, Govt of India',
  'Full financial assistance (tuition + hostel/maintenance, as per scheme norms)',
  '["OBC","EBC","DNT","Central Government"]'::jsonb,
  '{"academic": "Minimum 75% marks in the qualifying exam (as prescribed by the scheme)",
    "level": "Class 9, Class 11 or first year of an undergraduate programme in a notified institution",
    "other": "Belongs to OBC / EBC / DNT category; income ceiling applies; selection through YET (entrance test) conducted by NTA"}'::jsonb,
  '2026-11-30 23:59:59+05:30'::timestamptz,
  '2026-11-30 23:59:59+05:30'::timestamptz,
  'open',
  'The PM YASASVI Central Sector Scheme of Top Class Education in College provides full financial assistance to eligible OBC, EBC and DNT students admitted to notified premier institutions for the 2026-27 academic year. Applications are submitted only through the National Scholarship Portal. Deadlines were extended by the Ministry.',
  '["Income certificate","Caste / category certificate","Previous exam marksheet","Aadhaar","Domicile certificate","Bank account details","Recent photograph"]'::jsonb,
  'https://scholarships.gov.in/',
  false, 'admin',
  now(),
  ARRAY['All India'],
  'School / Undergraduate',
  ARRAY['Any Stream'],
  ARRAY['OBC','EBC','DNT'],
  'Annual family income must not exceed the ceiling prescribed by the scheme (approx. Rs 2,50,000).',
  250000,
  'Merit-cum-Means / Top Class (Central Sector)',
  'Register or log in on scholarships.gov.in, complete the application form for PM YASASVI 2026-27, upload documents and submit before the extended deadline.',
  'https://scholarships.gov.in/public-scheme/notification',
  'verified', now()
),

-- ------------------------------------------------------------
-- 2. NFST — National Fellowship & Scholarship for ST Students
-- ------------------------------------------------------------
(
  'admin-nfst-2026-27',
  'National Fellowship and Scholarship for Higher Education of ST Students (NFST) 2026-27',
  'Ministry of Tribal Affairs, Govt of India',
  'Fellowship / scholarship maintenance amount as per scheme norms (varies by study level)',
  '["ST","Central Government"]'::jsonb,
  '{"academic": "Admission into a postgraduate programme or research fellowship at a recognised Indian university",
    "level": "Postgraduate / Research",
    "other": "Belongs to a Scheduled Tribe; only through the NFST portal; upper age/institution notifications apply"}'::jsonb,
  '2026-11-30 23:59:59+05:30'::timestamptz,
  '2026-11-30 23:59:59+05:30'::timestamptz,
  'open',
  'The Ministry of Tribal Affairs provides fellowship and scholarship support to meritorious Scheduled Tribe students for higher education (postgraduate studies and post-doctoral research). Selection is based on merit as per the ULW (University List of awardees) / UGC-NET processes published on the NFST portal. Applications close on the National Scholarship Portal on 30 November 2026.',
  '["Caste / ST certificate","Admission proof / university letter","Previous exam marksheet","Aadhaar","Bank account details","Research proposal (for fellowship component)"]'::jsonb,
  'https://nfst.tribal.gov.in/',
  false, 'admin',
  now(),
  ARRAY['All India'],
  'Postgraduate / Research',
  ARRAY['Any Stream'],
  ARRAY['ST'],
  'No explicit income ceiling for the fellowship component; merit-based selection applies.',
  NULL,
  'Fellowship / Scholarship (Central Sector)',
  'Apply on the National Scholarship Portal (scholarships.gov.in) under the Ministry of Tribal Affairs scheme; also register on nfst.tribal.gov.in where applicable. Submit before the extended deadline of 30 November 2026.',
  'https://scholarships.gov.in/',
  'verified', now()
),

-- ------------------------------------------------------------
-- 3. Top Class Education in Schools for SC Students
-- ------------------------------------------------------------
(
  'admin-topclass-school-sc-2026-27',
  'Central Sector Scheme of Top Class Education in Schools for SC Students (2026-27)',
  'Department of Social Justice and Empowerment, Govt of India',
  'Full financial assistance (tuition fees + maintenance allowance, as per scheme norms)',
  '["SC","Central Government"]'::jsonb,
  '{"academic": "Admission to Class 9 or Class 11 in a notified top-class school",
    "level": "School (Class 9 to 12)",
    "other": "Belongs to the Scheduled Caste category; merit-cum-means based selection"}'::jsonb,
  '2026-11-15 23:59:59+05:30'::timestamptz,
  '2026-11-15 23:59:59+05:30'::timestamptz,
  'closing-soon',
  'This centrally sponsored scheme covers full educational expenses for meritorious SC students admitted to notified top-class residential/public schools from Class 9 onwards. Applications for 2026-27 close on the National Scholarship Portal on 15 November 2026.',
  '["Caste / SC certificate","Income certificate","Previous exam marksheet","Aadhaar","School admission proof","Bank account details"]'::jsonb,
  'https://scholarships.gov.in/',
  false, 'admin',
  now(),
  ARRAY['All India'],
  'School',
  ARRAY['Any Stream'],
  ARRAY['SC'],
  'Annual family income must not exceed the ceiling prescribed by the scheme (approx. Rs 2,50,000).',
  250000,
  'Merit-cum-Means / Top Class (Central Sector)',
  'Apply via scholarships.gov.in — select the scheme under the Department of Social Justice and Empowerment, complete the form, upload documents and submit before 15 November 2026.',
  'https://scholarships.gov.in/public-scheme/notification',
  'verified', now()
),

-- ------------------------------------------------------------
-- 4. Top Class Education for Students with Disabilities
-- ------------------------------------------------------------
(
  'admin-topclass-pwd-2026-27',
  'Top Class Education for Students with Disabilities (2026-27)',
  'Department of Empowerment of Persons with Disabilities, Govt of India',
  'Full financial assistance (tuition fees + maintenance allowance, as per scheme norms)',
  '["PwD","Central Government"]'::jsonb,
  '{"academic": "Admission to a notified institution / school at the school or higher-education level",
    "level": "School / Undergraduate / Postgraduate",
    "other": "Must hold a valid disability certificate (40% or more disability); merit-based selection"}'::jsonb,
  '2026-11-30 23:59:59+05:30'::timestamptz,
  '2026-11-30 23:59:59+05:30'::timestamptz,
  'open',
  'This central sector scheme provides full financial support to students with benchmark disabilities studying in notified top-class schools, colleges and universities. Applications for the 2026-27 session close on the National Scholarship Portal on 30 November 2026.',
  '["Disability certificate (40%+)","Income certificate","Previous exam marksheet","Aadhaar","Institution admission proof","Bank account details"]'::jsonb,
  'https://scholarships.gov.in/',
  false, 'admin',
  now(),
  ARRAY['All India'],
  'School / Undergraduate / Postgraduate',
  ARRAY['Any Stream'],
  ARRAY['PwD'],
  'Annual family income must not exceed the ceiling prescribed by the scheme (approx. Rs 2,50,000).',
  250000,
  'Top Class (Central Sector)',
  'Apply via scholarships.gov.in under the Department of Empowerment of Persons with Disabilities, upload documents and submit before 30 November 2026.',
  'https://scholarships.gov.in/public-scheme/notification',
  'verified', now()
),

-- ------------------------------------------------------------
-- 5. NMMS — National Means-cum-Merit Scholarship
-- ------------------------------------------------------------
(
  'admin-nmms-2026-27',
  'National Means-cum-Merit Scholarship Scheme (NMMS) 2026-27',
  'Department of School Education and Literacy, Govt of India',
  'Rs 12,000 per annum (Rs 1,000 per month)',
  '["Means-cum-Merit","School","Central Government"]'::jsonb,
  '{"academic": "Minimum 55% marks (50% for SC/ST/PwD) in the Class 7 exam for entry to Class 9",
    "level": "School (Class 9 to 12, government / aided schools)",
    "other": "Studying in a government, local-body or aided school; annual family income up to Rs 3,50,000"}'::jsonb,
  '2026-11-15 23:59:59+05:30'::timestamptz,
  '2026-11-15 23:59:59+05:30'::timestamptz,
  'closing-soon',
  'NMMS awards Rs 1,000 per month (Rs 12,000 a year) to meritorious students of economically weaker sections to discourage dropout after Class 8 and support schooling through Class 12. The 2026-27 application window on the National Scholarship Portal closes on 15 November 2026.',
  '["Income certificate (up to Rs 3.5 lakh)","Previous exam marksheet","Aadhaar","School bonafide / admission proof","Bank account details","Caste certificate (if applicable)"]'::jsonb,
  'https://scholarships.gov.in/',
  false, 'admin',
  now(),
  ARRAY['All India'],
  'School',
  ARRAY['Any Stream'],
  ARRAY['General / EWS','OBC','SC','ST','PwD'],
  'Annual family income from all sources must not exceed Rs 3,50,000.',
  350000,
  'Means-cum-Merit (Central Sector)',
  'Apply via the National Scholarship Portal — choose NMMS under the Department of School Education and Literacy, complete state-specific fields and submit before 15 November 2026.',
  'https://scholarships.gov.in/public-scheme/notification',
  'verified', now()
),

-- ------------------------------------------------------------
-- 6. SDEF India Scholarship 2026-27 (private foundation)
-- ------------------------------------------------------------
(
  'admin-sdef-india-2026-27',
  'SDEF India Scholarship 2026-27',
  'Swami Dayanand Education Foundation (SDEF)',
  'Up to Rs 50,000 per year (Rs 2,00,000 over the 4-year course)',
  '["Need-cum-Merit","Private Foundation"]'::jsonb,
  '{"academic": "80% or above in Class XII",
    "level": "First year of a full-time professional undergraduate programme (B.Tech / MBBS / BDS / B.Sc Nursing / B.Pharm / B.Arch / BVSc)",
    "other": "Renewable annually subject to continued eligibility and academic performance; selection considers academic achievement, financial need and family circumstances"}'::jsonb,
  '2026-11-30 23:59:59+05:30'::timestamptz,
  '2026-11-30 23:59:59+05:30'::timestamptz,
  'open',
  'The Swami Dayanand Education Foundation awards merit-cum-need scholarships of up to Rs 50,000 per year (renewable up to Rs 2,00,000 across a 4-year professional degree) to first-year Indian students in full-time professional undergraduate programmes. The foundation evaluates academic achievement, financial need and family circumstances. Deadline extended to 30 November 2026. Notifications in mid-December 2026; funding begins January 2027.',
  '["Class XII marksheet (80%+)","Proof of admission to first-year professional UG course","Family income proof","Recent photograph","Bank account details"]'::jsonb,
  'https://form.jotform.com/swamid/sdef-india-scholarship-2026-27',
  false, 'admin',
  now(),
  ARRAY['All India'],
  'Undergraduate',
  ARRAY['B.Tech','MBBS','BDS','B.Sc Nursing','B.Pharm','B.Arch','BVSc'],
  ARRAY['General / EWS','OBC','SC','ST','PwD'],
  'Annual family income must not exceed Rs 12,00,000.',
  1200000,
  'Merit-cum-Need (Private Foundation)',
  'Apply online at the official SDEF application form (JotForm) before 30 November 2026. Keep your Class XII marksheet, admission proof and income documents ready.',
  'https://www.swamidayanand.org/india-scholarships-2026-27',
  'verified', now()
),

-- ------------------------------------------------------------
-- 7. CFA Access Scholarship (August 2027 exam window)
-- ------------------------------------------------------------
(
  'admin-cfa-access-scholarship-aug2027',
  'CFA Program Access Scholarship (August 2027 Exam Window)',
  'CFA Institute',
  'CFA exam fee reduced to USD 400 (registration fee waived; free Premium + Practice Pack included)',
  '["Professional Certification","Need-based"]'::jsonb,
  '{"academic": "Bachelor''s degree (or final-year student) or equivalent professional experience meeting CFA Program entry requirements",
    "level": "Graduate / Working Professional",
    "other": "For candidates facing genuine financial hardship who cannot afford the full CFA Program fee; must be unable to afford the standard registration cost"}'::jsonb,
  '2026-11-23 23:59:59+05:30'::timestamptz,
  '2026-11-03 00:00:00+05:30'::timestamptz,
  'open',
  'The CFA Access Scholarship reduces the CFA Program enrollment cost to a one-time USD 400, covering the exam registration fee and including the Premium question bank and Practice Pack. The application window for the August 2027 exam window runs from 3 November to 23 November 2026 (for CFA Level I, II and III candidates). Selection is based on demonstrated financial need. Never rely on unofficial sources — apply only through the CFA Institute website.',
  '["Personal financial statement (income, expenses, assets, commitments)","Statement of financial need","Identity document","Academic / professional records"]'::jsonb,
  'https://www.cfainstitute.org/programs/cfa-program/scholarships/access',
  false, 'admin',
  now(),
  ARRAY['Global (India eligible)'],
  'Graduate / Professional',
  ARRAY['Finance','Investment','Banking','Commerce','Economics','Any Stream'],
  ARRAY['General / EWS','OBC','SC','ST','PwD'],
  'No fixed income cap — decisions are based on a holistic assessment of the applicant''s ability to pay (income, expenses, assets and other financial commitments).',
  NULL,
  'Need-based Professional Certification Fee Waiver',
  'Apply online through the CFA Institute Access Scholarship portal (cfai.smapply.io) between 3 November and 23 November 2026. Complete the personal financial statement and essay describing your financial circumstances.',
  'https://www.cfainstitute.org/programs/cfa-program/scholarships/access',
  'verified', now()
)

on conflict (id) do update set
  name = excluded.name,
  provider = excluded.provider,
  amount = excluded.amount,
  category = excluded.category,
  eligibility = excluded.eligibility,
  deadline = excluded.deadline,
  open_date = excluded.open_date,
  status = excluded.status,
  description = excluded.description,
  required_documents = excluded.required_documents,
  official_link = excluded.official_link,
  source = excluded.source,
  last_checked_at = excluded.last_checked_at,
  state = excluded.state,
  education_level = excluded.education_level,
  course = excluded.course,
  category_requirements = excluded.category_requirements,
  family_income_criteria = excluded.family_income_criteria,
  max_income = excluded.max_income,
  scholarship_type = excluded.scholarship_type,
  application_instructions = excluded.application_instructions,
  source_url = excluded.source_url,
  verification_status = 'verified',
  last_verified_at = excluded.last_verified_at;
