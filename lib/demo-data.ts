// ============================================================
// ClaimWise Platform — Comprehensive Demo / Sample Data
// All data is fictional and used for UI demonstration only.
// ============================================================

import type {
  StudentProfile,
  Document,
  Scholarship,
  Application,
  Notification,
  EligibilityResult,
} from "./types";

// ----------------------------------------------------------------
// Demo Student Profile
// ----------------------------------------------------------------
export const demoUser: StudentProfile = {
  // Core identity
  id: "demo-user-1",
  email: "demo@claimwise.in",
  name: "Priya Sharma",
  phone: "9876543210",
  dob: "2003-06-15",
  gender: "Female",
  religion: "Hindu",
  category: "OBC",
  disability: false,
  familyIncome: 280000, // ₹2,80,000 per annum

  // Address
  state: "Karnataka",
  district: "Bengaluru Urban",

  // Education
  college: "RV College of Engineering",
  course: "B.E. Computer Science & Engineering",
  year: "2nd Year",
  marksPercentage: 92.67,
  marksExam: "12th (PUC)",

  // Meta
  createdAt: "2026-07-10T08:30:00Z",
  updatedAt: "2026-10-22T14:15:00Z",
  profileComplete: true,

  // Related data
  documents: [], // populated below after demoDocuments is defined
  applications: [], // populated below after demoApplications is defined
};

// ----------------------------------------------------------------
// Demo Documents (6 documents, mixed statuses)
// ----------------------------------------------------------------
export const demoDocuments: Document[] = [
  {
    id: "doc-001",
    userId: "demo-user-1",
    name: "Aadhaar Card - Priya Sharma",
    type: "AadhaarCard",
    fileType: "pdf",
    size: 512000, // 500 KB
    uploadedAt: "2026-07-12T10:00:00Z",
    status: "processed",
    extractedData: {
      name: "Priya Sharma",
      dob: "15/06/2003",
      gender: "Female",
      aadhaarNumber: "XXXX XXXX 4321",
      address: "12, 3rd Cross, Rajajinagar, Bengaluru - 560010",
    },
  },
  {
    id: "doc-002",
    userId: "demo-user-1",
    name: "PAN Card",
    type: "PANCard",
    fileType: "jpg",
    size: 204800, // 200 KB
    uploadedAt: "2026-07-13T11:30:00Z",
    status: "processed",
    extractedData: {
      name: "Priya Sharma",
      panNumber: "ABCPS1234D",
      dob: "15/06/2003",
    },
  },
  {
    id: "doc-003",
    userId: "demo-user-1",
    name: "Income Certificate 2025-26",
    type: "IncomeCertificate",
    fileType: "pdf",
    size: 768000, // 750 KB
    uploadedAt: "2026-08-01T09:15:00Z",
    status: "processed",
    extractedData: {
      applicantName: "Priya Sharma",
      fatherName: "Ramesh Sharma",
      annualIncome: "2,80,000",
      issuedBy: "Tahsildar, Bengaluru Urban",
      issueDate: "25/07/2026",
    },
  },
  {
    id: "doc-004",
    userId: "demo-user-1",
    name: "10th Marks Card (SSLC)",
    type: "MarksCard",
    fileType: "pdf",
    size: 921600, // 900 KB
    uploadedAt: "2026-08-05T14:00:00Z",
    status: "processed",
    extractedData: {
      studentName: "Priya Sharma",
      rollNumber: "KA2103456",
      totalMarks: "578/625",
      percentage: "92.48%",
      year: "2019",
      board: "Karnataka Secondary Education Examination Board",
    },
  },
  {
    id: "doc-005",
    userId: "demo-user-1",
    name: "12th Marks Card (PUC)",
    type: "MarksCard",
    fileType: "pdf",
    size: 870400, // 850 KB
    uploadedAt: "2026-08-05T14:20:00Z",
    status: "processed",
    extractedData: {
      studentName: "Priya Sharma",
      rollNumber: "PU21-KA-78901",
      totalMarks: "556/600",
      percentage: "92.67%",
      year: "2021",
      board: "Department of Pre-University Education, Karnataka",
    },
  },
  {
    id: "doc-006",
    userId: "demo-user-1",
    name: "Bank Passbook / Account Details",
    type: "BankDocument",
    fileType: "jpg",
    size: 358400, // 350 KB
    uploadedAt: "2026-10-10T16:45:00Z",
    status: "pending",
    // No extractedData yet — still being processed
  },
];

