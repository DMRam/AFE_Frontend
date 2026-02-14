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
    // Remove leading/trailing slashes and the /p/ prefix if user typed it
    let cleaned = input.trim().replace(/^\/+|\/+$/g, "");

    // Remove /p/ prefix if user included it
    if (cleaned.startsWith("p/")) {
        cleaned = cleaned.substring(2);
    }

    return cleaned;
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
                subtitle: "Ajoutez un sous-titre ici…",
                backgroundImage: "/images/placeholder.jpg",
                align: "center",
                textColor: "light",
            },
            {
                type: "richText",
                id: uid("rt"),
                enabled: true,
                content: "Écrivez votre contenu ici…",
            },
            {
                type: "split",
                id: uid("split"),
                enabled: true,
                title: "Titre de section",
                content: "Ajoutez votre texte ici…",
                imageUrl: "/images/placeholder.jpg",
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

    // Auto slug proposal
    const suggestedSlug = useMemo(() => {
        const base = lastSegment(pageId) || title;
        const s = slugify(base);
        return s ? ensureLeadingSlash(s) : "";
    }, [pageId, title]);

    const finalSlug = useMemo(() => {
        return ensureLeadingSlash(slugOverride) || suggestedSlug;
    }, [slugOverride, suggestedSlug]);

    const urlPreview = useMemo(() => {
        // Always include /p/ prefix in the URL preview
        if (!pageId) return "—";
        return `/p/${pageId}`;
    }, [pageId]);

    const canSubmit = useMemo(() => {
        return !!pageId && !!title.trim() && !submitting;
    }, [pageId, title, submitting]);

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

        if (!pageId) return setErr("Le chemin de la page est requis.");
        if (!title.trim()) return setErr("Le titre est requis.");

        setSubmitting(true);
        try {
            const doc = buildPageDoc({
                pageId,
                title: title.trim(),
                slug: finalSlug || `/p/${pageId}`, // Use the /p/ prefix for slug
                seed,
                seoTitle: seoTitle.trim(),
                seoDescription: seoDescription.trim(),
            });

            await upsertPage(doc);

            await onRefreshList();
            onCreated(pageDocIdFromPageId(pageId));

            close();
        } catch (e: any) {
            setErr(e?.message ?? "Impossible de créer la page.");
            setSubmitting(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className={[
                    "inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black transition-colors",
                    className,
                ].join(" ")}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle page
            </button>

            {open ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={close}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="border-b border-gray-100 p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Créer une page</h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Définissez l’adresse, le titre et un contenu de départ
                                    </p>
                                </div>
                                <button
                                    onClick={close}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    aria-label="Fermer"
                                >
                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Scrollable content */}
                        <div className="max-h-[70vh] overflow-y-auto p-6 space-y-6">
                            {/* Error message */}
                            {err && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                        </div>
                                        <div className="text-sm text-red-700">{err}</div>
                                    </div>
                                </div>
                            )}

                            {/* URL Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                    Adresse de la page
                                </h3>

                                <div className="space-y-3">
                                    <label className="block">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-medium text-gray-700">Chemin</span>
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                Préfixe automatique <code className="font-mono">/p/</code>
                                            </span>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <span className="text-gray-500 font-mono">/p/</span>
                                            </div>
                                            <input
                                                type="text"
                                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                value={pageIdRaw}
                                                onChange={(e) => setPageIdRaw(e.target.value)}
                                                placeholder="a-propos/diagnostic"
                                                autoFocus
                                            />
                                        </div>
                                    </label>

                                    <div className="text-xs text-gray-500">
                                        <p className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            Utilisez des « / » pour organiser les pages. Exemple :
                                            <code className="font-mono mx-1 px-1.5 py-0.5 bg-gray-100 rounded">services/consultation</code>
                                        </p>
                                    </div>
                                </div>

                                {/* URL Preview Card */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                            />
                                        </svg>
                                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                            Aperçu
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Adresse publique</div>
                                            <div className="font-mono text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 truncate">
                                                {urlPreview}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Identifiant interne</div>
                                            <div className="font-mono text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 truncate">
                                                {derivedDocId || "Sera généré"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                    Contenu
                                </h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="block">
                                            <span className="text-sm font-medium text-gray-700">Titre de la page</span>
                                            <input
                                                type="text"
                                                className="w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                value={title}
                                                onChange={(e) => {
                                                    setTitle(e.target.value);
                                                    if (!seoTitle.trim()) setSeoTitle(e.target.value);
                                                }}
                                                placeholder="À propos du diagnostic"
                                            />
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            Ce titre peut apparaître sur la page et dans la navigation.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block">
                                            <span className="text-sm font-medium text-gray-700">Modèle</span>
                                            <select
                                                className="w-full mt-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                                                value={seed}
                                                onChange={(e) => setSeed(e.target.value as SeedMode)}
                                            >
                                                <option value="standard">Mise en page standard (recommandée)</option>
                                                <option value="empty">Page vide</option>
                                            </select>
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            Choisissez un modèle de départ. Vous pourrez tout modifier ensuite.
                                        </p>
                                    </div>
                                </div>

                                {/* Advanced Options */}
                                <div className="pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced((v) => !v)}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        <div
                                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${showAdvanced ? "bg-gray-900 border-gray-900" : "border-gray-300"
                                                }`}
                                        >
                                            <svg
                                                className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180 text-white" : "text-gray-500"
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        <span>{showAdvanced ? "Masquer les options avancées" : "Afficher les options avancées"}</span>
                                    </button>

                                    {showAdvanced && (
                                        <div className="mt-4 space-y-4 animate-in fade-in duration-200">
                                            {/* NOTE: on garde slugOverride dans l’état, au cas où tu veux l’ajouter au UI plus tard */}
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="block">
                                                        <span className="text-sm font-medium text-gray-700">Titre SEO</span>
                                                        <input
                                                            type="text"
                                                            className="w-full mt-1 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                            value={seoTitle}
                                                            onChange={(e) => setSeoTitle(e.target.value)}
                                                            placeholder="Optionnel — pour les moteurs de recherche"
                                                        />
                                                    </label>
                                                </div>
                                                <div>
                                                    <label className="block">
                                                        <span className="text-sm font-medium text-gray-700">Description SEO</span>
                                                        <input
                                                            type="text"
                                                            className="w-full mt-1 px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                            value={seoDescription}
                                                            onChange={(e) => setSeoDescription(e.target.value)}
                                                            placeholder="Optionnel — courte description"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 p-6 bg-gray-50/50">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    <p className="font-medium mb-1">Exemple</p>
                                    <p className="font-mono text-xs">
                                        a-propos/diagnostic → <span className="text-blue-600">/p/a-propos/diagnostic</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={close}
                                        className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                                        disabled={submitting}
                                    >
                                        Annuler
                                    </button>

                                    <button
                                        type="button"
                                        onClick={submit}
                                        disabled={!canSubmit}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Création…
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Créer la page
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
