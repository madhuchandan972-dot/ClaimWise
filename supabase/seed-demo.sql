-- ============================================================
-- ⚠️ LEGACY FILE — NOT PART OF THE CURRENT APP AND NOT RUN BY ANY
-- MIGRATION. The family-vault MVP does not create or seed demo
-- accounts, sample records or fake scholarships. Leave this file
-- untouched unless you deliberately want the old scholarship demo.
-- ============================================================
-- ClaimWise — OPTIONAL demo seed (manually run, opt-in)
--
-- ⚠️  THIS SCRIPT IS NOT PART OF THE APP. Nothing calls it. The
--     application code never creates fictional records. If you
--     want the clearly-labelled "demo experience" (login page's
--     demo@claimwise.in account with sample documents, sample
--     applications and sample scholarship listings), run this ONCE
--     in the Supabase SQL editor AFTER:
--       1. supabase/migrations/001_claimwise_init.sql, and
--       2. signing up demo@claimwise.in / Demo@123 through the
--          app's normal signup flow (this creates the auth user
--          + blank profile with no data).
--
-- Every row inserted here is fictional and labelled:
--   - profiles.is_demo = true  → drives the "Demo" badge in the UI
--   - scholarships.is_demo = true, official_link '#'
-- If you do nothing, the workspace stays genuinely empty — real
-- records only ever come from real users and real sources.
-- ============================================================

