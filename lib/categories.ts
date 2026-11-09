// ============================================================
// ClaimWise — Vault document categories (single source of truth)
// Note: app/api/documents/route.ts keeps its own legacy copy for
// compatibility; new code should import from here.
// ============================================================

import type { DocumentType } from "./types";

export const DOCUMENT_CATEGORIES: DocumentType[] = [
  "AadhaarCard",
  "PANCard",
  "PropertyDocument",
  "InsuranceDocument",
  "BankDocument",
  "IncomeCertificate",
  "CasteCertificate",
  "MarksCard",
  "TransferCertificate",
  "Other",
];
