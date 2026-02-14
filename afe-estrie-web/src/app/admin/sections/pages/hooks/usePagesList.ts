import { useCallback, useEffect, useState } from "react";
import type { PageDoc } from "../../../../../content/types/pageBlocks";
import { listPages } from "../../../../../services/pageRepo";

export function usePagesList() {
  const [loadingList, setLoadingList] = useState(true);
  const [pages, setPages] = useState<PageDoc[]>([]);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoadingList(true);
    setError("");
    try {
      const items = await listPages();
      const sorted = [...items].sort((a, b) =>
        (a.title || "").localeCompare(b.title || "", "fr-CA")
      );
      setPages(sorted);
      return sorted;
    } catch (e: any) {
      setError(`Erreur de chargement: ${e?.message ?? "Inconnue"}`);
      return [];
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    loadingList,
    pages,
    error,
    setError,
    reload,
  };
}
