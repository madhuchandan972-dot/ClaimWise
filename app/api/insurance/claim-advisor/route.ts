// ============================================================
// ClaimWise — POST /api/insurance/claim-advisor
//
// AI Insurance Claim Advisor ("Can I Claim This?"):
// Grounded in the user's real insurance policies, IRDAI
// guidelines, cashless vs reimbursement procedures, and
// claim rejection prevention steps.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth";
import { listInsuranceRecords } from "@/lib/vault";
import { describeAiFailure } from "@/lib/ai";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(3000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(25),
  policyId: z.string().optional(),
});

const CLAIM_SYSTEM_PROMPT = `You are the ClaimWise AI Claim Advisor ("Can I Claim This?") for Indian insurance policyholders.
Your purpose is to give clear, realistic, and highly practical claim advice governed by IRDAI (Insurance Regulatory and Development Authority of India) standards.

When a user describes an accident, medical condition, hospitalization, property damage, or loss:
1. **Coverage Assessment & Eligibility**:
   - State clearly if this is typically COVERED, PARTIALLY COVERED (subject to sub-limits/deductibles), or EXCLUDED under the user's policy type.
   - Explain Cashless vs. Reimbursement options.
   - Warn about common traps: Room Rent Capping (and the dangerous "Proportionate Deduction" rule across all doctor/surgeon fees), Co-pay clauses, Pre-existing Disease (PED) waiting periods (usually 2-3 years), and 30-day initial waiting period for illnesses (except accidental hospitalization).
2. **Immediate Action Steps (Time-Critical)**:
   - Planned hospitalization: Intimate TPA/Insurer at least 48-72 hours in advance.
   - Emergency hospitalization: Intimate within 24 hours of admission.
   - Motor accidents/damage: Take geo-tagged photos/videos immediately before moving or repairing the vehicle. Check if an FIR / Panchnama is needed.
3. **Mandatory Documentation Checklist**:
   - Give an itemized checklist of exact papers required (e.g. Original discharge summary, itemized hospital bill, doctor's prescription for every diagnostic test, indoor case papers, cancelled cheque with printed name, KYC documents).
4. **Rejection Prevention Pro-Tips**:
   - Explain non-payable items (gloves, masks, registration charges, admin fees).
   - In motor claims: check if the estimated repair cost exceeds the No-Claim Bonus (NCB) discount to advise whether claiming is financially wise.
5. **Tone & Honesty**:
   - Empathetic, calm, structured, and easy to read with Markdown bullet points and bold highlights.
   - If the user's uploaded policy notes do not specify their exact sum insured or sub-limit, clearly advise them to check their specific policy schedule with their TPA/insurer helpline.`;

