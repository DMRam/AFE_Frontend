import { useEffect, useMemo, useState } from "react";
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
    return input
        .trim()
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function slugifyPath(input: string) {
    return input
        .split("/")
        .map((part) => slugify(part))
        .filter(Boolean)
        .join("/");
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

function fallbackCopyText(text: string): boolean {
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "-1000px";
        textarea.style.left = "-1000px";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);

        return successful;
    } catch {
        return false;
    }
}

async function copyText(text: string): Promise<boolean> {
    if (!text) return false;

    try {
        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // fallback below
    }

    return fallbackCopyText(text);
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
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState("");
    const [copied, setCopied] = useState(false);
    const [copyError, setCopyError] = useState("");

    // User-facing fields
    const [title, setTitle] = useState("");
    const [parentLabel, setParentLabel] = useState("");
    const [seed, setSeed] = useState<SeedMode>("standard");

    // Advanced
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [customUrlSegment, setCustomUrlSegment] = useState("");
    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");

    const parentPath = useMemo(() => slugifyPath(parentLabel), [parentLabel]);

    const pageSlugSegment = useMemo(() => {
        return slugify(customUrlSegment) || slugify(title);
    }, [customUrlSegment, title]);

    const pageId = useMemo(() => {
        if (!pageSlugSegment) return "";
        return parentPath ? `${parentPath}/${pageSlugSegment}` : pageSlugSegment;
    }, [parentPath, pageSlugSegment]);

    const publicPath = useMemo(() => {
        return pageId ? `/p/${pageId}` : "";
    }, [pageId]);

    const fullUrl = useMemo(() => {
        if (!baseUrl || !publicPath) return "";
        return `${baseUrl}${publicPath}`;
    }, [baseUrl, publicPath]);

    const derivedDocId = useMemo(() => {
        return pageId ? pageDocIdFromPageId(pageId) : "";
    }, [pageId]);

    const canSubmit = useMemo(() => {
        return !!title.trim() && !!pageId && !submitting;
    }, [title, pageId, submitting]);

    useEffect(() => {
        if (!open) return;

        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape" && !submitting) {
                close();
            }
        }

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, submitting]);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 1800);
        return () => window.clearTimeout(timer);
    }, [copied]);

    useEffect(() => {
        if (!copyError) return;
        const timer = window.setTimeout(() => setCopyError(""), 2500);
        return () => window.clearTimeout(timer);
    }, [copyError]);

    function resetForm() {
        setErr("");
        setSubmitting(false);
        setCopied(false);
        setCopyError("");
        setTitle("");
        setParentLabel("");
        setSeed("standard");
        setShowAdvanced(false);
        setCustomUrlSegment("");
        setSeoTitle("");
        setSeoDescription("");
    }

    function close() {
        setOpen(false);
        resetForm();
    }

    async function copyUrl() {
        if (!fullUrl) return;

        const ok = await copyText(fullUrl);
        if (ok) {
            setCopied(true);
            setCopyError("");
        } else {
            setCopied(false);
            setCopyError("Impossible de copier automatiquement le lien.");
        }
    }

    async function submit() {
        setErr("");

        if (!title.trim()) {
            setErr("Le nom de la page est requis.");
            return;
        }

        if (!pageId) {
            setErr("Impossible de générer le lien de la page.");
            return;
        }

        setSubmitting(true);

        try {
            const doc = buildPageDoc({
                pageId,
                title: title.trim(),
                slug: publicPath,
                seed,
                seoTitle: seoTitle.trim(),
                seoDescription: seoDescription.trim(),
            });

            await upsertPage(doc);
            await onRefreshList();

            if (fullUrl) {
                await copyText(fullUrl);
            }

            onCreated(derivedDocId);
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
                    "inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800",
                    className,
                ].join(" ")}
            >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle page
            </button>

            {open ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => {
                            if (!submitting) close();
                        }}
                        aria-hidden="true"
                    />

                    <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-medium text-gray-900">Nouvelle page</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Créez une nouvelle page pour votre site.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={close}
                                className="rounded-lg p-2 text-gray-400 hover:text-gray-500"
                                aria-label="Fermer"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-5">
                            <div className="space-y-6">
                                {err && (
                                    <div className="rounded-lg bg-red-50 p-4">
                                        <p className="text-sm text-red-600">{err}</p>
                                    </div>
                                )}

                                {/* Main fields */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Nom de la page
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={title}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setTitle(next);
                                                if (!seoTitle.trim()) setSeoTitle(next);
                                            }}
                                            placeholder="Ex: À propos, Contact, Services"
                                            autoFocus
                                        />
                                    </div>

                                    {/* <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Dossier parent <span className="text-gray-400">(optionnel)</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={parentLabel}
                                            onChange={(e) => setParentLabel(e.target.value)}
                                            placeholder="Ex: Ressources, Blog"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Laissez vide pour créer une page à la racine
                                        </p>
                                    </div> */}

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Modèle de départ
                                        </label>
                                        <select
                                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={seed}
                                            onChange={(e) => setSeed(e.target.value as SeedMode)}
                                        >
                                            <option value="standard">Avec sections par défaut</option>
                                            <option value="empty">Page vide</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Advanced options */}
                                <div className="border-t border-gray-200 pt-5">
                                    <button
                                        type="button"
                                        onClick={() => setShowAdvanced((v) => !v)}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                    >
                                        <svg
                                            className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        Options avancées
                                    </button>

                                    {showAdvanced && (
                                        <div className="mt-4 space-y-5">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                                    Segment d'URL personnalisé
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={customUrlSegment}
                                                    onChange={(e) => setCustomUrlSegment(e.target.value)}
                                                    placeholder="Généré automatiquement si vide"
                                                />
                                            </div>

                                            <div className="grid gap-5 sm:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                        Titre SEO
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={seoTitle}
                                                        onChange={(e) => setSeoTitle(e.target.value)}
                                                        placeholder="Titre de la page"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                        Description SEO
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={seoDescription}
                                                        onChange={(e) => setSeoDescription(e.target.value)}
                                                        placeholder="Description pour les moteurs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* URL preview */}
                                {fullUrl && (
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    URL de la page
                                                </p>
                                                <p className="truncate text-sm text-gray-900">{fullUrl}</p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Conservez ce lien, vous pourrez l’utiliser plus tard.
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={copyUrl}
                                                className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                                            >
                                                {copied ? (
                                                    <>
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Copié
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                        </svg>
                                                        Copier
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {copyError ? (
                                            <p className="mt-3 text-xs text-amber-600">
                                                {copyError} Vous pouvez sélectionner l’URL manuellement.
                                            </p>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/50 px-6 py-4">
                            <p className="text-xs text-gray-500">
                                <kbd className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-600">
                                    Esc
                                </kbd>{" "}
                                pour fermer
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={close}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                                    disabled={submitting}
                                >
                                    Annuler
                                </button>

                                <button
                                    type="button"
                                    onClick={submit}
                                    disabled={!canSubmit}
                                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {submitting ? "Création..." : "Créer la page"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}