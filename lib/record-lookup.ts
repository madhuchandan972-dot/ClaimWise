// ============================================================
// ClaimWise — Official Record Lookup (RD number)
//
// A curated registry of OFFICIAL Indian government portals so a
// user can find their registered document (deed, EC, land record,
// certificate...) by its registration/RD number instead of having
// to scan and upload a copy.
//
// Design rules:
//   ✅ Every URL points at a government (.gov.in / .nic.in /
//      state-run) portal — never an aggregator or middleman.
//   ✅ ClaimWise does NOT fetch, scrape or proxy these sites.
//      We only hand back a reference card: portal link + the exact
//      details to enter. The document is downloaded by the user
//      directly from the government's own server.
//   ✅ Portal menus change; steps name the service but never claim
//      a guaranteed deep link.
// ============================================================

// ----------------------------------------------------------------
// Field schema shared by lookup kinds
// ----------------------------------------------------------------

export type LookupFieldKey = "number" | "year" | "sro" | "district" | "village";

export interface LookupField {
  key: LookupFieldKey;
  label: string;
  placeholder: string;
  optional: boolean;
}

export type LookupKind = "deed" | "ec" | "certified_copy" | "land_record" | "certificate" | "marriage";

const F = {
  number: (label: string, placeholder: string): LookupField => ({ key: "number", label, placeholder, optional: false }),
  year: { key: "year", label: "Registration year", placeholder: "e.g. 2021", optional: true } as LookupField,
  sro: { key: "sro", label: "Sub-Registrar office (SRO)", placeholder: "e.g. Haveli-1 / Jayanagar", optional: true } as LookupField,
  district: { key: "district", label: "District", placeholder: "e.g. Mysuru", optional: true } as LookupField,
  village: { key: "village", label: "Village", placeholder: "As printed on the record", optional: true } as LookupField,
};

interface KindMeta {
  kindLabel: string;
  fields: LookupField[];
}

/** What each record kind needs. `number` is always the RD/registration number. */
const KIND_META: Record<LookupKind, KindMeta> = {
  deed: {
    kindLabel: "Registered deed (document search)",
    fields: [F.number("Registration / RD number", "e.g. RD-123-2021"), F.sro, F.year],
  },
  ec: {
    kindLabel: "Encumbrance certificate / Index-II check",
    fields: [F.number("Registration / RD number", "e.g. RD-123-2021"), F.sro, F.year],
  },
  certified_copy: {
    kindLabel: "Certified copy of a registered document",
    fields: [F.number("Registration / RD number", "e.g. RD-123-2021"), F.sro, F.year],
  },
  land_record: {
    kindLabel: "Land record extract (RTC / Pahani / Patta / Khatauni)",
    fields: [F.number("Survey / Khata / Case number", "As printed on the record"), F.village, F.district],
  },
  certificate: {
    kindLabel: "Government certificate (income / caste / birth…)",
    fields: [F.number("Registration / application number", "From the acknowledgement slip"), F.year, F.district],
  },
  marriage: {
    kindLabel: "Marriage registration record",
    fields: [F.number("Marriage registration number", "e.g. MH/REG/M/2023/001"), F.year],
  },
};

// ----------------------------------------------------------------
// Registry — state → official portals
// ----------------------------------------------------------------

export interface StateEntry {
  code: string;
  name: string;
  lookups: LookupEntry[];
}

export interface LookupEntry {
  /** Stable id, e.g. "ka-deed". */
  id: string;
  stateCode: string;
  kind: LookupKind;
  /** Name of the government portal (shown to user). */
  portalName: string;
  /** ONLY ever an official portal URL. */
  portalUrl: string;
  /** The service / menu item on the portal to open. */
  service: string;
  /** Optional site-specific hint. */
  note?: string;
}

function entry(stateCode: string, kind: LookupKind, portalName: string, portalUrl: string, service: string, note?: string): LookupEntry {
  return { id: `${stateCode}-${kind}`, stateCode, kind, portalName, portalUrl, service, note };
}

