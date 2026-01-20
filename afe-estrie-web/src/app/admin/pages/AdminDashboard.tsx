import { useEffect, useMemo, useState } from "react";
import { AdminLayout, type AdminSectionId } from "../ui/AdminLayout";
import { AdminPanel, AdminStat } from "../ui/AdminPanel";
import { NavManager } from "../sections/NavManager";
import { PagesManager } from "../sections/PagesManager";
import { Clock, FileText, Navigation, Users } from "lucide-react";
import { FooterManager } from "../sections/FooterManager";


import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../services/firebase";
import { Timestamp } from "firebase/firestore";
import HomePageManager from "../sections/HomePageManager";
import { CookieConsentManager } from "../sections/CookieConsentManager";
import { CampaignsManager } from "../sections/CampaignsManager";

// ---- CONFIG ----
const NAV_DOC_ID = "navigation";
const NAV_FIELD = "items";

// ---- TYPES ----
interface Metrics {
  totalPages: number | null;
  publishedPages: number | null;
  navItems: number | null;
  lastUpdateLabel: string;
  lastEditorLabel: string;
}

interface ActivityUser {
  uid?: string | null;
  email?: string | null;
  name?: string | null;
}

interface Activity {
  id: string;
  at?: Timestamp | Date;
  type?: string;
  title?: string;
  detail?: string;
  by?: ActivityUser;
  meta?: {
    title?: string;
    type?: string;
    detail?: string;
    [key: string]: any;
  };
}

interface NavNode {
  children?: NavNode[];
  [key: string]: any;
}

// ---- UTILS ----
function timestampToDate(at: Timestamp | Date | null | undefined): Date | null {
  if (!at) return null;

  if (at instanceof Timestamp) {
    return at.toDate();
  }

  if (at instanceof Date) {
    return at;
  }

  if (typeof (at as any)?.toDate === "function") {
    return (at as any).toDate();
  }

  return null;
}

function formatWhen(date: Date | null): string {
  if (!date) return "—";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (inputDate.getTime() === today.getTime()) {
    return `Aujourd'hui • ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  if (inputDate.getTime() === yesterday.getTime()) {
    return `Hier • ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }

  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleDateString('fr-FR', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function countNavNodes(nodes: NavNode[] | undefined): number {
  if (!Array.isArray(nodes)) return 0;

  let total = 0;
  for (const node of nodes) {
    total += 1;
    if (Array.isArray(node.children)) {
      total += countNavNodes(node.children);
    }
  }

  return total;
}

function getUserLabel(user?: ActivityUser): string {
  if (!user) return "—";

  const name = (user.name || "").trim();
  const email = (user.email || "").trim();

  return name || email || "—";
}

function getActivityTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    PAGE_SAVE: "Page sauvegardée",
    PAGE_DELETE: "Page supprimée",
    NAV_SAVE: "Navigation mise à jour",
    PAGE_CREATE: "Page créée",
    PAGE_PUBLISH: "Page publiée",
    PAGE_UNPUBLISH: "Page dépubliée",
  };

  return labels[type || ""] || type || "Modification";
}

function getActivityTypeBadge(type?: string) {
  if (!type) return null;

  const baseClasses = "inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold";

  const typeStyles: Record<string, string> = {
    PAGE_SAVE: "border-blue-200 bg-blue-50 text-blue-700",
    PAGE_DELETE: "border-red-200 bg-red-50 text-red-700",
    NAV_SAVE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    PAGE_CREATE: "border-purple-200 bg-purple-50 text-purple-700",
    PAGE_PUBLISH: "border-green-200 bg-green-50 text-green-700",
  };

  const styleClass = typeStyles[type] || "border-gray-200 bg-gray-50 text-gray-700";
  return <span className={`${baseClasses} ${styleClass}`}>{getActivityTypeLabel(type)}</span>;
}