async function callGeminiRaw(messages: { role: "user" | "assistant"; content: string }[], systemPrompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_KEY_MISSING");

  const models = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
  let lastErr = "";

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: messages.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: { temperature: 0.35, maxOutputTokens: 1024 },
          }),
          signal: AbortSignal.timeout(45_000),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
        if (text) return text;
      } else {
        const raw = await res.text().catch(() => "");
        lastErr = raw;
      }
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }

  throw new Error(lastErr || "Failed to communicate with Gemini AI.");
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in." }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid request format." }, { status: 400 });
  }

  const { messages, policyId } = parsed.data;

  // Retrieve user's actual registered insurance policies
  let userPoliciesContext = "No insurance policies currently added in ClaimWise.";
  try {
    const policies = await listInsuranceRecords(session.sub);
    if (policies.length > 0) {
      const lines = policies.map((p) => {
        const activeMarker = policyId === p.id ? " [CURRENTLY SELECTED FOR THIS QUERY]" : "";
        return `- ${p.provider} (${p.policyType} Insurance)${activeMarker}: Policy #${p.policyNumber || "Not recorded"}, Policyholder: ${p.policyholderName || "Self"}, Expiry: ${p.expiryDate || "Not specified"}, Premium: ₹${p.premiumAmount ?? "N/A"}. Notes: ${p.notes || "None"}`;
      });
      userPoliciesContext = `User's Registered Policies in ClaimWise:\n${lines.join("\n")}`;
    }
  } catch (err) {
    console.error("[claim-advisor] could not load policies:", err);
  }

  const fullSystemPrompt = `${CLAIM_SYSTEM_PROMPT}\n\n${userPoliciesContext}`;

  try {
    const reply = await callGeminiRaw(messages, fullSystemPrompt);
    return NextResponse.json({ success: true, reply, mode: "gemini" });
  } catch (err) {
    console.warn("[claim-advisor] Gemini call fallback:", err);

    // Smart, high-utility rule-based claim guidance if API key is absent or depleted
    const lastUserMsg = messages[messages.length - 1]?.content.toLowerCase() || "";
    const isHealth = lastUserMsg.includes("health") || lastUserMsg.includes("hospital") || lastUserMsg.includes("surgery") || lastUserMsg.includes("doctor") || lastUserMsg.includes("medical") || lastUserMsg.includes("cataract") || lastUserMsg.includes("fever") || lastUserMsg.includes("admit");
    const isMotor = lastUserMsg.includes("car") || lastUserMsg.includes("bike") || lastUserMsg.includes("vehicle") || lastUserMsg.includes("accident") || lastUserMsg.includes("dent") || lastUserMsg.includes("scratch") || lastUserMsg.includes("bumper");

    let fallbackReply = "";
    if (isHealth) {
      fallbackReply = `### 🏥 Health Insurance Claim Assessment\n\n**1. Cashless vs. Reimbursement:**\n- **Network Hospital:** Approach the hospital's TPA / Insurance desk immediately. Planned admissions require pre-authorization 48 hours prior; emergency admissions must be intimated within **24 hours**.\n- **Non-Network Hospital:** You must pay upfront and submit original bills for reimbursement within 15–30 days of discharge.\n\n**2. Key Coverage & Traps to Watch:**\n- **Room Rent Limit:** If your policy has a 1% room rent cap and you take an expensive room, the **Proportionate Deduction rule** will penalize doctor fees, nursing, and surgery costs proportionately!\n- **Waiting Periods:** Initial 30 days for new policies (except accidents), 24 months for specific ailments (hernia, cataract, joints), and 2–3 years for pre-existing diseases.\n\n**3. Required Documents:**\n- Original Discharge Summary with complete clinical notes\n- Final itemized hospital bill + payment receipts\n- Doctor's prescription for every diagnostic test / scan\n- Pharmacy bills with matching batch numbers\n- Pre-authorization request form & KYC documents\n\n*Tip: Non-medical consumables (gloves, masks, PPE, admin charges) are typically not payable under standard IRDAI guidelines unless you have a Consumables add-on.*`;
    } else if (isMotor) {
      fallbackReply = `### 🚗 Motor / Vehicle Insurance Claim Guidance\n\n**1. Immediate Action Before Moving Vehicle:**\n- Take clear, wide-angle photos and videos of the damage, vehicle registration plate, and the accident spot.\n- **Do not repair the car before the surveyor's inspection**, or the claim will be outright rejected.\n\n**2. The NCB (No Claim Bonus) Calculation:**\n- If the repair estimate is minor (e.g. ₹2,000 – ₹4,000 for a small scratch or bumper touch-up), it is usually cheaper to pay out-of-pocket to protect your **20% to 50% No Claim Bonus** discount on your renewal premium.\n\n**3. Required Documents:**\n- Duly signed Claim Form\n- Copy of Vehicle Registration Certificate (RC)\n- Copy of valid Driving License of the person driving\n- Original repair estimate bill from the workshop\n- Police FIR / Panchnama (mandatory if third-party injury, death, or major highway accident occurred).`;
    } else {
      fallbackReply = `### 📋 ClaimWise Claim Advisor\n\nTo file an insurance claim successfully under IRDAI guidelines, follow these core rules:\n\n1. **Intimation Timing:** Notify your insurer or TPA as soon as possible. Delays in notification are one of the top causes for claim queries and rejections.\n2. **Keep All Originals:** Never discard original receipts, medical prescriptions, bills, or diagnostic reports until your claim is settled.\n3. **Policy Exclusions:** Always check your specific policy schedule for deductibles, co-payment percentages, and sub-limits.\n\n*You can select one of your registered policies above and ask about specific procedures, surgeries, or damage repairs!*`;
    }

    return NextResponse.json({
      success: true,
      reply: fallbackReply,
      mode: "simulated",
    });
  }
}