export const RECORD_STATES: StateEntry[] = [
  {
    code: "KA",
    name: "Karnataka",
    lookups: [
      entry("KA", "deed", "Kaveri Online Services", "https://kaverionline.karnataka.gov.in/", "e-Search / Index-II document search"),
      entry("KA", "certified_copy", "Kaveri Online Services", "https://kaverionline.karnataka.gov.in/", "Certified copy request"),
      entry("KA", "ec", "Kaveri Online Services", "https://kaverionline.karnataka.gov.in/", "Encumbrance Certificate (e-Search EC)"),
      entry("KA", "land_record", "Bhoomi (Land Records)", "https://landrecords.karnataka.gov.in/", "RTC / Pahani search"),
      entry("KA", "certificate", "Nadakacheri (e-District)", "https://nadakacheri.karnataka.gov.in/", "Certificate status / download"),
    ],
  },
  {
    code: "MH",
    name: "Maharashtra",
    lookups: [
      entry("MH", "deed", "IGR Maharashtra", "https://igrmaharashtra.gov.in/", "e-Search (Index-II document search)", "e-Search is under 'अभिलेख व भरणा' (Records & Fees) — free tier available."),
      entry("MH", "certified_copy", "IGR Maharashtra", "https://igrmaharashtra.gov.in/", "e-Sethu certified copy"),
      entry("MH", "ec", "IGR Maharashtra", "https://igrmaharashtra.gov.in/", "e-Search EC"),
      entry("MH", "land_record", "MahaBhulekh", "https://mahabhulekh.maharashtra.gov.in/", "7/12 & 8A extract search"),
      entry("MH", "certificate", "Aaple Sarkar", "https://aaplesarkar.mahaonline.gov.in/", "Track application / download certificate"),
      entry("MH", "marriage", "IGR Maharashtra", "https://igrmaharashtra.gov.in/", "Marriage registration 2.0"),
    ],
  },
  {
    code: "TN",
    name: "Tamil Nadu",
    lookups: [
      entry("TN", "deed", "TNREGINET", "https://tnreginet.gov.in/portal/", "Find Document (e-Services)"),
      entry("TN", "certified_copy", "TNREGINET", "https://tnreginet.gov.in/portal/", "Certified copy request"),
      entry("TN", "land_record", "e-Services Tamil Nadu", "https://eservices.tn.gov.in/eservicesnew/index.html", "Patta / Chitta & A-Register search"),
      entry("TN", "certificate", "TN e-Sevai", "https://tnesevai.tn.gov.in/", "Track application / download certificate"),
    ],
  },
  {
    code: "TG",
    name: "Telangana",
    lookups: [
      entry("TG", "deed", "IGRS Telangana", "https://registration.telangana.gov.in/", "e-Search document search"),
      entry("TG", "ec", "IGRS Telangana", "https://registration.telangana.gov.in/", "Encumbrance certificate"),
      entry("TG", "land_record", "Dharani", "https://dharani.telangana.gov.in/", "Pahani / PPB search"),
      entry("TG", "certificate", "Mee-Seva Telangana", "https://ts.meeseva.telangana.gov.in/", "Track application / download"),
    ],
  },
  {
    code: "AP",
    name: "Andhra Pradesh",
    lookups: [
      entry("AP", "deed", "IGRS Andhra Pradesh", "https://registration.ap.gov.in/", "Document search (e-Search)"),
      entry("AP", "ec", "IGRS Andhra Pradesh", "https://registration.ap.gov.in/", "Encumbrance certificate"),
      entry("AP", "land_record", "Meebhoomi", "https://meebhoomi.ap.gov.in/", "Adangal / 1-B / ROR-1 search"),
      entry("AP", "certificate", "AP Meeseva", "https://ap.meeseva.ap.gov.in/", "Track application / download"),
    ],
  },
  {
    code: "KL",
    name: "Kerala",
    lookups: [
      entry("KL", "deed", "IGRS Kerala", "https://registration.kerala.gov.in/", "Registry search / certified copy"),
      entry("KL", "certificate", "e-District Kerala", "https://edistrict.kerala.gov.in/", "Track application / download"),
    ],
  },
  {
    code: "UP",
    name: "Uttar Pradesh",
    lookups: [
      entry("UP", "deed", "IGRSUP", "https://igrsup.gov.in/", "e-Search (साध) document search"),
      entry("UP", "land_record", "UP Bhulekh", "https://upbhulekh.gov.in/", "Khasra / Khatauni search"),
      entry("UP", "certificate", "e-District UP", "https://edistrict.up.gov.in/", "Track application / download"),
    ],
  },
  {
    code: "GJ",
    name: "Gujarat",
    lookups: [
      entry("GJ", "deed", "IGRS Gujarat", "https://igr.gujarat.gov.in/", "Document search"),
      entry("GJ", "land_record", "AnyROR", "https://anyror.gujarat.gov.in/", "VF-7 / VF-6 land record search"),
      entry("GJ", "certificate", "Digital Gujarat", "https://www.digitalgujarat.gov.in/", "Track application / download"),
    ],
  },
  {
    code: "DL",
    name: "Delhi",
    lookups: [
      entry("DL", "deed", "DORIS Delhi", "https://doris.delhigovt.nic.in/", "Document search / inquiry"),
      entry("DL", "certificate", "e-District Delhi", "https://edistrict.delhigovt.nic.in/", "Track application / download"),
    ],
  },
  {
    code: "RJ",
    name: "Rajasthan",
    lookups: [
      entry("RJ", "deed", "IGRS Rajasthan", "https://igrs.rajasthan.gov.in/", "Document search"),
      entry("RJ", "land_record", "Bhulekh Rajasthan", "https://bhulekh.rajasthan.gov.in/", "Khasra / Girdawari search"),
      entry("RJ", "certificate", "e-Mitra", "https://emitra.rajasthan.gov.in/", "Track application / download"),
    ],
  },
  {
    code: "MP",
    name: "Madhya Pradesh",
    lookups: [
      entry("MP", "deed", "MP Stamps & Registration", "https://mpregistration.gov.in/", "Document search"),
      entry("MP", "land_record", "MP Bhulekh", "https://mpbhulekh.gov.in/", "Khasra / B-1 search"),
      entry("MP", "certificate", "e-District MP", "https://edistrict.mp.gov.in/", "Track application / download"),
    ],
  },
  {
    code: "BR",
    name: "Bihar",
    lookups: [
      entry("BR", "deed", "Registration Dept. Bihar", "https://registration.bihar.gov.in/", "Document search / deed registration records"),
      entry("BR", "land_record", "Bhulekh Bihar", "https://bhulekh.bihar.gov.in/", "Jamabandi / Khesra search"),
      entry("BR", "certificate", "RTPS Bihar", "https://rtps.bihar.gov.in/", "Track application / download"),
    ],
  },
  {
    code: "WB",
    name: "West Bengal",
    lookups: [
      entry("WB", "deed", "WB Registration", "https://wbregistration.gov.in/", "e-Ghatalani / document search"),
      entry("WB", "land_record", "Banglar Bhumi", "https://banglarbhumi.gov.in/", "Khatian & Plot information"),
    ],
  },
  {
    code: "PB",
    name: "Punjab",
    lookups: [
      entry("PB", "deed", "IGR Punjab", "https://igrpunjab.gov.in/", "Document search"),
      entry("PB", "land_record", "PLRS Punjab", "https://plrs.gov.in/", "Jamabandi / Fard search"),
    ],
  },
  {
    code: "HR",
    name: "Haryana",
    lookups: [
      entry("HR", "land_record", "Jamabandi Haryana", "https://jamabandi.nic.in/", "Jamabandi / mutation search"),
    ],
  },
  {
    code: "OD",
    name: "Odisha",
    lookups: [
      entry("OD", "deed", "IGR Odisha", "https://igrodisha.gov.in/", "Document search"),
      entry("OD", "land_record", "Bhulekh Odisha", "https://bhulekh.odisha.gov.in/", "ROR / Khewat search"),
      entry("OD", "certificate", "e-District Odisha", "https://edistrict.odisha.gov.in/", "Track application / download"),
    ],
  },
  {
    code: "JH",
    name: "Jharkhand",
    lookups: [
      entry("JH", "deed", "Registration, Stamps & Registration — Jharkhand", "https://registration.jharkhand.gov.in/", "Document search"),
      entry("JH", "land_record", "JharBhoomi", "https://jharbhoomi.jharkhand.gov.in/", "Khata / register-II search"),
    ],
  },
];

