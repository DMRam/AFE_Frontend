import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageRenderer } from "../../../components/pageBuilder/PageRenderer";
import type { PageDoc } from "../../../content/types/pageBlocks";
import { getPageByPageId } from "../../../services/pageRepo";

export default function DynamicPage() {
  const params = useParams();
  const pageId = params["*"] || "";

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<PageDoc | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const p = await getPageByPageId(pageId);
        if (!alive) return;

        if (!p) {
          setPage(null);
          setError("Page not found.");
          return;
        }

        setPage(p);
      } catch (e: any) {
        if (!alive) return;
        setPage(null);
        setError("Page not found.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [pageId]);

  if (loading) {
    return <div className="mx-auto max-w-6xl px-6 py-16">Loading…</div>;
  }

  if (error) {
    return <div className="mx-auto max-w-6xl px-6 py-16 text-red-700">{error}</div>;
  }

  if (!page) return null;

  const visibleSections = page.sections.filter((section) => section.enabled);

  return <PageRenderer sections={visibleSections} />;
}