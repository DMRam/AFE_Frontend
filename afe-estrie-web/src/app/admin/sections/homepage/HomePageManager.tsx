import { useEffect, useState } from "react";
import type { HomePageCMS } from "../../../../content/types/homePage";
import { ContactEditor } from "./components/ContactEditor";
import { FeaturesEditor } from "./components/FeaturesEditor";
import { HeaderCtasEditor } from "./components/HeaderCtasEditor";
import { NewsEditor } from "./components/NewsEditor";
import { PartnersEditor } from "./components/PartnersEditor";
import { QuickCardEditor } from "./components/QuickCardEditor";
import { SimpleBlockEditor } from "./components/SimpleBlockEditor";
import { SlideCard } from "./components/SlideCard";
import { Toast } from "./components/Toast";
import { useHomePageDraft } from "./hooks/useHomePageDraft";
import { uid } from "./utils/ids";
import { btnPrimary, btnSecondary } from "./utils/ui";


type TabKey =
  | "headerCtas"
  | "hero"
  | "quickCards"
  | "features"
  | "activities"
  | "events"
  | "resources"
  | "partners"
  | "news"
  | "contact";

type TabItem = {
  key: TabKey;
  label: string;
  description: string;
  status: "activé" | "désactivé";
};

function SectionActionBar({
  dirty,
  saving,
  onReset,
  onSave,
  label,
}: {
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
  label: string;
}) {
  return (
    <div className="border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900">{label}</div>
          <div className="text-xs text-gray-500">
            Enregistrez les modifications de cette section sans revenir en haut.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={[
              "rounded-md px-3 py-1 text-sm font-medium",
              dirty ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {dirty ? "Modifications non enregistrées" : "À jour"}
          </div>

          <button
            type="button"
            onClick={onReset}
            disabled={!dirty || saving}
            className={`${btnSecondary} rounded-md disabled:opacity-50`}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className={`${btnPrimary} rounded-md disabled:opacity-50`}
          >
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  label,
  status,
  onClick,
}: {
  active: boolean;
  label: string;
  status: "activé" | "désactivé";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative flex items-center gap-2 whitespace-nowrap px-1 py-3 text-sm font-medium transition-colors",
        active ? "text-blue-700" : "text-gray-600 hover:text-gray-900",
      ].join(" ")}
    >
      <span>{label}</span>

      <span
        className={[
          "rounded-full px-2 py-0.5 text-[11px] font-medium",
          status === "activé"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-gray-100 text-gray-500",
        ].join(" ")}
      >
        {status}
      </span>

      {active ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-600" /> : null}
    </button>
  );
}

function SectionPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="p-4">{children}</div>
    </section>
  );
}

