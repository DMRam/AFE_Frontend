import { useCallback, useEffect, useMemo, useState } from "react";
import type { AnySection, PageDocExt } from "../types";
import {
  getPageByDocId,
  patchPage,
  pageDocIdFromPageId,
  removePage,
} from "../../../../../services/pageRepo";
import { uid } from "../utils/ids";
import { clampIndex, moveItem } from "../utils/array";

export function usePageEditor() {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const [loadingPage, setLoadingPage] = useState(false);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState<PageDocExt | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(false);
  const [categoryId, setCategoryId] = useState<string>("");

  const [sections, setSections] = useState<AnySection[]>([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSelected = useCallback(async (docId: string) => {
    setSelectedDocId(docId);
  }, []);

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
          setPublished(false);
          setCategoryId("");
          setSections([]);
          setError("Page introuvable.");
          return;
        }

        setPage(p);
        setTitle(p.title ?? "");
        setSlug(p.slug ?? "");
        setPublished(p.published !== false);
        setCategoryId(p.categoryId ?? "");
        setSections((p.sections ?? []) as AnySection[]);
      } catch (e: any) {
        setError(`Erreur de chargement: ${e?.message ?? "Inconnue"}`);
      } finally {
        setLoadingPage(false);
      }
    })();
  }, [selectedDocId]);

  const canSave = useMemo(() => {
    return !!selectedDocId && !!page && !saving && !loadingPage;
  }, [selectedDocId, page, saving, loadingPage]);

  const addSection = useCallback((type: "hero" | "richText" | "split") => {
    const base = { id: uid(type), type, enabled: true };

    const next =
      type === "hero"
        ? {
            ...base,
            title: "Nouveau bandeau",
            subtitle: "Sous-titre (optionnel)",
            backgroundImage: "",
            align: "center",
            textColor: "light",
          }
        : type === "richText"
          ? {
              ...base,
              heading: "",
              body: "Écrivez votre texte ici…",
              tone: "standard", // standard | info | important
            }
          : {
              ...base,
              title: "Nouvelle section",
              body: "Écrivez votre texte ici…",
              imageUrl: "",
              imageAlt: "",
              imageSide: "right",
              variant: "default",
            };

    setSections((prev) => [...prev, next]);
  }, []);

  const removeSection = useCallback((index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const toggleEnabled = useCallback((index: number) => {
    setSections((prev) => {
      const next = [...prev];
      const cur = next[index];
      if (!cur) return prev;
      next[index] = { ...cur, enabled: cur?.enabled === false ? true : false };
      return next;
    });
  }, []);

  const moveUp = useCallback((index: number) => {
    setSections((prev) => moveItem(prev, index, clampIndex(index - 1, prev.length - 1)));
  }, []);

  const moveDown = useCallback((index: number) => {
    setSections((prev) => moveItem(prev, index, clampIndex(index + 1, prev.length - 1)));
  }, []);

  const updateSection = useCallback((index: number, value: AnySection) => {
    setSections((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    if (!selectedDocId || !page) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await patchPage(selectedDocId, {
        title,
        slug,
        published,
        sections,
        categoryId: categoryId || "",
      } as any);

      setSuccess("Enregistré.");
    } catch (e: any) {
      setError(`Impossible d’enregistrer: ${e?.message ?? "Inconnue"}`);
    } finally {
      setSaving(false);
    }
  }, [selectedDocId, page, title, slug, published, sections, categoryId]);

  const deletePage = useCallback(async (docId: string) => {
    setError("");
    setSuccess("");
    try {
      await removePage(docId);
      setSuccess("Page supprimée.");
      return true;
    } catch (e: any) {
      setError(`Erreur de suppression: ${e?.message ?? "Inconnue"}`);
      return false;
    }
  }, []);

  const selectFirstFromList = useCallback((pages: { id: string }[]) => {
    if (!pages.length) return;
    setSelectedDocId(pageDocIdFromPageId(pages[0].id));
  }, []);

  return {
    // selection
    selectedDocId,
    setSelectedDocId,
    loadSelected,
    selectFirstFromList,

    // states
    loadingPage,
    saving,
    canSave,

    // doc
    page,
    title,
    setTitle,
    slug,
    setSlug,
    published,
    setPublished,
    categoryId,
    setCategoryId,

    // sections
    sections,
    setSections,
    addSection,
    removeSection,
    toggleEnabled,
    moveUp,
    moveDown,
    updateSection,

    // messages
    error,
    setError,
    success,
    setSuccess,

    // actions
    save,
    deletePage,
  };
}
