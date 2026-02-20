import { useEffect, useMemo, useState } from "react";

import { clampNumber } from "../utils/numbers";
import { normContact, normFeaturesItems, normItems, normLogos, normNewsItems } from "../utils/normalizeHomePage";
import type { HomePageCMS } from "../../../../../content/types/homePage";
import { deepMergeDefaults, getHomePage, saveHomePage, seedHomePage } from "../../../../../services/homePageRepo";

export type Toast = { type: "success" | "error"; msg: string } | null;

export function useHomePageDraft() {
    const [home, setHome] = useState<HomePageCMS | null>(null);
    const [draft, setDraft] = useState<HomePageCMS | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<Toast>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await getHomePage();
                const finalData = data ?? seedHomePage();
                setHome(finalData);
                setDraft(structuredClone(finalData));
            } catch (e) {
                console.error(e);
                setToast({ type: "error", msg: "Impossible de charger /sitePages/home." });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    function stableHomeForCompare(v: any) {
        if (!v) return v;
        const { updatedAt, updatedAtServer, ...rest } = v;
        return rest;
    }

    const dirty = useMemo(() => {
        if (!home || !draft) return false;
        return JSON.stringify(stableHomeForCompare(home)) !== JSON.stringify(stableHomeForCompare(draft));
    }, [home, draft]);

    const resetDraft = () => {
        if (!home) return;
        setDraft(structuredClone(home));
        setToast({ type: "success", msg: "↺ Modifications annulées" });
        window.setTimeout(() => setToast(null), 1600);
    };

    const initMissing = async () => {
        if (!confirm("Ajouter les nouvelles sections/champs manquants sans écraser le contenu existant ?")) return;
        try {
            setSaving(true);
            const current = await getHomePage();
            const defaults = seedHomePage();
            const merged = deepMergeDefaults(defaults, current ?? {});
            await saveHomePage(merged);
            setHome(merged);
            setDraft(structuredClone(merged));
            setToast({ type: "success", msg: "✓ Champs manquants ajoutés (sans écraser)" });
            window.setTimeout(() => setToast(null), 2500);
        } catch (e) {
            console.error(e);
            setToast({ type: "error", msg: "✗ Erreur lors de l'initialisation" });
            window.setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const publish = async () => {
        if (!draft) return;
        try {
            setSaving(true);

            const normalized: HomePageCMS = {
                ...draft,
                headerCtas: {
                    donate: {
                        enabled: draft.headerCtas?.donate?.enabled !== false,
                        label: draft.headerCtas?.donate?.label ?? "Faire un don",
                        href: draft.headerCtas?.donate?.href ?? "#don",
                    },
                    member: {
                        enabled: draft.headerCtas?.member?.enabled !== false,
                        label: draft.headerCtas?.member?.label ?? "Devenir membre",
                        mode: draft.headerCtas?.member?.mode === "external" ? "external" : "stripe",
                        href: draft.headerCtas?.member?.href ?? "",
                    },
                },
                hero: {
                    ...draft.hero,
                    intervalSeconds: clampNumber(draft.hero.intervalSeconds, 3, 30, 9),
                    fadeMs: clampNumber(draft.hero.fadeMs, 200, 5000, 1200),
                    slides: (draft.hero.slides ?? []).map((s, idx) => ({
                        ...s,
                        id: s.id || `s${idx + 1}`,
                        enabled: s.enabled !== false,
                        order: clampNumber(s.order ?? idx + 1, 0, 999, idx + 1),
                        eyebrow: s.eyebrow ?? "",
                        title: s.title ?? "",
                        description: s.description ?? "",
                        ctas: (s.ctas ?? []).map((c) => ({
                            label: c.label ?? "",
                            href: c.href ?? "#",
                            variant: c.variant === "secondary" ? "secondary" : "primary",
                        })),
                    })),
                },
                quickCards: {
                    ...draft.quickCards,
                    heading: draft.quickCards.heading ?? "",
                    cards: (draft.quickCards.cards ?? []).map((c, idx) => ({
                        ...c,
                        id: c.id || `qc${idx + 1}`,
                        enabled: c.enabled !== false,
                        order: clampNumber(c.order ?? idx + 1, 0, 999, idx + 1),
                        title: c.title ?? "",
                        description: c.description ?? "",
                        href: c.href ?? "",
                        icon: c.icon ?? "",
                    })),
                },
                features: {
                    enabled: (draft as any).features?.enabled !== false,
                    eyebrow: (draft as any).features?.eyebrow ?? "",
                    heading: (draft as any).features?.heading ?? "",
                    subheading: (draft as any).features?.subheading ?? "",

                    ctaEnabled: (draft as any).features?.ctaEnabled !== false,
                    ctaText: (draft as any).features?.ctaText ?? "",
                    ctaLink: (draft as any).features?.ctaLink ?? "",

                    items: normFeaturesItems((draft as any).features?.items),
                } as any,
                activities: {
                    ...draft.activities,
                    enabled: draft.activities?.enabled !== false,
                    header: {
                        heading: draft.activities?.header?.heading ?? "",
                        subheading: draft.activities?.header?.subheading ?? "",
                    },
                    ctaLabel: draft.activities?.ctaLabel ?? "",
                    ctaHref: draft.activities?.ctaHref ?? "",
                    items: normItems((draft.activities as any)?.items),
                } as any,
                events: {
                    ...draft.events,
                    enabled: draft.events?.enabled !== false,
                    header: {
                        heading: draft.events?.header?.heading ?? "",
                        subheading: draft.events?.header?.subheading ?? "",
                    },
                    ctaLabel: draft.events?.ctaLabel ?? "",
                    ctaHref: draft.events?.ctaHref ?? "",
                    items: normItems((draft.events as any)?.items),
                } as any,
                resources: {
                    ...draft.resources,
                    enabled: draft.resources?.enabled !== false,
                    header: {
                        heading: draft.resources?.header?.heading ?? "",
                        subheading: draft.resources?.header?.subheading ?? "",
                    },
                    ctaLabel: draft.resources?.ctaLabel ?? "",
                    ctaHref: draft.resources?.ctaHref ?? "",
                    items: normItems((draft.resources as any)?.items),
                } as any,
                partners: {
                    ...draft.partners,
                    enabled: draft.partners?.enabled !== false,
                    heading: draft.partners?.heading ?? "",
                    logos: normLogos((draft.partners as any)?.logos),
                } as any,
                news: {
                    enabled: (draft as any).news?.enabled !== false,
                    eyebrow: (draft as any).news?.eyebrow ?? "",
                    heading: (draft as any).news?.heading ?? "",
                    subheading: (draft as any).news?.subheading ?? "",
                    ctaLabel: (draft as any).news?.ctaLabel ?? "",
                    ctaHref: (draft as any).news?.ctaHref ?? "",
                    items: normNewsItems((draft as any).news?.items),
                } as any,
                contact: normContact((draft as any)?.contact),
            };

            await saveHomePage(normalized);
            const fresh = await getHomePage();
            setHome(fresh ?? normalized);
            setDraft(structuredClone(fresh ?? normalized));
            setToast({ type: "success", msg: "✓ Page d'accueil publiée avec succès" });
            window.setTimeout(() => setToast(null), 2200);
        } catch (e) {
            console.error(e);
            setToast({ type: "error", msg: "✗ Erreur lors de la publication" });
            window.setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    return { home, draft, setDraft, loading, saving, toast, setToast, dirty, resetDraft, publish, initMissing };
}
