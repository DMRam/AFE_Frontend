import { useEffect, useState } from "react";
import { uid } from "./utils/ids";
import { useHomePageDraft } from "./hooks/useHomePageDraft";

import { Toast } from "./components/Toast";
import { SectionCard } from "./components/SectionCard";
import { SlideCard } from "./components/SlideCard";
import { QuickCardEditor } from "./components/QuickCardEditor";
import { SimpleBlockEditor } from "./components/SimpleBlockEditor";
import { PartnersEditor } from "./components/PartnersEditor";
import { FeaturesEditor } from "./components/FeaturesEditor";
import { NewsEditor } from "./components/NewsEditor";
import { ContactEditor } from "./components/ContactEditor";
import type { HomePageCMS } from "../../../../content/types/homePage";
import { btnPrimary, btnSecondary } from "./utils/ui";
import { HeaderCtasEditor } from "./components/HeaderCtasEditor";

export default function HomePageManager() {
    const {
        draft,
        setDraft,
        loading,
        saving,
        toast,
        dirty,
        resetDraft,
        publish,
        initMissing,
    } = useHomePageDraft();


    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        () => new Set()
    );

    const toggleSection = (key: string) => {
        const next = new Set(expandedSections);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setExpandedSections(next);
    };

    // Guard: warn before leaving if there are unsaved changes
    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!dirty) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [dirty]);

    const canRender = !loading && !!draft;

    if (!canRender) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex min-h-[60vh] items-center justify-center">
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                        <p className="text-lg font-medium text-gray-700">
                            Chargement de l’éditeur de la page d’accueil…
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const homepage = draft as HomePageCMS;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
                <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center sm:gap-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Éditeur — Page d’accueil
                            </h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Modifiez le contenu principal de la page d’accueil
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div
                                className={`rounded-lg px-3 py-1 text-sm font-medium ${dirty
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                    }`}
                            >
                                {dirty ? "● Modifications non enregistrées" : "✓ À jour"}
                            </div>

                            <button
                                type="button"
                                onClick={initMissing}
                                disabled={saving}
                                className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                            >
                                Ajouter les champs manquants
                            </button>

                            <button
                                type="button"
                                onClick={resetDraft}
                                disabled={!dirty || saving}
                                className={`${btnSecondary} disabled:opacity-50`}
                            >
                                Annuler
                            </button>

                            <button
                                type="button"
                                onClick={publish}
                                disabled={!dirty || saving}
                                className={`${btnPrimary} disabled:opacity-50`}
                            >
                                {saving ? "Publication…" : "Publier"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <Toast toast={toast} />

            <div className="mx-auto max-w-8xl px-1 py-8 sm:px-6 lg:px-8">


                {/* CTAs Header */}
                <SectionCard
                    title="Boutons du haut (Header)"
                    description="Configurer « Faire un don » et « Devenir membre » (Stripe ou lien externe)"
                    isExpanded={expandedSections.has("headerCtas")}
                    onToggle={() => toggleSection("headerCtas")}
                    status={
                        homepage.headerCtas?.donate?.enabled !== false ||
                            homepage.headerCtas?.member?.enabled !== false
                            ? "activé"
                            : "désactivé"
                    }
                >
                    {expandedSections.has("headerCtas") && (
                        <HeaderCtasEditor homepage={homepage} setDraft={setDraft} />
                    )}
                </SectionCard>

                {/* HERO */}
                <SectionCard
                    title="Bannière principale (Hero)"
                    description="Diaporama principal avec vidéos et boutons d’action"
                    isExpanded={expandedSections.has("hero")}
                    onToggle={() => toggleSection("hero")}
                    status={homepage.hero?.enabled ? "activé" : "désactivé"}
                >
                    {expandedSections.has("hero") && (
                        <div className="space-y-6">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                    Paramètres généraux
                                </h3>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Intervalle entre les diapositives (secondes)
                                        </label>
                                        <input
                                            type="range"
                                            min="3"
                                            max="30"
                                            step="1"
                                            value={homepage.hero.intervalSeconds ?? 9}
                                            onChange={(e) =>
                                                setDraft({
                                                    ...homepage,
                                                    hero: {
                                                        ...homepage.hero,
                                                        intervalSeconds: Number(e.target.value),
                                                    },
                                                })
                                            }
                                            className="w-full"
                                        />
                                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                                            <span>3 s</span>
                                            <span className="font-medium">
                                                {homepage.hero.intervalSeconds ?? 9} s
                                            </span>
                                            <span>30 s</span>
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
                                            value={homepage.hero.fadeMs ?? 1200}
                                            onChange={(e) =>
                                                setDraft({
                                                    ...homepage,
                                                    hero: {
                                                        ...homepage.hero,
                                                        fadeMs: Number(e.target.value),
                                                    },
                                                })
                                            }
                                            className="w-full"
                                        />
                                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                                            <span>200 ms</span>
                                            <span className="font-medium">
                                                {homepage.hero.fadeMs ?? 1200} ms
                                            </span>
                                            <span>5 s</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Diapositives ({homepage.hero.slides?.length || 0})
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setDraft({
                                                ...homepage,
                                                hero: {
                                                    ...homepage.hero,
                                                    slides: [
                                                        ...(homepage.hero.slides ?? []),
                                                        {
                                                            id: uid("s"),
                                                            enabled: true,
                                                            order: (homepage.hero.slides?.length ?? 0) + 1,
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
                                        + Ajouter une diapositive
                                    </button>
                                </div>

                                {(homepage.hero.slides ?? [])
                                    .slice()
                                    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                                    .map((s: any, idx: number) => (
                                        <SlideCard
                                            key={s.id ?? idx}
                                            slide={s}
                                            index={idx}
                                            draft={homepage}
                                            setDraft={setDraft}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </SectionCard>

                {/* QUICK CARDS */}
                <SectionCard
                    title="Cartes rapides"
                    description="Raccourcis vers les sections principales"
                    isExpanded={expandedSections.has("quickCards")}
                    onToggle={() => toggleSection("quickCards")}
                    status={homepage.quickCards?.enabled ? "activé" : "désactivé"}
                >
                    {expandedSections.has("quickCards") && (
                        <div className="space-y-6">
                            <div className="rounded-xl bg-gray-50 p-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-700">
                                            Titre de la section
                                        </label>
                                        <input
                                            type="text"
                                            value={homepage.quickCards.heading ?? ""}
                                            onChange={(e) =>
                                                setDraft({
                                                    ...homepage,
                                                    quickCards: {
                                                        ...homepage.quickCards,
                                                        heading: e.target.value,
                                                    },
                                                })
                                            }
                                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Ex. Découvrez nos services"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={homepage.quickCards.enabled !== false}
                                                onChange={(e) =>
                                                    setDraft({
                                                        ...homepage,
                                                        quickCards: {
                                                            ...homepage.quickCards,
                                                            enabled: e.target.checked,
                                                        },
                                                    })
                                                }
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">
                                                Section active
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Cartes ({homepage.quickCards.cards?.length || 0})
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const next = [...(homepage.quickCards.cards ?? [])];
                                            next.push({
                                                id: uid("qc"),
                                                enabled: true,
                                                order: next.length + 1,
                                                title: "",
                                                description: "",
                                                href: "",
                                                icon: "",
                                            });
                                            setDraft({
                                                ...homepage,
                                                quickCards: { ...homepage.quickCards, cards: next },
                                            });
                                        }}
                                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                    >
                                        + Ajouter une carte
                                    </button>
                                </div>

                                {(homepage.quickCards.cards ?? [])
                                    .slice()
                                    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
                                    .map((c: any, idx: number) => (
                                        <QuickCardEditor
                                            key={c.id ?? idx}
                                            card={c}
                                            index={idx}
                                            draft={homepage}
                                            setDraft={setDraft}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}
                </SectionCard>


                {/* FEATURES */}
                <SectionCard
                    title="Bloc « Symptômes » (icônes auto-dessinées)"
                    description="Modifier le texte de la section rouge"
                    isExpanded={expandedSections.has("features")}
                    onToggle={() => toggleSection("features")}
                    status={(homepage as any).features?.enabled ? "activé" : "désactivé"}
                >
                    {expandedSections.has("features") && (
                        <FeaturesEditor
                            block={(homepage as any).features}
                            onChange={(next: any) =>
                                setDraft({ ...(homepage as any), features: next })
                            }
                        />
                    )}
                </SectionCard>

                {/* OTHER SECTIONS */}
                <SectionCard
                    title="Autres sections"
                    description="Activités, Événements, Ressources, Partenaires, Actualités, Contact"
                    isExpanded={expandedSections.has("otherSections")}
                    onToggle={() => toggleSection("otherSections")}
                >
                    {expandedSections.has("otherSections") && (
                        <div className="space-y-6">
                            <SimpleBlockEditor
                                title="Activités"
                                icon="🎯"
                                block={homepage.activities}
                                onChange={(next: any) => setDraft({ ...homepage, activities: next })}
                            />

                            <SimpleBlockEditor
                                title="Événements"
                                icon="📅"
                                kind="events"
                                block={homepage.events}
                                onChange={(next: any) => setDraft({ ...homepage, events: next })}
                            />

                            <SimpleBlockEditor
                                title="Ressources"
                                icon="📚"
                                kind="resources"
                                block={homepage.resources}
                                onChange={(next: any) => setDraft({ ...homepage, resources: next })}
                            />

                            <PartnersEditor
                                block={homepage.partners}
                                onChange={(next: any) => setDraft({ ...homepage, partners: next })}
                            />

                            <NewsEditor
                                block={homepage.news}
                                onChange={(next) =>
                                    setDraft((d) => (d ? ({ ...d, news: next } as HomePageCMS) : d))
                                }
                                onSave={publish}
                            />

                            <ContactEditor
                                block={(homepage as any).contact}
                                onChange={(next: any) =>
                                    setDraft({ ...(homepage as any), contact: next })
                                }
                            />
                        </div>
                    )}
                </SectionCard>

                {/* Footer actions */}
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div>
                            <h3 className="font-semibold text-gray-900">Prêt à publier ?</h3>
                            <p className="text-sm text-gray-600">
                                Les modifications seront visibles sur le site après la publication.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={resetDraft}
                                disabled={!dirty || saving}
                                className={`${btnSecondary} disabled:opacity-50`}
                            >
                                Tout annuler
                            </button>

                            <button
                                type="button"
                                onClick={publish}
                                disabled={!dirty || saving}
                                className={`${btnPrimary} disabled:opacity-50`}
                            >
                                {saving ? "Publication…" : "Publier maintenant"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
