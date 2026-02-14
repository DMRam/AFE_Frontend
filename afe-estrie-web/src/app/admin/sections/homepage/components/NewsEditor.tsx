import { useState } from "react";
import { uid } from "../utils/ids";
import { uploadHomeMedia } from "../../../../../services/storageRepo";

type NewsItem = {
  id: string;
  enabled?: boolean;
  order?: number;
  title?: string;
  excerpt?: string;
  date?: string;
  href?: string;
  coverSrc?: string;
  coverAlt?: string;
  storagePath?: string;
  readingTime?: string;
  pageDocId?: string;
};

type NewsBlock = {
  enabled?: boolean;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items?: NewsItem[];
};

export function NewsEditor({
  block,
  onChange,
}: {
  block?: NewsBlock;
  onChange: (next: NewsBlock) => void;
}) {
  const items = (block?.items ?? []) as NewsItem[];

  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const setItem = (id: string, patch: Partial<NewsItem>) => {
    const next = items.map((x) => (x.id === id ? { ...x, ...patch } : x));
    onChange({ ...(block ?? {}), items: next });
  };

  const removeItem = (id: string) => {
    onChange({ ...(block ?? {}), items: items.filter((x) => x.id !== id) });
  };

  const addItem = () => {
    const next = [...items];
    next.push({
      id: uid("n"),
      enabled: true,
      order: next.length + 1,
      title: "",
      excerpt: "",
      date: "",
      href: "",
      coverSrc: "",
      coverAlt: "",
      storagePath: "",
      readingTime: "",
      pageDocId: "",
    });
    onChange({ ...(block ?? {}), items: next });
  };

  const onUpload = async (id: string, file?: File | null) => {
    if (!file) return;
    setErr(null);
    setUploadingId(id);

    try {
      const { url, path } = await uploadHomeMedia(file);
      setItem(id, { coverSrc: url, storagePath: path });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Upload error");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-l-4 border-red-500">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">📰</span>
              <h4 className="font-semibold text-gray-900">News</h4>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block?.enabled !== false}
                onChange={(e) => onChange({ ...(block ?? {}), enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Eyebrow</label>
              <input
                type="text"
                value={block?.eyebrow ?? ""}
                onChange={(e) => onChange({ ...(block ?? {}), eyebrow: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g., Latest updates"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Heading</label>
              <input
                type="text"
                value={block?.heading ?? ""}
                onChange={(e) => onChange({ ...(block ?? {}), heading: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g., News"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Subheading</label>
              <textarea
                value={block?.subheading ?? ""}
                onChange={(e) => onChange({ ...(block ?? {}), subheading: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Short text displayed under the title..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">CTA label</label>
              <input
                type="text"
                value={block?.ctaLabel ?? ""}
                onChange={(e) => onChange({ ...(block ?? {}), ctaLabel: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g., View all news"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">CTA href</label>
              <input
                type="text"
                value={block?.ctaHref ?? ""}
                onChange={(e) => onChange({ ...(block ?? {}), ctaHref: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g., /news"
              />
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-gray-900">Cards ({items.length})</h5>
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Add news item
              </button>
            </div>

            {items
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((it, idx) => {
                const isUploading = uploadingId === it.id;
                const cover = it.coverSrc ?? "";

                return (
                  <div key={it.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
                          {idx + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={it.enabled !== false}
                                onChange={(e) => setItem(it.id, { enabled: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Enabled</span>
                            </label>

                            <div className="text-xs text-gray-500">ID: {it.id}</div>
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                              {cover ? (
                                <img
                                  src={cover}
                                  alt={it.coverAlt || "cover"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-gray-400">Image</span>
                              )}
                            </div>

                            <div className="grid flex-1 gap-3 md:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Order</label>
                                <input
                                  type="number"
                                  value={it.order ?? idx + 1}
                                  onChange={(e) => setItem(it.id, { order: Number(e.target.value) })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Date label</label>
                                <input
                                  type="text"
                                  value={it.date ?? ""}
                                  onChange={(e) => setItem(it.id, { date: e.target.value })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  placeholder="e.g., OCT 28, 2025"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Reading time</label>
                                <input
                                  type="text"
                                  value={it.readingTime ?? ""}
                                  onChange={(e) => setItem(it.id, { readingTime: e.target.value })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  placeholder="e.g., 3 min"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">Title</label>
                              <input
                                type="text"
                                value={it.title ?? ""}
                                onChange={(e) => setItem(it.id, { title: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="News title"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">Excerpt</label>
                              <textarea
                                value={it.excerpt ?? ""}
                                onChange={(e) => setItem(it.id, { excerpt: e.target.value })}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Short text shown on the card..."
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">Link (href)</label>
                              <input
                                type="text"
                                value={it.href ?? ""}
                                onChange={(e) => setItem(it.id, { href: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="/news/slug-or-page"
                              />
                              <p className="mt-1 text-[11px] text-gray-500">
                                Tip: you can point to a page created in PagesManager.
                              </p>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">Image URL (A)</label>
                              <input
                                type="text"
                                value={it.coverSrc ?? ""}
                                onChange={(e) => setItem(it.id, { coverSrc: e.target.value, storagePath: "" })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="https://.../cover.jpg"
                              />
                              <p className="mt-1 text-[11px] text-gray-500">
                                If you paste a URL, storagePath is cleared.
                              </p>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">Upload (B)</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => onUpload(it.id, e.target.files?.[0])}
                                disabled={isUploading}
                                className="block w-full text-sm"
                              />
                              <div className="mt-2 text-[11px] text-gray-500">
                                {isUploading ? "Uploading..." : it.storagePath ? `Storage: ${it.storagePath}` : ""}
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">Image alt</label>
                              <input
                                type="text"
                                value={it.coverAlt ?? ""}
                                onChange={(e) => setItem(it.id, { coverAlt: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="e.g., Cover photo"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

            {!items.length ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                No news yet. Click <b>“Add news item”</b>.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
