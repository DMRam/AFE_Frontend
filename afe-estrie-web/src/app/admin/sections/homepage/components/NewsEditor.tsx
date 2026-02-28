import { useEffect, useMemo, useRef, useState } from "react";
import { uid } from "../utils/ids";
import { uploadHomeMedia } from "../../../../../services/storageRepo";
import { RichTextInput } from "../../../../../components/RichTextInput";

type NewsItem = {
  id: string;
  enabled?: boolean;
  order?: number;
  title?: string;
  excerpt?: string; // HTML
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

function deepEqual(a: any, b: any) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function clampNum(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeItems(items: NewsItem[]) {
  // Keep stable order defaults
  const sorted = items.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return sorted.map((it, idx) => ({ ...it, order: it.order ?? idx + 1 }));
}

function IconChevron({ open }: { open: boolean }) {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600">
      <span className={`transition-transform ${open ? "rotate-90" : ""}`}>›</span>
    </span>
  );
}

function UploadDropzone({
  valueUrl,
  uploading,
  helperText,
  onPickFile,
  onClear,
}: {
  valueUrl?: string;
  uploading?: boolean;
  helperText?: string;
  onPickFile: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const openPicker = () => inputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onPickFile(file);
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPickFile(f);
          // reset so picking same file again triggers change
          e.currentTarget.value = "";
        }}
        disabled={uploading}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          "rounded-xl border p-4 transition",
          dragOver ? "border-red-400 bg-red-50" : "border-gray-200 bg-white",
          uploading ? "opacity-70" : "",
        ].join(" ")}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {valueUrl ? (
              <img src={valueUrl} alt="Aperçu" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-gray-400">Aperçu</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openPicker}
                disabled={uploading}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {valueUrl ? "Remplacer l’image" : "Téléverser une image"}
              </button>

              {valueUrl ? (
                <button
                  type="button"
                  onClick={onClear}
                  disabled={uploading}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Retirer
                </button>
              ) : null}

              {uploading ? (
                <span className="text-sm font-medium text-gray-600">Téléversement…</span>
              ) : null}
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Glissez-déposez une image ici, ou cliquez sur le bouton. (JPG/PNG/WebP)
            </p>
            {helperText ? <p className="mt-1 text-[11px] text-gray-500">{helperText}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewsEditor({
  block,
  onChange,
  onSave,
}: {
  block?: NewsBlock;
  onChange: (next: NewsBlock) => void;
  onSave?: () => Promise<void> | void;
}) {
  const items = useMemo(() => normalizeItems((block?.items ?? []) as NewsItem[]), [block?.items]);

  const [open, setOpen] = useState(true); // section collapse
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // "Own save" UX
  const [savingLocal, setSavingLocal] = useState(false);
  const [savedToast, setSavedToast] = useState<string | null>(null);
  const lastSavedRef = useRef<NewsBlock | null>(null);

  function cleanBlock(b: NewsBlock | undefined | null): NewsBlock {
    const x = b ?? {};
    return {
      enabled: x.enabled !== false,
      eyebrow: x.eyebrow ?? "",
      heading: x.heading ?? "",
      subheading: x.subheading ?? "",
      ctaLabel: x.ctaLabel ?? "",
      ctaHref: x.ctaHref ?? "",
      items: normalizeItems((x.items ?? []).map((it) => ({
        id: it.id,
        enabled: it.enabled !== false,
        order: it.order ?? 999,
        title: it.title ?? "",
        excerpt: it.excerpt ?? "",
        date: it.date ?? "",
        href: it.href ?? "",
        coverSrc: it.coverSrc ?? "",
        coverAlt: it.coverAlt ?? "",
        storagePath: it.storagePath ?? "",
        readingTime: it.readingTime ?? "",
        pageDocId: it.pageDocId ?? "",
      }))),
    };
  }

  const clean = useMemo(() => cleanBlock(block), [block]);

  const dirty = useMemo(() => {
    if (!lastSavedRef.current) return false;
    return !deepEqual(clean, lastSavedRef.current);
  }, [clean]);

  useEffect(() => {
    if (!lastSavedRef.current) {
      lastSavedRef.current = cleanBlock(block);
    }
  }, []);

  const setItem = (id: string, patch: Partial<NewsItem>) => {
    const nextItems = items.map((x) => (x.id === id ? { ...x, ...patch } : x));
    onChange({ ...(block ?? {}), items: nextItems });
  };

  const removeItem = (id: string) => {
    onChange({ ...(block ?? {}), items: items.filter((x) => x.id !== id) });
    setOpenItems((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const addItem = () => {
    const next = [...items];
    const id = uid("n");
    next.push({
      id,
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

    // auto expand newly created item
    setOpen(true);
    setOpenItems((prev) => ({ ...prev, [id]: true }));
  };

  const reorder = (id: string, nextOrderRaw: number) => {
    const nextOrder = clampNum(nextOrderRaw, 1, 999);
    setItem(id, { order: nextOrder });
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
      setErr(e?.message ?? "Erreur de téléversement");
    } finally {
      setUploadingId(null);
    }
  };

  const clearImage = (id: string) => {
    // Keep it simple: clear URL + storagePath
    setItem(id, { coverSrc: "", storagePath: "" });
  };

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const handleSaveLocal = async () => {
    setErr(null);
    if (!onSave) {
      setErr("Aucune fonction d’enregistrement n’a été fournie par HomePageManager.");
      return;
    }

    try {
      setSavingLocal(true);
      await onSave();
      await new Promise((r) => setTimeout(r, 0));

      lastSavedRef.current = cleanBlock(block);
      setSavedToast("Enregistré ✅");
      window.setTimeout(() => setSavedToast(null), 1800);
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Erreur lors de l’enregistrement");
    } finally {
      setSavingLocal(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header (collapsible) */}
      <div className="border-l-4 border-red-500">
        <div className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-3 text-left"
            >
              <IconChevron open={open} />
              <div className="flex items-center gap-3">
                <span className="text-xl">📰</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Actualités</h4>
                  <p className="text-xs text-gray-500">
                    {items.length} élément(s) •{" "}
                    <span className={dirty ? "font-semibold text-amber-600" : "font-semibold text-green-600"}>
                      {dirty ? "Modifications non enregistrées" : "À jour"}
                    </span>
                    {savedToast ? <span className="ml-2 text-green-600">{savedToast}</span> : null}
                  </p>
                </div>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={block?.enabled !== false}
                  onChange={(e) => onChange({ ...(block ?? {}), enabled: e.target.checked })}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">Activer</span>
              </label>

              <button
                type="button"
                onClick={handleSaveLocal}
                disabled={savingLocal || !dirty}
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingLocal ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>

          {!open ? null : (
            <>
              {/* Block fields */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Surtitre</label>
                  <input
                    type="text"
                    value={block?.eyebrow ?? ""}
                    onChange={(e) => onChange({ ...(block ?? {}), eyebrow: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ex. : Dernières nouvelles"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Titre</label>
                  <input
                    type="text"
                    value={block?.heading ?? ""}
                    onChange={(e) => onChange({ ...(block ?? {}), heading: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ex. : Nos actualités"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Sous-titre</label>
                  <textarea
                    value={block?.subheading ?? ""}
                    onChange={(e) => onChange({ ...(block ?? {}), subheading: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Court texte affiché sous le titre…"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Libellé du bouton (CTA)</label>
                  <input
                    type="text"
                    value={block?.ctaLabel ?? ""}
                    onChange={(e) => onChange({ ...(block ?? {}), ctaLabel: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ex. : Voir toutes les actualités"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Lien du bouton (URL)</label>
                  <input
                    type="text"
                    value={block?.ctaHref ?? ""}
                    onChange={(e) => onChange({ ...(block ?? {}), ctaHref: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Ex. : /actualites"
                  />
                </div>
              </div>

              {err ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {err}
                </div>
              ) : null}

              {/* Items */}
              <div className="mt-8 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h5 className="text-sm font-semibold text-gray-900">Cartes ({items.length})</h5>
                  <button
                    type="button"
                    onClick={addItem}
                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-black"
                  >
                    + Ajouter une actualité
                  </button>
                </div>

                {!items.length ? (
                  <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                    Aucune actualité pour l’instant. Cliquez sur <b>« Ajouter une actualité »</b>.
                  </div>
                ) : null}

                {items.map((it, idx) => {
                  const isUploading = uploadingId === it.id;
                  const isOpen = openItems[it.id] ?? true;

                  return (
                    <div key={it.id} className="rounded-2xl border border-gray-200 bg-gray-50">
                      {/* Item header */}
                      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => toggleItem(it.id)}
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          <IconChevron open={isOpen} />
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-semibold text-gray-900">
                                {it.title?.trim() ? it.title : "Sans titre"}
                              </span>
                              <span className="text-xs text-gray-500">ID : {it.id}</span>
                            </div>
                            <div className="mt-0.5 text-xs text-gray-500">
                              Ordre : <span className="font-semibold">{it.order ?? idx + 1}</span>
                              {it.date ? <span> • {it.date}</span> : null}
                              {it.readingTime ? <span> • {it.readingTime}</span> : null}
                            </div>
                          </div>
                        </button>

                        <div className="flex flex-wrap items-center gap-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={it.enabled !== false}
                              onChange={(e) => setItem(it.id, { enabled: e.target.checked })}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Activer</span>
                          </label>

                          <button
                            type="button"
                            onClick={() => removeItem(it.id)}
                            className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>

                      {/* Item body */}
                      {!isOpen ? null : (
                        <div className="border-t border-gray-200 p-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2 grid gap-3 md:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Ordre</label>
                                <input
                                  type="number"
                                  value={it.order ?? idx + 1}
                                  onChange={(e) => reorder(it.id, Number(e.target.value))}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Date (affichée)</label>
                                <input
                                  type="text"
                                  value={it.date ?? ""}
                                  onChange={(e) => setItem(it.id, { date: e.target.value })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  placeholder="Ex. : 28 OCTOBRE 2025"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">Temps de lecture</label>
                                <input
                                  type="text"
                                  value={it.readingTime ?? ""}
                                  onChange={(e) => setItem(it.id, { readingTime: e.target.value })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  placeholder="Ex. : 3 min"
                                />
                              </div>
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">Titre</label>
                              <input
                                type="text"
                                value={it.title ?? ""}
                                onChange={(e) => setItem(it.id, { title: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Titre de l’actualité"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">Extrait</label>
                              <RichTextInput
                                value={it.excerpt ?? ""}
                                onChange={(html) => setItem(it.id, { excerpt: html })}
                                placeholder="Texte court affiché sur la carte…"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">Lien (URL)</label>
                              <input
                                type="text"
                                value={it.href ?? ""}
                                onChange={(e) => setItem(it.id, { href: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="/actualites/slug-ou-page"
                              />
                              <p className="mt-1 text-[11px] text-gray-500">
                                Astuce : vous pouvez pointer vers une page créée dans PagesManager.
                              </p>
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">Image</label>
                              <UploadDropzone
                                valueUrl={it.coverSrc ?? ""}
                                uploading={isUploading}
                                helperText={it.storagePath ? `Stockage : ${it.storagePath}` : undefined}
                                onPickFile={(file) => onUpload(it.id, file)}
                                onClear={() => clearImage(it.id)}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-xs font-medium text-gray-700">Texte alternatif (alt)</label>
                              <input
                                type="text"
                                value={it.coverAlt ?? ""}
                                onChange={(e) => setItem(it.id, { coverAlt: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Ex. : Photo de couverture"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}