-- Look up the flagged demo account (must exist first — signup via UI)
select 'Verify demo account exists:' as step;
-- (The script below fails safely if the account doesn't exist.)

update public.profiles
set is_demo = true
where email = 'demo@claimwise.in';

-- ── Sample scholarship catalogue (fictional, is_demo = true) ──
insert into public.scholarships
  (id, name, provider, amount, category, eligibility, deadline, open_date,
   status, description, required_documents, official_link, is_demo)
values
  ('sch-001', 'National Merit Scholarship',
   'Ministry of Education, Govt. of India', '₹12,000/year',
   '["Merit","Central","Undergraduate"]'::jsonb,
   '{"maxIncome":600000,"minMarks":80,"educationLevel":"Undergraduate"}'::jsonb,
   '2027-01-31T23:59:59Z', '2026-11-01T00:00:00Z', 'open',
   'National Merit Scholarship is awarded to meritorious students pursuing undergraduate studies at recognised colleges across India. The scholarship encourages academic excellence among students from economically weaker sections.',
   '["AadhaarCard","IncomeCertificate","MarksCard","BankDocument"]'::jsonb, '#', true),
  ('sch-002', 'Central Sector Scholarship Scheme',
   'Ministry of Education, Govt. of India', '₹10,000–₹20,000/year',
   '["Merit","Central","Undergraduate","Postgraduate"]'::jsonb,
   '{"maxIncome":800000,"minMarks":80,"educationLevel":"Undergraduate"}'::jsonb,
   '2027-02-15T23:59:59Z', '2026-11-15T00:00:00Z', 'open',
   'The Central Sector Scholarship Scheme of Scholarships for College and University Students (CSSS) supports meritorious students from families with annual income up to ₹8 lakh.',
   '["AadhaarCard","IncomeCertificate","MarksCard","BankDocument"]'::jsonb, '#', true),
  ('sch-003', 'Post Matric Scholarship for SC/ST Students',
   'Ministry of Social Justice & Empowerment, Govt. of India', '₹1,500–₹3,500/month',
   '["SC/ST","Central","Undergraduate","Postgraduate"]'::jsonb,
   '{"maxIncome":250000,"caste":["SC","ST"],"educationLevel":"Undergraduate"}'::jsonb,
   '2026-11-13T23:59:59Z', '2026-09-01T00:00:00Z', 'closing-soon',
   'Post Matric Scholarship is provided to Scheduled Caste and Scheduled Tribe students studying at post matriculation or post-secondary stage.',
   '["AadhaarCard","CasteCertificate","IncomeCertificate","MarksCard","BankDocument"]'::jsonb, '#', true),
  ('sch-004', 'Pragati Scholarship for Girl Students',
   'All India Council for Technical Education (AICTE)', '₹30,000/year',
   '["Girls","Technical","Central","Undergraduate"]'::jsonb,
   '{"maxIncome":800000,"minMarks":60,"educationLevel":"Undergraduate","gender":["Female"]}'::jsonb,
   '2027-02-28T23:59:59Z', '2026-12-01T00:00:00Z', 'upcoming',
   'Pragati Scholarship by AICTE empowers girl students pursuing technical education at AICTE-approved institutions.',
   '["AadhaarCard","IncomeCertificate","MarksCard","BankDocument"]'::jsonb, '#', true),
  ('sch-005', 'NSP Top Class Education Scholarship',
   'Ministry of Minority Affairs, Govt. of India', '₹2,00,000/year',
   '["Minority","Central","Undergraduate","Postgraduate"]'::jsonb,
   '{"maxIncome":600000,"minMarks":50,"educationLevel":"Undergraduate"}'::jsonb,
   '2027-01-15T23:59:59Z', '2026-10-20T00:00:00Z', 'open',
   'NSP Top Class Education Scholarship is awarded to students from minority communities admitted to premier institutions for professional courses.',
   '["AadhaarCard","IncomeCertificate","MarksCard","BankDocument","Other"]'::jsonb, '#', true),
  ('sch-006', 'Karnataka Rajyotsava Scholarship',
   'Department of Backward Classes Welfare, Govt. of Karnataka', '₹5,000/year',
   '["State","OBC","Karnataka"]'::jsonb,
   '{"maxIncome":350000,"minMarks":60,"educationLevel":"Undergraduate","caste":["OBC"],"state":["Karnataka"]}'::jsonb,
   '2027-01-20T23:59:59Z', '2026-11-01T00:00:00Z', 'open',
   'Karnataka Rajyotsava Scholarship is awarded to OBC students domiciled in Karnataka who are pursuing graduation or post-graduation in recognised institutions.',
   '["AadhaarCard","CasteCertificate","IncomeCertificate","MarksCard","BankDocument"]'::jsonb, '#', true),
  ('sch-007', 'Vidyasiri Scholarship',
   'Karnataka SC & ST Development Corporation', '₹1,000–₹2,000/month',
   '["SC/ST","State","Karnataka"]'::jsonb,
   '{"maxIncome":250000,"caste":["SC","ST"],"state":["Karnataka"],"educationLevel":"Undergraduate"}'::jsonb,
   '2026-09-30T23:59:59Z', '2026-07-01T00:00:00Z', 'closed',
   'Vidyasiri Scholarship supports SC/ST students in Karnataka pursuing higher education. Applications are accepted via the Sakala portal.',
   '["AadhaarCard","CasteCertificate","IncomeCertificate","MarksCard","BankDocument","TransferCertificate"]'::jsonb, '#', true),
  ('sch-008', 'INSPIRE Scholarship for Higher Education (SHE)',
   'Department of Science & Technology (DST), Govt. of India', '₹80,000/year',
   '["Science","Merit","Central","Undergraduate"]'::jsonb,
   '{"minMarks":85,"educationLevel":"Undergraduate"}'::jsonb,
   '2027-02-28T23:59:59Z', '2026-12-15T00:00:00Z', 'upcoming',
   'INSPIRE SHE is awarded to students who rank in the top 1% of their board exams and are pursuing basic and natural science courses. The programme aims to attract bright young minds to careers in science and research.',
   '["AadhaarCard","MarksCard","BankDocument","Other"]'::jsonb, '#', true)
on conflict (id) do nothing;

-- ── Sample data for the DEMO ACCOUNT ONLY ──
DO $demo_seed$
DECLARE
  demo_id uuid;
BEGIN
  SELECT id INTO demo_id FROM public.profiles WHERE email = 'demo@claimwise.in';
  IF demo_id IS NULL THEN
    RAISE NOTICE 'Demo account not found — sign up demo@claimwise.in via the app first, then re-run this script. No sample rows were inserted.';
    RETURN;
  END IF;

  -- Sample documents (metadata only — there are NO file bytes in the
  -- storage bucket for these, exactly like the previous demo).
  insert into public.documents (id, user_id, name, type, file_type, size, uploaded_at, status, extracted_data)
  values
    ('doc-001', demo_id, 'Aadhaar Card - Demo Student', 'AadhaarCard', 'pdf', 512000, '2026-07-12T10:00:00Z', 'processed',
     '{"name":"Demo Student","dob":"15/06/2003","gender":"Female","aadhaarNumber":"XXXX XXXX 4321"}'::jsonb),
    ('doc-002', demo_id, 'PAN Card (sample)', 'PANCard', 'jpg', 204800, '2026-07-13T11:30:00Z', 'processed',
     '{"name":"Demo Student","panNumber":"ABCPS1234D","dob":"15/06/2003"}'::jsonb),
    ('doc-003', demo_id, 'Income Certificate 2025-26 (sample)', 'IncomeCertificate', 'pdf', 768000, '2026-08-01T09:15:00Z', 'processed',
     '{"applicantName":"Demo Student","annualIncome":"2,80,000","issuedBy":"Tahsildar"}'::jsonb),
    ('doc-004', demo_id, '10th Marks Card SSLC (sample)', 'MarksCard', 'pdf', 921600, '2026-08-05T14:00:00Z', 'processed',
     '{"studentName":"Demo Student","percentage":"92.48%","year":"2019"}'::jsonb),
    ('doc-005', demo_id, '12th Marks Card PUC (sample)', 'MarksCard', 'pdf', 870400, '2026-08-05T14:20:00Z', 'processed',
     '{"studentName":"Demo Student","percentage":"92.67%","year":"2021"}'::jsonb),
    ('doc-006', demo_id, 'Bank Passbook (sample)', 'BankDocument', 'jpg', 358400, '2026-10-10T16:45:00Z', 'pending', null)
  on conflict (id) do nothing;

  -- Sample applications (demo account only)
  insert into public.applications
    (id, user_id, scholarship_id, scholarship_name, status, applied_date, notes, documents, next_action, timeline, created_at)
  values
    ('app-001', demo_id, 'sch-001', 'National Merit Scholarship', 'submitted', '2026-11-05T10:30:00Z',
     'Sample: applied through NSP portal. Awaiting verification.',
     '["doc-001","doc-003","doc-005","doc-006"]'::jsonb,
     'Sample: wait for institutional verification. Expected by 30 Nov 2026.',
     '[{"date":"2026-10-20T09:00:00Z","action":"Started application","status":"completed"},
       {"date":"2026-10-28T14:00:00Z","action":"Documents uploaded","status":"completed"},
       {"date":"2026-11-05T10:30:00Z","action":"Submitted on NSP portal","status":"completed"},
       {"date":"2026-11-30T00:00:00Z","action":"Institutional verification","status":"current"},
       {"date":"2027-01-31T00:00:00Z","action":"Final approval & disbursal","status":"pending"}]'::jsonb,
     '2026-10-20T09:00:00Z'),
    ('app-002', demo_id, 'sch-006', 'Karnataka Rajyotsava Scholarship', 'preparing', null,
     'Sample: need to get Caste Certificate before submitting.',
     '["doc-001","doc-003","doc-005"]'::jsonb,
     'Sample: upload Caste Certificate and Bank Document to complete the application.',
     '[{"date":"2026-11-01T10:00:00Z","action":"Started application","status":"completed"},
       {"date":"2026-11-06T00:00:00Z","action":"Upload missing documents","status":"current"},
       {"date":"2027-01-10T00:00:00Z","action":"Submit application","status":"pending"}]'::jsonb,
     '2026-11-01T10:00:00Z'),
    ('app-003', demo_id, 'sch-004', 'Pragati Scholarship for Girl Students', 'not-started', null,
     'Sample: applications open on 1 Dec 2026.',
     '[]'::jsonb,
     'Sample: set a reminder for 1 Dec 2026 when applications open.',
     '[{"date":"2026-12-01T00:00:00Z","action":"Applications open","status":"pending"},
       {"date":"2027-01-15T00:00:00Z","action":"Submit application","status":"pending"},
       {"date":"2027-02-28T00:00:00Z","action":"Deadline","status":"pending"}]'::jsonb,
     '2026-11-01T10:00:00Z'),
    ('app-004', demo_id, 'sch-002', 'Central Sector Scholarship Scheme', 'more-info-required', '2026-10-10T08:00:00Z',
     'Sample: portal requested additional proof of family income.',
     '["doc-001","doc-003","doc-005","doc-006"]'::jsonb,
     'Sample: upload latest salary slip or Form 16 of parent/guardian and re-submit.',
     '[{"date":"2026-09-25T09:00:00Z","action":"Started application","status":"completed"},
       {"date":"2026-10-10T08:00:00Z","action":"Submitted on NSP portal","status":"completed"},
       {"date":"2026-10-28T10:00:00Z","action":"More info requested by portal","status":"current"},
       {"date":"2027-02-15T00:00:00Z","action":"Final approval","status":"pending"}]'::jsonb,
     '2026-09-25T09:00:00Z')
  on conflict (id) do nothing;

  -- Sample notifications (demo account only)
  insert into public.notifications (id, user_id, type, title, message, read, created_at, link)
  values
    ('notif-001', demo_id, 'deadline',
     'Sample: Deadline Alert — Post Matric SC/ST Scholarship',
     'Sample: the Post Matric Scholarship for SC/ST Students closes in 7 days (13 Nov 2026). Complete your profile now.',
     false, '2026-11-06T08:00:00Z', '/dashboard/scholarships/sch-003'),
    ('notif-002', demo_id, 'status-update',
     'Sample: Application Submitted Successfully',
     'Sample: your application for the National Merit Scholarship has been submitted. Track its status in My Applications.',
     false, '2026-11-05T10:35:00Z', '/dashboard/applications'),
    ('notif-003', demo_id, 'missing-doc',
     'Sample: Missing Document — Bank Passbook',
     'Sample: your Bank Document upload is still pending. 2 of your applications require this document.',
     false, '2026-11-04T14:00:00Z', '/dashboard/documents'),
    ('notif-004', demo_id, 'new-match',
     'Sample: New Scholarship Match — Pragati Scholarship',
     'Sample: based on your profile, you are eligible for the AICTE Pragati Scholarship worth ₹30,000/year. Applications open 1 Dec.',
     true, '2026-11-01T10:00:00Z', '/dashboard/scholarships/sch-004'),
    ('notif-005', demo_id, 'status-update',
     'Sample: More Information Required',
     'Sample: the NSP portal has requested additional income proof for your Central Sector Scholarship application.',
     true, '2026-10-28T10:05:00Z', '/dashboard/applications'),
    ('notif-006', demo_id, 'reminder',
     'Sample: Profile 85% Complete',
     'Sample: add your Caste Certificate to unlock 3 more scholarship matches and complete your profile.',
     true, '2026-10-25T09:00:00Z', '/dashboard/profile')
  on conflict (id) do nothing;

  -- Optional: the sample identity fields the demo UI expects. All
  -- explicitly fictional; a demo account without this update simply
  -- shows an empty profile instead.
  update public.profiles
  set
    name      = coalesce(name, 'Student'),
    dob       = '2003-06-15',
    gender    = 'Female',
    religion  = 'Hindu',
    category  = 'OBC',
    disability= false,
    state     = 'Karnataka',
    district  = 'Bengaluru Urban',
    college   = 'RV College of Engineering',
    course    = 'B.E. Computer Science & Engineering',
    year      = '2nd Year',
    marks_percentage = 92.67,
    marks_exam       = '12th (PUC)',
    family_income    = 280000,
    profile_complete = true,
    updated_at = now()
  where id = demo_id and is_demo = true;

  RAISE NOTICE 'Demo seed applied to account %.', demo_id;
END
$demo_seed$;

-- Done. Everything above is explicitly labelled sample data for the
-- flagged demo account and the sample catalogue.
