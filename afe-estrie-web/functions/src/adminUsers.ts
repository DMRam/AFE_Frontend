// functions/src/adminUsers.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Prevent "already exists" if imported in index.ts (or hot reload)
if (admin.apps.length === 0) admin.initializeApp();

const db = getFirestore();

/**
 * Auth helpers
 * In Gen2 onCall, you get:
 * request.auth?.uid
 * request.auth?.token (custom claims live here)
 */
function assertAdmin(request: any) {
    const uid = request.auth?.uid;
    const token = request.auth?.token || {};
    const isAdmin = token.admin === true || token.role === "admin";

    if (!uid || !isAdmin) {
        throw new HttpsError("permission-denied", "Admin only");
    }

    return { uid, token };
}

function normalizeEmail(v: unknown) {
    return String(v ?? "").trim().toLowerCase();
}

type Role = "admin" | "editor" | "viewer";

/**
 * ----------------------------
 * 1) Create dashboard user
 * ----------------------------
 */
type CreateDashboardUserInput = {
    email: string;
    password: string; // temp password
    displayName?: string;
    role?: Role;
};

export const createDashboardUser = onCall<CreateDashboardUserInput>(
    { cors: true },
    async (request) => {
        const caller = assertAdmin(request);

        const email = normalizeEmail(request.data?.email);
        const password = String(request.data?.password ?? "").trim();
        const displayName = String(request.data?.displayName ?? "").trim() || "Utilisateur";
        const role = (request.data?.role ?? "editor") as Role;

        if (!email || !email.includes("@")) {
            throw new HttpsError("invalid-argument", "Email invalide");
        }
        if (password.length < 10) {
            throw new HttpsError("invalid-argument", "Mot de passe trop court (min 10)");
        }
        if (!["admin", "editor", "viewer"].includes(role)) {
            throw new HttpsError("invalid-argument", "Rôle invalide");
        }

        // Create Auth user
        const user = await admin.auth().createUser({
            email,
            password,
            displayName,
            emailVerified: false,
            disabled: false,
        });

        // Set claims used by UI gating
        await admin.auth().setCustomUserClaims(user.uid, {
            admin: role === "admin",
            role,
        });

        // Store in Firestore
        await db.collection("admin_users").doc(user.uid).set(
            {
                uid: user.uid,
                email,
                displayName,
                photoURL: "",
                role,
                mustChangePassword: true,
                disabled: false,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                createdBy: {
                    uid: caller.uid,
                    email: String(caller.token.email ?? ""),
                    name: String(caller.token.name ?? ""),
                },
            },
            { merge: true }
        );

        logger.info("Admin user created", { uid: user.uid, email, role, by: caller.uid });
        return { ok: true, uid: user.uid };
    }
);

/**
 * ----------------------------
 * 2) List dashboard users
 * ----------------------------
 */
type ListDashboardUsersInput = {
    limit?: number;
};

export const listDashboardUsers = onCall<ListDashboardUsersInput>(
    { cors: true },
    async (request) => {
        assertAdmin(request);

        const limit = Math.max(1, Math.min(Number(request.data?.limit ?? 50), 200));

        const snap = await db
            .collection("admin_users")
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();

        const users = snap.docs.map((d) => {
            const x: any = d.data();
            return {
                uid: d.id,
                email: String(x.email ?? ""),
                displayName: String(x.displayName ?? ""),
                role: (x.role ?? "viewer") as Role,
                disabled: Boolean(x.disabled),
                mustChangePassword: Boolean(x.mustChangePassword),
                photoURL: String(x.photoURL ?? ""),
                createdAt: x.createdAt ?? null,
                updatedAt: x.updatedAt ?? null,
            };
        });

        return { ok: true, users };
    }
);

/**
 * ----------------------------
 * 3) Disable/enable dashboard user
 * ----------------------------
 */
type SetDashboardUserDisabledInput = {
    uid: string;
    disabled: boolean;
};

export const setDashboardUserDisabled = onCall<SetDashboardUserDisabledInput>(
    { cors: true },
    async (request) => {
        const caller = assertAdmin(request);

        const uid = String(request.data?.uid ?? "").trim();
        const disabled = Boolean(request.data?.disabled);

        if (!uid) throw new HttpsError("invalid-argument", "Missing uid");
        if (uid === caller.uid) {
            throw new HttpsError("failed-precondition", "You cannot disable yourself");
        }

        await admin.auth().updateUser(uid, { disabled });

        await db.collection("admin_users").doc(uid).set(
            {
                disabled,
                updatedAt: FieldValue.serverTimestamp(),
                updatedBy: {
                    uid: caller.uid,
                    email: String(caller.token.email ?? ""),
                    name: String(caller.token.name ?? ""),
                },
            },
            { merge: true }
        );

        return { ok: true };
    }
);

/**
 * ----------------------------
 * 4) Delete dashboard user (hard delete)
 * ----------------------------
 */
type DeleteDashboardUserInput = {
    uid: string;
};

export const deleteDashboardUser = onCall<DeleteDashboardUserInput>(
    { cors: true },
    async (request) => {
        const caller = assertAdmin(request);

        const uid = String(request.data?.uid ?? "").trim();
        if (!uid) throw new HttpsError("invalid-argument", "Missing uid");
        if (uid === caller.uid) {
            throw new HttpsError("failed-precondition", "You cannot delete yourself");
        }

        // Delete from Auth first
        await admin.auth().deleteUser(uid);

        // Then delete Firestore profile
        await db.collection("admin_users").doc(uid).delete();

        return { ok: true };
    }
);
