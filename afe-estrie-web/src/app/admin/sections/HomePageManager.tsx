import { useEffect, useMemo, useState } from "react";
import type { HomePageCMS } from "../../../content/types/homePage";
import { deepMergeDefaults, getHomePage, saveHomePage, seedHomePage } from "../../../services/homePageRepo";

type Toast = { type: "success" | "error"; msg: string } | null;

function uid(prefix = "id") {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${id}`;
}

function clampNumber(n: any, min: number, max: number, fallback: number) {
    const v = Number(n);
    if (!Number.isFinite(v)) return fallback;
    return Math.max(min, Math.min(max, v));
}

// -------- normalization helpers (SAVE ONLY) --------

const normItems = (items: any[] | undefined) =>
    (items ?? []).map((it, idx) => ({
        ...it,
        id: it.id || `it${idx + 1}`,
        enabled: it.enabled !== false,
        order: clampNumber(it.order ?? idx + 1, 0, 999, idx + 1),
        title: it.title ?? "",
        description: it.description ?? "",
        href: it.href ?? "",
        meta: it.meta ?? "",
        date: it.date ?? "",
    }));

const normLogos = (logos: any[] | undefined) =>
    (logos ?? []).map((l, idx) => ({
        ...l,
        id: l.id || `p${idx + 1}`,
        enabled: l.enabled !== false,
        order: clampNumber(l.order ?? idx + 1, 0, 999, idx + 1),
        alt: l.alt ?? "",
        href: l.href ?? "",
        src: l.src ?? "",
        storagePath: l.storagePath ?? "",
    }));

const normNewsItems = (items: any[] | undefined) =>
    (items ?? []).map((it, idx) => ({
        ...it,
        id: it.id || `n${idx + 1}`,
        enabled: it.enabled !== false,
        order: clampNumber(it.order ?? idx + 1, 0, 999, idx + 1),
        title: it.title ?? "",
        excerpt: it.excerpt ?? "",
        href: it.href ?? "",
        date: it.date ?? "",
        readingTime: it.readingTime ?? "",
        coverSrc: it.coverSrc ?? "",
        coverAlt: it.coverAlt ?? "",
        pageDocId: it.pageDocId ?? "",
    }));

function setHomeContactPatch(setDraft: any, patch: any) {
    setDraft((d: any) => ({
        ...(d ?? {}),
        contact: {
            ...(d?.contact ?? {}),
            ...patch,
        },
    }));
}

function updateContactListItem(
    setDraft: any,
    key: "hours" | "phones",
    idx: number,
    patch: any
) {
    setDraft((d: any) => {
        const list = Array.isArray(d?.contact?.[key]) ? [...d.contact[key]] : [];
        const cur = list[idx] ?? {};
        list[idx] = { ...cur, ...patch };
        return {
            ...(d ?? {}),
            contact: {
                ...(d?.contact ?? {}),
                [key]: list,
            },
        };
    });
}

function addContactListItem(setDraft: any, key: "hours" | "phones") {
    setDraft((d: any) => {
        const list = Array.isArray(d?.contact?.[key]) ? [...d.contact[key]] : [];
        list.push(key === "hours" ? { label: "", value: "" } : { label: "", value: "" });
        return {
            ...(d ?? {}),
            contact: { ...(d?.contact ?? {}), [key]: list },
        };
    });
}

function removeContactListItem(setDraft: any, key: "hours" | "phones", idx: number) {
    setDraft((d: any) => {
        const list = Array.isArray(d?.contact?.[key]) ? [...d.contact[key]] : [];
        list.splice(idx, 1);
        return {
            ...(d ?? {}),
            contact: { ...(d?.contact ?? {}), [key]: list },
        };
    });
}



export default function HomePageManager() {
    const [home, setHome] = useState<HomePageCMS | null>(null);
    const [draft, setDraft] = useState<HomePageCMS | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<Toast>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(["hero", "quickCards", "activities"])
    );

    const toggleSection = (section: string) => {
        const newSet = new Set(expandedSections);
        if (newSet.has(section)) {
            newSet.delete(section);
        } else {
            newSet.add(section);
        }
        setExpandedSections(newSet);
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


    // -------- load --------
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

    const dirty = useMemo(() => {
        if (!home || !draft) return false;
        return JSON.stringify(home) !== JSON.stringify(draft);
    }, [home, draft]);


    const normFeaturesItems = (items: any[] | undefined) =>
        (items ?? []).map((it, idx) => ({
            ...it,
            id: it.id || `f${idx + 1}`,
            enabled: it.enabled !== false,
            order: clampNumber(it.order ?? idx + 1, 0, 999, idx + 1),
            icon: (it.icon ?? "brain") as any,
            title: it.title ?? "",
            description: it.description ?? "",
        }));


    const normContact = (c: any | undefined) => ({
        enabled: c?.enabled !== false,
        mapEmbedUrl: c?.mapEmbedUrl ?? "",
        orgName: c?.orgName ?? "",
        email: c?.email ?? "",
        address: c?.address ?? "",
        directionsUrl: c?.directionsUrl ?? "",
        hours: (c?.hours ?? []).map((h: any, idx: number) => ({
            label: h?.label ?? "",
            value: h?.value ?? "",
            id: h?.id || `h${idx + 1}`, // optional
        })),
        phones: (c?.phones ?? []).map((p: any, idx: number) => ({
            label: p?.label ?? "",
            value: p?.value ?? "",
            id: p?.id || `ph${idx + 1}`, // optional
        })),
    });


    const publish = async () => {
        if (!draft) return;
        try {
            setSaving(true);


            const normalized: HomePageCMS = {
                ...draft,
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
            setHome(normalized);
            setDraft(structuredClone(normalized));
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

    const resetDraft = () => {
        if (!home) return;
        setDraft(structuredClone(home));
        setToast({ type: "success", msg: "↺ Modifications annulées" });
        window.setTimeout(() => setToast(null), 1600);
    };

    if (loading || !draft) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                        <p className="text-lg font-medium text-gray-700">Chargement de la page d'accueil...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
                <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Éditeur de page d'accueil</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Modifiez le contenu de la page principale du site
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className={`rounded-lg px-3 py-1 text-sm font-medium ${dirty ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                                    }`}
                            >
                                {dirty ? "⚫ Modifications non sauvegardées" : "✓ À jour"}
                            </div>

                            <button
                                type="button"
                                onClick={initMissing}
                                disabled={saving}
                                className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                                Ajouter champs manquants
                            </button>


                            <button
                                type="button"
                                onClick={resetDraft}
                                disabled={!dirty || saving}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700"
                            >
                                Annuler
                            </button>

                            <button
                                type="button"
                                onClick={publish}
                                disabled={!dirty || saving}
                                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white"
                            >
                                {saving ? "Publication..." : "Publier"}
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {toast && (
                <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
                    <div
                        className={`rounded-lg border px-4 py-3 shadow-sm ${toast.type === "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : "border-red-200 bg-red-50 text-red-800"
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            {toast.type === "success" ? "✓" : "✗"}
                            <span className="font-medium">{toast.msg}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                {/* HERO Section */}
                <SectionCard
                    title="Bannière Hero"
                    description="Diaporama principal avec vidéos et messages"
                    isExpanded={expandedSections.has("hero")}
                    onToggle={() => toggleSection("hero")}
                    status={draft.hero.enabled ? "activé" : "désactivé"}
                >
                    {expandedSections.has("hero") && (
                        <div className="space-y-6">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <h3 className="mb-3 text-sm font-semibold text-gray-800">Configuration générale</h3>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Intervalle entre slides (secondes)
                                        </label>
                                        <input
                                            type="range"
                                            min="3"
                                            max="30"
                                            step="1"
                                            value={draft.hero.intervalSeconds ?? 9}
                                            onChange={(e) =>
                                                setDraft({ ...draft, hero: { ...draft.hero, intervalSeconds: Number(e.target.value) } })
                                            }
                                            className="w-full"
                                        />
                                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                                            <span>3s</span>
                                            <span className="font-medium">{draft.hero.intervalSeconds ?? 9}s</span>
                                            <span>30s</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Durée de transition (ms)
                                        </label>
                                        <input
                                            type="range"
                                            min="200"
                                            max="5000"
                                            step="100"
                                            value={draft.hero.fadeMs ?? 1200}
                                            onChange={(e) =>
                                                setDraft({ ...draft, hero: { ...draft.hero, fadeMs: Number(e.target.value) } })
                                            }
                                            className="w-full"
                                        />
                                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                                            <span>200ms</span>
                                            <span className="font-medium">{draft.hero.fadeMs ?? 1200}ms</span>
                                            <span>5s</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Diapositives ({draft.hero.slides?.length || 0})
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDraft({
                                                ...draft,
                                                hero: {
                                                    ...draft.hero,
                                                    slides: [
                                                        ...(draft.hero.slides ?? []),
                                                        {
                                                            id: uid("s"),
                                                            enabled: true,
                                                            order: (draft.hero.slides?.length ?? 0) + 1,
                                                            eyebrow: "",
                                                            title: "",
                                                            description: "",
                                                            videoKey: "v1",
                                                            ctas: [],
                                                        },
                                                    ],
                                                },
                                            })
                                        }
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                    >
                                        + Nouvelle diapositive
                                    </button>
                                </div>

                                {(draft.hero.slides ?? [])
                                    .slice()
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                    .map((s, idx) => (
                                        <SlideCard
                                            key={s.id ?? idx}
                                            slide={s}
                                            index={idx}
                                            draft={draft}
                                            setDraft={setDraft}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </SectionCard>

                {/* QUICK CARDS Section */}
                <SectionCard
                    title="Cartes rapides"
                    description="Accès rapide aux sections principales"
                    isExpanded={expandedSections.has("quickCards")}
                    onToggle={() => toggleSection("quickCards")}
                    status={draft.quickCards.enabled ? "activé" : "désactivé"}
                >
                    {expandedSections.has("quickCards") && (
                        <div className="space-y-6">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Titre de section
                                        </label>
                                        <input
                                            type="text"
                                            value={draft.quickCards.heading ?? ""}
                                            onChange={(e) =>
                                                setDraft({ ...draft, quickCards: { ...draft.quickCards, heading: e.target.value } })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Ex: Découvrez nos services"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={draft.quickCards.enabled}
                                                onChange={(e) =>
                                                    setDraft({ ...draft, quickCards: { ...draft.quickCards, enabled: e.target.checked } })
                                                }
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Section active</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Cartes ({draft.quickCards.cards?.length || 0})
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = [...(draft.quickCards.cards ?? [])];
                                            next.push({
                                                id: uid("qc"),
                                                enabled: true,
                                                order: (next.length ?? 0) + 1,
                                                title: "",
                                                description: "",
                                                href: "",
                                                icon: "",
                                            });
                                            setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                                        }}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                    >
                                        + Nouvelle carte
                                    </button>
                                </div>

                                {(draft.quickCards.cards ?? [])
                                    .slice()
                                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                    .map((c, idx) => (
                                        <QuickCardEditor
                                            key={c.id ?? idx}
                                            card={c}
                                            index={idx}
                                            draft={draft}
                                            setDraft={setDraft}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </SectionCard>


                <SectionCard
                    title="Bloc “Symptômes” (icônes auto-dessinées)"
                    description="Modifier les textes de la section rouge"
                    isExpanded={expandedSections.has("features")}
                    onToggle={() => toggleSection("features")}
                    status={(draft as any).features?.enabled ? "activé" : "désactivé"}
                >
                    {expandedSections.has("features") && (
                        <FeaturesEditor
                            block={(draft as any).features}
                            onChange={(next: any) => setDraft({ ...(draft as any), features: next })}
                        />
                    )}
                </SectionCard>


                {/* SECTIONS SIMPLE */}
                <SectionCard
                    title="Autres sections"
                    description="Activités, Événements, Ressources et Partenaires"
                    isExpanded={expandedSections.has("activities")}
                    onToggle={() => toggleSection("activities")}
                >
                    {expandedSections.has("activities") && (
                        <div className="space-y-6">
                            <SimpleBlockEditor
                                title="Activités"
                                icon="🎯"
                                block={draft.activities}
                                onChange={(next: any) => setDraft({ ...draft, activities: next })}
                            />
                            <SimpleBlockEditor
                                title="Événements"
                                icon="📅"
                                block={draft.events}
                                onChange={(next: any) => setDraft({ ...draft, events: next })}
                            />
                            <SimpleBlockEditor
                                title="Ressources"
                                icon="📚"
                                block={draft.resources}
                                onChange={(next: any) => setDraft({ ...draft, resources: next })}
                            />
                            <PartnersEditor
                                block={draft.partners}
                                onChange={(next: any) => setDraft({ ...draft, partners: next })}
                            />
                            <NewsEditor
                                block={(draft as any).news}
                                onChange={(next: any) => setDraft({ ...(draft as any), news: next })}
                            />

                            <ContactEditor
                                block={(draft as any).contact}
                                onChange={(next: any) => setDraft({ ...(draft as any), contact: next })}
                            />

                        </div>
                    )}
                </SectionCard>

                {/* Footer Actions */}
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div>
                            <h3 className="font-semibold text-gray-900">Prêt à publier ?</h3>
                            <p className="text-sm text-gray-600">
                                Toutes les modifications seront visibles sur le site après publication
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={resetDraft}
                                disabled={!dirty || saving}
                                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Tout annuler
                            </button>
                            <button
                                type="button"
                                onClick={publish}
                                disabled={!dirty || saving}
                                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? "Publication en cours..." : "Publier maintenant"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------- COMPONENTS -----------------

function SectionCard({
    title,
    description,
    children,
    isExpanded,
    onToggle,
    status,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    status?: string;
}) {
    return (
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between p-6 text-left hover:bg-gray-50"
            >
                <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <span className="text-xl">{isExpanded ? "−" : "+"}</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                        <p className="mt-1 text-sm text-gray-600">{description}</p>
                        {status && (
                            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${status === 'activé' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {status}
                            </span>
                        )}
                    </div>
                </div>
                <svg
                    className={`h-5 w-5 transform text-gray-400 transition ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isExpanded && <div className="border-t border-gray-100 p-6">{children}</div>}
        </div>
    );
}

function SlideCard({ slide, index, draft, setDraft }: any) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-l-4 border-blue-500">
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                                {index + 1}
                            </span>
                            <div>
                                <h4 className="font-semibold text-gray-900">
                                    {slide.title || `Diapositive ${index + 1}`}
                                </h4>
                                <p className="text-xs text-gray-500">ID: {slide.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={slide.enabled !== false}
                                    onChange={(e) => {
                                        const next = (draft.hero.slides ?? []).map((x: any) =>
                                            x === slide ? { ...x, enabled: e.target.checked } : x
                                        );
                                        setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Active</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setExpanded(!expanded)}
                                className="rounded-lg p-2 hover:bg-gray-100"
                            >
                                <svg
                                    className={`h-5 w-5 text-gray-500 transition ${expanded ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = (draft.hero.slides ?? []).filter((x: any) => x !== slide);
                                    setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                }}
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>

                    {expanded && (
                        <div className="mt-6 space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Ordre d'affichage</label>
                                    <input
                                        type="number"
                                        value={slide.order ?? index + 1}
                                        onChange={(e) => {
                                            const next = (draft.hero.slides ?? []).map((x: any) =>
                                                x === slide ? { ...x, order: Number(e.target.value) } : x
                                            );
                                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                        }}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Vidéo de fond</label>
                                    <select
                                        value={slide.videoKey ?? "v1"}
                                        onChange={(e) => {
                                            const next = (draft.hero.slides ?? []).map((x: any) =>
                                                x === slide ? { ...x, videoKey: e.target.value as any } : x
                                            );
                                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                        }}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    >
                                        <option value="v1">Vidéo 1</option>
                                        <option value="v2">Vidéo 2</option>
                                        <option value="v3">Vidéo 3</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Sous-titre (eyebrow)</label>
                                    <input
                                        type="text"
                                        value={slide.eyebrow ?? ""}
                                        onChange={(e) => {
                                            const next = (draft.hero.slides ?? []).map((x: any) =>
                                                x === slide ? { ...x, eyebrow: e.target.value } : x
                                            );
                                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                        }}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="Ex: Association • Estrie"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Titre principal</label>
                                    <input
                                        type="text"
                                        value={slide.title ?? ""}
                                        onChange={(e) => {
                                            const next = (draft.hero.slides ?? []).map((x: any) =>
                                                x === slide ? { ...x, title: e.target.value } : x
                                            );
                                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                        }}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="Ex: Bienvenue — Association de la fibromyalgie de l'Estrie"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={slide.description ?? ""}
                                        onChange={(e) => {
                                            const next = (draft.hero.slides ?? []).map((x: any) =>
                                                x === slide ? { ...x, description: e.target.value } : x
                                            );
                                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                        }}
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        placeholder="Description de la diapositive..."
                                    />
                                </div>
                            </div>

                            {/* CTAs */}
                            <div className="rounded-lg border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <h5 className="font-semibold text-gray-900">Boutons d'action</h5>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const ctas = [...(slide.ctas ?? [])];
                                            ctas.push({ label: "", href: "#", variant: "primary" });
                                            const next = (draft.hero.slides ?? []).map((x: any) =>
                                                x === slide ? { ...x, ctas } : x
                                            );
                                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                        }}
                                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white"
                                    >
                                        + Ajouter un bouton
                                    </button>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {(slide.ctas ?? []).map((cta: any, cIdx: number) => (
                                        <div key={cIdx} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="grid gap-3 md:grid-cols-3">
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium text-gray-700">Texte du bouton</label>
                                                    <input
                                                        type="text"
                                                        value={cta.label}
                                                        onChange={(e) => {
                                                            const nextCtas = [...(slide.ctas ?? [])];
                                                            nextCtas[cIdx] = { ...nextCtas[cIdx], label: e.target.value };
                                                            const next = (draft.hero.slides ?? []).map((x: any) =>
                                                                x === slide ? { ...x, ctas: nextCtas } : x
                                                            );
                                                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                                        }}
                                                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                                                        placeholder="Ex: Voir les activités"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium text-gray-700">Lien</label>
                                                    <input
                                                        type="text"
                                                        value={cta.href}
                                                        onChange={(e) => {
                                                            const nextCtas = [...(slide.ctas ?? [])];
                                                            nextCtas[cIdx] = { ...nextCtas[cIdx], href: e.target.value };
                                                            const next = (draft.hero.slides ?? []).map((x: any) =>
                                                                x === slide ? { ...x, ctas: nextCtas } : x
                                                            );
                                                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                                        }}
                                                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                                                        placeholder="Ex: /activites"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-xs font-medium text-gray-700">Style</label>
                                                    <select
                                                        value={cta.variant}
                                                        onChange={(e) => {
                                                            const nextCtas = [...(slide.ctas ?? [])];
                                                            nextCtas[cIdx] = { ...nextCtas[cIdx], variant: e.target.value };
                                                            const next = (draft.hero.slides ?? []).map((x: any) =>
                                                                x === slide ? { ...x, ctas: nextCtas } : x
                                                            );
                                                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                                        }}
                                                        className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                                                    >
                                                        <option value="primary">Principal (rouge)</option>
                                                        <option value="secondary">Secondaire (blanc)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const nextCtas = [...(slide.ctas ?? [])].filter((_, i) => i !== cIdx);
                                                        const next = (draft.hero.slides ?? []).map((x: any) =>
                                                            x === slide ? { ...x, ctas: nextCtas } : x
                                                        );
                                                        setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                                                    }}
                                                    className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    Supprimer ce bouton
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function QuickCardEditor({ card, index, draft, setDraft }: any) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-l-4 border-green-500">
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                                {index + 1}
                            </span>
                            <div>
                                <h4 className="font-semibold text-gray-900">{card.title || `Carte ${index + 1}`}</h4>
                                <p className="text-xs text-gray-500">ID: {card.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={card.enabled !== false}
                                    onChange={(e) => {
                                        const next = (draft.quickCards.cards ?? []).map((x: any) =>
                                            x === card ? { ...x, enabled: e.target.checked } : x
                                        );
                                        setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                                    }}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Active</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setExpanded(!expanded)}
                                className="rounded-lg p-2 hover:bg-gray-100"
                            >
                                <svg
                                    className={`h-5 w-5 text-gray-500 transition ${expanded ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = (draft.quickCards.cards ?? []).filter((x: any) => x !== card);
                                    setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                                }}
                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>

                    {expanded && (
                        <div className="mt-6 space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">Ordre d'affichage</label>
                                    <input
                                        type="number"
                                        value={card.order ?? index + 1}
                                        onChange={(e) => {
                                            const next = (draft.quickCards.cards ?? []).map((x: any) =>
                                                x === card ? { ...x, order: Number(e.target.value) } : x
                                            );
                                            setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                                        }}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Titre</label>
                                <input
                                    type="text"
                                    value={card.title ?? ""}
                                    onChange={(e) => {
                                        const next = (draft.quickCards.cards ?? []).map((x: any) =>
                                            x === card ? { ...x, title: e.target.value } : x
                                        );
                                        setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                                    }}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="Ex: Devenir membre"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={card.description ?? ""}
                                    onChange={(e) => {
                                        const next = (draft.quickCards.cards ?? []).map((x: any) =>
                                            x === card ? { ...x, description: e.target.value } : x
                                        );
                                        setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                                    }}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="Description de la carte..."
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">Lien</label>
                                <input
                                    type="text"
                                    value={card.href ?? ""}
                                    onChange={(e) => {
                                        const next = (draft.quickCards.cards ?? []).map((x: any) =>
                                            x === card ? { ...x, href: e.target.value } : x
                                        );
                                        setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                                    }}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    placeholder="/membre, /activites, #section..."
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SimpleBlockEditor({ title, icon, block, onChange }: any) {
    const items = ((block as any)?.items ?? []) as any[];

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-l-4 border-purple-500">
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{icon}</span>
                            <h4 className="font-semibold text-gray-900">{title}</h4>
                        </div>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={block?.enabled !== false}
                                onChange={(e) => onChange({ ...block, enabled: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Section active</span>
                        </label>
                    </div>

                    {/* header + CTA */}
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Titre principal</label>
                            <input
                                type="text"
                                value={block?.header?.heading ?? ""}
                                onChange={(e) =>
                                    onChange({ ...block, header: { ...(block?.header ?? {}), heading: e.target.value } })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Sous-titre</label>
                            <input
                                type="text"
                                value={block?.header?.subheading ?? ""}
                                onChange={(e) =>
                                    onChange({ ...block, header: { ...(block?.header ?? {}), subheading: e.target.value } })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Texte du bouton</label>
                            <input
                                type="text"
                                value={block?.ctaLabel ?? ""}
                                onChange={(e) => onChange({ ...block, ctaLabel: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Lien du bouton</label>
                            <input
                                type="text"
                                value={block?.ctaHref ?? ""}
                                onChange={(e) => onChange({ ...block, ctaHref: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* items CRUD */}
                    <div className="mt-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-gray-900">
                                Items ({items.length})
                            </h5>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = [...items];
                                    next.push({
                                        id: uid("it"),
                                        enabled: true,
                                        order: next.length + 1,
                                        title: "",
                                        description: "",
                                        href: "",
                                        meta: "",
                                        date: "",
                                    });
                                    onChange({ ...block, items: next });
                                }}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                + Ajouter un item
                            </button>
                        </div>

                        {items
                            .slice()
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((it, idx) => (
                                <div key={it.id ?? idx} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{it.title || "Item"}</p>
                                                <p className="text-xs text-gray-500">ID: {it.id}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={it.enabled !== false}
                                                    onChange={(e) => {
                                                        const next = items.map((x) => (x === it ? { ...x, enabled: e.target.checked } : x));
                                                        onChange({ ...block, items: next });
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">Actif</span>
                                            </label>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const next = items.filter((x) => x !== it);
                                                    onChange({ ...block, items: next });
                                                }}
                                                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 md:grid-cols-6">
                                        <div className="md:col-span-1">
                                            <label className="mb-1 block text-xs font-medium text-gray-700">Ordre</label>
                                            <input
                                                type="number"
                                                value={it.order ?? idx + 1}
                                                onChange={(e) => {
                                                    const next = items.map((x) => (x === it ? { ...x, order: Number(e.target.value) } : x));
                                                    onChange({ ...block, items: next });
                                                }}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                            />
                                        </div>

                                        <div className="md:col-span-5">
                                            <label className="mb-1 block text-xs font-medium text-gray-700">Titre</label>
                                            <input
                                                type="text"
                                                value={it.title ?? ""}
                                                onChange={(e) => {
                                                    const next = items.map((x) => (x === it ? { ...x, title: e.target.value } : x));
                                                    onChange({ ...block, items: next });
                                                }}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                            />
                                        </div>

                                        <div className="md:col-span-6">
                                            <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
                                            <textarea
                                                value={it.description ?? ""}
                                                onChange={(e) => {
                                                    const next = items.map((x) => (x === it ? { ...x, description: e.target.value } : x));
                                                    onChange({ ...block, items: next });
                                                }}
                                                rows={3}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="mb-1 block text-xs font-medium text-gray-700">Lien</label>
                                            <input
                                                type="text"
                                                value={it.href ?? ""}
                                                onChange={(e) => {
                                                    const next = items.map((x) => (x === it ? { ...x, href: e.target.value } : x));
                                                    onChange({ ...block, items: next });
                                                }}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                placeholder="/activites ou https://..."
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="mb-1 block text-xs font-medium text-gray-700">Meta (optionnel)</label>
                                            <input
                                                type="text"
                                                value={it.meta ?? ""}
                                                onChange={(e) => {
                                                    const next = items.map((x) => (x === it ? { ...x, meta: e.target.value } : x));
                                                    onChange({ ...block, items: next });
                                                }}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                placeholder="Ex: Atelier • 90 min"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


import { uploadHomeMedia } from "../../../services/storageRepo";

function PartnersEditor({ block, onChange }: any) {
    const logos = (block?.logos ?? []) as any[];
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const setLogo = (id: string, patch: any) => {
        const next = logos.map((l) => (l.id === id ? { ...l, ...patch } : l));
        onChange({ ...block, logos: next });
    };

    const removeLogo = (id: string) => {
        onChange({ ...block, logos: logos.filter((l) => l.id !== id) });
    };

    const addLogo = () => {
        const next = [...logos];
        next.push({
            id: uid("p"),
            enabled: true,
            order: next.length + 1,
            alt: "",
            href: "",
            src: "",
            storagePath: "",
        });
        onChange({ ...block, logos: next });
    };

    const onUpload = async (id: string, file?: File | null) => {
        if (!file) return;
        setErr(null);
        setUploadingId(id);
        try {
            const { url, path } = await uploadHomeMedia(file);
            setLogo(id, { src: url, storagePath: path });
        } catch (e: any) {
            console.error(e);
            setErr(e?.message ?? "Upload error");
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-l-4 border-orange-500">
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">🤝</span>
                            <h4 className="font-semibold text-gray-900">Partenaires</h4>
                        </div>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={block?.enabled !== false}
                                onChange={(e) => onChange({ ...block, enabled: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Section active</span>
                        </label>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Titre de section</label>
                            <input
                                type="text"
                                value={block?.heading ?? ""}
                                onChange={(e) => onChange({ ...block, heading: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Ex: Nos partenaires"
                            />
                        </div>

                        <div className="flex items-end justify-end">
                            <button
                                type="button"
                                onClick={addLogo}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                + Ajouter un logo
                            </button>
                        </div>
                    </div>

                    {err ? (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {err}
                        </div>
                    ) : null}

                    <div className="mt-6 space-y-4">
                        {logos
                            .slice()
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((logo, idx) => {
                                const isUploading = uploadingId === logo.id;
                                const src = logo.src || "";

                                return (
                                    <div key={logo.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                                                    {idx + 1}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-3">
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={logo.enabled !== false}
                                                                onChange={(e) => setLogo(logo.id, { enabled: e.target.checked })}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">Actif</span>
                                                        </label>

                                                        <div className="text-xs text-gray-500">ID: {logo.id}</div>
                                                    </div>

                                                    {/* Preview */}
                                                    <div className="mt-3 flex items-center gap-3">
                                                        <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                                            {src ? (
                                                                <img src={src} alt={logo.alt || "logo"} className="h-full w-full object-contain" />
                                                            ) : (
                                                                <span className="text-xs font-semibold text-gray-400">Aperçu</span>
                                                            )}
                                                        </div>

                                                        <div className="grid flex-1 gap-3 md:grid-cols-2">
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-700">Ordre</label>
                                                                <input
                                                                    type="number"
                                                                    value={logo.order ?? idx + 1}
                                                                    onChange={(e) => setLogo(logo.id, { order: Number(e.target.value) })}
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-700">Texte alternatif</label>
                                                                <input
                                                                    type="text"
                                                                    value={logo.alt ?? ""}
                                                                    onChange={(e) => setLogo(logo.id, { alt: e.target.value })}
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                    placeholder="Ex: Desjardins"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                                                Image URL (option A)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={logo.src ?? ""}
                                                                onChange={(e) =>
                                                                    setLogo(logo.id, { src: e.target.value, storagePath: "" })
                                                                }
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                placeholder="https://.../logo.png"
                                                            />
                                                            <p className="mt-1 text-[11px] text-gray-500">
                                                                Si vous collez une URL, on vide storagePath automatiquement.
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-gray-700">
                                                                Upload (option B)
                                                            </label>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => onUpload(logo.id, e.target.files?.[0])}
                                                                disabled={isUploading}
                                                                className="block w-full text-sm"
                                                            />
                                                            <div className="mt-2 text-[11px] text-gray-500">
                                                                {isUploading ? "Upload en cours..." : logo.storagePath ? `Storage: ${logo.storagePath}` : ""}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-gray-700">Lien (optionnel)</label>
                                                            <input
                                                                type="text"
                                                                value={logo.href ?? ""}
                                                                onChange={(e) => setLogo(logo.id, { href: e.target.value })}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                placeholder="https://partenaire.org"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeLogo(logo.id)}
                                                className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                        {!logos.length ? (
                            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                                Aucun logo pour le moment. Cliquez sur <b>“Ajouter un logo”</b>.
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeaturesEditor({ block, onChange }: any) {
    const items = block?.items ?? [];

    const addItem = () => {
        const next = [...items];
        next.push({
            id: `f_${Date.now()}`,
            enabled: true,
            order: next.length + 1,
            icon: next.length === 0 ? "brain" : next.length === 1 ? "sleep" : next.length === 2 ? "balance" : "stairs",
            title: "",
            description: "",
        });
        onChange({ ...(block ?? {}), items: next });
    };

    const updateItem = (idx: number, patch: any) => {
        const next = [...items];
        next[idx] = { ...next[idx], ...patch };
        onChange({ ...block, items: next });
    };

    const removeItem = (idx: number) => {
        const next = items.filter((_: any, i: number) => i !== idx);
        onChange({ ...block, items: next });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-xl bg-gray-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={block?.enabled !== false}
                            onChange={(e) => onChange({ ...(block ?? {}), enabled: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm font-medium text-gray-700">Section active</span>
                    </label>

                    <div />
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Eyebrow</label>
                        <input
                            value={block?.eyebrow ?? ""}
                            onChange={(e) => onChange({ ...(block ?? {}), eyebrow: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Ex: Soutien"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Titre</label>
                        <input
                            value={block?.heading ?? ""}
                            onChange={(e) => onChange({ ...(block ?? {}), heading: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Ex: Les symptômes de la fibromyalgie"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">Texte</label>
                        <textarea
                            value={block?.subheading ?? ""}
                            onChange={(e) => onChange({ ...(block ?? {}), subheading: e.target.value })}
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Éléments ({items.length})</h3>
                <button
                    type="button"
                    onClick={addItem}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    + Ajouter
                </button>
            </div>

            <div className="space-y-4">
                {items
                    .slice()
                    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                    .map((it: any, idx: number) => (
                        <div key={it.id ?? idx} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-700">#{it.order ?? idx + 1}</span>
                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                        icône: {it.icon ?? "brain"} (fixe)
                                    </span>
                                </div>

                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={it.enabled !== false}
                                            onChange={(e) => updateItem(idx, { enabled: e.target.checked })}
                                            className="rounded border-gray-300 text-blue-600"
                                        />
                                        Actif
                                    </label>

                                    <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Ordre</label>
                                    <input
                                        type="number"
                                        value={it.order ?? idx + 1}
                                        onChange={(e) => updateItem(idx, { order: Number(e.target.value) })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Titre</label>
                                    <input
                                        value={it.title ?? ""}
                                        onChange={(e) => updateItem(idx, { title: e.target.value })}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </div>

                                <div className="md:col-span-3">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={it.description ?? ""}
                                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                                        rows={3}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                    />
                                </div>
                            </div>

                            <p className="mt-3 text-xs text-gray-500">
                                Les icônes sont volontairement fixes (style “auto-dessin”), on édite seulement le texte.
                            </p>
                        </div>
                    ))}
            </div>
        </div>
    );
}

type NewsItem = {
    id: string;
    enabled?: boolean;
    order?: number;
    title?: string;
    excerpt?: string;
    date?: string;
    href?: string;
    coverSrc?: string;
    coverAlt?: string;
    storagePath?: string; // optional, if using upload
    readingTime?: string;
    pageDocId?: string;
};

type NewsBlock = {
    enabled?: boolean;
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    ctaLabel?: string;
    ctaHref?: string;
    items?: NewsItem[];
};

export function NewsEditor({
    block,
    onChange,
}: {
    block?: NewsBlock;
    onChange: (next: NewsBlock) => void;
}) {
    const items = (block?.items ?? []) as NewsItem[];

    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const setItem = (id: string, patch: Partial<NewsItem>) => {
        const next = items.map((x) => (x.id === id ? { ...x, ...patch } : x));
        onChange({ ...(block ?? {}), items: next });
    };

    const removeItem = (id: string) => {
        onChange({ ...(block ?? {}), items: items.filter((x) => x.id !== id) });
    };

    const addItem = () => {
        const next = [...items];
        next.push({
            id: uid("n"),
            enabled: true,
            order: next.length + 1,
            title: "",
            excerpt: "",
            date: "",
            href: "",
            coverSrc: "",
            coverAlt: "",
            storagePath: "",
        });
        onChange({ ...(block ?? {}), items: next });
    };

    // OPTIONAL upload handler (same pattern as PartnersEditor)
    const onUpload = async (id: string, file?: File | null) => {
        if (!file) return;
        setErr(null);
        setUploadingId(id);
        try {
            const { url, path } = await uploadHomeMedia(file);
            setItem(id, { coverSrc: url, storagePath: path });
        } catch (e: any) {
            console.error(e);
            setErr(e?.message ?? "Upload error");
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-l-4 border-red-500">
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📰</span>
                            <h4 className="font-semibold text-gray-900">Actualités</h4>
                        </div>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={block?.enabled !== false}
                                onChange={(e) => onChange({ ...(block ?? {}), enabled: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Section active</span>
                        </label>
                    </div>

                    {/* Header fields */}
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Eyebrow</label>
                            <input
                                type="text"
                                value={block?.eyebrow ?? ""}
                                onChange={(e) => onChange({ ...(block ?? {}), eyebrow: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Ex: Nos actualités"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Titre</label>
                            <input
                                type="text"
                                value={block?.heading ?? ""}
                                onChange={(e) => onChange({ ...(block ?? {}), heading: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Ex: Nos actualités"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-sm font-medium text-gray-700">Sous-titre</label>
                            <textarea
                                value={block?.subheading ?? ""}
                                onChange={(e) => onChange({ ...(block ?? {}), subheading: e.target.value })}
                                rows={2}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Ex: Pour être informé des dernières actualités..."
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Texte du bouton</label>
                            <input
                                type="text"
                                value={block?.ctaLabel ?? ""}
                                onChange={(e) => onChange({ ...(block ?? {}), ctaLabel: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Ex: Toutes nos actualités"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">Lien du bouton</label>
                            <input
                                type="text"
                                value={block?.ctaHref ?? ""}
                                onChange={(e) => onChange({ ...(block ?? {}), ctaHref: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Ex: /actualites"
                            />
                        </div>
                    </div>

                    {err ? (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {err}
                        </div>
                    ) : null}

                    {/* Items */}
                    <div className="mt-8 space-y-3">
                        <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-gray-900">Cartes ({items.length})</h5>
                            <button
                                type="button"
                                onClick={addItem}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                            >
                                + Ajouter une actualité
                            </button>
                        </div>

                        {items
                            .slice()
                            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                            .map((it, idx) => {
                                const isUploading = uploadingId === it.id;
                                const cover = it.coverSrc ?? "";

                                return (
                                    <div key={it.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex min-w-0 items-start gap-4">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
                                                    {idx + 1}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={it.enabled !== false}
                                                                onChange={(e) => setItem(it.id, { enabled: e.target.checked })}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                            <span className="text-sm font-medium text-gray-700">Actif</span>
                                                        </label>

                                                        <div className="text-xs text-gray-500">ID: {it.id}</div>
                                                    </div>

                                                    {/* Preview */}
                                                    <div className="mt-3 flex items-center gap-3">
                                                        <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                                                            {cover ? (
                                                                <img src={cover} alt={it.coverAlt || "cover"} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-semibold text-gray-400">Image</span>
                                                            )}
                                                        </div>

                                                        <div className="grid flex-1 gap-3 md:grid-cols-3">
                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-700">Ordre</label>
                                                                <input
                                                                    type="number"
                                                                    value={it.order ?? idx + 1}
                                                                    onChange={(e) => setItem(it.id, { order: Number(e.target.value) })}
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-700">Date (label)</label>
                                                                <input
                                                                    type="text"
                                                                    value={it.date ?? ""}
                                                                    onChange={(e) => setItem(it.id, { date: e.target.value })}
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                    placeholder="Ex: 28 OCTOBRE 2025"
                                                                />
                                                            </div>

                                                            <div>
                                                                <label className="mb-1 block text-xs font-medium text-gray-700">Temps lecture</label>
                                                                <input
                                                                    type="text"
                                                                    value={it.readingTime ?? ""}
                                                                    onChange={(e) => setItem(it.id, { readingTime: e.target.value })}
                                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                    placeholder="Ex: 3 min"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                        <div className="md:col-span-2">
                                                            <label className="mb-1 block text-xs font-medium text-gray-700">Titre</label>
                                                            <input
                                                                type="text"
                                                                value={it.title ?? ""}
                                                                onChange={(e) => setItem(it.id, { title: e.target.value })}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                placeholder="Titre de l’actualité"
                                                            />
                                                        </div>

                                                        <div className="md:col-span-2">
                                                            <label className="mb-1 block text-xs font-medium text-gray-700">Extrait</label>
                                                            <textarea
                                                                value={it.excerpt ?? ""}
                                                                onChange={(e) => setItem(it.id, { excerpt: e.target.value })}
                                                                rows={3}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                placeholder="Texte court affiché sur la carte..."
                                                            />
                                                        </div>

                                                        <div className="md:col-span-2">
                                                            <label className="mb-1 block text-xs font-medium text-gray-700">Lien (href)</label>
                                                            <input
                                                                type="text"
                                                                value={it.href ?? ""}
                                                                onChange={(e) => setItem(it.id, { href: e.target.value })}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                placeholder="/actualites/slug-ou-page"
                                                            />
                                                            <p className="mt-1 text-[11px] text-gray-500">
                                                                Option: tu peux pointer vers une page créée par ton PagesManager.
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-gray-700">Image URL (option A)</label>
                                                            <input
                                                                type="text"
                                                                value={it.coverSrc ?? ""}
                                                                onChange={(e) => setItem(it.id, { coverSrc: e.target.value, storagePath: "" })}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                placeholder="https://.../cover.jpg"
                                                            />
                                                            <p className="mt-1 text-[11px] text-gray-500">
                                                                Si tu colles une URL, on vide storagePath.
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-gray-700">Upload (option B)</label>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => onUpload(it.id, e.target.files?.[0])}
                                                                disabled={isUploading}
                                                                className="block w-full text-sm"
                                                            />
                                                            <div className="mt-2 text-[11px] text-gray-500">
                                                                {isUploading ? "Upload en cours..." : it.storagePath ? `Storage: ${it.storagePath}` : ""}
                                                            </div>
                                                        </div>

                                                        <div className="md:col-span-2">
                                                            <label className="mb-1 block text-xs font-medium text-gray-700">Alt image</label>
                                                            <input
                                                                type="text"
                                                                value={it.coverAlt ?? ""}
                                                                onChange={(e) => setItem(it.id, { coverAlt: e.target.value })}
                                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                                                placeholder="Ex: Photo de couverture"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => removeItem(it.id)}
                                                className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                        {!items.length ? (
                            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                                Aucune actualité pour le moment. Cliquez sur <b>“Ajouter une actualité”</b>.
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}


type ContactBlock = {
    enabled?: boolean;
    mapEmbedUrl?: string;
    orgName?: string;
    email?: string;
    address?: string;
    directionsUrl?: string;
    hours?: { label: string; value: string }[];
    phones?: { label?: string; value: string }[];
};

export function ContactEditor({
    block,
    onChange,
}: {
    block?: ContactBlock;
    onChange: (next: ContactBlock) => void;
}) {
    const hours = (block?.hours ?? []) as { label: string; value: string }[];
    const phones = (block?.phones ?? []) as { label?: string; value: string }[];

    const set = (patch: Partial<ContactBlock>) => onChange({ ...(block ?? {}), ...patch });

    const setHour = (idx: number, patch: Partial<{ label: string; value: string }>) => {
        const next = [...hours];
        next[idx] = { ...(next[idx] ?? { label: "", value: "" }), ...patch };
        set({ hours: next });
    };

    const addHour = () => set({ hours: [...hours, { label: "", value: "" }] });
    const removeHour = (idx: number) => set({ hours: hours.filter((_, i) => i !== idx) });

    const setPhone = (idx: number, patch: Partial<{ label?: string; value: string }>) => {
        const next = [...phones];
        next[idx] = { ...(next[idx] ?? { label: "", value: "" }), ...patch };
        set({ phones: next });
    };

    const addPhone = () => set({ phones: [...phones, { label: "", value: "" }] });
    const removePhone = (idx: number) => set({ phones: phones.filter((_, i) => i !== idx) });

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-l-4 border-rose-500">
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📍</span>
                            <h4 className="font-semibold text-gray-900">Contact (carte + coordonnées)</h4>
                        </div>

                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={block?.enabled !== false}
                                onChange={(e) => set({ enabled: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Section active</span>
                        </label>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <label className="text-sm">
                            <div className="mb-1 font-medium text-gray-900">Nom de l’organisme</div>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                value={block?.orgName ?? ""}
                                onChange={(e) => set({ orgName: e.target.value })}
                                placeholder="Association de la fibromyalgie de l’Estrie"
                            />
                        </label>

                        <label className="text-sm">
                            <div className="mb-1 font-medium text-gray-900">Courriel</div>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                value={block?.email ?? ""}
                                onChange={(e) => set({ email: e.target.value })}
                                placeholder="info@exemple.ca"
                            />
                        </label>

                        <label className="text-sm md:col-span-2">
                            <div className="mb-1 font-medium text-gray-900">Adresse</div>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                value={block?.address ?? ""}
                                onChange={(e) => set({ address: e.target.value })}
                                placeholder="1013, rue ... Sherbrooke (Qc) ..."
                            />
                        </label>

                        <label className="text-sm md:col-span-2">
                            <div className="mb-1 font-medium text-gray-900">Carte (lien embed Google Maps)</div>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
                                value={block?.mapEmbedUrl ?? ""}
                                onChange={(e) => set({ mapEmbedUrl: e.target.value })}
                                placeholder="https://www.google.com/maps/embed?pb=..."
                            />
                            <div className="mt-1 text-xs text-gray-500">
                                Google Maps → Partager → <b>Intégrer une carte</b> → copier le lien (<span className="font-mono">src</span>)
                            </div>
                        </label>

                        <label className="text-sm md:col-span-2">
                            <div className="mb-1 font-medium text-gray-900">Lien “Itinéraire” (Directions)</div>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                value={block?.directionsUrl ?? ""}
                                onChange={(e) => set({ directionsUrl: e.target.value })}
                                placeholder="https://maps.google.com/?q=..."
                            />
                        </label>
                    </div>

                    {/* HOURS */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-gray-900">Heures d’ouverture</h5>
                            <button
                                type="button"
                                onClick={addHour}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                + Ajouter
                            </button>
                        </div>

                        <div className="mt-3 space-y-2">
                            {hours.map((h, idx) => (
                                <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                                    <input
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={h.label ?? ""}
                                        onChange={(e) => setHour(idx, { label: e.target.value })}
                                        placeholder="Lundi au vendredi"
                                    />
                                    <input
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={h.value ?? ""}
                                        onChange={(e) => setHour(idx, { value: e.target.value })}
                                        placeholder="9h00 à 12h00"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeHour(idx)}
                                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            ))}

                            {!hours.length ? (
                                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                                    Aucune heure. Cliquez sur <b>“Ajouter”</b>.
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* PHONES */}
                    <div className="mt-8">
                        <div className="flex items-center justify-between">
                            <h5 className="text-sm font-semibold text-gray-900">Téléphones</h5>
                            <button
                                type="button"
                                onClick={addPhone}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                + Ajouter
                            </button>
                        </div>

                        <div className="mt-3 space-y-2">
                            {phones.map((p, idx) => (
                                <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                                    <input
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={p.label ?? ""}
                                        onChange={(e) => setPhone(idx, { label: e.target.value })}
                                        placeholder="Local / Sans frais (optionnel)"
                                    />
                                    <input
                                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        value={p.value ?? ""}
                                        onChange={(e) => setPhone(idx, { value: e.target.value })}
                                        placeholder="819-566-1067"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removePhone(idx)}
                                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            ))}

                            {!phones.length ? (
                                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                                    Aucun téléphone. Cliquez sur <b>“Ajouter”</b>.
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
