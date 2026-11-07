// ============================================================
// ClaimWise — Family Vault data access
//
// Every function runs with the caller's Supabase session. The
// database enforces RLS on top of the explicit ownership filters:
//   • owners can read/write their own rows
//   • accepted family members can read the owner's rows
//   • nobody else can read anything
//
// No function accepts a user id from the browser for writes — the
// API routes always pass the id from the verified server session.
// ============================================================

import { createSupabaseServerClient } from "./supabase/server";
import type {
  EmergencyContact,
  FamilyInvitation,
  FamilyMember,
  FinancialRecord,
  InsuranceRecord,
  PropertyRecord,
  SavedScholarship,
  SharedVault,
} from "./types";

const SCHEMA_HINT =
  "The family vault tables are not initialised yet. Run supabase/migrations/003_family_vault.sql in the Supabase SQL editor, then reload.";

export function vaultError(operation: string, error: { message: string }): Error {
  const m = error.message.toLowerCase();
  if (
    m.includes("does not exist") ||
    m.includes("relation") ||
    m.includes("schema cache") ||
    m.includes("could not find the table") ||
    m.includes("could not find the function") ||
    (m.includes("function") && m.includes("not found"))
  ) {
    console.error(`[vault:${operation}] schema error:`, error.message);
    return new Error(SCHEMA_HINT);
  }
  console.error(`[vault:${operation}]`, error.message);
  return new Error("A database error occurred. Please try again.");
}

// ----------------------------------------------------------------
// Row mappers
// ----------------------------------------------------------------