// Back-fill documents into demoUser
demoUser.documents = demoDocuments;

// ----------------------------------------------------------------
// Demo Scholarships (8 realistic Indian scholarships)
// These are NOT loaded by the application. They remain only as an
// offline UI fixture; no seed script or app code inserts them.
// ----------------------------------------------------------------
const demoScolarshipsRaw = [
  // 1. National Merit Scholarship
  {
    id: "sch-001",
    name: "National Merit Scholarship",
    provider: "Ministry of Education, Govt. of India",
    amount: "₹12,000/year",
    category: ["Merit", "Central", "Undergraduate"],
    eligibility: {
      maxIncome: 600000,
      minMarks: 80,
      educationLevel: "Undergraduate",
    },
    deadline: "2027-01-31T23:59:59Z",
    openDate: "2026-11-01T00:00:00Z",
    status: "open",
    description:
      "National Merit Scholarship is awarded to meritorious students pursuing undergraduate studies at recognised colleges across India. The scholarship encourages academic excellence among students from economically weaker sections.",
    requiredDocuments: [
      "AadhaarCard",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
    ],
    officialLink: "#",
    isDemo: true,
  },

  // 2. Central Sector Scholarship
  {
    id: "sch-002",
    name: "Central Sector Scholarship Scheme",
    provider: "Ministry of Education, Govt. of India",
    amount: "₹10,000–₹20,000/year",
    category: ["Merit", "Central", "Undergraduate", "Postgraduate"],
    eligibility: {
      maxIncome: 800000,
      minMarks: 80,
      educationLevel: "Undergraduate",
    },
    deadline: "2027-02-15T23:59:59Z",
    openDate: "2026-11-15T00:00:00Z",
    status: "open",
    description:
      "The Central Sector Scholarship Scheme of Scholarships for College and University Students (CSSS) supports meritorious students from families with annual income up to ₹8 lakh. The scheme provides financial support to meet day-to-day expenses during college education.",
    requiredDocuments: [
      "AadhaarCard",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
    ],
    officialLink: "#",
    isDemo: true,
  },

  // 3. Post Matric Scholarship SC/ST (closing-soon)
  {
    id: "sch-003",
    name: "Post Matric Scholarship for SC/ST Students",
    provider: "Ministry of Social Justice & Empowerment, Govt. of India",
    amount: "₹1,500–₹3,500/month",
    category: ["SC/ST", "Central", "Undergraduate", "Postgraduate"],
    eligibility: {
      maxIncome: 250000,
      caste: ["SC", "ST"],
      educationLevel: "Undergraduate",
    },
    deadline: "2026-11-13T23:59:59Z",
    openDate: "2026-09-01T00:00:00Z",
    status: "closing-soon",
    description:
      "Post Matric Scholarship is provided to Scheduled Caste and Scheduled Tribe students studying at post matriculation or post-secondary stage. It aims to enable eligible SC/ST students to complete their education from Class XI onwards.",
    requiredDocuments: [
      "AadhaarCard",
      "CasteCertificate",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
    ],
    officialLink: "#",
    isDemo: true,
  },

  // 4. Pragati Scholarship for Girls (upcoming)
  {
    id: "sch-004",
    name: "Pragati Scholarship for Girl Students",
    provider: "All India Council for Technical Education (AICTE)",
    amount: "₹30,000/year",
    category: ["Girls", "Technical", "Central", "Undergraduate"],
    eligibility: {
      maxIncome: 800000,
      minMarks: 60,
      educationLevel: "Undergraduate",
      gender: ["Female"],
    },
    deadline: "2027-02-28T23:59:59Z",
    openDate: "2026-12-01T00:00:00Z",
    status: "upcoming",
    description:
      "Pragati Scholarship by AICTE empowers girl students pursuing technical education at AICTE-approved institutions. The scheme supports one girl per family in obtaining technical education and professional development.",
    requiredDocuments: [
      "AadhaarCard",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
    ],
    officialLink: "#",
    isDemo: true,
  },

  // 5. NSP Top Class Education (open)
  {
    id: "sch-005",
    name: "NSP Top Class Education Scholarship",
    provider: "Ministry of Minority Affairs, Govt. of India",
    amount: "₹2,00,000/year",
    category: ["Minority", "Central", "Undergraduate", "Postgraduate"],
    eligibility: {
      maxIncome: 600000,
      minMarks: 50,
      educationLevel: "Undergraduate",
    },
    deadline: "2027-01-15T23:59:59Z",
    openDate: "2026-10-20T00:00:00Z",
    status: "open",
    description:
      "NSP Top Class Education Scholarship is awarded to students from minority communities (Muslim, Christian, Sikh, Buddhist, Zoroastrian, Jain) admitted to premier institutions such as IITs, NITs, IIMs, and other top-ranked colleges for professional courses.",
    requiredDocuments: [
      "AadhaarCard",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
      "Other",
    ],
    officialLink: "#",
    isDemo: true,
  },

  // 6. Karnataka Rajyotsava Scholarship (open)
  {
    id: "sch-006",
    name: "Karnataka Rajyotsava Scholarship",
    provider: "Department of Backward Classes Welfare, Govt. of Karnataka",
    amount: "₹5,000/year",
    category: ["State", "OBC", "Karnataka"],
    eligibility: {
      maxIncome: 350000,
      minMarks: 60,
      educationLevel: "Undergraduate",
      caste: ["OBC"],
      state: ["Karnataka"],
    },
    deadline: "2027-01-20T23:59:59Z",
    openDate: "2026-11-01T00:00:00Z",
    status: "open",
    description:
      "Karnataka Rajyotsava Scholarship is awarded to OBC students domiciled in Karnataka who are pursuing graduation or post-graduation in recognised institutions. The scholarship promotes higher education among backward communities in the state.",
    requiredDocuments: [
      "AadhaarCard",
      "CasteCertificate",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
    ],
    officialLink: "#",
    isDemo: true,
  },

  // 7. Vidyasiri Scholarship (closed)
  {
    id: "sch-007",
    name: "Vidyasiri Scholarship",
    provider: "Karnataka Scheduled Caste & Scheduled Tribe Development Corporation",
    amount: "₹1,000–₹2,000/month",
    category: ["SC/ST", "State", "Karnataka"],
    eligibility: {
      maxIncome: 250000,
      caste: ["SC", "ST"],
      state: ["Karnataka"],
      educationLevel: "Undergraduate",
    },
    deadline: "2026-09-30T23:59:59Z",
    openDate: "2026-07-01T00:00:00Z",
    status: "closed",
    description:
      "Vidyasiri Scholarship supports SC/ST students in Karnataka pursuing higher education. The monthly stipend covers hostel accommodation and basic educational expenses. Applications are accepted via the Sakala portal.",
    requiredDocuments: [
      "AadhaarCard",
      "CasteCertificate",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
      "TransferCertificate",
    ],
    officialLink: "#",
    isDemo: true,
  },

  // 8. INSPIRE Scholarship (upcoming)
  {
    id: "sch-008",
    name: "INSPIRE Scholarship for Higher Education (SHE)",
    provider: "Department of Science & Technology (DST), Govt. of India",
    amount: "₹80,000/year",
    category: ["Science", "Merit", "Central", "Undergraduate"],
    eligibility: {
      minMarks: 85,
      educationLevel: "Undergraduate",
    },
    deadline: "2027-02-28T23:59:59Z",
    openDate: "2026-12-15T00:00:00Z",
    status: "upcoming",
    description:
      "INSPIRE SHE (Scholarship for Higher Education) is awarded to students who rank in the top 1% of their board exams and are pursuing B.Sc./B.S./B.Stat./B.Math./Integrated M.Sc./M.S. in natural and basic sciences. The programme aims to attract bright young minds to careers in science and research.",
    requiredDocuments: [
      "AadhaarCard",
      "MarksCard",
      "BankDocument",
      "Other",
    ],
    officialLink: "#",
    isDemo: true,
  },
];

