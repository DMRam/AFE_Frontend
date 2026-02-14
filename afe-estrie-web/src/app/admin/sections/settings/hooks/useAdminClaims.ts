import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { Role } from "../api/team";
import { auth } from "../../../../../services/firebase";

export function useAdminClaims() {
  const [loading, setLoading] = useState(true);

  const [meUid, setMeUid] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState("");
  const [meName, setMeName] = useState("");
  const [mePhoto, setMePhoto] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);

      if (!u) {
        setMeUid(null);
        setMeEmail("");
        setMeName("");
        setMePhoto("");
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setMeUid(u.uid);
      setMeEmail(u.email || "");
      setMeName(u.displayName || "");
      setMePhoto(u.photoURL || "");

      const token = await u.getIdTokenResult(true);
      const role = (token.claims.role as Role) || (token.claims.admin ? "admin" : "viewer");
      setIsAdmin(role === "admin" || Boolean(token.claims.admin));

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return {
    loading,
    meUid,
    meEmail,
    meName,
    mePhoto,
    isAdmin,
  };
}