function EditorOverviewBar({
  dirty,
  saving,
  onReset,
  onPublish,
  onInitMissing,
}: {
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  onPublish: () => void;
  onInitMissing: () => void;
}) {
  return (
    <div className="border border-gray-200 bg-white">
      <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Page d’accueil</h2>
          <p className="mt-1 text-sm text-gray-500">
            Modifiez le contenu principal de la page d’accueil.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className={[
              "rounded-md px-3 py-1 text-sm font-medium",
              dirty ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700",
            ].join(" ")}
          >
            {dirty ? "Modifications non enregistrées" : "À jour"}
          </div>

          <button
            type="button"
            onClick={onInitMissing}
            disabled={saving}
            className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            Ajouter les champs manquants
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={!dirty || saving}
            className={`${btnSecondary} rounded-md disabled:opacity-50`}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={!dirty || saving}
            className={`${btnPrimary} rounded-md disabled:opacity-50`}
          >
            {saving ? "Enregistrement…" : "Publier"}
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const [activeTab, setActiveTab] = useState<TabKey>("hero");

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
  const homepage = (draft ?? {}) as HomePageCMS;

  const tabs: TabItem[] = [
    {
      key: "headerCtas",
      label: "Boutons du haut",
      description:
        "Configurer « Faire un don » et « Devenir membre » (Stripe ou lien externe)",
      status:
        homepage.headerCtas?.donate?.enabled !== false ||
        homepage.headerCtas?.member?.enabled !== false
          ? "activé"
          : "désactivé",
    },
    {
      key: "hero",
      label: "Bannière principale",
      description: "Diaporama principal avec vidéos et boutons d’action",
      status: homepage.hero?.enabled ? "activé" : "désactivé",
    },
    {
      key: "quickCards",
      label: "Cartes rapides",
      description: "Raccourcis vers les sections principales",
      status: homepage.quickCards?.enabled ? "activé" : "désactivé",
    },
    {
      key: "features",
      label: "Symptômes",
      description: "Modifier le texte de la section rouge",
      status: (homepage as any).features?.enabled ? "activé" : "désactivé",
    },
    {
      key: "activities",
      label: "Activités",
      description: "Modifier la section des activités",
      status: homepage.activities?.enabled ? "activé" : "désactivé",
    },
    {
      key: "events",
      label: "Événements",
      description: "Modifier la section des événements",
      status: homepage.events?.enabled ? "activé" : "désactivé",
    },
    {
      key: "resources",
      label: "Ressources",
      description: "Modifier la section des ressources",
      status: homepage.resources?.enabled ? "activé" : "désactivé",
    },
    {
      key: "partners",
      label: "Partenaires",
      description: "Gérer les partenaires et logos",
      status: homepage.partners?.enabled ? "activé" : "désactivé",
    },
    {
      key: "news",
      label: "Actualités",
      description: "Gérer les nouvelles et articles",
      status: homepage.news?.enabled ? "activé" : "désactivé",
    },
    {
      key: "contact",
      label: "Contact",
      description: "Modifier les informations de contact",
      status: (homepage as any).contact?.enabled ? "activé" : "désactivé",
    },
  ];

  const activeTabMeta = tabs.find((t) => t.key === activeTab) ?? tabs[0];

  if (!canRender) {
    return (
      <div className="py-8">
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="text-base font-medium text-gray-700">
              Chargement de l’éditeur de la page d’accueil…
            </p>
          </div>
        </div>
      </div>
    );
  }

  function renderCurrentTab() {
    switch (activeTab) {
      case "headerCtas":
        return (
          <SectionPanel
            title="Boutons du haut (Header)"
            description="Configurer « Faire un don » et « Devenir membre » (Stripe ou lien externe)"
          >
            <HeaderCtasEditor homepage={homepage} setDraft={setDraft} />
          </SectionPanel>
        );

      case "hero":
        return (
          <SectionPanel
            title="Bannière principale (Hero)"
            description="Diaporama principal avec vidéos et boutons d’action"
          >
            <div className="space-y-6">
              <div className="border border-gray-200 bg-gray-50 p-4">
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-semibold text-gray-900">
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
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Ajouter une diapositive
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
          </SectionPanel>
        );

      case "quickCards":
        return (
          <SectionPanel
            title="Cartes rapides"
            description="Raccourcis vers les sections principales"
          >
            <div className="space-y-6">
              <div className="border border-gray-200 bg-gray-50 p-4">
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
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-base font-semibold text-gray-900">
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
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Ajouter une carte
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
          </SectionPanel>
        );

      case "features":
        return (
          <SectionPanel
            title="Bloc « Symptômes »"
            description="Modifier le texte de la section rouge"
          >
            <FeaturesEditor
              block={(homepage as any).features}
              onChange={(next: any) =>
                setDraft({ ...(homepage as any), features: next })
              }
            />
          </SectionPanel>
        );

      case "activities":
        return (
          <SectionPanel
            title="Activités"
            description="Modifier la section des activités"
          >
            <SimpleBlockEditor
              title="Activités"
              icon="🎯"
              block={homepage.activities}
              onChange={(next: any) => setDraft({ ...homepage, activities: next })}
            />
          </SectionPanel>
        );

      case "events":
        return (
          <SectionPanel
            title="Événements"
            description="Modifier la section des événements"
          >
            <SimpleBlockEditor
              title="Événements"
              icon="📅"
              kind="events"
              block={homepage.events}
              onChange={(next: any) => setDraft({ ...homepage, events: next })}
            />
          </SectionPanel>
        );

      case "resources":
        return (
          <SectionPanel
            title="Ressources"
            description="Modifier la section des ressources"
          >
            <SimpleBlockEditor
              title="Ressources"
              icon="📚"
              kind="resources"
              block={homepage.resources}
              onChange={(next: any) => setDraft({ ...homepage, resources: next })}
            />
          </SectionPanel>
        );

      case "partners":
        return (
          <SectionPanel
            title="Partenaires"
            description="Gérer les partenaires et logos"
          >
            <PartnersEditor
              block={homepage.partners}
              onChange={(next: any) => setDraft({ ...homepage, partners: next })}
            />
          </SectionPanel>
        );

      case "news":
        return (
          <SectionPanel
            title="Actualités"
            description="Gérer les nouvelles et articles"
          >
            <NewsEditor
              block={homepage.news}
              onChange={(next: any) =>
                setDraft((d: any) => (d ? ({ ...d, news: next } as HomePageCMS) : d))
              }
              onSave={publish}
            />
          </SectionPanel>
        );

      case "contact":
        return (
          <SectionPanel
            title="Contact"
            description="Modifier les informations de contact"
          >
            <ContactEditor
              block={(homepage as any).contact}
              onChange={(next: any) =>
                setDraft({ ...(homepage as any), contact: next })
              }
            />
          </SectionPanel>
        );

      default:
        return null;
    }
  }

  return (
    <div className="space-y-4">
      <EditorOverviewBar
        dirty={dirty}
        saving={saving}
        onReset={resetDraft}
        onPublish={publish}
        onInitMissing={initMissing}
      />

      <Toast toast={toast} />

      <div className="sticky top-0 z-20 border border-gray-200 bg-white">
        <div className="overflow-x-auto px-4">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <TabButton
                key={tab.key}
                active={activeTab === tab.key}
                label={tab.label}
                status={tab.status}
                onClick={() => setActiveTab(tab.key)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SectionActionBar
          dirty={dirty}
          saving={saving}
          onReset={resetDraft}
          onSave={publish}
          label={activeTabMeta.label}
        />

        {renderCurrentTab()}

        <SectionActionBar
          dirty={dirty}
          saving={saving}
          onReset={resetDraft}
          onSave={publish}
          label={activeTabMeta.label}
        />
      </div>
    </div>
  );
}