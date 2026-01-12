import { useEffect, useMemo, useRef, useState } from "react";
import type { PageDoc } from "../../../content/types/pageBlocks";
import {
    listPages,
    getPageByDocId,
    patchPage,
    pageDocIdFromPageId,
} from "../../../services/pageRepo";

// ✅ add this (you said the other stuff is done)
import { uploadImage } from "../../../services/storageRepo";
import { NewPageButton } from "../pages/NewPageButton";

type EditorMode = "simple" | "json";

function safeJsonParse<T>(
    text: string
): { ok: true; value: T } | { ok: false; error: string } {
    try {
        return { ok: true, value: JSON.parse(text) as T };
    } catch (e: any) {
        return { ok: false, error: e?.message ?? "Invalid JSON" };
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
// ⚠️ We keep reading existing "team" docs, but we don't offer it in Simple mode anymore.
// This avoids "unknown section type" for old data and prevents creating new team sections.
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
                aria-label="Close modal"
            />
            <div className="relative w-full max-w-2xl rounded-2xl border bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <div className="text-sm font-semibold text-gray-900">{title}</div>
                    <button
                        type="button"
                        className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
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

    // Source of truth: sections array (simple mode)
    const [sections, setSections] = useState<AnySection[]>([]);

    // Advanced JSON editor buffer (only used in JSON mode)
    const [mode, setMode] = useState<EditorMode>("simple");
    const [sectionsText, setSectionsText] = useState("[]");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>("");

    // Section modal state
    const [editOpen, setEditOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<AnySection | null>(null);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const heroFileRef = useRef<HTMLInputElement | null>(null);
    const splitFileRef = useRef<HTMLInputElement | null>(null);

    // Load list
    // useEffect(() => {
    //     (async () => {
    //         setLoadingList(true);
    //         setError("");
    //         try {
    //             const items = await listPages();
    //             setPages(items);

    //             if (items.length) {
    //                 const firstDocId = pageDocIdFromPageId(items[0].id);
    //                 setSelectedDocId(firstDocId);
    //             }
    //         } catch (e: any) {
    //             setError(e?.message ?? "Failed to load pages list");
    //         } finally {
    //             setLoadingList(false);
    //         }
    //     })();
    // }, []);

    useEffect(() => {
        void reloadPagesList(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    async function reloadPagesList(selectFirst = false) {
        setLoadingList(true);
        setError("");
        try {
            const items = await listPages();
            setPages(items);
            if (selectFirst && items.length) {
                setSelectedDocId(pageDocIdFromPageId(items[0].id));
            }
        } catch (e: any) {
            setError(e?.message ?? "Failed to load pages list");
        } finally {
            setLoadingList(false);
        }
    }


    // Load selected page
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
                    setSections([]);
                    setSectionsText("[]");
                    setError("Page not found in Firestore.");
                    return;
                }

                setPage(p);
                setTitle(p.title ?? "");
                setSlug(p.slug ?? "");
                const secs = (p.sections ?? []) as AnySection[];
                setSections(secs);
                setSectionsText(JSON.stringify(secs, null, 2));
            } catch (e: any) {
                setError(e?.message ?? "Failed to load page");
            } finally {
                setLoadingPage(false);
            }
        })();
    }, [selectedDocId]);

    // JSON validation
    const jsonCheck = useMemo(
        () => safeJsonParse<AnySection[]>(sectionsText),
        [sectionsText]
    );

    // Keep JSON text in sync when in JSON mode and sections change
    useEffect(() => {
        if (mode !== "json") return;
        setSectionsText(JSON.stringify(sections ?? [], null, 2));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, sections]);

    function switchMode(next: EditorMode) {
        setError("");
        if (next === mode) return;

        if (next === "json") {
            setSectionsText(JSON.stringify(sections ?? [], null, 2));
            setMode("json");
            return;
        }

        // switching from json -> simple: must parse first
        const parsed = safeJsonParse<AnySection[]>(sectionsText);
        if (!parsed.ok) {
            setError(`Sections JSON error: ${parsed.error}`);
            return;
        }
        setSections(parsed.value ?? []);
        setMode("simple");
    }

    async function onSave() {
        if (!selectedDocId || !page) return;

        // If user is in JSON mode, validate & sync before saving
        if (mode === "json") {
            if (!jsonCheck.ok) {
                setError(`Sections JSON error: ${jsonCheck.error}`);
                return;
            }
            setSections(jsonCheck.value ?? []);
        }

        setSaving(true);
        setError("");
        try {
            await patchPage(selectedDocId, {
                title,
                slug,
                sections:
                    mode === "json"
                        ? jsonCheck.ok
                            ? jsonCheck.value
                            : sections
                        : sections,
            });
        } catch (e: any) {
            setError(e?.message ?? "Save failed");
        } finally {
            setSaving(false);
        }
    }

    // ---- SIMPLE MODE actions ----
    function addSection(type: "hero" | "richText" | "split") {
        const base = { id: uid(type), type, enabled: true };

        const next =
            type === "hero"
                ? {
                    ...base,
                    title: "New hero title",
                    subtitle: "Optional subtitle",
                    backgroundImage: "/images/your-image.jpg",
                    align: "center",
                    textColor: "light",
                }
                : type === "richText"
                    ? {
                        ...base,
                        content: "Write your content here…",
                    }
                    : {
                        ...base,
                        title: "New section title",
                        content: "Write your text here…",
                        imageUrl: "/images/your-image.jpg",
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
            // You can change folders if you want
            const folder = target === "hero" ? "page-hero" : "page-images";
            const url = await uploadImage(file, folder);

            setDraft((d: any) => {
                if (!d) return d;
                if (target === "hero") return { ...d, backgroundImage: url };
                return { ...d, imageUrl: url };
            });
        } catch (e: any) {
            setUploadError(e?.message ?? "Upload failed");
        } finally {
            setUploading(false);
            // keep input file so user sees they selected something? usually we clear:
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
        <div className="space-y-4">
            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                {/* LIST */}
                <div className="rounded-2xl border bg-white">
                    <div className="border-b px-4 py-3 text-sm font-semibold text-gray-900">
                        Pages
                    </div>

                    {loadingList ? (
                        <div className="p-4 text-sm text-gray-500">Loading…</div>
                    ) : (
                        <div className="divide-y">
                            {pages.map((p) => {
                                const docId = pageDocIdFromPageId(p.id);
                                const active = docId === selectedDocId;

                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setSelectedDocId(docId)}
                                        className={[
                                            "w-full text-left px-4 py-3 transition",
                                            active ? "bg-gray-50" : "hover:bg-gray-50",
                                        ].join(" ")}
                                    >
                                        <div className="text-sm font-semibold text-gray-900">
                                            {p.title}
                                        </div>
                                        <div className="mt-0.5 text-xs text-gray-500">
                                            {p.slug} • {p.id}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* EDITOR */}
                <div className="rounded-2xl border bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Editor</div>
                            <div className="text-xs text-gray-500">
                                Simple editor for clients • JSON mode for you
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-xl border bg-white p-1">
                                <button
                                    type="button"
                                    onClick={() => switchMode("simple")}
                                    className={[
                                        "rounded-lg px-3 py-1.5 text-sm font-semibold",
                                        mode === "simple"
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-900 hover:bg-gray-50",
                                    ].join(" ")}
                                >
                                    Simple
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchMode("json")}
                                    className={[
                                        "rounded-lg px-3 py-1.5 text-sm font-semibold",
                                        mode === "json"
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-900 hover:bg-gray-50",
                                    ].join(" ")}
                                >
                                    JSON
                                </button>

                            </div>

                            <button
                                type="button"
                                onClick={onSave}
                                disabled={!canSave}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                title={mode === "json" && !jsonCheck.ok ? jsonCheck.error : ""}
                            >
                                {saving ? "Saving…" : "Save"}
                            </button>

                        </div>
                        

                    </div>

                    <div className="flex items-center justify-between border-b px-4 py-3">
                            <div className="text-sm font-semibold text-gray-900">Pages</div>
                            <NewPageButton
                                onRefreshList={() => reloadPagesList(false)}
                                onCreated={(docId) => setSelectedDocId(docId)}
                            />
                        </div>

                    {loadingPage ? (
                        <div className="p-4 text-sm text-gray-500">Loading page…</div>
                    ) : !page ? (
                        <div className="p-4 text-sm text-gray-500">Select a page.</div>
                    ) : (
                        <div className="p-4 space-y-6">
                            {/* Page fields */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="text-sm">
                                    <div className="mb-1 font-semibold text-gray-900">Title</div>
                                    <input
                                        className="w-full rounded-xl border px-3 py-2"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </label>

                                <label className="text-sm">
                                    <div className="mb-1 font-semibold text-gray-900">Slug</div>
                                    <input
                                        className="w-full rounded-xl border px-3 py-2"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        placeholder="/a-propos/en-bref"
                                    />
                                </label>
                            </div>

                            {/* Sections */}
                            {mode === "simple" ? (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">
                                                Sections
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Add / edit sections without touching JSON.
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => addSection("hero")}
                                                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                            >
                                                + Hero
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addSection("richText")}
                                                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                            >
                                                + Text
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => addSection("split")}
                                                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                            >
                                                + Split
                                            </button>
                                        </div>
                                    </div>

                                    {sections.length === 0 ? (
                                        <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
                                            No sections yet. Add one using the buttons above.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {sections.map((s, i) => {
                                                const disabled = s?.enabled === false;

                                                const subtitle =
                                                    isHero(s)
                                                        ? s.subtitle
                                                        : isSplit(s)
                                                            ? s.title
                                                            : isTeam(s)
                                                                ? `${(s.members?.length ?? 0)} member(s) (legacy)`
                                                                : isRichText(s)
                                                                    ? (s.content ?? "").slice(0, 80)
                                                                    : "";

                                                return (
                                                    <div
                                                        key={s.id ?? `${s.type}-${i}`}
                                                        className={[
                                                            "rounded-2xl border bg-white p-4",
                                                            disabled ? "opacity-70" : "",
                                                        ].join(" ")}
                                                    >
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div className="min-w-[220px]">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                                                                        {String(s.type)}
                                                                    </span>
                                                                    {disabled ? (
                                                                        <span className="rounded-lg bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-800">
                                                                            Disabled
                                                                        </span>
                                                                    ) : (
                                                                        <span className="rounded-lg bg-green-50 px-2 py-1 text-xs font-semibold text-green-800">
                                                                            Enabled
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <div className="mt-2 text-sm font-semibold text-gray-900">
                                                                    {isHero(s)
                                                                        ? s.title || "Hero"
                                                                        : isSplit(s)
                                                                            ? s.title || "Split section"
                                                                            : isRichText(s)
                                                                                ? "Text block"
                                                                                : isTeam(s)
                                                                                    ? s.title || "Team section (legacy)"
                                                                                    : "Section"}
                                                                </div>

                                                                {subtitle ? (
                                                                    <div className="mt-1 text-sm text-gray-600">
                                                                        {String(subtitle)}
                                                                    </div>
                                                                ) : null}

                                                                <div className="mt-2 text-xs text-gray-400">
                                                                    id: {String(s.id ?? "—")}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleEnabled(i)}
                                                                    className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                                                >
                                                                    {disabled ? "Enable" : "Disable"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEdit(i)}
                                                                    className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black"
                                                                >
                                                                    Edit
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => moveUp(i)}
                                                                    disabled={i === 0}
                                                                    className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                                                                >
                                                                    ↑
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => moveDown(i)}
                                                                    disabled={i === sections.length - 1}
                                                                    className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                                                                >
                                                                    ↓
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeSection(i)}
                                                                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <Modal open={editOpen} title={`Edit section`} onClose={closeEdit}>
                                        {!draft ? null : (
                                            <div className="space-y-4">
                                                {uploadError ? (
                                                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                                        {uploadError}
                                                    </div>
                                                ) : null}

                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={draft.enabled !== false}
                                                        onChange={(e) =>
                                                            setDraft((d: any) => ({
                                                                ...(d ?? {}),
                                                                enabled: e.target.checked,
                                                            }))
                                                        }
                                                    />
                                                    <span className="font-semibold text-gray-900">Enabled</span>
                                                </label>

                                                {/* HERO */}
                                                {isHero(draft) ? (
                                                    <div className="grid gap-4">
                                                        <label className="text-sm">
                                                            <div className="mb-1 font-semibold text-gray-900">Title</div>
                                                            <input
                                                                className="w-full rounded-xl border px-3 py-2"
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
                                                            <div className="mb-1 font-semibold text-gray-900">Subtitle</div>
                                                            <textarea
                                                                className="min-h-[90px] w-full rounded-xl border px-3 py-2"
                                                                value={draft.subtitle ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((d: any) => ({
                                                                        ...(d ?? {}),
                                                                        subtitle: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </label>

                                                        <div className="grid gap-3">
                                                            <label className="text-sm">
                                                                <div className="mb-1 font-semibold text-gray-900">
                                                                    Background image URL
                                                                </div>
                                                                <input
                                                                    className="w-full rounded-xl border px-3 py-2"
                                                                    value={draft.backgroundImage ?? ""}
                                                                    onChange={(e) =>
                                                                        setDraft((d: any) => ({
                                                                            ...(d ?? {}),
                                                                            backgroundImage: e.target.value,
                                                                        }))
                                                                    }
                                                                />
                                                            </label>

                                                            <div className="flex flex-wrap items-center gap-2">
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
                                                                    className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                                                                >
                                                                    {uploading ? "Uploading…" : "Upload image"}
                                                                </button>

                                                                <div className="text-xs text-gray-500">
                                                                    Upload sets the URL automatically.
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid gap-4 md:grid-cols-2">
                                                            <label className="text-sm">
                                                                <div className="mb-1 font-semibold text-gray-900">Align</div>
                                                                <select
                                                                    className="w-full rounded-xl border px-3 py-2"
                                                                    value={draft.align ?? "center"}
                                                                    onChange={(e) =>
                                                                        setDraft((d: any) => ({
                                                                            ...(d ?? {}),
                                                                            align: e.target.value as "left" | "center",
                                                                        }))
                                                                    }
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="center">Center</option>
                                                                </select>
                                                            </label>

                                                            <label className="text-sm">
                                                                <div className="mb-1 font-semibold text-gray-900">Text Color</div>
                                                                <select
                                                                    className="w-full rounded-xl border px-3 py-2"
                                                                    value={draft.textColor ?? "light"}
                                                                    onChange={(e) =>
                                                                        setDraft((d: any) => ({
                                                                            ...(d ?? {}),
                                                                            textColor: e.target.value as "light" | "dark",
                                                                        }))
                                                                    }
                                                                >
                                                                    <option value="light">Light (White)</option>
                                                                    <option value="dark">Dark (Black)</option>
                                                                </select>
                                                            </label>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* RICH TEXT */}
                                                {isRichText(draft) ? (
                                                    <div className="grid gap-4">
                                                        <label className="text-sm">
                                                            <div className="mb-1 font-semibold text-gray-900">Content</div>
                                                            <textarea
                                                                className="min-h-[220px] w-full rounded-xl border px-3 py-2"
                                                                value={draft.content ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((d: any) => ({
                                                                        ...(d ?? {}),
                                                                        content: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                            <div className="mt-1 text-xs text-gray-500">
                                                                (MVP) Plain text / Markdown. Later we can plug a rich editor.
                                                            </div>
                                                        </label>
                                                    </div>
                                                ) : null}

                                                {/* SPLIT */}
                                                {isSplit(draft) ? (
                                                    <div className="grid gap-4">
                                                        <label className="text-sm">
                                                            <div className="mb-1 font-semibold text-gray-900">Title</div>
                                                            <input
                                                                className="w-full rounded-xl border px-3 py-2"
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
                                                            <div className="mb-1 font-semibold text-gray-900">Content</div>
                                                            <textarea
                                                                className="min-h-[160px] w-full rounded-xl border px-3 py-2"
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
                                                            <div className="grid gap-3">
                                                                <label className="text-sm">
                                                                    <div className="mb-1 font-semibold text-gray-900">Image URL</div>
                                                                    <input
                                                                        className="w-full rounded-xl border px-3 py-2"
                                                                        value={draft.imageUrl ?? ""}
                                                                        onChange={(e) =>
                                                                            setDraft((d: any) => ({
                                                                                ...(d ?? {}),
                                                                                imageUrl: e.target.value,
                                                                            }))
                                                                        }
                                                                    />
                                                                </label>

                                                                <div className="flex flex-wrap items-center gap-2">
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
                                                                        className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
                                                                    >
                                                                        {uploading ? "Uploading…" : "Upload image"}
                                                                    </button>
                                                                    <div className="text-xs text-gray-500">
                                                                        Upload sets the URL automatically.
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <label className="text-sm">
                                                                <div className="mb-1 font-semibold text-gray-900">Image side</div>
                                                                <select
                                                                    className="w-full rounded-xl border px-3 py-2"
                                                                    value={draft.imageSide ?? "right"}
                                                                    onChange={(e) =>
                                                                        setDraft((d: any) => ({
                                                                            ...(d ?? {}),
                                                                            imageSide: e.target.value as "left" | "right",
                                                                        }))
                                                                    }
                                                                >
                                                                    <option value="left">Left</option>
                                                                    <option value="right">Right</option>
                                                                </select>

                                                                <div className="mt-4">
                                                                    <div className="mb-1 font-semibold text-gray-900">Background</div>
                                                                    <select
                                                                        className="w-full rounded-xl border px-3 py-2"
                                                                        value={draft.variant ?? "default"}
                                                                        onChange={(e) =>
                                                                            setDraft((d: any) => ({
                                                                                ...(d ?? {}),
                                                                                variant: e.target.value as "default" | "soft",
                                                                            }))
                                                                        }
                                                                    >
                                                                        <option value="default">White</option>
                                                                        <option value="soft">Soft</option>
                                                                    </select>
                                                                </div>
                                                            </label>
                                                        </div>

                                                        <label className="text-sm">
                                                            <div className="mb-1 font-semibold text-gray-900">Image alt text</div>
                                                            <input
                                                                className="w-full rounded-xl border px-3 py-2"
                                                                value={draft.imageAlt ?? ""}
                                                                onChange={(e) =>
                                                                    setDraft((d: any) => ({
                                                                        ...(d ?? {}),
                                                                        imageAlt: e.target.value,
                                                                    }))
                                                                }
                                                            />
                                                        </label>
                                                    </div>
                                                ) : null}

                                                {/* TEAM (legacy) */}
                                                {isTeam(draft) ? (
                                                    <div className="rounded-xl border bg-amber-50 p-3 text-sm text-amber-900">
                                                        <div className="font-semibold">Legacy section: team</div>
                                                        <div className="mt-1 text-xs text-amber-800">
                                                            We no longer create Team sections in Simple mode.
                                                            Please convert this to Split blocks (one per member), or edit in JSON.
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Unknown type fallback */}
                                                {!isHero(draft) && !isRichText(draft) && !isSplit(draft) && !isTeam(draft) ? (
                                                    <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
                                                        Unknown section type: <b>{String(draft.type)}</b>
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            Use JSON mode to edit this section.
                                                        </div>
                                                    </div>
                                                ) : null}

                                                <div className="flex items-center justify-end gap-2 pt-2">
                                                    <button
                                                        type="button"
                                                        className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                                        onClick={closeEdit}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                                                        onClick={applyEdit}
                                                        disabled={uploading}
                                                        title={uploading ? "Wait for upload to finish" : ""}
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Modal>
                                </div>
                            ) : (
                                // JSON mode
                                <label className="text-sm">
                                    <div className="mb-1 font-semibold text-gray-900">Sections (JSON)</div>
                                    <textarea
                                        className={[
                                            "min-h-[420px] w-full rounded-xl border px-3 py-2 font-mono text-xs",
                                            jsonCheck.ok ? "" : "border-red-300",
                                        ].join(" ")}
                                        value={sectionsText}
                                        onChange={(e) => setSectionsText(e.target.value)}
                                    />
                                    <div className="mt-1 text-xs text-gray-500">
                                        {jsonCheck.ok ? "Valid JSON ✅" : `Invalid JSON: ${jsonCheck.error}`}
                                    </div>
                                </label>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
