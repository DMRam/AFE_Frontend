import { useEffect, useMemo, useState } from "react";
import { AdminLayout, type AdminSectionId } from "../ui/AdminLayout";
import { AdminPanel, AdminStat } from "../ui/AdminPanel";

import { NavManager } from "../sections/NavManager";
import { PagesManager } from "../sections/PagesManager";
import { FooterManager } from "../sections/FooterManager";
import { CookieConsentManager } from "../sections/CookieConsentManager";
import { MembersManager } from "../sections/members/MembersManager";

import { useAdminUser } from "../hooks/useAdminUser";
import { signOut } from "firebase/auth";
import { auth } from "../../../services/firebase";



import {
  collection,
  getCountFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../services/firebase";

import {
  Clock,
  FileText,
  Users,
  HeartHandshake,
  CalendarDays,
  LayoutDashboard,
  Home,
  FilePenLine,
  UserPlus,
} from "lucide-react";
import { SettingsManager } from "../sections/settings/SettingsManager";
import HomePageManager from "../sections/homepage/HomePageManager";

// ---- TYPES ----
interface Metrics {
  membersTotal: number | null;

  pagesPublished: number | null;
  pagesDraft: number | null;

  lastUpdateLabel: string;
  lastEditorLabel: string;

  // optional placeholders for future features
  donationsThisMonth?: number | null;
  upcomingEvents?: number | null;
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

// ---- UTILS ----
function timestampToDate(at: Timestamp | Date | null | undefined): Date | null {
  if (!at) return null;
  if (at instanceof Timestamp) return at.toDate();
  if (at instanceof Date) return at;
  if (typeof (at as any)?.toDate === "function") return (at as any).toDate();
  return null;
}

function formatWhen(date: Date | null): string {
  if (!date) return "—";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");

  if (inputDate.getTime() === today.getTime()) return `Aujourd’hui • ${hh}:${mm}`;
  if (inputDate.getTime() === yesterday.getTime()) return `Hier • ${hh}:${mm}`;

  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleDateString("fr-FR", { month: "short" });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function getUserLabel(user?: ActivityUser): string {
  if (!user) return "—";
  const name = (user.name || "").trim();
  // We hide emails by default for client comfort; keep as fallback if no name.
  const email = (user.email || "").trim();
  return name || email || "—";
}

function getActivityLabel(type?: string): string {
  const labels: Record<string, string> = {
    PAGE_SAVE: "Page mise à jour",
    PAGE_DELETE: "Page supprimée",
    PAGE_CREATE: "Page créée",
    PAGE_PUBLISH: "Page publiée",
    PAGE_UNPUBLISH: "Page mise en brouillon",
    NAV_SAVE: "Menu du site modifié",
    MEMBER_CREATE: "Membre ajouté",
    MEMBER_UPDATE: "Membre mis à jour",
    MEMBER_DELETE: "Membre supprimé",
  };
  return labels[type || ""] || "Modification";
}

function getActivityIcon(type?: string) {
  const cls = "h-4 w-4";
  switch (type) {
    case "MEMBER_CREATE":
    case "MEMBER_UPDATE":
    case "MEMBER_DELETE":
      return <Users className={cls} />;
    case "PAGE_SAVE":
    case "PAGE_CREATE":
    case "PAGE_DELETE":
    case "PAGE_PUBLISH":
    case "PAGE_UNPUBLISH":
      return <FileText className={cls} />;
    case "NAV_SAVE":
      return <LayoutDashboard className={cls} />;
    default:
      return <Clock className={cls} />;
  }
}

// ---- UI COMPONENTS ----
function PrimaryAction({
  icon,
  title,
  subtitle,
  onClick,
  color = "rose",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  color?: "rose" | "violet" | "sky" | "emerald";
}) {
  const colorMap = {
    rose: "bg-rose-50 border-rose-100 text-rose-700",
    violet: "bg-violet-50 border-violet-100 text-violet-700",
    sky: "bg-sky-50 border-sky-100 text-sky-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:shadow-md hover:border-gray-300 transition"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-xl border p-2 ${colorMap[color]}`}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-600 mt-1 leading-relaxed">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs font-medium text-gray-500 group-hover:text-gray-700">
        Ouvrir →
      </div>
    </button>
  );
}


function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      ← Retour
    </button>
  );
}

function ActivityItem({ activity }: { activity: Activity }) {
  const date = timestampToDate(activity.at);
  const when = formatWhen(date);

  const type = activity.type || activity.meta?.type;
  const who = getUserLabel(activity.by);

  // For client readability: show "Page publiée" etc. + optional title/detail
  const main = activity.title?.trim() || activity.meta?.title?.trim() || getActivityLabel(type);
  const detail = activity.detail?.trim() || activity.meta?.detail?.trim() || "";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-gray-200 bg-gray-50 p-2 text-gray-700">
          {getActivityIcon(type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{main}</div>
              {detail ? (
                <div className="text-sm text-gray-600 line-clamp-2 mt-1">{detail}</div>
              ) : null}
              <div className="text-xs text-gray-500 mt-2 flex items-center gap-4">
                <span className="truncate">
                  <span className="text-gray-400">Par</span>{" "}
                  <span className="font-medium text-gray-700">{who}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {when}
                </span>
              </div>
            </div>

            <div className="hidden sm:block text-xs text-gray-500 whitespace-nowrap">
              {getActivityLabel(type)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpPanel() {
  return (
    <AdminPanel
      title="Aide rapide"
      description="Les tâches les plus fréquentes"
    >
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 space-y-3">
        <div>
          • Pour modifier le site: utilisez <b>Pages</b> ou <b>Page d’accueil</b>.
        </div>
        <div>
          • Pour gérer les inscriptions: utilisez <b>Membres</b>.
        </div>
        <div>
          • Pour des éléments plus avancés: <b>Footer</b> et <b>Cookies</b>.
        </div>
        <div className="pt-3 border-t border-gray-100 text-xs text-gray-600">
          Conseil: faites de petits changements puis vérifiez le site.
        </div>
      </div>
    </AdminPanel>
  );
}

function OverviewContent({
  metrics,
  recent,
  onGo,
}: {
  metrics: Metrics;
  recent: Activity[];
  onGo: (section: AdminSectionId) => void;
}) {
  const statCards = useMemo(
    () => [
      {
        label: "Membres",
        value: metrics.membersTotal ?? "—",
        hint: "Personnes inscrites",
        icon: <Users className="h-4 w-4" />,
      },
      {
        label: "Pages publiées",
        value: metrics.pagesPublished ?? "—",
        hint: "Visibles sur le site",
        icon: <FileText className="h-4 w-4" />,
      },
      {
        label: "Brouillons",
        value: metrics.pagesDraft ?? "—",
        hint: "À réviser",
        icon: <FilePenLine className="h-4 w-4" />,
      },
      {
        label: "Dernière modification",
        value: metrics.lastUpdateLabel,
        hint: "Activité la plus récente",
        icon: <Clock className="h-4 w-4" />,
      },
    ],
    [metrics]
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5 shadow-sm">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-900">Accueil administration</h1>
            <p className="text-sm text-gray-600">
              Gérez le contenu du site et les membres (AFE – Fibromyalgie).
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <div className="text-xs font-medium text-gray-500">Dernière personne active</div>
            <div className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">
              {metrics.lastEditorLabel}
            </div>
          </div>
        </div>

        {/* Primary actions */}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <PrimaryAction
            icon={<Home className="h-4 w-4" />}
            title="Modifier la page d’accueil"
            subtitle="Bannières, blocs, messages importants."
            onClick={() => onGo("homepage")}
            color="rose"
          />

          <PrimaryAction
            icon={<FileText className="h-4 w-4" />}
            title="Modifier les pages"
            subtitle="Textes et contenus d’information."
            onClick={() => onGo("pages")}
            color="violet"
          />

          <PrimaryAction
            icon={<UserPlus className="h-4 w-4" />}
            title="Gérer les membres"
            subtitle="Ajouter, corriger ou désactiver."
            onClick={() => onGo("members")}
            color="sky"
          />

        </div>

        {/* Optional feature placeholders */}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <HeartHandshake className="h-4 w-4" />
              Dons & campagnes (bientôt)
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Suivi des campagnes et messages de soutien.
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <CalendarDays className="h-4 w-4" />
              Activités & événements (bientôt)
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Ateliers, groupes de soutien, conférences.
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
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
          <AdminPanel title="Dernières actions" description="Ce qui a été modifié récemment">
            {recent.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
                <LayoutDashboard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Aucune action récente</p>
                <p className="text-xs text-gray-400 mt-1">
                  Les changements apparaîtront ici automatiquement.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recent.slice(0, 6).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </AdminPanel>
        </div>

        {/* Help */}
        <div className="lg:col-span-1">
          <HelpPanel />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSectionId>("overview");
  const [metrics, setMetrics] = useState<Metrics>({
    membersTotal: null,
    pagesPublished: null,
    pagesDraft: null,
    lastUpdateLabel: "—",
    lastEditorLabel: "—",
  });

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { loading: authLoading, user } = useAdminUser();



  // Fetch friendly metrics (no jargon)
  useEffect(() => {
    let isMounted = true;

    async function fetchMetrics() {
      try {
        setIsLoading(true);
        setError(null);

        // Pages
        const [allPagesSnapshot, draftPagesSnapshot] = await Promise.all([
          getCountFromServer(collection(db, "pages")),
          getCountFromServer(query(collection(db, "pages"), where("published", "==", false))),
        ]);

        const total = allPagesSnapshot.data().count;
        const drafts = draftPagesSnapshot.data().count;
        const published = Math.max(0, total - drafts);

        // Members: adjust collection name if needed
        const membersSnapshot = await getCountFromServer(collection(db, "members"));
        const membersTotal = membersSnapshot.data().count;

        if (isMounted) {
          setMetrics((prev) => ({
            ...prev,
            pagesPublished: published,
            pagesDraft: drafts,
            membersTotal,
          }));
        }
      } catch (e) {
        console.error("Erreur chargement métriques:", e);
        if (isMounted) setError("Impossible de charger les informations.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Subscribe to recent activity (human readable)
  useEffect(() => {
    const activityQuery = query(
      collection(db, "admin_activity"),
      orderBy("at", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      activityQuery,
      (snapshot) => {
        const activities: Activity[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Activity, "id">),
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
      (err) => {
        console.error("Erreur écoute activité:", err);
        setRecentActivity([]);
        setMetrics((prev) => ({ ...prev, lastUpdateLabel: "—", lastEditorLabel: "—" }));
      }
    );

    return () => unsubscribe();
  }, []);

  const renderContent = () => {
    if (error) {
      return (
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <div className="text-red-700 font-semibold mb-2">Oups…</div>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-4">

            <OverviewContent metrics={metrics} recent={recentActivity} onGo={setActiveSection} />
          </div>
        );


      case "homepage":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Page d’accueil"
              description="Modifier les blocs visibles sur la page principale"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <HomePageManager />
            </AdminPanel>
          </div>
        );

      case "pages":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Pages du site"
              description="Créer et modifier les pages d’information"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <PagesManager />
            </AdminPanel>
          </div>
        );

      case "members":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Membres"
              description="Gérer les inscriptions et informations des membres"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <MembersManager />
            </AdminPanel>
          </div>
        );

      // Keep advanced sections but make them feel “administration”, not dev.
      case "navigation":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Menu du site"
              description="Modifier le menu principal et les sous-menus"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <NavManager />
            </AdminPanel>
          </div>
        );

      case "footer":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Pied de page"
              description="Coordonnées, liens utiles, partenaires"
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
              title="Cookies"
              description="Texte de consentement et liens de politiques"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <CookieConsentManager />
            </AdminPanel>
          </div>
        );

      case "settings":
        return (
          <div className="mx-auto max-w-6xl">
            <AdminPanel
              title="Paramètres"
              description="Profil et accès équipe"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <SettingsManager />
            </AdminPanel>
          </div>
        );


      default:
        return (
          <div className="mx-auto max-w-4xl">
            <AdminPanel
              title="Section bientôt disponible"
              description="Cette fonctionnalité sera ajoutée prochainement"
              right={<BackButton onClick={() => setActiveSection("overview")} />}
            >
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-12 text-center">
                <div className="text-gray-400 text-4xl mb-4">🧩</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  En préparation
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
      title="AFE • Administration"
      subtitle="Gestion du site et des membres"
      active={activeSection}
      onChange={setActiveSection}
      isLoading={isLoading || authLoading}
      user={{
        name: user?.name || "Utilisateur",
        email: user?.email,
        avatarUrl: user?.avatarUrl,
        role: user?.role, // <- important
      }}
      onLogout={() => signOut(auth)}
    >
      {renderContent()}
    </AdminLayout>

  );
}
