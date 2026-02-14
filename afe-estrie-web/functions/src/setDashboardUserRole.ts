import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

type Role = "admin" | "editor" | "viewer";

function assertRole(role: any): role is Role {
  return role === "admin" || role === "editor" || role === "viewer";
}

export const setDashboardUserRole = onCall({ cors: true }, async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Not authenticated.");

  const callerUid = req.auth.uid;
  const { uid, role } = (req.data ?? {}) as { uid?: string; role?: Role };

  if (!uid) throw new HttpsError("invalid-argument", "Missing uid.");
  if (!assertRole(role)) throw new HttpsError("invalid-argument", "Invalid role.");

  if (uid === callerUid) {
    throw new HttpsError("failed-precondition", "You cannot change your own role.");
  }

  // Ensure caller is admin
  const caller = await admin.auth().getUser(callerUid);
  const callerRole = (caller.customClaims?.role as Role) || (caller.customClaims?.admin ? "admin" : "viewer");
  if (callerRole !== "admin") throw new HttpsError("permission-denied", "Admins only.");

  // Update claims for target user
  await admin.auth().setCustomUserClaims(uid, { role });

  // Update Firestore
  await admin.firestore().doc(`admin_users/${uid}`).set(
    { role, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );

  return { ok: true };
});
