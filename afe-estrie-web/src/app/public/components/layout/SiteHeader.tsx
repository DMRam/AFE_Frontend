import { useEffect, useMemo, useState } from "react";
import logoFooter from "../../../../assets/logo/logo-footer.png";
import { Heart, UserPlus } from "lucide-react";
import { MemberModal } from "../../../../components/modals/MemberModal";
import { useNavigation } from "../../../../hooks/useNavigation";
import type { NavItem, NavNode } from "../../../../content/types/navTypes";
import { useHomePagePublic } from "../../../../hooks/useHomePagePublic";

function isHash(href?: string) {
  return Boolean(href && href.startsWith("#"));
}

/**
 * Smooth scroll with sticky header offset
 */
function scrollToHashWithOffset(href: string, offset = 92) {
  const id = href.replace("#", "");
  const el = document.getElementById(id);
  if (!el) return;

  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

type AnyNav = NavItem | NavNode;

export function SiteHeader() {
  const { items, loading } = useNavigation();
  const { home } = useHomePagePublic();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  // CTA config (with safe fallbacks)
  const donateCta = {
    enabled: home?.headerCtas?.donate?.enabled !== false,
    label: home?.headerCtas?.donate?.label ?? "Faire un don",
    href: home?.headerCtas?.donate?.href ?? "#don",
  };

  const memberCta = {
    enabled: home?.headerCtas?.member?.enabled !== false,
    label: home?.headerCtas?.member?.label ?? "Devenir membre",
    mode: home?.headerCtas?.member?.mode ?? "stripe",
    href: home?.headerCtas?.member?.href ?? "",
  };

  const openMember = () => {
    if (memberCta.mode === "external") {
      if (memberCta.href) window.location.href = memberCta.href;
      return;
    }
    setMemberOpen(true);
  };

  // Stack path for unlimited nesting: [menuId, submenuId, ...]
  const [path, setPath] = useState<string[]>([]);
  const [dir, setDir] = useState<"forward" | "back">("forward"); // (optional) for animations later

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPath([]);
  };

  // lock body scroll when drawer OR member modal is open
  useEffect(() => {
    const shouldLock = drawerOpen || memberOpen;
    if (!shouldLock) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // prevent layout shift when scrollbar disappears
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [drawerOpen, memberOpen]);

  // close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        setPath([]);
        setMemberOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Build an index of ALL nodes by id (top-level + nested)
  const navIndex = useMemo(() => {
    const map = new Map<string, AnyNav>();

    const walk = (nodes?: AnyNav[]) => {
      for (const n of nodes ?? []) {
        if (!n?.id) continue;
        map.set(n.id, n);
        const children = (n as AnyNav).children as AnyNav[] | undefined;
        if (children?.length) walk(children);
      }
    };

    walk(items as AnyNav[]);
    return map;
  }, [items]);

  const activeNode = useMemo<AnyNav | null>(() => {
    if (path.length === 0) return null;
    return navIndex.get(path[path.length - 1]) ?? null;
  }, [path, navIndex]);

  const currentList = useMemo<AnyNav[]>(() => {
    if (!activeNode) return (items as AnyNav[]) ?? [];
    return ((activeNode as AnyNav).children as AnyNav[]) ?? [];
  }, [activeNode, items]);

  const title = useMemo(() => {
    if (!activeNode) return "Menu";
    return (activeNode as AnyNav).label ?? "Menu";
  }, [activeNode]);

  const handleNavigate = (href?: string) => {
    if (!href) return;

    // close drawer first (so the scroll works properly on iOS)
    closeDrawer();

    window.setTimeout(() => {
      if (isHash(href)) scrollToHashWithOffset(href, 92);
      else window.location.href = href;
    }, 50);
  };

  const openChildren = (id: string) => {
    setDir("forward");
    setPath((prev) => [...prev, id]);
  };

  const goBack = () => {
    setDir("back");
    setPath((prev) => prev.slice(0, -1));
  };

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* Left */}
        <a href="#" className="flex items-center gap-3">
          <img src={logoFooter} alt="AFE" className="h-12 sm:h-16 object-contain" />

          <div className="hidden sm:block leading-tight">
            <p className="text-sm uppercase tracking-wide text-gray-500">Association de la</p>
            <p className="text-2xl font-semibold text-red-700">Fibromyalgie</p>
            <p className="text-sm uppercase tracking-wide text-gray-500">de l’Estrie</p>
          </div>
        </a>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          {donateCta.enabled && (
            <a
              href={donateCta.href}
              onClick={(e) => {
                if (donateCta.href?.startsWith("#")) {
                  e.preventDefault();
                  scrollToHashWithOffset(donateCta.href, 92);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-red-600/70 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:border-red-700 hover:bg-red-50 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              {donateCta.label}
            </a>
          )}

          {memberCta.enabled && (
            <button
              type="button"
              onClick={openMember}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {memberCta.label}
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden inline-flex items-center justify-center rounded-xl px-3 py-2 text-3xl font-semibold"
          aria-label="Ouvrir le menu"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          ☰
        </button>
      </div>

      {/* MOBILE DRAWER */}
      {drawerOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <button
            aria-label="Fermer"
            onClick={closeDrawer}
            className="fixed inset-0 z-40 cursor-default bg-black/40"
          />

          {/* Panel */}
          <div className="fixed right-0 top-0 z-50 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-4">
              <div className="text-sm font-semibold text-gray-900">{title}</div>

              <div className="flex items-center gap-2">
                {path.length > 0 ? (
                  <button
                    onClick={goBack}
                    className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
                    aria-label="Retour"
                  >
                    ←
                  </button>
                ) : null}

                <button
                  onClick={closeDrawer}
                  className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
                  aria-label="Fermer le menu"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body (scrollable) */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {/* CTAs only on root level */}
              {path.length === 0 ? (
                <>
                  <div className="flex gap-2">
                    {donateCta.enabled && (
                      <button
                        type="button"
                        onClick={() => handleNavigate(donateCta.href)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-red-600/70 bg-white px-4 py-2 text-center text-sm font-semibold text-red-700 shadow-sm"
                      >
                        <Heart className="h-4 w-4" aria-hidden="true" />
                        {donateCta.label}
                      </button>
                    )}

                    {memberCta.enabled && (
                      <button
                        type="button"
                        onClick={() => {
                          closeDrawer();
                          openMember();
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm"
                      >
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        {memberCta.label}
                      </button>
                    )}
                  </div>

                  <div className="mt-4 border-t pt-4" />
                </>
              ) : null}

              {/* List */}
              <div className="relative overflow-hidden">
                <ul
                  className={[
                    "space-y-2 transition-transform duration-300 ease-out",
                    "translate-x-0",
                    dir === "forward" ? "" : "",
                  ].join(" ")}
                >
                  {loading ? (
                    <li className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-600">
                      Chargement…
                    </li>
                  ) : currentList.length === 0 ? (
                    <li className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-600">
                      Aucun élément.
                    </li>
                  ) : (
                    currentList.map((item) => {
                      const enabled = (item as any).enabled !== false;
                      if (!enabled) return null;

                      const hasChildren = Boolean((item as any).children?.length);

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (hasChildren) return openChildren(item.id);
                              handleNavigate((item as any).href);
                            }}
                            className="w-full flex items-center justify-between rounded-xl px-3 py-3 text-left text-base font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            <span>{item.label}</span>
                            <span className="text-gray-400">{hasChildren ? "›" : "↗"}</span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>

              <div className="h-6" />
            </div>
          </div>
        </div>
      )}

      <MemberModal open={memberOpen} onClose={() => setMemberOpen(false)} />
    </header>
  );
}
