import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, UserPlus } from "lucide-react";

import logoFooter from "../../../../assets/logo/logo.png";
import { MemberModal } from "../../../../components/modals/MemberModal";
import { useNavigation } from "../../../../hooks/useNavigation";
import type { NavItem, NavNode } from "../../../../content/types/navTypes";
import { useHomePagePublic } from "../../../../hooks/useHomePagePublic";
import {
  handleSmartNavigation,
  isExternalNewTabUrl,
} from "../../utils/navigation";

type AnyNav = NavItem | NavNode;

export function SiteHeader() {
  const { items, loading } = useNavigation();
  const { home } = useHomePagePublic();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

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

  const [path, setPath] = useState<string[]>([]);
  const [_dir, setDir] = useState<"forward" | "back">("forward");


  useEffect(() => {
    const resetUiState = () => {
      setMemberOpen(false);
      setDrawerOpen(false);
      setPath([]);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };

    window.addEventListener("pageshow", resetUiState);
    return () => window.removeEventListener("pageshow", resetUiState);
  }, []);

  const closeModal = () => {
    setMemberOpen(false);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPath([]);
  };

  const closeEverything = () => {
    setDrawerOpen(false);
    setPath([]);
    setMemberOpen(false);
  };

  const handleNavigate = (href?: string) => {
    handleSmartNavigation(href, navigate, {
      close: closeDrawer,
      offset: 92,
      delay: 50,
    });
  };

  const openMember = () => {
    if (memberCta.mode === "external") {
      setMemberOpen(false);
      setDrawerOpen(false);
      setPath([]);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      handleSmartNavigation(memberCta.href, navigate, {
        close: closeDrawer,
        offset: 92,
        delay: 0,
      });
      return;
    }

    setMemberOpen(true);
  };

  useEffect(() => {
    const shouldLock = drawerOpen || memberOpen;
    if (!shouldLock) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [drawerOpen, memberOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeEverything();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navIndex = useMemo(() => {
    const map = new Map<string, AnyNav>();

    const walk = (nodes?: AnyNav[]) => {
      for (const node of nodes ?? []) {
        if (!node?.id) continue;

        map.set(node.id, node);

        const children = (node as AnyNav).children as AnyNav[] | undefined;
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
      <div className="border-b bg-white xl:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <button
            type="button"
            onClick={() =>
              handleSmartNavigation("/", navigate, {
                offset: 92,
                delay: 0,
              })
            }
            className="flex items-center gap-3"
            aria-label="Retour à l’accueil"
          >
            <img src={logoFooter} alt="AFE" className="h-16 object-contain" />
          </button>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-3xl font-semibold shadow-sm"
            aria-label="Ouvrir le menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            ☰
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="xl:hidden">
          <button
            type="button"
            aria-label="Fermer"
            onClick={closeDrawer}
            className="fixed inset-0 z-40 cursor-default bg-black/40"
          />

          <div className="fixed right-0 top-0 z-50 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-4">
              <div className="text-sm font-semibold text-gray-900">{title}</div>

              <div className="flex items-center gap-2">
                {path.length > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
                    aria-label="Retour"
                  >
                    ←
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
                  aria-label="Fermer le menu"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {path.length === 0 ? (
                <>
                  <div className="flex gap-2">
                    {donateCta.enabled && (
                      <button
                        type="button"
                        onClick={() => handleNavigate(donateCta.href)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-600/70 bg-white px-4 py-2 text-center text-sm font-semibold text-red-700 shadow-sm"
                      >
                        <Heart className="h-4 w-4" aria-hidden="true" />
                        {donateCta.label}
                      </button>
                    )}

                    {memberCta.enabled && (
                      <button
                        type="button"
                        onClick={() => {
                          if (memberCta.mode === "external") {
                            openMember();
                            return;
                          }

                          closeDrawer();
                          openMember();
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm"
                      >
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        {memberCta.label}
                      </button>
                    )}
                  </div>

                  <div className="mt-4 border-t pt-4" />
                </>
              ) : null}

              <div className="relative overflow-hidden">
                <ul className="space-y-2">
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
                      const enabled = (item as AnyNav & { enabled?: boolean }).enabled !== false;
                      if (!enabled) return null;

                      const hasChildren = Boolean(
                        (item as AnyNav).children?.length
                      );

                      const href = (item as AnyNav).href;
                      const isExternal = isExternalNewTabUrl(href);

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => {
                              if (hasChildren) {
                                openChildren(item.id);
                                return;
                              }

                              handleNavigate(href);
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-base font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            <span>{item.label}</span>
                            <span className="text-gray-400">
                              {hasChildren ? "›" : isExternal ? "↗" : "→"}
                            </span>
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

<MemberModal open={memberOpen} onClose={closeModal} />    </header>
  );
}