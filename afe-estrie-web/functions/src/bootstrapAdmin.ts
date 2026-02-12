import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * One-time function:
 * - Only YOUR email can call it
 * - It sets your claims: admin + role
 * Deploy -> call once -> delete file -> redeploy
 */
export const bootstrapAdmin = onCall({ cors: true }, async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "Login required");

  const callerEmail = String(req.auth?.token?.email || "").toLowerCase();

  const allowed = ["dmunoz_it@outlook.com"];
  if (!allowed.includes(callerEmail)) throw new HttpsError("permission-denied", "Not allowed");

  await admin.auth().setCustomUserClaims(req.auth.uid, { admin: true, role: "admin" });

  return { ok: true };
});
