// ============================================================
// ClaimWise — Core TypeScript Types
// ============================================================

export type UserCategory = "General" | "SC" | "ST" | "OBC" | "EWS";
export type UserGender = "Male" | "Female" | "Other" | "Prefer not to say";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  college: string;
  course: string;
  year: string;
  /** Highest / current education level, used by the scholarship matcher. */
  educationLevel?: string;
  /** Last qualifying exam percentage (e.g. 92.67). */
  marksPercentage?: number;
  marksExam?: string;
  dob: string;
  gender: UserGender;
  state: string;
  district: string;
  religion: string;
  category: UserCategory;
  disability: boolean;
  familyIncome: number; // Annual family income in INR
  createdAt: string;
  updatedAt: string;
  profileComplete: boolean;
  isDemo?: boolean;
}

// ----------------------------------------------------------------
// Documents
// ----------------------------------------------------------------
export type DocumentType =
  | "AadhaarCard"
  | "PANCard"
  | "PropertyDocument"
  | "InsuranceDocument"
  | "BankDocument"
  | "Other"
  | "IncomeCertificate"
  | "CasteCertificate"
  | "MarksCard"
  | "TransferCertificate";

export type DocumentFileType = "pdf" | "jpg" | "jpeg" | "png";
export type DocumentStatus = "pending" | "processed" | "failed";

export interface Document {
  id: string;
  userId: string;
  /** User-facing document title. */
  name: string;
  type: DocumentType;
  description?: string;
  originalName?: string;
  fileType: DocumentFileType;
  size: number; // bytes
  uploadedAt: string;
  status: DocumentStatus;
  extractedData?: Record<string, string>;
  extractionMode?: "gemini" | "simulated";
  reviewed?: boolean;
}

// ----------------------------------------------------------------
// Scholarship
// ----------------------------------------------------------------
export type ScholarshipStatus = "open" | "closing-soon" | "closed" | "upcoming";
export type ScholarshipVerification = "verified" | "needs_verification";

export interface ScholarshipEligibility {
  minIncome?: number;
  maxIncome?: number;
  minMarks?: number;
  educationLevel?: string;
  caste?: UserCategory[];
  state?: string[];
  gender?: UserGender[];
  extraRequirements?: string[];
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: string;
  category: string[];
  eligibility: ScholarshipEligibility;
  deadline: string;
  openDate: string;
  status: ScholarshipStatus;
  description: string;
  requiredDocuments: string[];
  officialLink: string;
  officialUrl: string;
  sourceUrl: string;
  verificationStatus: ScholarshipVerification;
  lastVerifiedAt?: string;
  applicationInstructions: string;
  scholarshipType: string;
  /** Human-readable annual family income criteria, as published. */
  familyIncomeCriteria: string;
  maxIncome?: number;
  states: string[];
  educationLevel: string;
  courses: string[];
  categoryRequirements: string[];
  isDemo: boolean;
  source?: string;
  lastCheckedAt?: string;
}

// ----------------------------------------------------------------
// Applications / notifications (retained modules)
// ----------------------------------------------------------------
export type ApplicationStatus =
  | "not-started"
  | "preparing"
  | "awaiting-review"
  | "ready-to-submit"
  | "submitted"
  | "under-verification"
  | "approved"
  | "rejected"
  | "more-info-required";

export interface ApplicationTimeline {
  date: string;
  action: string;
  status: "completed" | "current" | "pending";
}

export interface Application {
  id: string;
  userId: string;
  scholarshipId: string;
  scholarshipName: string;
  status: ApplicationStatus;
  appliedDate?: string;
  notes: string;
  documents: string[];
  nextAction: string;
  timeline: ApplicationTimeline[];
}

export type NotificationType =
  | "deadline"
  | "missing-doc"
  | "status-update"
  | "new-match"
  | "reminder";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

// ----------------------------------------------------------------
// Family vault records
// ----------------------------------------------------------------

export type PropertyType =
  | "Residential"
  | "Commercial"
  | "Land"
  | "Agricultural"
  | "Other";

export interface PropertyRecord {
  id: string;
  userId: string;
  propertyName: string;
  propertyType: string;
  location: string;
  ownershipDetails: string;
  registrationNumber: string;
  registrationDate?: string;
  notes: string;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type FinancialRecordType =
  | "loan"
  | "debt"
  | "obligation"
  | "bank_reference"
  | "note";

export interface FinancialRecord {
  id: string;
  userId: string;
  recordType: string;
  institution: string;
  description: string;
  amount?: number;
  outstandingAmount?: number;
  accountReference: string;
  dueDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceRecord {
  id: string;
  userId: string;
  provider: string;
  policyType: string;
  policyNumber: string;
  policyholderName: string;
  expiryDate?: string;
  premiumAmount?: number;
  notes: string;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export type FamilyInvitationStatus = "pending" | "accepted" | "revoked";

export interface FamilyInvitation {
  id: string;
  ownerId: string;
  ownerEmail: string;
  email: string;
  relationship: string;
  status: FamilyInvitationStatus;
  token: string;
  createdAt: string;
  acceptedAt?: string;
}

export interface FamilyMember {
  id: string;
  ownerId: string;
  memberId: string;
  email: string;
  relationship: string;
  permissions: "view";
  createdAt: string;
}

export interface SharedVault {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  relationship: string;
  permissions: "view";
}

export interface SavedScholarship {
  scholarshipId: string;
  savedAt: string;
}

// ----------------------------------------------------------------
// Composite / derived types
// ----------------------------------------------------------------

export interface StudentProfile extends User {
  documents: Document[];
  applications: Application[];
}

export type EligibilityStatus =
  | "eligible"
  | "possibly-eligible"
  | "not-eligible"
  | "more-info-required";

export interface EligibilityResult {
  scholarshipId: string;
  scholarshipName: string;
  status: EligibilityStatus;
  score: number; // 0–100 confidence/match summary
  reasons: string[];
  missingInfo: string[];
  requiredDocuments: string[];
}
