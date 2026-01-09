import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../services/firebase";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setSignedIn(!!user);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="p-6">Loading…</div>;
  if (!signedIn) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}
