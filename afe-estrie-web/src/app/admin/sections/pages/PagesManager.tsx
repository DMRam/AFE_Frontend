import { useEffect, useState } from "react";
import type { PageDocExt, AnySection, CategoryOption } from "./types";



import { Save, CheckCircle2, XCircle } from "lucide-react";


import { listPages, pageDocIdFromPageId, getPageByDocId, patchPage, removePage } from "../../../../services/pageRepo";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import { PageDetailsForm } from "./components/PageDetailsForm";
import { PagesSidebar } from "./components/PagesSidebar";
import { SectionsEditor } from "./components/SectionsEditor";
import { SectionEditModal } from "./components/SectionEditModal";

function s(v: any) {
    return String(v ?? "").trim();
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

    // -------- delete modal state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<string | null>(null);

    // -------- section edit modal state
    const [editOpen, setEditOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [draft, setDraft] = useState<AnySection | null>(null);

    // -------- categories (simple default)
    const [categories, setCategories] = useState<CategoryOption[]>([
        { id: "", label: "Non classée" },
        { id: "accueil", label: "Accueil" },
        { id: "a-propos", label: "À propos" },
        { id: "services", label: "Services" },
        { id: "ressources", label: "Ressources" },
        { id: "faq", label: "FAQ" },
        { id: "contact", label: "Contact" },
        { id: "politiques", label: "Politique & confidentialité" },
    ]);

    const [seoTitle, setSeoTitle] = useState("");
    const [seoDescription, setSeoDescription] = useState("");
    const [seoImage, setSeoImage] = useState("");

    function addCategory(c: CategoryOption) {
        setCategories((prev) => {
            if (prev.some((x) => x.id === c.id)) return prev;
            return [...prev, c].sort((a, b) => a.label.localeCompare(b.label, "fr-CA"));
        });
    }



    // -------- list loader
    async function reloadPagesList(selectFirst = false) {
        setLoadingList(true);
        setError("");
        try {
            const items = (await listPages()) as PageDocExt[];
            // sort by title
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
                    setError("Page introuvable.");
                    return;
                }

                setPage(p);
                setTitle(p.title ?? "");
                setSlug(p.slug ?? "");
                setPublished(p.published !== false);
                setCategoryId((p as any).categoryId ?? "");
                setSections(((p as any).sections ?? []) as AnySection[]);
            } catch (e: any) {
                setError(`Erreur de chargement: ${e?.message ?? "Inconnue"}`);
            } finally {
                setLoadingPage(false);
            }
        })();
    }, [selectedDocId]);

    // -------- save
    const canSave = !!selectedDocId && !!page && !saving && !loadingPage;

    async function onSave() {
        if (!selectedDocId || !page) return;

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            await patchPage(selectedDocId, {
                title: s(title),
                slug: slug,
                published,
                categoryId: categoryId || "",
                sections,
            } as any);

            setSuccess("Enregistré.");
            void reloadPagesList(false);
        } catch (e: any) {
            setError(`Impossible d’enregistrer. ${e?.message ?? ""}`.trim());
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
            closeDelete();
            await reloadPagesList(true);
        } catch (e: any) {
            setError(`Impossible de supprimer. ${e?.message ?? ""}`.trim());
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
                        // legacy-friendly
                        content: "Écrivez votre contenu ici…",
                        body: "Écrivez votre contenu ici…",
                        heading: "",
                        tone: "standard",
                    }
                    : {
                        ...base,
                        title: "Nouvelle section",
                        // legacy-friendly
                        content: "Écrivez votre texte ici…",
                        body: "Écrivez votre texte ici…",
                        imageUrl: "",
                        imageAlt: "",
                        imageSide: "right",
                        variant: "default",
                    };

        setSections((prev) => [...prev, next]);
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
        setSections((prev) => prev.filter((_, idx) => idx !== i));
    }

    function moveUp(i: number) {
        setSections((prev) => {
            if (i <= 0) return prev;
            const next = [...prev];
            const item = next[i];
            next.splice(i, 1);
            next.splice(i - 1, 0, item);
            return next;
        });
    }

    function moveDown(i: number) {
        setSections((prev) => {
            if (i >= prev.length - 1) return prev;
            const next = [...prev];
            const item = next[i];
            next.splice(i, 1);
            next.splice(i + 1, 0, item);
            return next;
        });
    }

    function openEdit(i: number) {
        const sec = sections[i];
        if (!sec) return;
        setEditIndex(i);
        setDraft(structuredClone ? structuredClone(sec) : JSON.parse(JSON.stringify(sec)));
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
        closeEdit();
    }

    return (
        <div className="space-y-6">
            {/* Alerts */}
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

            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                {/* Sidebar */}
                <PagesSidebar
                    pages={pages}
                    loading={loadingList}
                    selectedDocId={selectedDocId}
                    categories={categories}
                    onSelect={(docId) => setSelectedDocId(docId)}
                    onRequestDelete={(docId) => openDelete(docId)}
                    onRefreshList={() => void reloadPagesList(false)}
                    onCreated={(docId) => setSelectedDocId(docId)}
                />


                {/* Editor */}
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-200 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-sm font-semibold text-gray-900">Éditeur de page</div>
                                <div className="text-xs text-gray-500">
                                    Modifiez le titre, la catégorie et le contenu — puis Enregistrer
                                </div>
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
                            >
                                <Save className="h-4 w-4" />
                                {saving ? "Enregistrement…" : "Enregistrer"}
                            </button>
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
                        <div className="p-4 space-y-6">
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

            {/* Delete confirm */}
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


            {/* Section edit modal */}
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