// ---- COMPONENTS ----
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      ← Retour au tableau de bord
    </button>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const date = timestampToDate(activity.at);
  const when = formatWhen(date);
  const who = getUserLabel(activity.by);

  const title = activity.title || activity.meta?.title || "Modification";
  const detail = activity.detail || activity.meta?.detail || "";
  const type = activity.type || activity.meta?.type;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {title}
                </div>
              </div>
              {detail && (
                <div className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {detail}
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span className="font-medium text-gray-700">{who}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {when}
                </span>
              </div>
            </div>
            {getActivityTypeBadge(type)}
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesPanel() {
  return (
    <AdminPanel title="Informations" description="Référence rapide">
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
        <ul className="space-y-3">
          <li className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <span className="font-medium">Pages :</span> collection{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">pages</code>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Navigation className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <span className="font-medium">Navigation :</span> document{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                siteConfig/navigation
              </code>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
            <div>
              <span className="font-medium">Activité :</span> collection{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                admin_activity
              </code>
            </div>
          </li>
          <li className="text-sm text-gray-600 pt-2 border-t border-gray-100">
            <span className="font-medium">Note :</span> Les pages sans champ{' '}
            <code className="px-1 bg-gray-100">published</code> sont considérées comme publiées.
          </li>
        </ul>
      </div>
    </AdminPanel>
  );
}

function OverviewContent({ metrics, recent }: { metrics: Metrics; recent: Activity[] }) {
  const statCards = useMemo(() => [
    {
      label: "Pages totales",
      value: metrics.totalPages === null ? "—" : metrics.totalPages,
      hint: "Toutes les pages dans Firestore",
      icon: <FileText className="h-4 w-4 text-blue-500" />,
    },
    {
      label: "Pages publiées",
      value: metrics.publishedPages === null ? "—" : metrics.publishedPages,
      hint: "Pages non marquées comme non publiées",
      icon: <FileText className="h-4 w-4 text-emerald-500" />,
    },
    {
      label: "Éléments de navigation",
      value: metrics.navItems === null ? "—" : metrics.navItems,
      hint: `siteConfig/${NAV_DOC_ID}`,
      icon: <Navigation className="h-4 w-4 text-purple-500" />,
    },
    {
      label: "Dernière mise à jour",
      value: metrics.lastUpdateLabel,
      hint: "Activité la plus récente",
      icon: <Clock className="h-4 w-4 text-amber-500" />,
    },
  ], [metrics]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-sm text-gray-600">
              Métriques en temps réel et historique d'activité depuis Firestore
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg px-4 py-2.5">
            <div className="text-xs font-medium text-gray-500">Dernier éditeur</div>
            <div className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
              {metrics.lastEditorLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <AdminStat
            key={index}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Changes */}
        <div className="lg:col-span-1">
          <AdminPanel
            title="Activité récente"
            description="Dernières modifications enregistrées"
          >
            {recent.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucune activité enregistrée</p>
                <p className="text-xs text-gray-400 mt-1">Les modifications apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </AdminPanel>
        </div>

        {/* Notes Panel */}
        <div className="lg:col-span-1">
          <NotesPanel />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSectionId>("overview");
  const [metrics, setMetrics] = useState<Metrics>({
    totalPages: null,
    publishedPages: null,
    navItems: null,
    lastUpdateLabel: "—",
    lastEditorLabel: "—",
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics and navigation data
  useEffect(() => {
    let isMounted = true;

    async function fetchMetrics() {
      try {
        setIsLoading(true);
        setError(null);

        const [allPagesSnapshot, unpublishedPagesSnapshot] = await Promise.all([
          getCountFromServer(collection(db, "pages")),
          getCountFromServer(
            query(collection(db, "pages"), where("published", "==", false))
          ),
        ]);

        const total = allPagesSnapshot.data().count;
        const unpublished = unpublishedPagesSnapshot.data().count;
        const published = Math.max(0, total - unpublished);

        // Fetch navigation data
        const navRef = doc(db, "siteConfig", NAV_DOC_ID);
        const navSnapshot = await getDoc(navRef);

        let navItems: number | null = null;
        if (navSnapshot.exists()) {
          const data = navSnapshot.data();
          const navFields = [NAV_FIELD, "nodes", "items", "nav", "menu"];

          for (const field of navFields) {
            const nodes = data[field];
            if (Array.isArray(nodes)) {
              navItems = countNavNodes(nodes);
              break;
            }
          }
        }

        if (isMounted) {
          setMetrics((prev) => ({
            ...prev,
            totalPages: total,
            publishedPages: published,
            navItems,
          }));
        }
      } catch (error) {
        console.error("Erreur lors du chargement des métriques:", error);
        if (isMounted) {
          setError("Impossible de charger les métriques");
          setMetrics((prev) => ({ ...prev }));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to recent activity
  useEffect(() => {
    const activityQuery = query(
      collection(db, "admin_activity"),
      orderBy("at", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      activityQuery,
      (snapshot) => {
        const activities: Activity[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Activity, "id">),
        }));

        setRecentActivity(activities);

        if (activities.length > 0) {
          const latest = activities[0];
          const latestDate = timestampToDate(latest.at);

          setMetrics((prev) => ({
            ...prev,
            lastUpdateLabel: latestDate ? formatWhen(latestDate) : "—",
            lastEditorLabel: getUserLabel(latest.by),
          }));
        }
      },
      (error) => {
        console.error("Erreur d'écoute de l'activité:", error);
        setRecentActivity([]);
        setMetrics((prev) => ({
          ...prev,
          lastUpdateLabel: "—",
          lastEditorLabel: "—",
        }));
      }
    );

    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    if (error) {
      return (
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <div className="text-red-600 font-medium mb-2">Erreur de chargement</div>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "overview":
        return <OverviewContent metrics={metrics} recent={recentActivity} />;

      case "navigation":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Gestionnaire de navigation"
              description="Modifiez le menu principal et les sous-menus"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <NavManager />
            </AdminPanel>
          </div>
        );

      case "pages":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Gestionnaire de pages"
              description="Créez et modifiez les pages de contenu"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <PagesManager />
            </AdminPanel>
          </div>
        );

      case "homepage":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Gestionnaire de pages"
              description="Créez et modifiez les pages de contenu"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <HomePageManager />
            </AdminPanel>
          </div>
        );

      case "footer":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Gestionnaire du footer"
              description="Coordonnées, liens, actualités, partenaire + lien admin"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <FooterManager />
            </AdminPanel>
          </div>
        );

      case "cookie":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Consentement cookies"
              description="Texte, boutons, liens de politiques et préférences"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <CookieConsentManager />
            </AdminPanel>
          </div>
        );

      case "campaigns":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Campagnes"
              description="Créer et envoyer des contenus promotionnels"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <CampaignsManager />
            </AdminPanel>
          </div>
        );




      default:
        return (
          <div className="mx-auto max-w-4xl">
            <AdminPanel
              title="Section en développement"
              description="Cette fonctionnalité sera bientôt disponible"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-12 text-center">
                <div className="text-gray-400 text-4xl mb-4">🚧</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  En cours de construction
                </h3>
                <p className="text-gray-600">
                  Cette section sera disponible prochainement.
                </p>
              </div>
            </AdminPanel>
          </div>
        );
    }
  };

  return (
    <AdminLayout
      title="AFE Administration"
      subtitle="Gestion de contenu Firebase"
      active={activeSection}
      onChange={setActiveSection}
      isLoading={isLoading}
    >
      {renderContent()}
    </AdminLayout>
  );
}