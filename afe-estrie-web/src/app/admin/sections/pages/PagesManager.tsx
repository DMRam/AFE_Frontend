import { useEffect, useMemo, useState } from "react";
import type { PageDocExt, AnySection, CategoryOption } from "./types";

import { Save, CheckCircle2, XCircle, Info, AlertCircle, Clock3 } from "lucide-react";

import {
    listPages,
    pageDocIdFromPageId,
    getPageByDocId,
    patchPage,
    removePage,
} from "../../../../services/pageRepo";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { PageDetailsForm } from "./components/PageDetailsForm";
import { PagesSidebar } from "./components/PagesSidebar";
import { SectionsEditor } from "./components/SectionsEditor";
import { SectionEditModal } from "./components/SectionEditModal";
import { collection, doc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "../../../../services/firebase";

function s(v: any) {
    return String(v ?? "").trim();
}

function deepClone<T>(value: T): T {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
}

function stableStringify(value: unknown) {
    return JSON.stringify(value);
}

function formatLastSaved(timestamp: number | null) {
    if (!timestamp) return "";
    try {
        return new Intl.DateTimeFormat("fr-CA", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }).format(new Date(timestamp));
    } catch {
        return "";
    }
}

type ToastState = {
    type: "success" | "error" | "info";
    title?: string;
    message: string;
} | null;

type SavedSnapshot = {
    title: string;
    slug: string;
    published: boolean;
    categoryId: string;
    sections: AnySection[];
    seoTitle: string;
    seoDescription: string;
    seoImage: string;
};

function buildSnapshot(input: SavedSnapshot): SavedSnapshot {
    return {
        title: s(input.title),
        slug: String(input.slug ?? ""),
        published: input.published !== false,
        categoryId: String(input.categoryId ?? ""),
        sections: deepClone(input.sections ?? []),
        seoTitle: s(input.seoTitle),
        seoDescription: s(input.seoDescription),
        seoImage: s(input.seoImage),
    };
}

