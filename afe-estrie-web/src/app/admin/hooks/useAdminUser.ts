import { useEffect, useState } from "react";
import { auth } from "../../../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

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
  } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);

      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }

      const token = await u.getIdTokenResult(true);
      const role = (token.claims.role as Role) || (token.claims.admin ? "admin" : "viewer");

      setUser({
        uid: u.uid,
        email: u.email || "",
        name: u.displayName || "Utilisateur",
        avatarUrl: u.photoURL || "",
        role,
        isAdmin: !!token.claims.admin || role === "admin",
      });

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return { loading, user };
}