// Normalise the fixture to the current Scholarship shape without
// changing any of the fictional values above.
export const demoScholarships: Scholarship[] = demoScolarshipsRaw.map((s) => ({
  ...s,
  officialUrl: s.officialLink,
  sourceUrl: "",
  verificationStatus: "needs_verification" as const,
  lastVerifiedAt: undefined,
  applicationInstructions: "",
  scholarshipType: s.category[0] ?? "",
  familyIncomeCriteria: s.eligibility.maxIncome
    ? `Up to ₹${s.eligibility.maxIncome.toLocaleString("en-IN")} per year`
    : "",
  maxIncome: s.eligibility.maxIncome,
  states: s.eligibility.state ?? [],
  educationLevel: s.eligibility.educationLevel ?? "",
  courses: [],
  categoryRequirements: s.eligibility.caste ?? [],
})) as Scholarship[];

// ----------------------------------------------------------------
// Demo Applications (4 applications with varied statuses)
// ----------------------------------------------------------------
export const demoApplications: Application[] = [
  {
    id: "app-001",
    userId: "demo-user-1",
    scholarshipId: "sch-001",
    scholarshipName: "National Merit Scholarship",
    status: "submitted",
    appliedDate: "2026-11-05T10:30:00Z",
    notes: "Applied through NSP portal. Awaiting verification by institution.",
    documents: ["doc-001", "doc-003", "doc-005", "doc-006"],
    nextAction: "Wait for institutional verification. Expected by 30 Nov 2026.",
    timeline: [
      {
        date: "2026-10-20T09:00:00Z",
        action: "Started application",
        status: "completed",
      },
      {
        date: "2026-10-28T14:00:00Z",
        action: "Documents uploaded",
        status: "completed",
      },
      {
        date: "2026-11-02T11:00:00Z",
        action: "Application reviewed by ClaimWise AI",
        status: "completed",
      },
      {
        date: "2026-11-05T10:30:00Z",
        action: "Submitted on NSP portal",
        status: "completed",
      },
      {
        date: "2026-11-30T00:00:00Z",
        action: "Institutional verification",
        status: "current",
      },
      {
        date: "2027-01-31T00:00:00Z",
        action: "Final approval & disbursal",
        status: "pending",
      },
    ],
  },
  {
    id: "app-002",
    userId: "demo-user-1",
    scholarshipId: "sch-006",
    scholarshipName: "Karnataka Rajyotsava Scholarship",
    status: "preparing",
    notes: "Need to get Caste Certificate before submitting.",
    documents: ["doc-001", "doc-003", "doc-005"],
    nextAction: "Upload Caste Certificate and Bank Document to complete the application.",
    timeline: [
      {
        date: "2026-11-01T10:00:00Z",
        action: "Started application",
        status: "completed",
      },
      {
        date: "2026-11-06T00:00:00Z",
        action: "Upload missing documents",
        status: "current",
      },
      {
        date: "2027-01-10T00:00:00Z",
        action: "Submit application",
        status: "pending",
      },
    ],
  },
  {
    id: "app-003",
    userId: "demo-user-1",
    scholarshipId: "sch-004",
    scholarshipName: "Pragati Scholarship for Girl Students",
    status: "not-started",
    notes: "Applications open on 1 Dec 2026.",
    documents: [],
    nextAction: "Set a reminder for 1 Dec 2026 when applications open. Prepare documents in advance.",
    timeline: [
      {
        date: "2026-12-01T00:00:00Z",
        action: "Applications open",
        status: "pending",
      },
      {
        date: "2027-01-15T00:00:00Z",
        action: "Submit application",
        status: "pending",
      },
      {
        date: "2027-02-28T00:00:00Z",
        action: "Deadline",
        status: "pending",
      },
    ],
  },
  {
    id: "app-004",
    userId: "demo-user-1",
    scholarshipId: "sch-002",
    scholarshipName: "Central Sector Scholarship Scheme",
    status: "more-info-required",
    appliedDate: "2026-10-10T08:00:00Z",
    notes: "Portal requested additional proof of family income.",
    documents: ["doc-001", "doc-003", "doc-005", "doc-006"],
    nextAction: "Upload latest salary slip or Form 16 of parent/guardian and re-submit.",
    timeline: [
      {
        date: "2026-09-25T09:00:00Z",
        action: "Started application",
        status: "completed",
      },
      {
        date: "2026-10-05T12:00:00Z",
        action: "Documents uploaded",
        status: "completed",
      },
      {
        date: "2026-10-10T08:00:00Z",
        action: "Submitted on NSP portal",
        status: "completed",
      },
      {
        date: "2026-10-28T10:00:00Z",
        action: "More info requested by portal",
        status: "current",
      },
      {
        date: "2027-02-15T00:00:00Z",
        action: "Final approval",
        status: "pending",
      },
    ],
  },
];

