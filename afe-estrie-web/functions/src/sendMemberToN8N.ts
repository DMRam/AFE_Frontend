import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

function getN8NWebhookUrl(): string {
  // 1) From env var (recommended)
  const url = (process.env.N8N_WEBHOOK_URL || "").trim();
  if (url.startsWith("http")) return url;

  throw new Error("N8N_WEBHOOK_URL is not configured");
}

export const sendMemberToN8N = onCall(async (request) => {
  const { memberId } = request.data as { memberId?: string };

  if (!memberId) {
    throw new HttpsError("invalid-argument", "memberId is required");
  }

  try {
    const snap = await admin.firestore().collection("members").doc(memberId).get();
    if (!snap.exists) {
      throw new HttpsError("not-found", "Member not found");
    }

    const member = snap.data() || {};
    const webhookUrl = getN8NWebhookUrl();

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId,
        email: member.email ?? "",
        fullName: member.fullName ?? "",
        city: member.city ?? "",
        status: member.status ?? "",
      }),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw new Error(`n8n error ${res.status}: ${text || "no body"}`);
    }

    return { ok: true };
  } catch (err: any) {
    console.error("[sendMemberToN8N]", err);
    return { ok: false, error: err?.message ?? "Unknown error" };
  }
});