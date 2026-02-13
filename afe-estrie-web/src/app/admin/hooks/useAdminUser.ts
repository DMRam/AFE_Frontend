import { useEffect, useState } from "react";
import { auth, db } from "../../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export type Role = "admin" | "editor" | "viewer";

export function useAdminUser() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{
        uid: string;
        email: string;
        name: string;
        avatarUrl?: string;
        role: Role;
        isAdmin: boolean;
        mustChangePassword: boolean; // 👈 add
    } | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            setLoading(true);

            if (!u) {
                setUser(null);
                setLoading(false);
                return;
            }

            // 1) Claims (role/admin)
            const token = await u.getIdTokenResult(true);
            const role =
                (token.claims.role as Role) ||
                (token.claims.admin ? "admin" : "viewer");

            const isAdmin = !!token.claims.admin || role === "admin";

            // 2) Firestore flag (mustChangePassword)
            let mustChangePassword = false;
            try {
                const snap = await getDoc(doc(db, "admin_users", u.uid));
                mustChangePassword = !!snap.data()?.mustChangePassword;
            } catch {
                // if doc missing or rules block, default false (or true if you prefer strict)
                mustChangePassword = false;
            }

            setUser({
                uid: u.uid,
                email: u.email || "",
                name: u.displayName || "Utilisateur",
                avatarUrl: u.photoURL || "",
                role,
                isAdmin,
                mustChangePassword,
            });

            setLoading(false);
        });

        return () => unsub();
    }, []);

    return { loading, user };
}