// Back-fill applications into demoUser
demoUser.applications = demoApplications;

// ----------------------------------------------------------------
// Demo Notifications (6 notifications)
// ----------------------------------------------------------------
export const demoNotifications: Notification[] = [
  {
    id: "notif-001",
    userId: "demo-user-1",
    type: "deadline",
    title: "Deadline Alert: Post Matric SC/ST Scholarship",
    message:
      "The Post Matric Scholarship for SC/ST Students closes in 7 days (13 Nov 2026). Complete your profile now.",
    read: false,
    createdAt: "2026-11-06T08:00:00Z",
    link: "/dashboard/scholarships/sch-003",
  },
  {
    id: "notif-002",
    userId: "demo-user-1",
    type: "status-update",
    title: "Application Submitted Successfully",
    message:
      "Your application for the National Merit Scholarship has been submitted. Track its status in My Applications.",
    read: false,
    createdAt: "2026-11-05T10:35:00Z",
    link: "/dashboard/applications",
  },
  {
    id: "notif-003",
    userId: "demo-user-1",
    type: "missing-doc",
    title: "Missing Document: Bank Passbook",
    message:
      "Your Bank Document upload is still pending. 2 of your applications require this document.",
    read: false,
    createdAt: "2026-11-04T14:00:00Z",
    link: "/dashboard/documents",
  },
  {
    id: "notif-004",
    userId: "demo-user-1",
    type: "new-match",
    title: "New Scholarship Match: Pragati Scholarship",
    message:
      "Based on your profile, you are eligible for the AICTE Pragati Scholarship worth ₹30,000/year. Applications open 1 Dec.",
    read: true,
    createdAt: "2026-11-01T10:00:00Z",
    link: "/dashboard/scholarships/sch-004",
  },
  {
    id: "notif-005",
    userId: "demo-user-1",
    type: "status-update",
    title: "More Information Required",
    message:
      "The NSP portal has requested additional income proof for your Central Sector Scholarship application.",
    read: true,
    createdAt: "2026-10-28T10:05:00Z",
    link: "/dashboard/applications",
  },
  {
    id: "notif-006",
    userId: "demo-user-1",
    type: "reminder",
    title: "Profile 85% Complete",
    message:
      "Add your Caste Certificate to unlock 3 more scholarship matches and complete your profile.",
    read: true,
    createdAt: "2026-10-25T09:00:00Z",
    link: "/dashboard/profile",
  },
];

