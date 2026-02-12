import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Expect: caller must be superadmin/admin via custom claims.
 * We'll check request.auth.token.admin === true
 */
function assertAdmin(context: any) {
  const isAdmin = !!context.auth?.token?.admin;
  if (!context.auth?.uid || !isAdmin) {
    throw new HttpsError("permission-denied", "Admin only");
  }
}

type CreateDashboardUserInput = {
  email: string;
  password: string; // temp password
  displayName?: string;
  role?: "admin" | "editor" | "viewer";
};

export const createDashboardUser = onCall<CreateDashboardUserInput>(
  { cors: true },
  async (req) => {
    assertAdmin(req);

    const email = String(req.data?.email || "").trim().toLowerCase();
    const password = String(req.data?.password || "").trim();
    const displayName = String(req.data?.displayName || "").trim() || "Utilisateur";
    const role = (req.data?.role || "editor") as "admin" | "editor" | "viewer";

    if (!email || !email.includes("@")) throw new HttpsError("invalid-argument", "Email invalide");
    if (password.length < 10) throw new HttpsError("invalid-argument", "Mot de passe trop court (min 10)");
    if (!["admin", "editor", "viewer"].includes(role)) throw new HttpsError("invalid-argument", "Rôle invalide");

    // Create Auth user
    const user = await admin.auth().createUser({
      email,
      password,
      displayName,
      emailVerified: false,
      disabled: false,
    });

    // Optional: set claims for UI gating
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: role === "admin",
      role,
    });

    // Store admin profile in Firestore
    await db.collection("admin_users").doc(user.uid).set(
      {
        uid: user.uid,
        email,
        displayName,
        photoURL: "",
        role,
        disabled: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: {
          uid: req.auth!.uid,
          email: req.auth?.token?.email || "",
          name: req.auth?.token?.name || "",
        },
      },
      { merge: true }
    );

    return { ok: true, uid: user.uid };
  }
);