type PropertyRow = {
  id: string;
  user_id: string;
  property_name: string;
  property_type: string;
  location: string | null;
  ownership_details: string | null;
  registration_number: string | null;
  registration_date: string | null;
  notes: string | null;
  document_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

function toProperty(row: PropertyRow): PropertyRecord {
  return {
    id: row.id,
    userId: row.user_id,
    propertyName: row.property_name,
    propertyType: row.property_type,
    location: row.location ?? "",
    ownershipDetails: row.ownership_details ?? "",
    registrationNumber: row.registration_number ?? "",
    registrationDate: row.registration_date ?? undefined,
    notes: row.notes ?? "",
    documentIds: row.document_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type FinancialRow = {
  id: string;
  user_id: string;
  record_type: string;
  institution: string | null;
  description: string;
  amount: number | string | null;
  outstanding_amount: number | string | null;
  account_reference: string | null;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function toFinancial(row: FinancialRow): FinancialRecord {
  return {
    id: row.id,
    userId: row.user_id,
    recordType: row.record_type,
    institution: row.institution ?? "",
    description: row.description,
    amount: row.amount === null ? undefined : Number(row.amount),
    outstandingAmount:
      row.outstanding_amount === null ? undefined : Number(row.outstanding_amount),
    accountReference: row.account_reference ?? "",
    dueDate: row.due_date ?? undefined,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type InsuranceRow = {
  id: string;
  user_id: string;
  provider: string;
  policy_type: string;
  policy_number: string | null;
  policyholder_name: string | null;
  expiry_date: string | null;
  premium_amount: number | string | null;
  notes: string | null;
  document_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

function toInsurance(row: InsuranceRow): InsuranceRecord {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    policyType: row.policy_type,
    policyNumber: row.policy_number ?? "",
    policyholderName: row.policyholder_name ?? "",
    expiryDate: row.expiry_date ?? undefined,
    premiumAmount:
      row.premium_amount === null ? undefined : Number(row.premium_amount),
    notes: row.notes ?? "",
    documentIds: row.document_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ContactRow = {
  id: string;
  user_id: string;
  name: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

function toContact(row: ContactRow): EmergencyContact {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    relationship: row.relationship ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type InvitationRow = {
  id: string;
  owner_id: string;
  owner_email: string | null;
  email: string;
  relationship: string | null;
  status: FamilyInvitation["status"];
  token: string;
  created_at: string;
  accepted_at: string | null;
};

function toInvitation(row: InvitationRow): FamilyInvitation {
  return {
    id: row.id,
    ownerId: row.owner_id,
    ownerEmail: row.owner_email ?? "",
    email: row.email,
    relationship: row.relationship ?? "Family member",
    status: row.status,
    token: row.token,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at ?? undefined,
  };
}

type MemberRow = {
  id: string;
  owner_id: string;
  member_id: string;
  email: string;
  relationship: string | null;
  permissions: "view";
  created_at: string;
};

function toMember(row: MemberRow): FamilyMember {
  return {
    id: row.id,
    ownerId: row.owner_id,
    memberId: row.member_id,
    email: row.email,
    relationship: row.relationship ?? "Family member",
    permissions: row.permissions,
    createdAt: row.created_at,
  };
}

// ----------------------------------------------------------------
// Properties
// ----------------------------------------------------------------

export interface PropertyInput {
  propertyName: string;
  propertyType: string;
  location?: string;
  ownershipDetails?: string;
  registrationNumber?: string;
  registrationDate?: string | null;
  notes?: string;
  documentIds?: string[];
}

function propertyPatch(input: PropertyInput) {
  return {
    property_name: input.propertyName,
    property_type: input.propertyType,
    location: input.location ?? "",
    ownership_details: input.ownershipDetails ?? "",
    registration_number: input.registrationNumber ?? "",
    registration_date: input.registrationDate ? input.registrationDate : null,
    notes: input.notes ?? "",
    document_ids: input.documentIds ?? [],
  };
}

export async function listProperties(userId: string): Promise<PropertyRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw vaultError("listProperties", error);
  return (data ?? []).map((row) => toProperty(row as PropertyRow));
}

export async function createProperty(
  userId: string,
  input: PropertyInput
): Promise<PropertyRecord> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({ user_id: userId, ...propertyPatch(input) })
    .select("*")
    .single();
  if (error) throw vaultError("createProperty", error);
  return toProperty(data as PropertyRow);
}

export async function updateProperty(
  id: string,
  userId: string,
  input: PropertyInput
): Promise<PropertyRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("properties")
    .update({ ...propertyPatch(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error) throw vaultError("updateProperty", error);
  return data ? toProperty(data as PropertyRow) : null;
}

export async function deleteProperty(id: string, userId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("properties")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw vaultError("deleteProperty", error);
  return true;
}

// ----------------------------------------------------------------
// Financial records
// ----------------------------------------------------------------

export interface FinancialInput {
  recordType: string;
  institution?: string;
  description: string;
  amount?: number | null;
  outstandingAmount?: number | null;
  accountReference?: string;
  dueDate?: string | null;
  notes?: string;
}

function financialPatch(input: FinancialInput) {
  return {
    record_type: input.recordType,
    institution: input.institution ?? "",
    description: input.description,
    amount: input.amount ?? null,
    outstanding_amount: input.outstandingAmount ?? null,
    account_reference: input.accountReference ?? "",
    due_date: input.dueDate ? input.dueDate : null,
    notes: input.notes ?? "",
  };
}

export async function listFinancialRecords(
  userId: string
): Promise<FinancialRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("financial_records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw vaultError("listFinancialRecords", error);
  return (data ?? []).map((row) => toFinancial(row as FinancialRow));
}

export async function createFinancialRecord(
  userId: string,
  input: FinancialInput
): Promise<FinancialRecord> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("financial_records")
    .insert({ user_id: userId, ...financialPatch(input) })
    .select("*")
    .single();
  if (error) throw vaultError("createFinancialRecord", error);
  return toFinancial(data as FinancialRow);
}

export async function updateFinancialRecord(
  id: string,
  userId: string,
  input: FinancialInput
): Promise<FinancialRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("financial_records")
    .update({ ...financialPatch(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error) throw vaultError("updateFinancialRecord", error);
  return data ? toFinancial(data as FinancialRow) : null;
}

export async function deleteFinancialRecord(
  id: string,
  userId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("financial_records")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw vaultError("deleteFinancialRecord", error);
  return true;
}

// ----------------------------------------------------------------
// Insurance records
// ----------------------------------------------------------------

export interface InsuranceInput {
  provider: string;
  policyType: string;
  policyNumber?: string;
  policyholderName?: string;
  expiryDate?: string | null;
  premiumAmount?: number | null;
  notes?: string;
  documentIds?: string[];
}

function insurancePatch(input: InsuranceInput) {
  return {
    provider: input.provider,
    policy_type: input.policyType,
    policy_number: input.policyNumber ?? "",
    policyholder_name: input.policyholderName ?? "",
    expiry_date: input.expiryDate ? input.expiryDate : null,
    premium_amount: input.premiumAmount ?? null,
    notes: input.notes ?? "",
    document_ids: input.documentIds ?? [],
  };
}

export async function listInsuranceRecords(
  userId: string
): Promise<InsuranceRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("insurance_records")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw vaultError("listInsuranceRecords", error);
  return (data ?? []).map((row) => toInsurance(row as InsuranceRow));
}

export async function createInsuranceRecord(
  userId: string,
  input: InsuranceInput
): Promise<InsuranceRecord> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("insurance_records")
    .insert({ user_id: userId, ...insurancePatch(input) })
    .select("*")
    .single();
  if (error) throw vaultError("createInsuranceRecord", error);
  return toInsurance(data as InsuranceRow);
}

export async function updateInsuranceRecord(
  id: string,
  userId: string,
  input: InsuranceInput
): Promise<InsuranceRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("insurance_records")
    .update({ ...insurancePatch(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error) throw vaultError("updateInsuranceRecord", error);
  return data ? toInsurance(data as InsuranceRow) : null;
}

export async function deleteInsuranceRecord(
  id: string,
  userId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("insurance_records")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw vaultError("deleteInsuranceRecord", error);
  return true;
}

// ----------------------------------------------------------------
// Emergency contacts
// ----------------------------------------------------------------

export interface ContactInput {
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
}

function contactPatch(input: ContactInput) {
  return {
    name: input.name,
    relationship: input.relationship ?? "",
    phone: input.phone ?? "",
    email: input.email ?? "",
  };
}

export async function listEmergencyContacts(
  userId: string
): Promise<EmergencyContact[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw vaultError("listEmergencyContacts", error);
  return (data ?? []).map((row) => toContact(row as ContactRow));
}

export async function createEmergencyContact(
  userId: string,
  input: ContactInput
): Promise<EmergencyContact> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("emergency_contacts")
    .insert({ user_id: userId, ...contactPatch(input) })
    .select("*")
    .single();
  if (error) throw vaultError("createEmergencyContact", error);
  return toContact(data as ContactRow);
}

export async function updateEmergencyContact(
  id: string,
  userId: string,
  input: ContactInput
): Promise<EmergencyContact | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("emergency_contacts")
    .update({ ...contactPatch(input), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error) throw vaultError("updateEmergencyContact", error);
  return data ? toContact(data as ContactRow) : null;
}

export async function deleteEmergencyContact(
  id: string,
  userId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("emergency_contacts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw vaultError("deleteEmergencyContact", error);
  return true;
}

// ----------------------------------------------------------------
// Family access
// ----------------------------------------------------------------

export async function listSentInvitations(
  ownerId: string
): Promise<FamilyInvitation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("family_invitations")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw vaultError("listSentInvitations", error);
  return (data ?? []).map((row) => toInvitation(row as InvitationRow));
}

export async function listReceivedInvitations(
  email: string
): Promise<FamilyInvitation[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("family_invitations")
    .select("*")
    .ilike("email", email)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw vaultError("listReceivedInvitations", error);
  return (data ?? []).map((row) => toInvitation(row as InvitationRow));
}

export async function createInvitation(
  ownerId: string,
  ownerEmail: string,
  email: string,
  relationship: string
): Promise<FamilyInvitation> {
  const supabase = await createSupabaseServerClient();
  const address = email.trim().toLowerCase();

  if (address === ownerEmail.trim().toLowerCase()) {
    throw new Error("You cannot invite your own email address.");
  }

  // Do not create a second live invitation/membership for the same person.
  const { data: existing } = await supabase
    .from("family_invitations")
    .select("id, status")
    .eq("owner_id", ownerId)
    .ilike("email", address)
    .in("status", ["pending", "accepted"])
    .maybeSingle();
  if (existing) {
    throw new Error(
      existing.status === "accepted"
        ? "This family member already has access to your vault."
        : "An invitation is already pending for this email address."
    );
  }

  const { data, error } = await supabase
    .from("family_invitations")
    .insert({
      owner_id: ownerId,
      owner_email: ownerEmail,
      email: address,
      relationship,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw vaultError("createInvitation", error);
  return toInvitation(data as InvitationRow);
}

export async function revokeInvitation(
  id: string,
  ownerId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("family_invitations")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select("id")
    .maybeSingle();
  if (error) throw vaultError("revokeInvitation", error);
  if (!data) return false;

  // Revoking access also removes an already accepted membership.
  const { error: memberError } = await supabase
    .from("family_members")
    .delete()
    .eq("invitation_id", id)
    .eq("owner_id", ownerId);
  if (memberError) throw vaultError("revokeInvitation.member", memberError);

  return true;
}

export async function listFamilyMembers(ownerId: string): Promise<FamilyMember[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw vaultError("listFamilyMembers", error);
  return (data ?? []).map((row) => toMember(row as MemberRow));
}

export async function removeFamilyMember(
  id: string,
  ownerId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId);
  if (error) throw vaultError("removeFamilyMember", error);
  return true;
}

export async function acceptInvitation(token: string): Promise<string> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("accept_family_invitation", {
    p_token: token,
  });
  if (error) {
    const message = error.message.replace(/^.*?:\s*/, "");
    throw new Error(message || "Could not accept this invitation.");
  }
  if (!data) throw new Error("Could not accept this invitation.");
  return data as string;
}

/** Vaults shared WITH the signed-in user (read-only). */
export async function listSharedVaults(memberId: string): Promise<SharedVault[]> {
  const supabase = await createSupabaseServerClient();
  const { data: memberships, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("member_id", memberId);
  if (error) throw vaultError("listSharedVaults", error);
  const rows = (memberships ?? []) as MemberRow[];
  if (rows.length === 0) return [];

  const ownerIds = [...new Set(rows.map((m) => m.owner_id))];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", ownerIds);
  if (profileError) throw vaultError("listSharedVaults.profiles", profileError);

  const byId = new Map(
    (profiles ?? []).map((p) => [p.id as string, p as { id: string; name: string; email: string }])
  );

  return rows.map((m) => ({
    ownerId: m.owner_id,
    ownerName: byId.get(m.owner_id)?.name ?? "Family owner",
    ownerEmail: byId.get(m.owner_id)?.email ?? "",
    relationship: m.relationship ?? "Family member",
    permissions: "view",
  }));
}

export async function canAccessVault(
  ownerId: string,
  viewerId: string
): Promise<boolean> {
  if (ownerId === viewerId) return true;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("member_id", viewerId)
    .maybeSingle();
  if (error) throw vaultError("canAccessVault", error);
  return Boolean(data);
}

// ----------------------------------------------------------------
// Shared vault (read-only view for an accepted family member)
// ----------------------------------------------------------------

export interface SharedVaultData {
  owner: { id: string; name: string; email: string };
  relationship: string;
  properties: PropertyRecord[];
  financialRecords: FinancialRecord[];
  insuranceRecords: InsuranceRecord[];
  contacts: EmergencyContact[];
}

export async function getSharedVault(
  ownerId: string,
  viewerId: string
): Promise<SharedVaultData | null> {
  if (!(await canAccessVault(ownerId, viewerId))) return null;

  const supabase = await createSupabaseServerClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", ownerId)
    .maybeSingle();
  if (profileError) throw vaultError("getSharedVault.profile", profileError);
  if (!profile) return null;

  const { data: membership } = await supabase
    .from("family_members")
    .select("relationship")
    .eq("owner_id", ownerId)
    .eq("member_id", viewerId)
    .maybeSingle();

  const [properties, financial, insurance, contacts] = await Promise.all([
    supabase.from("properties").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("financial_records").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("insurance_records").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }),
    supabase.from("emergency_contacts").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }),
  ]);

  const firstError = properties.error || financial.error || insurance.error || contacts.error;
  if (firstError) throw vaultError("getSharedVault", firstError);

  return {
    owner: {
      id: profile.id as string,
      name: (profile.name as string) || "Family owner",
      email: (profile.email as string) || "",
    },
    relationship: (membership?.relationship as string) || "Family member",
    properties: (properties.data ?? []).map((r) => toProperty(r as PropertyRow)),
    financialRecords: (financial.data ?? []).map((r) => toFinancial(r as FinancialRow)),
    insuranceRecords: (insurance.data ?? []).map((r) => toInsurance(r as InsuranceRow)),
    contacts: (contacts.data ?? []).map((r) => toContact(r as ContactRow)),
  };
}

// ----------------------------------------------------------------
// Saved scholarships
// ----------------------------------------------------------------

export async function listSavedScholarships(
  userId: string
): Promise<SavedScholarship[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("saved_scholarships")
    .select("scholarship_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw vaultError("listSavedScholarships", error);
  return (data ?? []).map((row) => ({
    scholarshipId: row.scholarship_id as string,
    savedAt: row.created_at as string,
  }));
}

export async function saveScholarship(
  userId: string,
  scholarshipId: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("saved_scholarships")
    .upsert(
      { user_id: userId, scholarship_id: scholarshipId },
      { onConflict: "user_id,scholarship_id" }
    );
  if (error) throw vaultError("saveScholarship", error);
}

export async function unsaveScholarship(
  userId: string,
  scholarshipId: string
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("saved_scholarships")
    .delete()
    .eq("user_id", userId)
    .eq("scholarship_id", scholarshipId);
  if (error) throw vaultError("unsaveScholarship", error);
}

// ----------------------------------------------------------------
// Overview counts
// ----------------------------------------------------------------

export interface VaultOverview {
  documents: number;
  properties: number;
  financialRecords: number;
  insuranceRecords: number;
  emergencyContacts: number;
  familyMembers: number;
  pendingInvitations: number;
  savedScholarships: number;
}

async function countRows(
  table: string,
  filterColumn: string,
  filterValue: string,
  extra?: { column: string; value: string }
): Promise<number> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq(filterColumn, filterValue);
  if (extra) query = query.eq(extra.column, extra.value);
  const { count, error } = await query;
  if (error) throw vaultError(`count:${table}`, error);
  return count ?? 0;
}

export async function getVaultOverview(userId: string): Promise<VaultOverview> {
  const [
    documents,
    properties,
    financialRecords,
    insuranceRecords,
    emergencyContacts,
    familyMembers,
    pendingInvitations,
    savedScholarships,
  ] = await Promise.all([
    countRows("documents", "user_id", userId),
    countRows("properties", "user_id", userId),
    countRows("financial_records", "user_id", userId),
    countRows("insurance_records", "user_id", userId),
    countRows("emergency_contacts", "user_id", userId),
    countRows("family_members", "owner_id", userId),
    countRows("family_invitations", "owner_id", userId, {
      column: "status",
      value: "pending",
    }),
    countRows("saved_scholarships", "user_id", userId),
  ]);

  return {
    documents,
    properties,
    financialRecords,
    insuranceRecords,
    emergencyContacts,
    familyMembers,
    pendingInvitations,
    savedScholarships,
  };
}
