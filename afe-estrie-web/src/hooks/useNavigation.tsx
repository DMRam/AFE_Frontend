import { useEffect, useMemo, useState } from "react";
import type { NavNode } from "../content/types/navTypes";
import { getNavigation } from "../services/navigationRepo";

function normalizeTree(nodes: NavNode[] = []): NavNode[] {
  return [...nodes]
    .filter(Boolean)
    .filter((n) => n.enabled !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((n, idx) => ({
      ...n,
      enabled: n.enabled !== false,
      order: idx + 1,
      children: normalizeTree(n.children ?? []),
    }));
}

export function useNavigation() {
  const [items, setItems] = useState<NavNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const data = await getNavigation();

      if (isMounted) {
        setItems(normalizeTree(data ?? []));
        console.log("Navigation loaded:", data);
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const sorted = useMemo(() => normalizeTree(items), [items]);

  console.log("useNavigation:", { items: sorted, loading });
  return { items: sorted, loading };
}