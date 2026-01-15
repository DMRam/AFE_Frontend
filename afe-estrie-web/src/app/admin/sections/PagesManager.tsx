import { useEffect, useMemo, useRef, useState } from "react";
import type { PageDoc } from "../../../content/types/pageBlocks";
import {
    listPages,
    getPageByDocId,
    patchPage,
    pageDocIdFromPageId,
    removePage,
} from "../../../services/pageRepo";
import { uploadImage } from "../../../services/storageRepo";
import { NewPageButton } from "../pages/NewPageButton";
import {
    Edit,
    Trash2,
    Eye,
    EyeOff,
    ChevronUp,
    ChevronDown,
    Save,
    Upload,
    Image as ImageIcon,
    FileText,
    Type,
    Columns,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Plus
} from "lucide-react";

type EditorMode = "simple" | "json";

function safeJsonParse<T>(
    text: string
): { ok: true; value: T } | { ok: false; error: string } {
    try {
        return { ok: true, value: JSON.parse(text) as T };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? "JSON invalide" };
    }
}

function uid(prefix = "sec") {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${id}`;
}

type AnySection = any;

function isHero(s: AnySection) {
    return s?.type === "hero";
}
function isRichText(s: AnySection) {
    return s?.type === "richText";
}
function isSplit(s: AnySection) {
    return s?.type === "split";
}
function isTeam(s: AnySection) {
    return s?.type === "team";
}

function clampIndex(i: number, max: number) {
    return Math.max(0, Math.min(i, max));
}

function moveItem<T>(arr: T[], from: number, to: number) {
    const a = [...arr];
    const item = a[from];
    a.splice(from, 1);
    a.splice(to, 0, item);
    return a;
}

function Modal({
    open,
    title,
    children,
    onClose,
}: {
    open: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/30"
                onClick={onClose}
                aria-label="Fermer"
            />
            <div className="relative w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div className="text-lg font-semibold text-gray-900">{title}</div>
                    <button
                        type="button"
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        onClick={onClose}
                    >
                        Fermer
                    </button>
                </div>
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

function ConfirmationModal({
    open,
    title,
    message,
    confirmLabel = "Supprimer",
    cancelLabel = "Annuler",
    onConfirm,
    onCancel,
}: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
        >
            <button
                type="button"
                className="absolute inset-0 bg-black/30"
                onClick={onCancel}
                aria-label="Fermer"
            />
            <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-200 px-5 py-4">
                    <div className="text-lg font-semibold text-gray-900">{title}</div>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-gray-600">{message}</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const PagesManager = () => {
    const [loadingList, setLoadingList] = useState(true);
    const [pages, setPages] = useState<PageDoc[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const [loadingPage, setLoadingPage] = useState(false);
    const [page, setPage] = useState<PageDoc | null>(null);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [published, setPublished] = useState(false);

    const [sections, setSections] = useState<AnySection[]>([]);
    const [mode, setMode] = useState<EditorMode>("simple");
    const [sectionsText, setSectionsText] = useState("[]");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editOpen, setEditOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<AnySection | null>(null);

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<string | null>(null);

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const heroFileRef = useRef<HTMLInputElement | null>(null);
    const splitFileRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        void reloadPagesList(true);
    }, []);

    async function reloadPagesList(selectFirst = false) {
        setLoadingList(true);
        setError("");
        try {
            const items = await listPages();
            const sortedItems = items.sort((a, b) =>
                (a.title || "").localeCompare(b.title || "")
            );
            setPages(sortedItems);
            if (selectFirst && sortedItems.length) {
                setSelectedDocId(pageDocIdFromPageId(sortedItems[0].id));
            }
        } catch (e: any) {
            setError(`Erreur de chargement: ${e?.message ?? "Inconnue"}`);
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        if (!selectedDocId) return;

        (async () => {
            setLoadingPage(true);
            setError("");
            try {
                const p = await getPageByDocId(selectedDocId);
                if (!p) {
                    setPage(null);
                    setTitle("");
                    setSlug("");
                    setPublished(false);
                    setSections([]);
                    setSectionsText("[]");
                    setError("Page non trouvée");
                    return;
                }

                setPage(p);
                setTitle(p.title ?? "");
                setSlug(p.slug ?? "");
                setPublished(p.published !== false);
                const secs = (p.sections ?? []) as AnySection[];
                setSections(secs);
                setSectionsText(JSON.stringify(secs, null, 2));
            } catch (e: any) {
                setError(`Erreur de chargement: ${e?.message ?? "Inconnue"}`);
            } finally {
                setLoadingPage(false);
            }
        })();
    }, [selectedDocId]);

    const jsonCheck = useMemo(
        () => safeJsonParse<AnySection[]>(sectionsText),
        [sectionsText]
    );

    useEffect(() => {
        if (mode !== "json") return;
        setSectionsText(JSON.stringify(sections ?? [], null, 2));
    }, [mode, sections]);

    function switchMode(next: EditorMode) {
        setError("");
        if (next === mode) return;

        if (next === "json") {
            setSectionsText(JSON.stringify(sections ?? [], null, 2));
            setMode("json");
            return;
        }

        const parsed = safeJsonParse<AnySection[]>(sectionsText);
        if (!parsed.ok) {
            setError(`Erreur JSON: ${parsed.error}`);
            return;
        }
        setSections(parsed.value ?? []);
        setMode("simple");
    }

    async function onSave() {
        if (!selectedDocId || !page) return;

        if (mode === "json") {
            if (!jsonCheck.ok) {
                setError(`Erreur JSON: ${jsonCheck.error}`);
                return;
            }
            setSections(jsonCheck.value ?? []);
        }

        setSaving(true);
        setError("");
        setSuccess("");
        try {
            await patchPage(selectedDocId, {
                title,
                slug,
                published,
                sections: mode === "json" && jsonCheck.ok ? jsonCheck.value : sections,
            });
            setSuccess("Page sauvegardée avec succès");
            void reloadPagesList(false);
        } catch (e: any) {
            setError(`Erreur de sauvegarde: ${e?.message ?? "Inconnue"}`);
        } finally {
            setSaving(false);
        }
    }

    async function onDeletePage(docId: string) {
        try {
            await removePage(docId);
            setSuccess("Page supprimée avec succès");
            setDeleteConfirmOpen(false);
            setPageToDelete(null);
            void reloadPagesList(true);
        } catch (e: any) {
            setError(`Erreur de suppression: ${e?.message ?? "Inconnue"}`);
        }
    }

    function addSection(type: "hero" | "richText" | "split") {
        const base = { id: uid(type), type, enabled: true };

        const next =
            type === "hero"
                ? {
                    ...base,
                    title: "Nouveau titre hero",
                    subtitle: "Sous-titre optionnel",
                    backgroundImage: "",
                    align: "center",
                    textColor: "light",
                }
                : type === "richText"
                    ? {
                        ...base,
                        content: "Écrivez votre contenu ici…",
                    }
                    : {
                        ...base,
                        title: "Nouvelle section",
                        content: "Écrivez votre texte ici…",
                        imageUrl: "",
                        imageAlt: "",
                        imageSide: "right",
                        variant: "default",
                    };

        setSections((prev) => [...prev, next]);
    }

    function openEdit(i: number) {
        const s = sections[i];
        if (!s) return;
        setEditIndex(i);
        setDraft(structuredClone ? structuredClone(s) : JSON.parse(JSON.stringify(s)));
        setUploadError("");
        setEditOpen(true);
    }

    function closeEdit() {
        setEditOpen(false);
        setEditIndex(null);
        setDraft(null);
        setUploading(false);
        setUploadError("");
        if (heroFileRef.current) heroFileRef.current.value = "";
        if (splitFileRef.current) splitFileRef.current.value = "";
    }

    function applyEdit() {
        if (editIndex == null || !draft) return;
        setSections((prev) => {
            const next = [...prev];
            next[editIndex] = draft;
            return next;
        });
        closeEdit();
    }

    function removeSection(i: number) {
        setSections((prev) => prev.filter((_, idx) => idx !== i));
    }

    function toggleEnabled(i: number) {
        setSections((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], enabled: next[i]?.enabled === false ? true : false };
            return next;
        });
    }

    function moveUp(i: number) {
        setSections((prev) => moveItem(prev, i, clampIndex(i - 1, prev.length - 1)));
    }

    function moveDown(i: number) {
        setSections((prev) => moveItem(prev, i, clampIndex(i + 1, prev.length - 1)));
    }

    async function handleUpload(file: File, target: "hero" | "split") {
        if (!draft) return;
        setUploading(true);
        setUploadError("");
        try {
            const folder = target === "hero" ? "page-hero" : "page-images";
            const url = await uploadImage(file, folder);

            setDraft((d: any) => {
                if (!d) return d;
                if (target === "hero") return { ...d, backgroundImage: url };
                return { ...d, imageUrl: url };
            });
        } catch (e: any) {
            setUploadError(`Erreur d'upload: ${e?.message ?? "Inconnue"}`);
        } finally {
            setUploading(false);
            if (target === "hero" && heroFileRef.current) heroFileRef.current.value = "";
            if (target === "split" && splitFileRef.current) splitFileRef.current.value = "";
        }
    }

    const canSave =
        !saving &&
        !loadingPage &&
        !!page &&
        !!selectedDocId &&
        (mode === "simple" || (mode === "json" && jsonCheck.ok));

    return (
        <div className="space-y-6">
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-700">{error}</div>
                </div>
            )}

            {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-emerald-700">{success}</div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr] 2xl:grid-cols-[320px_1fr]">
                {/* Liste des pages */}
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Pages</div>
                            <div className="text-xs text-gray-500">{pages.length} page(s)</div>
                        </div>
                        <NewPageButton
                            onRefreshList={() => reloadPagesList(false)}
                            onCreated={(docId) => setSelectedDocId(docId)}
                        />
                    </div>

                    {loadingList ? (
                        <div className="p-6 text-center">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                            <div className="mt-2 text-sm text-gray-500">Chargement…</div>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {pages.length === 0 ? (
                                <div className="p-6 text-center">
                                    <div className="text-sm text-gray-500">Aucune page</div>
                                </div>
                            ) : (
                                pages.map((p) => {
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
                                                onClick={() => setSelectedDocId(docId)}
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
                                                onClick={() => {
                                                    setPageToDelete(docId);
                                                    setDeleteConfirmOpen(true);
                                                }}
                                                className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                {/* Éditeur */}
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold text-gray-900">Éditeur de page</div>
                                <div className="text-xs text-gray-500">
                                    Mode simple pour les rédacteurs • JSON pour les développeurs
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                                    <button
                                        type="button"
                                        onClick={() => switchMode("simple")}
                                        className={[
                                            "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                                            mode === "simple"
                                                ? "bg-gray-900 text-white"
                                                : "text-gray-700 hover:bg-gray-50",
                                        ].join(" ")}
                                    >
                                        Simple
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => switchMode("json")}
                                        className={[
                                            "rounded px-3 py-1.5 text-sm font-medium transition-colors",
                                            mode === "json"
                                                ? "bg-gray-900 text-white"
                                                : "text-gray-700 hover:bg-gray-50",
                                        ].join(" ")}
                                    >
                                        JSON
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={onSave}
                                    disabled={!canSave}
                                    className={[
                                        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                        canSave
                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                            : "bg-gray-200 text-gray-400 cursor-not-allowed",
                                    ].join(" ")}
                                    title={mode === "json" && !jsonCheck.ok ? jsonCheck.error : ""}
                                >
                                    {saving ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Sauvegarde…
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Sauvegarder
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {loadingPage ? (
                        <div className="p-6 text-center">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                            <div className="mt-2 text-sm text-gray-500">Chargement de la page…</div>
                        </div>
                    ) : !page ? (
                        <div className="p-6 text-center">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8">
                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <div className="text-sm font-medium text-gray-900 mb-1">Aucune page sélectionnée</div>
                                <div className="text-sm text-gray-500">Sélectionnez une page dans la liste ou créez-en une nouvelle</div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 space-y-6">
                            {/* Champs de base */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="text-sm">
                                    <div className="mb-2 font-medium text-gray-900">Titre de la page</div>
                                    <input
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Titre de la page"
                                    />
                                </label>

                                <label className="text-sm">
                                    <div className="mb-2 font-medium text-gray-900">Slug (URL)</div>
                                    <input
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="/a-propos/en-bref"
                                    />
                                </label>

                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={published}
                                            onChange={(e) => setPublished(e.target.checked)}
                                        />
                                        <span className="text-sm font-medium text-gray-900">Page publiée</span>
                                    </label>
                                    <span className="text-xs text-gray-500">
                                        {published ? "Visible sur le site" : "Brouillon uniquement"}
                                    </span>
                                </div>
                            </div>

                            {/* Sections */}
                            {mode === "simple" ? (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="text-sm font-semibold text-gray-900">Sections de contenu</div>
                                            <div className="text-xs text-gray-500">
                                                {sections.length} section(s) • Gérez l'ordre et le contenu
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => addSection("hero")}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <Type className="h-4 w-4" />
                                                Hero
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addSection("richText")}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Texte
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addSection("split")}
                                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                <Columns className="h-4 w-4" />
                                                Split
                                            </button>
                                        </div>
                                    </div>

                                    {sections.length === 0 ? (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
                                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <div className="text-sm text-gray-600">Aucune section</div>
                                            <div className="text-xs text-gray-500 mt-1">Ajoutez votre première section</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {sections.map((s, i) => {
                                                const disabled = s?.enabled === false;

                                                const subtitle =
                                                    isHero(s)
                                                        ? s.subtitle
                                                        : isSplit(s)
                                                            ? s.title
                                                            : isTeam(s)
                                                                ? `${s.members?.length ?? 0} membre(s) (obsolète)`
                                                                : isRichText(s)
                                                                    ? (s.content ?? "").slice(0, 60) + "..."
                                                                    : "";

                                                return (
                                                    <div
                                                        key={s.id ?? `${s.type}-${i}`}
                                                        className={[
                                                            "rounded-lg border bg-white p-4 transition-colors",
                                                            disabled ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-gray-400",
                                                        ].join(" ")}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className={[
                                                                        "rounded-full px-2 py-1 text-xs font-medium",
                                                                        disabled ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700",
                                                                    ].join(" ")}>
                                                                        {s.type}
                                                                    </span>
                                                                    <span className={[
                                                                        "rounded-full px-2 py-1 text-xs font-medium",
                                                                        disabled ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800",
                                                                    ].join(" ")}>
                                                                        {disabled ? "Désactivée" : "Activée"}
                                                                    </span>
                                                                </div>

                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {isHero(s)
                                                                        ? s.title || "Section Hero"
                                                                        : isSplit(s)
                                                                            ? s.title || "Section Split"
                                                                            : isRichText(s)
                                                                                ? "Bloc de texte"
                                                                                : isTeam(s)
                                                                                    ? s.title || "Équipe (obsolète)"
                                                                                    : "Section"}
                                                                </div>

                                                                {subtitle && (
                                                                    <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                                                                        {subtitle}
                                                                    </div>
                                                                )}

                                                                <div className="mt-2 text-xs text-gray-500">
                                                                    ID: {s.id || "—"}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleEnabled(i)}
                                                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                                                                    title={disabled ? "Activer" : "Désactiver"}
                                                                >
                                                                    {disabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEdit(i)}
                                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                                    title="Modifier"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSection(i)}
                                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                                <div className="flex gap-1 mt-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveUp(i)}
                                                                        disabled={i === 0}
                                                                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
                                                                        title="Monter"
                                                                    >
                                                                        <ChevronUp className="h-4 w-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => moveDown(i)}
                                                                        disabled={i === sections.length - 1}
                                                                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
                                                                        title="Descendre"
                                                                    >
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Modal d'édition */}
                                    <Modal open={editOpen} title="Modifier la section" onClose={closeEdit}>
                                        {!draft ? null : (
                                            <div className="space-y-4">
                                                {uploadError && (
                                                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                                        {uploadError}
                                                    </div>
                                                )}

                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={draft.enabled !== false}
                                                        onChange={(e) =>
                                                            setDraft((d: any) => ({
                                                                ...(d ?? {}),
                                                                enabled: e.target.checked,
                                                            }))
                                                        }
                                                    />
                                                    <span className="font-medium text-gray-900">Section active</span>
                                                </label>

                                                {/* HERO */}
                                                {isHero(draft) ? (
                                                    <div className="space-y-4">
                                                        <label className="text-sm">
                                                            <div className="mb-2 font-medium text-gray-900">Titre</div>
                                                            <input
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                value={draft.title ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((d: any) => ({
                                                                        ...(d ?? {}),
                                                                        title: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </label>

                                                        <label className="text-sm">
                                                            <div className="mb-2 font-medium text-gray-900">Sous-titre</div>
                                                            <textarea
                                                                rows={3}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                value={draft.subtitle ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((d: any) => ({
                                                                        ...(d ?? {}),
                                                                        subtitle: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </label>

                                                        <div className="space-y-3">
                                                            <label className="text-sm">
                                                                <div className="mb-2 font-medium text-gray-900">
                                                                    Image de fond
                                                                </div>
                                                                <input
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                    value={draft.backgroundImage ?? ""}
                                                                    onChange={(e) =>
                                                                        setDraft((d: any) => ({
                                                                            ...(d ?? {}),
                                                                            backgroundImage: e.target.value,
                                                                        }))
                                                                    }
                                                                    placeholder="https://example.com/image.jpg"
                                                                />
                                                            </label>

                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    ref={heroFileRef}
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const f = e.target.files?.[0];
                                                                        if (!f) return;
                                                                        void handleUpload(f, "hero");
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => heroFileRef.current?.click()}
                                                                    disabled={uploading}
                                                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                                                >
                                                                    <Upload className="h-4 w-4" />
                                                                    {uploading ? "Téléchargement…" : "Télécharger une image"}
                                                                </button>
                                                                <span className="text-xs text-gray-500">
                                                                    PNG, JPG, WebP (max 5MB)
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            <label className="text-sm">
                                                                <div className="mb-2 font-medium text-gray-900">Alignement</div>
                                                                <select
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                    value={draft.align ?? "center"}
                                                                    onChange={(e) =>
                                                                        setDraft((d: any) => ({
                                                                            ...(d ?? {}),
                                                                            align: e.target.value,
                                                                        }))
                                                                    }
                                                                >
                                                                    <option value="left">Gauche</option>
                                                                    <option value="center">Centre</option>
                                                                </select>
                                                            </label>

                                                            <label className="text-sm">
                                                                <div className="mb-2 font-medium text-gray-900">Couleur du texte</div>
                                                                <select
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                    value={draft.textColor ?? "light"}
                                                                    onChange={(e) =>
                                                                        setDraft((d: any) => ({
                                                                            ...(d ?? {}),
                                                                            textColor: e.target.value,
                                                                        }))
                                                                    }
                                                                >
                                                                    <option value="light">Clair (blanc)</option>
                                                                    <option value="dark">Foncé (noir)</option>
                                                                </select>
                                                            </label>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* RICH TEXT */}
                                                {isRichText(draft) ? (
                                                    <div className="space-y-4">
                                                        <label className="text-sm">
                                                            <div className="mb-2 font-medium text-gray-900">Contenu</div>
                                                            <textarea
                                                                rows={8}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono"
                                                                value={draft.content ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((d: any) => ({
                                                                        ...(d ?? {}),
                                                                        content: e.target.value,
                                                                    }))
                                                                }
                                                                placeholder="Écrivez votre contenu en Markdown ou HTML…"
                                                            />
                                                        </label>
                                                        <div className="text-xs text-gray-500">
                                                            Utilisez du texte simple, Markdown ou HTML basique
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* SPLIT */}
                                                {isSplit(draft) ? (
                                                    <div className="space-y-4">
                                                        <label className="text-sm">
                                                            <div className="mb-2 font-medium text-gray-900">Titre</div>
                                                            <input
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                value={draft.title ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((d: any) => ({
                                                                        ...(d ?? {}),
                                                                        title: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </label>

                                                        <label className="text-sm">
                                                            <div className="mb-2 font-medium text-gray-900">Contenu</div>
                                                            <textarea
                                                                rows={4}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                value={draft.content ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((d: any) => ({
                                                                        ...(d ?? {}),
                                                                        content: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </label>

                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            <div className="space-y-3">
                                                                <label className="text-sm">
                                                                    <div className="mb-2 font-medium text-gray-900">URL de l'image</div>
                                                                    <input
                                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                        value={draft.imageUrl ?? ""}
                                                                        onChange={(e) =>
                                                                            setDraft((d: any) => ({
                                                                                ...(d ?? {}),
                                                                                imageUrl: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                </label>

                                                                <div className="flex items-center gap-3">
                                                                    <input
                                                                        ref={splitFileRef}
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const f = e.target.files?.[0];
                                                                            if (!f) return;
                                                                            void handleUpload(f, "split");
                                                                        }}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => splitFileRef.current?.click()}
                                                                        disabled={uploading}
                                                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                                                    >
                                                                        <Upload className="h-4 w-4" />
                                                                        Télécharger
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-3">
                                                                <label className="text-sm">
                                                                    <div className="mb-2 font-medium text-gray-900">Côté de l'image</div>
                                                                    <select
                                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                        value={draft.imageSide ?? "right"}
                                                                        onChange={(e) =>
                                                                            setDraft((d: any) => ({
                                                                                ...(d ?? {}),
                                                                                imageSide: e.target.value,
                                                                            }))
                                                                        }
                                                                    >
                                                                        <option value="left">Gauche</option>
                                                                        <option value="right">Droite</option>
                                                                    </select>
                                                                </label>

                                                                <label className="text-sm">
                                                                    <div className="mb-2 font-medium text-gray-900">Style</div>
                                                                    <select
                                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                        value={draft.variant ?? "default"}
                                                                        onChange={(e) =>
                                                                            setDraft((d: any) => ({
                                                                                ...(d ?? {}),
                                                                                variant: e.target.value,
                                                                            }))
                                                                        }
                                                                    >
                                                                        <option value="default">Blanc</option>
                                                                        <option value="soft">Gris clair</option>
                                                                    </select>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        <label className="text-sm">
                                                            <div className="mb-2 font-medium text-gray-900">Texte alternatif (alt)</div>
                                                            <input
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                                                value={draft.imageAlt ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((d: any) => ({
                                                                        ...(d ?? {}),
                                                                        imageAlt: e.target.value,
                                                                    }))
                                                                }
                                                                placeholder="Description de l'image"
                                                            />
                                                        </label>
                                                    </div>
                                                ) : null}

                                                {/* TEAM (legacy) */}
                                                {isTeam(draft) ? (
                                                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                                                        <div className="flex items-start gap-3">
                                                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                                            <div className="space-y-2">
                                                                <div className="text-sm font-medium text-amber-900">Section obsolète : Équipe</div>
                                                                <div className="text-xs text-amber-800">
                                                                    Nous ne créons plus de sections Équipe dans le mode simple.
                                                                    Veuillez convertir cette section en blocs Split (un par membre)
                                                                    ou utilisez le mode JSON pour la modifier.
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                                                    <button
                                                        type="button"
                                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                                        onClick={closeEdit}
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                                                        onClick={applyEdit}
                                                        disabled={uploading}
                                                    >
                                                        Appliquer
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Modal>
                                </div>
                            ) : (
                                // Mode JSON
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="text-sm font-semibold text-gray-900">Éditeur JSON</div>
                                            <div className="text-xs text-gray-500">
                                                Édition avancée des sections
                                            </div>
                                        </div>
                                        <div className="text-xs">
                                            {jsonCheck.ok ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    JSON valide
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-red-700">
                                                    <AlertCircle className="h-3 w-3" />
                                                    JSON invalide
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <label className="block">
                                        <textarea
                                            className={[
                                                "min-h-[500px] w-full rounded-lg border px-4 py-3 font-mono text-sm",
                                                jsonCheck.ok
                                                    ? "border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    : "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500",
                                            ].join(" ")}
                                            value={sectionsText}
                                            onChange={(e) => setSectionsText(e.target.value)}
                                            spellCheck="false"
                                        />
                                        {!jsonCheck.ok && (
                                            <div className="mt-2 text-xs text-red-600">
                                                {jsonCheck.error}
                                            </div>
                                        )}
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmation de suppression */}
            <ConfirmationModal
                open={deleteConfirmOpen}
                title="Supprimer la page"
                message="Êtes-vous sûr de vouloir supprimer cette page ? Cette action est irréversible."
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                onConfirm={() => pageToDelete && onDeletePage(pageToDelete)}
                onCancel={() => {
                    setDeleteConfirmOpen(false);
                    setPageToDelete(null);
                }}
            />
        </div>
    );
};