export default function PagesManager() {
    // -------- list state
    const [loadingList, setLoadingList] = useState(true);
    const [pages, setPages] = useState<PageDocExt[]>([]);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    // -------- editor state
    const [loadingPage, setLoadingPage] = useState(false);
    const [page, setPage] = useState<PageDocExt | null>(null);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [published, setPublished] = useState(true);
    const [categoryId, setCategoryId] = useState<string>("");

    const [sections, setSections] = useState<AnySection[]>([]);

    // -------- UX state
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [toast, setToast] = useState<ToastState>(null);

    const [savedSnapshot, setSavedSnapshot] = useState<SavedSnapshot | null>(null);
    const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

    // -------- delete modal state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<string | null>(null);

    // -------- section edit modal state
    const [editOpen, setEditOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<AnySection | null>(null);

    // -------- categories (simple default)
    const DEFAULT_CATEGORIES: CategoryOption[] = [
        { id: "", label: "Non classée" },
        { id: "accueil", label: "Accueil" },
        { id: "a-propos", label: "À propos" },
        { id: "services", label: "Services" },
        { id: "ressources", label: "Ressources" },
        { id: "faq", label: "FAQ" },
        { id: "contact", label: "Contact" },
        { id: "politiques", label: "Politique & confidentialité" },
    ];

    const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);

    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [seoImage, setSeoImage] = useState("");

    useEffect(() => {
        void loadCategories();
    }, []);

    async function loadCategories() {
        const snap = await getDocs(query(collection(db, "pageCategories"), orderBy("label")));
        const custom = snap.docs.map((d) => ({
            id: d.id,
            label: String(d.data().label || d.id),
        }));

        setCategories([
            ...DEFAULT_CATEGORIES,
            ...custom.filter((c) => !DEFAULT_CATEGORIES.some((d) => d.id === c.id)),
        ]);
    }

    async function addCategory(c: CategoryOption) {
        await setDoc(doc(db, "pageCategories", c.id), {
            label: c.label,
            createdAt: Date.now(),
        });

        setCategories((prev) => {
            if (prev.some((x) => x.id === c.id)) return prev;
            return [...prev, c].sort((a, b) => a.label.localeCompare(b.label, "fr-CA"));
        });
    }

    useEffect(() => {
        if (!toast) return;
        const t = window.setTimeout(() => setToast(null), 2800);
        return () => window.clearTimeout(t);
    }, [toast]);

    // -------- list loader
    async function reloadPagesList(selectFirst = false) {
        setLoadingList(true);
        setError("");

        try {
            const items = (await listPages()) as PageDocExt[];
            const sorted = [...items].sort((a, b) => s(a.title).localeCompare(s(b.title)));
            setPages(sorted);

            if (selectFirst) {
                if (sorted.length) {
                    setSelectedDocId(pageDocIdFromPageId(sorted[0].id));
                } else {
                    setSelectedDocId(null);
                }
            }
        } catch (e: any) {
            setError(`Erreur de chargement: ${e?.message ?? "Inconnue"}`);
        } finally {
            setLoadingList(false);
        }
    }

    useEffect(() => {
        void reloadPagesList(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // -------- page loader
    useEffect(() => {
        if (!selectedDocId) return;

        (async () => {
            setLoadingPage(true);
            setError("");
            setSuccess("");

            try {
                const p = (await getPageByDocId(selectedDocId)) as PageDocExt | null;

                if (!p) {
                    setPage(null);
                    setTitle("");
                    setSlug("");
                    setPublished(true);
                    setCategoryId("");
                    setSections([]);
                    setSeoTitle("");
                    setSeoDescription("");
                    setSeoImage("");
                    setSavedSnapshot(null);
                    setLastSavedAt(null);
                    setError("Page introuvable.");
                    return;
                }

                const nextTitle = p.title ?? "";
                const nextSlug = p.slug ?? "";
                const nextPublished = p.published !== false;
                const nextCategoryId = (p as any).categoryId ?? "";
                const nextSections = ((((p as any).sections ?? []) as AnySection[]) || []);
                const nextSeoTitle = (p as any).seoTitle ?? "";
                const nextSeoDescription = (p as any).seoDescription ?? "";
                const nextSeoImage = (p as any).seoImage ?? "";

                setPage(p);
                setTitle(nextTitle);
                setSlug(nextSlug);
                setPublished(nextPublished);
                setCategoryId(nextCategoryId);
                setSections(nextSections);
                setSeoTitle(nextSeoTitle);
                setSeoDescription(nextSeoDescription);
                setSeoImage(nextSeoImage);

                setSavedSnapshot(
                    buildSnapshot({
                        title: nextTitle,
                        slug: nextSlug,
                        published: nextPublished,
                        categoryId: nextCategoryId,
                        sections: nextSections,
                        seoTitle: nextSeoTitle,
                        seoDescription: nextSeoDescription,
                        seoImage: nextSeoImage,
                    })
                );
                setLastSavedAt(null);
            } catch (e: any) {
                setError(`Erreur de chargement: ${e?.message ?? "Inconnue"}`);
            } finally {
                setLoadingPage(false);
            }
        })();
    }, [selectedDocId]);

    const currentSnapshot = useMemo(
        () =>
            buildSnapshot({
                title,
                slug,
                published,
                categoryId,
                sections,
                seoTitle,
                seoDescription,
                seoImage,
            }),
        [title, slug, published, categoryId, sections, seoTitle, seoDescription, seoImage]
    );

    const isDirty = useMemo(() => {
        if (!savedSnapshot) return false;
        return stableStringify(currentSnapshot) !== stableStringify(savedSnapshot);
    }, [currentSnapshot, savedSnapshot]);

    useEffect(() => {
        if (isDirty && success) {
            setSuccess("");
        }
    }, [isDirty, success]);

    const canSave = !!selectedDocId && !!page && !saving && !loadingPage && isDirty;

    const saveState = saving ? "saving" : isDirty ? "dirty" : "saved";

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirty) return;
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    // -------- save
    async function onSave() {
        if (!selectedDocId || !page || !isDirty) return;

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await patchPage(selectedDocId, {
                title: s(title),
                slug,
                published,
                categoryId: categoryId || "",
                sections,
                seoTitle: s(seoTitle),
                seoDescription: s(seoDescription),
                seoImage: s(seoImage),
            } as any);

            setSavedSnapshot(currentSnapshot);
            setLastSavedAt(Date.now());

            setSuccess("Enregistré.");
            setToast({
                type: "success",
                title: "Page enregistrée",
                message: "Les modifications ont bien été sauvegardées.",
            });

            void reloadPagesList(false);
        } catch (e: any) {
            setError(`Impossible d’enregistrer. ${e?.message ?? ""}`.trim());
            setToast({
                type: "error",
                title: "Erreur",
                message: "Impossible d’enregistrer les modifications.",
            });
        } finally {
            setSaving(false);
        }
    }

    // -------- delete
    function openDelete(docId: string) {
        setPageToDelete(docId);
        setDeleteConfirmOpen(true);
    }

    function closeDelete() {
        setDeleteConfirmOpen(false);
        setPageToDelete(null);
    }

    async function confirmDelete() {
        if (!pageToDelete) return;

        setDeleting(true);
        setError("");
        setSuccess("");

        try {
            await removePage(pageToDelete);
            setSuccess("Page supprimée.");
            setToast({
                type: "success",
                title: "Page supprimée",
                message: "La page a été supprimée avec succès.",
            });
            closeDelete();
            await reloadPagesList(true);
        } catch (e: any) {
            setError(`Impossible de supprimer. ${e?.message ?? ""}`.trim());
            setToast({
                type: "error",
                title: "Erreur",
                message: "Impossible de supprimer la page.",
            });
        } finally {
            setDeleting(false);
        }
    }

    // -------- section ops
    function addSection(type: "hero" | "richText" | "split") {
        const id = `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        const base: AnySection = { id, type, enabled: true };

        const next =
            type === "hero"
                ? {
                    ...base,
                    title: "Nouveau titre",
                    subtitle: "Sous-titre optionnel",
                    backgroundImage: "",
                    align: "center",
                    textColor: "light",
                }
                : type === "richText"
                    ? {
                        ...base,
                        content: "Écrivez votre contenu ici…",
                        body: "Écrivez votre contenu ici…",
                        heading: "",
                        tone: "standard",
                    }
                    : {
                        ...base,
                        title: "Nouvelle section",
                        content: "Écrivez votre texte ici…",
                        body: "Écrivez votre texte ici…",
                        imageUrl: "",
                        imageAlt: "",
                        imageSide: "right",
                        variant: "default",
                        imageSize: "md",
                        imageObjectFit: "cover",
                    };

        setSections((prev) => [...prev, next]);

        setToast({
            type: "info",
            title: "Modification non enregistrée",
            message: "La nouvelle section a été ajoutée. N’oubliez pas d’enregistrer.",
        });

        window.setTimeout(() => {
            const target =
                document.getElementById(`section-card-${id}`) ??
                document.querySelector(`[data-section-id="${id}"]`);

            if (target instanceof HTMLElement) {
                target.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: "smooth",
                });
            }
        }, 140);
    }

    function toggleEnabled(i: number) {
        setSections((prev) => {
            const next = [...prev];
            const curr = next[i];
            if (!curr) return prev;
            next[i] = { ...curr, enabled: curr.enabled === false ? true : false };
            return next;
        });
    }

    function removeSection(i: number) {
        setSections((prev) => {
            const removed = prev[i];
            const next = prev.filter((_, idx) => idx !== i);

            setToast({
                type: "info",
                title: "Modification non enregistrée",
                message: removed?.type
                    ? `La section « ${removed.type} » a été retirée. Enregistrez pour confirmer.`
                    : "La section a été retirée. Enregistrez pour confirmer.",
            });

            return next;
        });
    }

    function moveUp(i: number) {
        setSuccess("");

        setSections((prev) => {
            if (i <= 0) return prev;
            const next = [...prev];
            const item = next[i];
            if (!item) return prev;
            next.splice(i, 1);
            next.splice(i - 1, 0, item);
            return next;
        });

        setToast({
            type: "info",
            title: "Ordre modifié",
            message: "La section a été déplacée vers le haut. Enregistrez pour confirmer.",
        });
    }

    function moveDown(i: number) {
        setSections((prev) => {
            if (i >= prev.length - 1) return prev;
            const next = [...prev];
            const item = next[i];
            if (!item) return prev;
            next.splice(i, 1);
            next.splice(i + 1, 0, item);
            return next;
        });

        setToast({
            type: "info",
            title: "Ordre modifié",
            message: "La section a été déplacée vers le bas. Enregistrez pour confirmer.",
        });
    }

    function openEdit(i: number) {
        const sec = sections[i];
        if (!sec) return;

        setEditIndex(i);
        setDraft(deepClone(sec));
        setEditOpen(true);
    }

    function closeEdit() {
        setEditOpen(false);
        setEditIndex(null);
        setDraft(null);
    }

    function applyEdit() {
        if (editIndex == null || !draft) return;

        setSections((prev) => {
            const next = [...prev];
            next[editIndex] = draft;
            return next;
        });

        setToast({
            type: "info",
            title: "Modification non enregistrée",
            message: "Les changements de la section ont été appliqués. Enregistrez pour confirmer.",
        });

        closeEdit();
    }

    function handleSelectPage(docId: string) {
        if (docId === selectedDocId) return;

        if (isDirty) {
            const confirmed = window.confirm(
                "Vous avez des modifications non enregistrées. Voulez-vous vraiment changer de page?"
            );
            if (!confirmed) return;
        }

        setSelectedDocId(docId);
    }

    const statusClasses =
        saveState === "saving"
            ? "border-blue-200 bg-blue-50 text-blue-700"
            : saveState === "dirty"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700";

    const statusDotClasses =
        saveState === "saving"
            ? "bg-blue-500"
            : saveState === "dirty"
                ? "bg-amber-500"
                : "bg-emerald-500";

    return (
        <div className="space-y-6">
            {/* Floating toast */}
            {toast && (
                <div className="fixed bottom-5 right-5 z-[100] max-w-sm">
                    <div
                        className={[
                            "rounded-2xl border bg-white/95 px-4 py-3 shadow-xl backdrop-blur",
                            toast.type === "success"
                                ? "border-emerald-200"
                                : toast.type === "error"
                                    ? "border-red-200"
                                    : "border-blue-200",
                        ].join(" ")}
                    >
                        <div className="flex items-start gap-3">
                            {toast.type === "success" ? (
                                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                            ) : toast.type === "error" ? (
                                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                            ) : (
                                <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                            )}

                            <div className="min-w-0 flex-1">
                                {toast.title ? (
                                    <div className="text-sm font-semibold text-gray-900">{toast.title}</div>
                                ) : null}
                                <div className="mt-0.5 text-sm text-gray-600">{toast.message}</div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setToast(null)}
                                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                aria-label="Fermer la notification"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts */}
            {error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div className="text-sm text-red-700">{error}</div>
                </div>
            )}

            {success && (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div className="text-sm text-emerald-700">{success}</div>
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                <PagesSidebar
                    pages={pages}
                    loading={loadingList}
                    selectedDocId={selectedDocId}
                    categories={categories}
                    onSelect={handleSelectPage}
                    onRequestDelete={(docId) => openDelete(docId)}
                    onRefreshList={() => void reloadPagesList(false)}
                    onCreated={(docId) => {
                        if (isDirty) {
                            const confirmed = window.confirm(
                                "Vous avez des modifications non enregistrées. Voulez-vous vraiment changer de page?"
                            );
                            if (!confirmed) return;
                        }
                        setSelectedDocId(docId);
                    }}
                />

                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold text-gray-900">Éditeur de page</div>
                                <div className="text-xs text-gray-500">
                                    Modifiez le titre, la catégorie et le contenu — puis Enregistrer
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <div
                                    className={[
                                        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                                        statusClasses,
                                    ].join(" ")}
                                    aria-live="polite"
                                >
                                    <span
                                        className={[
                                            "h-2.5 w-2.5 rounded-full",
                                            saveState === "saving" ? "animate-pulse" : "",
                                            statusDotClasses,
                                        ].join(" ")}
                                    />

                                    {saveState === "saving" ? (
                                        <>
                                            <Clock3 className="h-3.5 w-3.5" />
                                            <span>Enregistrement en cours…</span>
                                        </>
                                    ) : saveState === "dirty" ? (
                                        <>
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span>Modifications non enregistrées</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            <span>Toutes les modifications sont enregistrées</span>
                                        </>
                                    )}
                                </div>

                                {lastSavedAt && !isDirty && !saving ? (
                                    <div className="text-xs text-gray-500">
                                        Dernière sauvegarde à {formatLastSaved(lastSavedAt)}
                                    </div>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={onSave}
                                    disabled={!canSave}
                                    className={[
                                        "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                                        canSave
                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                            : "cursor-not-allowed bg-gray-200 text-gray-400",
                                    ].join(" ")}
                                >
                                    <Save className="h-4 w-4" />
                                    {saving
                                        ? "Enregistrement…"
                                        : isDirty
                                            ? "Enregistrer"
                                            : "Enregistré"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {loadingPage ? (
                        <div className="p-8 text-center">
                            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                            <div className="mt-2 text-sm text-gray-500">Chargement de la page…</div>
                        </div>
                    ) : !page ? (
                        <div className="p-8">
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                                <div className="text-sm font-medium text-gray-900">Aucune page sélectionnée</div>
                                <div className="mt-1 text-sm text-gray-500">
                                    Sélectionnez une page dans la liste à gauche.
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 p-4">
                            <PageDetailsForm
                                title={title}
                                setTitle={setTitle}
                                slug={slug}
                                published={published}
                                setPublished={setPublished}
                                categoryId={categoryId}
                                setCategoryId={setCategoryId}
                                categories={categories}
                                onAddCategory={addCategory}
                                seoTitle={seoTitle}
                                setSeoTitle={setSeoTitle}
                                seoDescription={seoDescription}
                                setSeoDescription={setSeoDescription}
                                seoImage={seoImage}
                                setSeoImage={setSeoImage}
                            />

                            <SectionsEditor
                                sections={sections}
                                onAddHero={() => addSection("hero")}
                                onAddText={() => addSection("richText")}
                                onAddSplit={() => addSection("split")}
                                onToggleEnabled={toggleEnabled}
                                onEdit={openEdit}
                                onRemove={removeSection}
                                onMoveUp={moveUp}
                                onMoveDown={moveDown}
                            />
                        </div>
                    )}
                </div>
            </div>

            <DeleteConfirmModal
                open={deleteConfirmOpen}
                title="Supprimer la page"
                message="Voulez-vous vraiment supprimer cette page? Cette action est définitive."
                confirmLabel={deleting ? "Suppression…" : "Supprimer"}
                cancelLabel="Annuler"
                busy={deleting}
                onConfirm={() => void confirmDelete()}
                onCancel={closeDelete}
            />

            <SectionEditModal
                open={editOpen}
                section={draft}
                onChange={setDraft}
                onCancel={closeEdit}
                onApply={applyEdit}
            />
        </div>
    );
}