// ----------------------------------------------------------------
// Lookups + validation helpers
// ----------------------------------------------------------------

export function getState(code: string): StateEntry | undefined {
  return RECORD_STATES.find((s) => s.code === code);
}

export function getLookupEntry(entryId: string): LookupEntry | undefined {
  for (const s of RECORD_STATES) {
    const e = s.lookups.find((l) => l.id === entryId);
    if (e) return e;
  }
  return undefined;
}

export function kindLabel(kind: LookupKind): string {
  return KIND_META[kind].kindLabel;
}

/** Field schema for a lookup entry (from its kind). */
export function fieldsFor(entry: LookupEntry): LookupField[] {
  return KIND_META[entry.kind].fields;
}

/** Sanitised, length-capped field values allowed for an entry. */
export function cleanValues(entry: LookupEntry, raw: Record<string, unknown>): Record<string, string> {
  const allowed = new Set(fieldsFor(entry).map((f) => f.key as string));
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(raw ?? {})) {
    if (!allowed.has(k)) continue;
    const s = String(val ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
    if (s) out[k] = s;
  }
  return out;
}

export function valuesComplete(entry: LookupEntry, values: Record<string, string>): boolean {
  return fieldsFor(entry).every((f) => f.optional || !!values[f.key]);
}

export interface BuiltReference {
  entryId: string;
  kind: LookupKind;
  kindLabel: string;
  stateName: string;
  portalName: string;
  portalUrl: string;
  service: string;
  steps: string[];
  details: { label: string; value: string }[];
  note?: string;
}

/** Builds the full reference card shown to the user. */
export function buildReference(entryId: string, values: Record<string, string>): BuiltReference | null {
  const entry = getLookupEntry(entryId);
  const state = getState(entry?.stateCode ?? "");
  if (!entry || !state) return null;

  const cleaned = cleanValues(entry, values);
  if (!valuesComplete(entry, cleaned)) return null;

  const details = fieldsFor(entry)
    .filter((f) => cleaned[f.key])
    .map((f) => ({ label: f.label, value: cleaned[f.key] }));

  return {
    entryId: entry.id,
    kind: entry.kind,
    kindLabel: KIND_META[entry.kind].kindLabel,
    stateName: state.name,
    portalName: entry.portalName,
    portalUrl: entry.portalUrl,
    service: entry.service,
    steps: [
      `Open ${entry.portalName} using the button below — it goes straight to the government's website.`,
      `Choose the "${entry.service}" service. (Menu wording can change; you may need to solve a captcha/coupon first.)`,
      "Enter the details listed below exactly as they appear on your registration slip or photocopy.",
      "View or download the document yourself. ClaimWise never hosts or proxies government files — everything comes from the official server.",
    ],
    details,
    note: entry.note,
  };
}
