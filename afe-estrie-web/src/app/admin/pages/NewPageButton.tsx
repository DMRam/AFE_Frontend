import { useMemo, useState } from "react";
import type { PageDoc } from "../../../content/types/pageBlocks";
import { upsertPage, pageDocIdFromPageId } from "../../../services/pageRepo";

type SeedMode = "standard" | "empty";

function uid(prefix = "sec") {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${id}`;
}

function slugify(input: string) {
    const s = input
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return s;
}

function ensureLeadingSlash(s: string) {
    const t = s.trim();
    if (!t) return "";
    return t.startsWith("/") ? t : `/${t}`;
}

function normalizePageId(input: string) {
    // allow user to type "/a-propos/diagnostic" or "a-propos/diagnostic"
    return input.trim().replace(/^\/+/, "").replace(/\/+$/g, "");
}

function lastSegment(pageId: string) {
    const parts = pageId.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
}

function buildPageDoc(params: {
    pageId: string;
    title: string;
    slug: string;
    seed: SeedMode;
    seoTitle?: string;
    seoDescription?: string;
}): PageDoc {
    const base: PageDoc = {
        id: params.pageId,
        title: params.title,
        slug: params.slug,
        sections: [],
        seo: {
            title: params.seoTitle?.trim() || params.title,
            description: params.seoDescription?.trim() || "",
            image: "",
        },
    };

    if (params.seed === "empty") return base;

    return {
        ...base,
        sections: [
            {
                type: "hero",
                id: uid("hero"),
                enabled: true,
                title: params.title,
                subtitle: "Sous-titre (Subtitle)",
                backgroundImage: "/images/your-image.jpg",
                align: "center",
                textColor: "light",
            },
            {
                type: "richText",
                id: uid("rt"),
                enabled: true,
                content: "Écris ton contenu ici… (Write your content here…)",
            },
            {
                type: "split",
                id: uid("split"),
                enabled: true,
                title: "Titre de section (Section title)",
                content: "Écris ton texte ici… (Write your text here…)",
                imageUrl: "/images/your-image.jpg",
                imageAlt: "",
                imageSide: "right",
                variant: "default",
            },
        ],
    };
}

export function NewPageButton({
    onCreated,
    onRefreshList,
    className = "",
}: {
    onCreated: (docId: string) => void;
    onRefreshList: () => Promise<void> | void;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState("");

    // Simple required fields
    const [pageIdRaw, setPageIdRaw] = useState(""); // user typing
    const pageId = useMemo(() => normalizePageId(pageIdRaw), [pageIdRaw]);

    const [title, setTitle] = useState("");
    const [seed, setSeed] = useState<SeedMode>("standard");

    // Optional override fields
    const [slugOverride, setSlugOverride] = useState(""); // optional
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");

    const derivedDocId = useMemo(() => {
        return pageId ? pageDocIdFromPageId(pageId) : "";
    }, [pageId]);

    // Auto slug proposal:
    // - If user overrides, use it
    // - Else, derive from last segment of pageId; fallback to title
    const suggestedSlug = useMemo(() => {
        const base = lastSegment(pageId) || title;
        const s = slugify(base);
        return s ? ensureLeadingSlash(s) : "";
    }, [pageId, title]);

    const finalSlug = useMemo(() => {
        return ensureLeadingSlash(slugOverride) || suggestedSlug;
    }, [slugOverride, suggestedSlug]);

    const urlPreview = useMemo(() => {
        // purely informational; assumes site base at "/"
        return finalSlug || "—";
    }, [finalSlug]);

    const canSubmit = useMemo(() => {
        return !!pageId && !!title.trim() && !!finalSlug && !submitting;
    }, [pageId, title, finalSlug, submitting]);

    function resetForm() {
        setErr("");
        setSubmitting(false);
        setPageIdRaw("");
        setTitle("");
        setSeed("standard");
        setSlugOverride("");
        setShowAdvanced(false);
        setSeoTitle("");
        setSeoDescription("");
    }

    function close() {
        setOpen(false);
        resetForm();
    }

    async function submit() {
        setErr("");

        if (!pageId) return setErr("ID de page requis (Page ID required).");
        if (!title.trim()) return setErr("Titre requis (Title required).");
        if (!finalSlug) return setErr("Slug requis (Slug required).");

        setSubmitting(true);
        try {
            const doc = buildPageDoc({
                pageId,
                title: title.trim(),
                slug: finalSlug,
                seed,
                seoTitle: seoTitle.trim(),
                seoDescription: seoDescription.trim(),
            });

            await upsertPage(doc);

            await onRefreshList();
            onCreated(pageDocIdFromPageId(pageId));

            close();
        } catch (e: any) {
            setErr(e?.message ?? "Échec de création (Failed to create page).");
            setSubmitting(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={[
                    "rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50",
                    className,
                ].join(" ")}
            >
                + Nouvelle page (New page)
            </button>

            {open ? (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Créer une page (Create page)"
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/30"
                        onClick={close}
                        aria-label="Fermer (Close)"
                    />

                    <div className="relative w-full max-w-2xl rounded-2xl border bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <div className="text-sm font-semibold text-gray-900">
                                    Créer une page (Create page)
                                </div>
                                <div className="text-xs text-gray-500">
                                    2 champs requis: ID + Titre (2 required: ID + Title)
                                </div>
                            </div>

                            <button
                                type="button"
                                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                onClick={close}
                            >
                                Fermer (Close)
                            </button>
                        </div>

                        <div className="px-5 py-4 space-y-4">
                            {err ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                    {err}
                                </div>
                            ) : null}

                            {/* SECTION: Page key */}
                            <div className="rounded-2xl border bg-gray-50 p-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    1) Identifiant & emplacement (ID & location)
                                </div>

                                <div className="mt-3 grid gap-4 md:grid-cols-2">
                                    <label className="text-sm">
                                        <div className="mb-1 font-semibold text-gray-900">
                                            ID de page (Page ID)
                                        </div>
                                        <input
                                            className="w-full rounded-xl border bg-white px-3 py-2"
                                            value={pageIdRaw}
                                            onChange={(e) => setPageIdRaw(e.target.value)}
                                            placeholder='ex: "a-propos/diagnostic"'
                                            autoFocus
                                        />
                                        <div className="mt-1 text-xs text-gray-600">
                                            Utilise des <b>/</b> pour organiser (Use <b>/</b> to organize).
                                        </div>
                                    </label>

                                    <div className="text-sm">
                                        <div className="mb-1 font-semibold text-gray-900">
                                            Aperçu (Preview)
                                        </div>

                                        <div className="rounded-xl border bg-white px-3 py-2 text-sm">
                                            <div className="text-xs text-gray-500">URL</div>
                                            <div className="font-mono text-gray-900">{urlPreview}</div>
                                        </div>

                                        <div className="mt-2 rounded-xl border bg-white px-3 py-2 text-sm">
                                            <div className="text-xs text-gray-500">Firestore docId</div>
                                            <div className="font-mono text-gray-900">
                                                {derivedDocId || "—"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION: Content */}
                            <div className="rounded-2xl border p-4">
                                <div className="text-sm font-semibold text-gray-900">
                                    2) Contenu de base (Basic content)
                                </div>

                                <div className="mt-3 grid gap-4 md:grid-cols-2">
                                    <label className="text-sm">
                                        <div className="mb-1 font-semibold text-gray-900">
                                            Titre (Title)
                                        </div>
                                        <input
                                            className="w-full rounded-xl border px-3 py-2"
                                            value={title}
                                            onChange={(e) => {
                                                setTitle(e.target.value);
                                                if (!seoTitle.trim()) setSeoTitle(e.target.value);
                                            }}
                                            placeholder="ex: Diagnostic"
                                        />
                                        <div className="mt-1 text-xs text-gray-500">
                                            S’affiche dans la liste et dans la page (Shown in list + page).
                                        </div>
                                    </label>

                                    <label className="text-sm">
                                        <div className="mb-1 font-semibold text-gray-900">
                                            Modèle (Template)
                                        </div>
                                        <select
                                            className="w-full rounded-xl border px-3 py-2"
                                            value={seed}
                                            onChange={(e) => setSeed(e.target.value as SeedMode)}
                                        >
                                            <option value="standard">
                                                Standard — 3 sections (Hero + Texte + Split)
                                            </option>
                                            <option value="empty">Vide — aucune section (Empty)</option>
                                        </select>
                                        <div className="mt-1 text-xs text-gray-500">
                                            Tu peux modifier après (You can edit after).
                                        </div>
                                    </label>
                                </div>

                               

                                {/* Advanced */}
                                <div className="mt-4">
                                    <button
                                        type="button"
                                        className="text-sm font-semibold text-gray-900 hover:underline"
                                        onClick={() => setShowAdvanced((v) => !v)}
                                    >
                                        {showAdvanced
                                            ? "Masquer options avancées (Hide advanced)"
                                            : "Options avancées (Advanced)"}
                                    </button>

                                    {showAdvanced ? (
                                        <div className="mt-3 grid gap-4 md:grid-cols-2">
                                            <label className="text-sm">
                                                <div className="mb-1 font-semibold text-gray-900">
                                                    Titre SEO (SEO title)
                                                </div>
                                                <input
                                                    className="w-full rounded-xl border px-3 py-2"
                                                    value={seoTitle}
                                                    onChange={(e) => setSeoTitle(e.target.value)}
                                                    placeholder="(optionnel) (optional)"
                                                />
                                            </label>

                                            <label className="text-sm">
                                                <div className="mb-1 font-semibold text-gray-900">
                                                    Description SEO (SEO description)
                                                </div>
                                                <input
                                                    className="w-full rounded-xl border px-3 py-2"
                                                    value={seoDescription}
                                                    onChange={(e) => setSeoDescription(e.target.value)}
                                                    placeholder="(optionnel) (optional)"
                                                />
                                            </label>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                    onClick={close}
                                    disabled={submitting}
                                >
                                    Annuler (Cancel)
                                </button>
                                <button
                                    type="button"
                                    className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                                    onClick={submit}
                                    disabled={!canSubmit}
                                    title={!canSubmit ? "Remplis ID + Titre (Fill ID + Title)" : ""}
                                >
                                    {submitting ? "Création… (Creating…)" : "Créer (Create)"}
                                </button>
                            </div>

                            <div className="text-xs text-gray-500">
                                Exemple (Example):{" "}
                                <span className="font-mono">a-propos/diagnostic</span> → docId{" "}
                                <span className="font-mono">a-propos__diagnostic</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
