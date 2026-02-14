import React, { useMemo, useState } from "react";
import type { PageDoc } from "../../../../../content/types/pageBlocks";
import type { CategoryOption } from "../types";
import { Trash2 } from "lucide-react";
import { pageDocIdFromPageId } from "../../../../../services/pageRepo";
import { NewPageButton } from "../../../pages/NewPageButton";

type StatusFilter = "all" | "published" | "draft";

export function PagesSidebar({
  pages,
  loading,
  selectedDocId,
  onSelect,
  onRequestDelete,
  onRefreshList,
  onCreated,
  categories,
}: {
  pages: PageDoc[];
  loading: boolean;
  selectedDocId: string | null;
  onSelect: (docId: string) => void;
  onRequestDelete: (docId: string) => void;
  onRefreshList: () => void;
  onCreated: (docId: string) => void;
  categories: CategoryOption[];
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [cat, setCat] = useState<string>("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return pages.filter((p: any) => {
      const title = String(p.title ?? "").toLowerCase();
      const slug = String(p.slug ?? "").toLowerCase();
      const categoryId = String(p.categoryId ?? "");

      if (query && !title.includes(query) && !slug.includes(query)) return false;

      if (status === "published" && p.published === false) return false;
      if (status === "draft" && p.published !== false) return false;

      if (cat && categoryId !== cat) return false;

      return true;
    });
  }, [pages, q, status, cat]);

  // group by category label
  const grouped = useMemo(() => {
    const map = new Map<string, PageDoc[]>();
    for (const p of filtered as any[]) {
      const cid = String(p.categoryId ?? "");
      const key = cid || "__uncat__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return map;
  }, [filtered]);

  const categoryLabel = (cid: string) => {
    if (cid === "__uncat__") return "Non classée";
    const found = categories.find((c) => c.id === cid);
    return found?.label ?? "Non classée";
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">Pages</div>
          <div className="text-xs text-gray-500">{pages.length} page(s)</div>
        </div>
        <NewPageButton onRefreshList={onRefreshList} onCreated={onCreated} />
      </div>

      <div className="p-3 space-y-2 border-b border-gray-100">
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          placeholder="Rechercher une page…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-2">
          <select
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="all">Tous</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
          </select>

          <select
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
            value={cat}
            onChange={(e) => setCat(e.target.value)}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
            <option value="__uncat__">Non classée</option>
          </select>
        </div>

        <div className="text-xs text-gray-500">
          {filtered.length} résultat(s)
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
          <div className="mt-2 text-sm text-gray-500">Chargement…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 text-center">
          <div className="text-sm text-gray-500">Aucune page</div>
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto">
          {[...grouped.keys()]
            .sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b), "fr-CA"))
            .map((cid) => {
              const items = grouped.get(cid)!;
              return (
                <div key={cid} className="border-t border-gray-100">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50">
                    {categoryLabel(cid)}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {items.map((p: any) => {
                      const docId = pageDocIdFromPageId(p.id);
                      const active = docId === selectedDocId;

                      return (
                        <div
                          key={p.id}
                          className={[
                            "flex items-start justify-between p-3 hover:bg-gray-50 transition-colors",
                            active ? "bg-blue-50" : "",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            onClick={() => onSelect(docId)}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {p.title || "Sans titre"}
                              </div>
                              {p.published === false ? (
                                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                  Brouillon
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                  Publiée
                                </span>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-gray-500 truncate">
                              /{p.slug || "—"}
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRequestDelete(docId)}
                            className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