// ----------------------------------------------------------------
// Demo Eligibility Results (8 results for 8 scholarships)
// ----------------------------------------------------------------
export const demoEligibilityResults: EligibilityResult[] = [
  {
    scholarshipId: "sch-001",
    scholarshipName: "National Merit Scholarship",
    status: "eligible",
    score: 92,
    reasons: [
      "Family income (₹2,80,000) is well below ₹6,00,000 limit",
      "Marks (92.67%) exceed the 80% requirement",
      "Pursuing Undergraduate education as required",
    ],
    missingInfo: [],
    requiredDocuments: ["AadhaarCard", "IncomeCertificate", "MarksCard", "BankDocument"],
  },
  {
    scholarshipId: "sch-002",
    scholarshipName: "Central Sector Scholarship Scheme",
    status: "eligible",
    score: 88,
    reasons: [
      "Family income (₹2,80,000) is below ₹8,00,000 limit",
      "Marks (92.67%) exceed the 80% requirement",
      "Pursuing Undergraduate education as required",
    ],
    missingInfo: [],
    requiredDocuments: ["AadhaarCard", "IncomeCertificate", "MarksCard", "BankDocument"],
  },
  {
    scholarshipId: "sch-003",
    scholarshipName: "Post Matric Scholarship for SC/ST Students",
    status: "not-eligible",
    score: 20,
    reasons: [
      "Category is OBC; this scholarship requires SC or ST category",
    ],
    missingInfo: [],
    requiredDocuments: [
      "AadhaarCard",
      "CasteCertificate",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
    ],
  },
  {
    scholarshipId: "sch-004",
    scholarshipName: "Pragati Scholarship for Girl Students",
    status: "eligible",
    score: 95,
    reasons: [
      "Gender is Female as required",
      "Family income (₹2,80,000) is below ₹8,00,000 limit",
      "Marks (92.67%) exceed the 60% requirement",
      "Pursuing technical degree (B.E. CSE) at AICTE-approved institution",
    ],
    missingInfo: [],
    requiredDocuments: ["AadhaarCard", "IncomeCertificate", "MarksCard", "BankDocument"],
  },
  {
    scholarshipId: "sch-005",
    scholarshipName: "NSP Top Class Education Scholarship",
    status: "possibly-eligible",
    score: 55,
    reasons: [
      "Family income (₹2,80,000) is below ₹6,00,000 limit",
      "Marks (92.67%) exceed the 50% requirement",
    ],
    missingInfo: [
      "Minority community certificate not provided — this scholarship targets minority communities",
    ],
    requiredDocuments: [
      "AadhaarCard",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
      "Other",
    ],
  },
  {
    scholarshipId: "sch-006",
    scholarshipName: "Karnataka Rajyotsava Scholarship",
    status: "eligible",
    score: 90,
    reasons: [
      "Domicile state is Karnataka as required",
      "Category is OBC as required",
      "Family income (₹2,80,000) is below ₹3,50,000 limit",
      "Marks (92.67%) exceed the 60% requirement",
    ],
    missingInfo: [],
    requiredDocuments: [
      "AadhaarCard",
      "CasteCertificate",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
    ],
  },
  {
    scholarshipId: "sch-007",
    scholarshipName: "Vidyasiri Scholarship",
    status: "not-eligible",
    score: 15,
    reasons: [
      "Category is OBC; Vidyasiri targets SC/ST students only",
      "Scholarship applications are currently closed",
    ],
    missingInfo: [],
    requiredDocuments: [
      "AadhaarCard",
      "CasteCertificate",
      "IncomeCertificate",
      "MarksCard",
      "BankDocument",
      "TransferCertificate",
    ],
  },
  {
    scholarshipId: "sch-008",
    scholarshipName: "INSPIRE Scholarship for Higher Education (SHE)",
    status: "possibly-eligible",
    score: 65,
    reasons: [
      "Marks (92.67%) exceed the 85% requirement",
    ],
    missingInfo: [
      "INSPIRE SHE requires students to be in top 1% of board exams — board rank not provided",
      "INSPIRE SHE is for natural/basic science streams; CSE eligibility depends on institution category",
    ],
    requiredDocuments: ["AadhaarCard", "MarksCard", "BankDocument", "Other"],
  },
];
