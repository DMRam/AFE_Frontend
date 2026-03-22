import { useMemo, useState } from "react";
import type { CategoryOption } from "../types";
import { Plus, X, Image as ImageIcon, Trash2, ChevronDown } from "lucide-react";
import { uploadImage } from "../../../../../services/storageRepo";

function slugifyFrCA(input: string) {
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 40);
}

function MiniModal({
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <button type="button" className="absolute inset-0 bg-black/30" onClick={onClose} aria-label="Fermer" />
            <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div className="text-lg font-semibold text-gray-900">{title}</div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="px-5 py-4">{children}</div>
            </div>
        </div>
    );
}

export function PageDetailsForm({
    title,
    setTitle,
    slug,
    published,
    setPublished,
    categoryId,
    setCategoryId,
    categories,
    onAddCategory,
    seoTitle,
    setSeoTitle,
    seoDescription,
    setSeoDescription,
    seoImage,
    setSeoImage,
}: {
    title: string;
    setTitle: (v: string) => void;
    slug: string;
    published: boolean;
    setPublished: (v: boolean) => void;
    categoryId: string;
    setCategoryId: (v: string) => void;
    categories: CategoryOption[];
    onAddCategory: (c: CategoryOption) => Promise<void>;

    seoTitle: string;
    setSeoTitle: (v: string) => void;
    seoDescription: string;
    setSeoDescription: (v: string) => void;
    seoImage: string;
    setSeoImage: (v: string) => void;
}) {
    const [openCat, setOpenCat] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState("");

    const [seoOpen, setSeoOpen] = useState(false);
    const [uploadingSeo, setUploadingSeo] = useState(false);
    const [seoErr, setSeoErr] = useState("");

    const suggestedId = useMemo(() => slugifyFrCA(newLabel), [newLabel]);
    const canCreate = newLabel.trim().length >= 2 && suggestedId.length >= 2;

    const exists = useMemo(() => {
        const id = suggestedId;
        if (!id) return false;
        return categories.some((c) => c.id === id);
    }, [categories, suggestedId]);

    async function createCategory() {
        if (!canCreate || exists || creatingCategory) return;

        setCreatingCategory(true);
        setCategoryError("");

        try {
            const c = { id: suggestedId, label: newLabel.trim() };
            await onAddCategory(c);
            setCategoryId(c.id);
            setNewLabel("");
            setOpenCat(false);
        } catch (error) {
            console.error(error);
            setCategoryError("Impossible de créer la catégorie.");
        } finally {
            setCreatingCategory(false);
        }
    }

    async function onPickSeoImage(file?: File) {
        if (!file) return;
        setSeoErr("");

        if (file.size > 2 * 1024 * 1024) {
            setSeoErr("L’image doit être inférieure à 2 Mo.");
            return;
        }

        setUploadingSeo(true);
        try {
            const url = await uploadImage(file, "page-seo");
            setSeoImage(url);
        } catch (e) {
            console.error(e);
            setSeoErr("Erreur lors du téléchargement de l’image.");
        } finally {
            setUploadingSeo(false);
        }
    }

    return (
        <div className="space-y-4">
            <div
                onClick={() => setSeoOpen((v) => !v)}
                className="cursor-pointer rounded-2xl border border-blue-200 bg-blue-50/60 p-4 transition hover:bg-blue-50"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-2">
                            <ImageIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900">
                                Partage et visibilité (SEO)
                            </div>
                            <div className="text-xs text-gray-600">
                                Configurez le titre, la description et l’image affichés sur Google et les réseaux sociaux.
                            </div>
                        </div>
                    </div>

                    <ChevronDown
                        className={`h-5 w-5 text-blue-600 transition-transform ${seoOpen ? "rotate-180" : ""}`}
                    />
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <label className="text-sm lg:col-span-2">
                    <div className="mb-2 font-medium text-gray-900">Titre</div>
                    <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={title}
                        onChange={(e) => {
                            const v = e.target.value;
                            setTitle(v);
                            if (!seoTitle.trim()) setSeoTitle(v);
                        }}
                        placeholder="Ex.: Services, À propos, Ressources…"
                    />
                </label>

                <label className="text-sm">
                    <div className="mb-2 font-medium text-gray-900">Adresse</div>
                    <input
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600"
                        value={`${slug || ""}`}
                        disabled
                    />
                    <div className="mt-1 text-xs text-gray-500">Gérée automatiquement.</div>
                </label>

                <div className="text-sm lg:col-span-2">
                    <div className="mb-2 font-medium text-gray-900">Catégorie</div>

                    <div className="flex items-center gap-2">
                        <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                            value={categoryId || ""}
                            onChange={(e) => setCategoryId(e.target.value)}
                        >
                            <option value="">Non classée</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => {
                                setCategoryError("");
                                setOpenCat(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            title="Ajouter une catégorie"
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter
                        </button>
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                        Utile pour retrouver rapidement les pages.
                    </div>
                </div>

                <div className="flex items-center gap-3 lg:justify-end">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={published}
                            onChange={(e) => setPublished(e.target.checked)}
                        />
                        <span className="text-sm font-medium text-gray-900">Publiée</span>
                    </label>
                    <span className="text-xs text-gray-500">{published ? "Visible" : "Brouillon"}</span>
                </div>
            </div>

            {seoOpen && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <ImageIcon className="h-4 w-4" />
                        Partage et visibilité (SEO)
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm">
                            <div className="mb-2 font-medium text-gray-900">Titre SEO</div>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                value={seoTitle}
                                onChange={(e) => setSeoTitle(e.target.value)}
                                placeholder="Ex.: Équipe – AFE Estrie"
                            />
                            <div className="mt-1 text-xs text-gray-500">
                                Utilisé par Google et lors du partage (Facebook/LinkedIn).
                            </div>
                        </label>

                        <label className="text-sm">
                            <div className="mb-2 font-medium text-gray-900">Description SEO</div>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                                value={seoDescription}
                                onChange={(e) => setSeoDescription(e.target.value)}
                                placeholder="Résumé court (1–2 phrases)."
                            />
                            <div className="mt-1 text-xs text-gray-500">
                                Une phrase claire aide les gens à comprendre la page.
                            </div>
                        </label>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="text-sm font-medium text-gray-900 mb-2">
                            Image de partage (SEO)
                        </div>

                        {seoErr ? <div className="mb-2 text-xs text-red-600">{seoErr}</div> : null}

                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingSeo}
                                className="w-full md:max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                                onChange={(e) => onPickSeoImage(e.target.files?.[0])}
                            />

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSeoImage("")}
                                    disabled={!seoImage || uploadingSeo}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Retirer
                                </button>

                                {uploadingSeo ? (
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                        Téléversement…
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {seoImage ? (
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 bg-white p-2">
                                    <img src={seoImage} alt="Aperçu SEO" className="h-36 w-full rounded-md object-cover" />
                                </div>
                                <div className="text-xs text-gray-600 space-y-2">
                                    <div className="font-medium text-gray-900">Aperçu (simple)</div>
                                    <div className="rounded-lg border border-gray-200 bg-white p-3">
                                        <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                                            {seoTitle || title || "—"}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                            {seoDescription || "Ajoutez une courte description pour aider les visiteurs."}
                                        </div>
                                        <div className="text-[11px] text-gray-500 mt-2">/{slug || "…"}</div>
                                    </div>

                                    <div className="text-gray-500">
                                        Conseil : idéalement 1200×630 px, moins de 2 Mo.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-xs text-gray-500">
                                Cette image est utilisée quand quelqu’un partage le lien sur les réseaux sociaux.
                            </div>
                        )}
                    </div>
                </div>
            )}

            <MiniModal open={openCat} title="Ajouter une catégorie" onClose={() => !creatingCategory && setOpenCat(false)}>
                <div className="space-y-3">
                    <label className="text-sm block">
                        <div className="mb-2 font-medium text-gray-900">Nom de la catégorie</div>
                        <input
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                            value={newLabel}
                            onChange={(e) => setNewLabel(e.target.value)}
                            placeholder="Ex.: Programmes, Ressources, Services…"
                            autoFocus
                            disabled={creatingCategory}
                        />
                    </label>

                    <div className="text-xs text-gray-500">
                        ID créé automatiquement :{" "}
                        <span className="font-mono text-gray-700">{suggestedId || "—"}</span>
                    </div>

                    {exists && <div className="text-xs text-red-600">Cette catégorie existe déjà.</div>}
                    {categoryError && <div className="text-xs text-red-600">{categoryError}</div>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setOpenCat(false)}
                            disabled={creatingCategory}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            onClick={createCategory}
                            disabled={!canCreate || exists || creatingCategory}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {creatingCategory ? "Ajout..." : "Ajouter"}
                        </button>
                    </div>
                </div>
            </MiniModal>
        </div>
    );
}