import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase"; // adjust path if needed
import type { HomePageCMS } from "../content/types/homePage";

export function useHomePagePublic() {
  const [home, setHome] = useState<HomePageCMS | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "sitePages", "home");

    const unsub = onSnapshot(
      ref,
      (snap) => {
        setHome((snap.data() as HomePageCMS) ?? null);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, []);

  return { home, loading };
}
