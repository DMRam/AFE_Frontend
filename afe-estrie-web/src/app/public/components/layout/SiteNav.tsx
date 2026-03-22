import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    useCallback,
    type Dispatch,
    type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronDown,
    ExternalLink,
    ChevronRight,
    Loader2,
    Search,
    Heart,
    UserPlus,
} from "lucide-react";

import { useNavigation } from "../../../../hooks/useNavigation";
import type { NavNode } from "../../../../content/types/navTypes";
import { useClickOutside } from "../../../../hooks/useClickOutside";
import { useFocusTrap } from "../../../../hooks/useFocusTrap";
import { useHomePagePublic } from "../../../../hooks/useHomePagePublic";

import logoFooter from "../../../../assets/logo/logo.png";
import { MemberModal } from "../../../../components/modals/MemberModal";
import {
    handleSmartNavigation,
    isExternalNewTabUrl,
} from "../../utils/navigation";

const CLOSE_DELAY = 420;
const MOBILE_BREAKPOINT = 768;

// ---------- utils ----------
function startsWithPath(openPath: string[], parentPath: string[]): boolean {
    if (parentPath.length > openPath.length) return false;
    for (let i = 0; i < parentPath.length; i++) {
        if (openPath[i] !== parentPath[i]) return false;
    }
    return true;
}

// ---------- components ----------
function NavLoadingSkeleton() {
    return (
        <nav className="hidden md:block bg-red-700">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex items-center justify-center gap-2 py-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 w-24 animate-pulse rounded-md bg-red-600" />
                    ))}
                </div>
            </div>
        </nav>
    );
}

function LiveRegion({ message }: { message: string }) {
    return (
        <div aria-live="polite" aria-atomic="true" className="sr-only">
            {message}
        </div>
    );
}

export function SiteNav() {
    const navigate = useNavigate();
    const { items: rawItems, loading, error } = useNavigation();
    const { home } = useHomePagePublic();

    const navId = useId();
    const navRef = useRef<HTMLElement>(null);
    const closeTimer = useRef<number | null>(null);

    const [openPath, setOpenPath] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [announcement, setAnnouncement] = useState("");
    const [memberOpen, setMemberOpen] = useState(false);
    const [_isStuck, setIsStuck] = useState(false);
    const [q, setQ] = useState("");

    useEffect(() => {
        const resetUiState = () => {
            setMemberOpen(false);
            setOpenPath([]);
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        };

        window.addEventListener("pageshow", resetUiState);
        return () => window.removeEventListener("pageshow", resetUiState);
    }, []);

    const closeModal = () => {
        setMemberOpen(false);
    };

    const items = useMemo(
        () => (rawItems ?? []).filter((x) => x.enabled !== false),
        [rawItems]
    );

    const SEARCH_PATH = "/recherche";

    function s(value: unknown) {
        return String(value ?? "").trim();
    }

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const query = s(q);
        if (!query) return;
        navigate(`${SEARCH_PATH}?q=${encodeURIComponent(query)}`);
    };

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

    const clearCloseTimer = useCallback(() => {
        if (closeTimer.current) {
            window.clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);

    const closeAll = useCallback(() => {
        clearCloseTimer();
        setOpenPath([]);
        setAnnouncement("Navigation menu closed");
    }, [clearCloseTimer]);

    const closeSoon = useCallback(() => {
        if (isMobile) return;
        clearCloseTimer();
        closeTimer.current = window.setTimeout(closeAll, CLOSE_DELAY);
    }, [clearCloseTimer, closeAll, isMobile]);

    const onNavigate = useCallback(
        (href?: string) => {
            handleSmartNavigation(href, navigate, {
                close: closeAll,
                offset: 92,
                delay: 50,
            });
        },
        [navigate, closeAll]
    );

    const openMember = () => {
        if (memberCta.mode === "external") {
            handleSmartNavigation(memberCta.href, navigate, {
                offset: 92,
                delay: 0,
            });
            return;
        }

        setMemberOpen(true);
    };

    useEffect(() => {
        const onScroll = () => setIsStuck(window.scrollY > 4);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useClickOutside(navRef, () => {
        if (isMobile && openPath.length > 0) closeAll();
    });

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeAll();

            if (e.key === "Tab" && navRef.current) {
                setTimeout(() => {
                    if (!navRef.current?.contains(document.activeElement)) {
                        closeAll();
                    }
                }, 10);
            }
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [closeAll]);

    useFocusTrap(navRef, openPath.length > 0 && isMobile);

    if (loading) return <NavLoadingSkeleton />;

    if (error) {
        return (
            <nav className="hidden md:block bg-red-700">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="py-3 text-center text-white/95">
                        <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Navigation failed to load
                        </span>
                    </div>
                </div>
            </nav>
        );
    }

    if (!items.length) return null;

    return (
        <>
            <LiveRegion message={announcement} />

            <nav
                ref={navRef}
                className="hidden xl:block sticky top-0 z-50 bg-transparent shadow-lg backdrop-blur-sm"
                aria-label="Main navigation"
            >
                <div
                    className="w-full grid"
                    style={{
                        gridTemplateColumns: "clamp(140px, 16vw, 280px) 1fr",
                        gridTemplateRows: "auto auto",
                    }}
                >
                    <a
                        href="/"
                        className="row-span-2 h-full"
                        onClick={(e) => {
                            e.preventDefault();
                            handleSmartNavigation("/", navigate, {
                                close: closeAll,
                                offset: 92,
                                delay: 0,
                            });
                        }}
                    >
                        <div className="flex h-full items-center justify-center border-r border-gray-100 bg-white px-3 lg:px-4">
                            <img
                                src={logoFooter}
                                alt="Association de la Fibromyalgie de l’Estrie"
                                className="h-20 w-full object-contain lg:h-33"
                            />
                        </div>
                    </a>

                    <div className="border-b border-gray-100 bg-white">
                        <div className="px-3 lg:px-6">
                            <div className="flex items-center justify-between gap-4 py-4">
                                <div className="min-w-0 flex items-center gap-4 text-sm font-semibold text-gray-700">
                                    <a
                                        href="tel:+18195661067"
                                        className="inline-flex items-center gap-2 transition hover:text-[#b33a22]"
                                    >
                                        <span className="whitespace-nowrap">📞 +1 (819) 566-1067</span>
                                    </a>

                                    <span className="hidden text-gray-300 lg:inline">|</span>

                                    <a
                                        href="mailto:info@fibromyalgie.ca"
                                        className="hidden truncate transition hover:text-[#b33a22] lg:inline"
                                    >
                                        info@fibromyalgie.ca
                                    </a>
                                </div>

                                <div className="hidden max-w-[520px] flex-1 lg:block">
                                    <form onSubmit={onSearchSubmit} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <input
                                                value={q}
                                                onChange={(e) => setQ(e.target.value)}
                                                placeholder="Trouver une page, un sujet, une ressource…"
                                                className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#af2511]/50 focus:ring-4 focus:ring-[#af2511]/10"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            className="rounded-2xl bg-[#af2511] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                                        >
                                            OK
                                        </button>
                                    </form>
                                </div>

                                <div className="shrink-0 flex items-center gap-2 whitespace-nowrap">
                                    {donateCta.enabled && (
                                        <a
                                            href={donateCta.href}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleSmartNavigation(donateCta.href, navigate, {
                                                    offset: 92,
                                                    delay: 0,
                                                });
                                            }}
                                            className="inline-flex items-center gap-2 rounded-full bg-[#b33a22] px-3 py-2 text-sm font-extrabold text-white shadow-sm transition hover:opacity-95"
                                        >
                                            <Heart className="h-4 w-4" />
                                            <span className="hidden xl:inline">{donateCta.label}</span>
                                        </a>
                                    )}

                                    {memberCta.enabled && (
                                        <button
                                            type="button"
                                            onClick={openMember}
                                            className="inline-flex items-center gap-2 rounded-full bg-[#8f2c19] px-3 py-2 text-sm font-extrabold text-white shadow-sm transition hover:opacity-95"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                            <span className="hidden xl:inline">{memberCta.label}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#b33a22]">
                        <div className="min-w-0 px-2 lg:px-4 flex items-center">
                            <ul className="flex w-full flex-nowrap items-center justify-center gap-1 whitespace-nowrap py-2">
                                {items.map((item) => (
                                    <TopItem
                                        key={item.id}
                                        item={item}
                                        navAriaId={navId}
                                        openPath={openPath}
                                        setOpenPath={setOpenPath}
                                        onNavigate={onNavigate}
                                        closeSoon={closeSoon}
                                        closeAll={closeAll}
                                        clearCloseTimer={clearCloseTimer}
                                        isMobile={isMobile}
                                    />
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            <MemberModal open={memberOpen} onClose={closeModal} />
        </>
    );
}

function TopItem({
    item,
    navAriaId,
    openPath,
    setOpenPath,
    onNavigate,
    closeSoon,
    closeAll,
    clearCloseTimer,
    isMobile,
}: {
    item: NavNode;
    navAriaId: string;
    openPath: string[];
    setOpenPath: Dispatch<SetStateAction<string[]>>;
    onNavigate: (href?: string) => void;
    closeSoon: () => void;
    closeAll: () => void;
    clearCloseTimer: () => void;
    isMobile: boolean;
}) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const hasChildren = !!item.children?.length;
    const isOpen = openPath[0] === item.id;
    const topHref = item.href ?? (hasChildren ? item.children?.[0]?.href : undefined);
    const isExternalLink = isExternalNewTabUrl(topHref);

    const handleMouseEnter = () => {
        if (hasChildren && !isMobile) {
            clearCloseTimer();
            setOpenPath([item.id]);
        }
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
        if (!hasChildren || isMobile) return;

        const related = e.relatedTarget as HTMLElement | null;
        const currentTarget = e.currentTarget as HTMLElement;
        const childMenu = currentTarget.querySelector('[role="menu"]');

        if (childMenu?.contains(related)) return;

        closeSoon();
    };

    const handleClick = (e: React.MouseEvent) => {
        if (hasChildren) {
            e.preventDefault();
            if (isOpen) closeAll();
            else setOpenPath([item.id]);
            return;
        }

        e.preventDefault();
        onNavigate(topHref);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case " ":
            case "Enter":
                e.preventDefault();
                if (hasChildren) setOpenPath([item.id]);
                else onNavigate(topHref);
                break;

            case "ArrowDown":
                if (hasChildren && !isOpen) {
                    e.preventDefault();
                    setOpenPath([item.id]);
                }
                break;

            case "Escape":
                closeAll();
                break;
        }
    };

    const tabBase =
        "group relative inline-flex items-center gap-1.5 rounded-md " +
        "px-2 py-2 text-[15.5px] lg:text-[16px] font-extrabold leading-none " +
        "transition-all duration-150 " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

    return (
        <li className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            {hasChildren ? (
                <button
                    ref={buttonRef}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    className={[
                        tabBase,
                        isOpen
                            ? "bg-white/20 text-white shadow-inner"
                            : "text-white/95 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-controls={`${navAriaId}-${item.id}`}
                >
                    <span>{item.label}</span>
                    <ChevronDown
                        className={[
                            "h-4 w-4 transition-transform duration-150",
                            isOpen ? "rotate-180" : "",
                        ].join(" ")}
                        aria-hidden="true"
                    />
                </button>
            ) : (
                <a
                    href={topHref || "#"}
                    onClick={handleClick}
                    className={[
                        tabBase,
                        "text-white/95 hover:bg-white/10 hover:text-white",
                    ].join(" ")}
                    target={isExternalLink ? "_blank" : undefined}
                    rel={isExternalLink ? "noopener noreferrer" : undefined}
                >
                    {item.label}
                    {isExternalLink && (
                        <ExternalLink className="h-4 w-4 opacity-70" aria-hidden="true" />
                    )}
                </a>
            )}

            {hasChildren && (
                <FlyoutMenu
                    id={`${navAriaId}-${item.id}`}
                    nodes={(item.children ?? []).filter((c) => c.enabled !== false)}
                    level={0}
                    openPath={openPath}
                    setOpenPath={setOpenPath}
                    onNavigate={onNavigate}
                    clearCloseTimer={clearCloseTimer}
                    closeSoon={closeSoon}
                    closeAll={closeAll}
                    parentPath={[item.id]}
                    isMobile={isMobile}
                    triggerRef={buttonRef}
                />
            )}
        </li>
    );
}

function FlyoutMenu({
    id,
    nodes,
    level,
    openPath,
    setOpenPath,
    onNavigate,
    clearCloseTimer,
    closeSoon,
    closeAll,
    parentPath,
    isMobile,
    triggerRef,
}: {
    id?: string;
    nodes: NavNode[];
    level: number;
    openPath: string[];
    setOpenPath: Dispatch<SetStateAction<string[]>>;
    onNavigate: (href?: string) => void;
    clearCloseTimer: () => void;
    closeSoon: () => void;
    closeAll: () => void;
    parentPath: string[];
    isMobile: boolean;
    triggerRef?: React.RefObject<HTMLElement | null>;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const isVisible = startsWithPath(openPath, parentPath);
    const isNested = level > 0;

    const [enteredFromBottom, setEnteredFromBottom] = useState(false);
    const enterTimeoutRef = useRef<number | null>(null);
    const [positionClass, setPositionClass] = useState("left-0");

    useEffect(() => {
        if (!menuRef.current || !triggerRef?.current || isMobile) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const menuWidth = 320;
        const viewportWidth = window.innerWidth;
        const spaceOnRight = viewportWidth - triggerRect.right;

        if (spaceOnRight < menuWidth && triggerRect.left > menuWidth) {
            setPositionClass("right-0");
        } else {
            setPositionClass("left-0");
        }
    }, [isMobile, triggerRef, isVisible]);

    const handleKeyNavigation = useCallback(
        (e: React.KeyboardEvent) => {
            const menuItems = menuRef.current?.querySelectorAll<HTMLElement>("a, button");
            if (!menuItems?.length) return;

            const currentIndex = Array.from(menuItems).findIndex(
                (item) => item === document.activeElement
            );

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    if (currentIndex < menuItems.length - 1) {
                        menuItems[currentIndex + 1]?.focus();
                    }
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    if (currentIndex > 0) {
                        menuItems[currentIndex - 1]?.focus();
                    } else {
                        triggerRef?.current?.focus();
                    }
                    break;

                case "ArrowLeft":
                    e.preventDefault();
                    if (isNested) setOpenPath(parentPath.slice(0, -1));
                    else closeAll();
                    break;

                case "Escape":
                    e.preventDefault();
                    closeAll();
                    triggerRef?.current?.focus();
                    break;
            }
        },
        [isNested, parentPath, setOpenPath, closeAll, triggerRef]
    );

    const handleMouseEnter = useCallback(() => {
        clearCloseTimer();
        setEnteredFromBottom(false);

        if (enterTimeoutRef.current) {
            clearTimeout(enterTimeoutRef.current);
            enterTimeoutRef.current = null;
        }

        setOpenPath(parentPath);
    }, [clearCloseTimer, setOpenPath, parentPath]);

    const handleMouseLeave = useCallback(
        (e: React.MouseEvent) => {
            if (isMobile) return;

            const related = e.relatedTarget as HTMLElement | null;
            const currentTarget = e.currentTarget as HTMLElement;

            if (related && currentTarget.contains(related)) return;

            if (isNested) {
                const parentMenu = currentTarget.closest('[role="menu"]');
                if (parentMenu && parentMenu.contains(related)) return;
            }

            if (triggerRef?.current && triggerRef.current.contains(related)) return;

            closeSoon();
        },
        [isMobile, isNested, triggerRef, closeSoon]
    );

    useEffect(() => {
        if (!menuRef.current || !isVisible) return;

        const menu = menuRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = menu.getBoundingClientRect();
            if (e.clientY > rect.bottom - 10) setEnteredFromBottom(true);
        };

        menu.addEventListener("mousemove", handleMouseMove);
        return () => menu.removeEventListener("mousemove", handleMouseMove);
    }, [isVisible]);

    useEffect(() => {
        return () => {
            if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
        };
    }, []);

    if (!isVisible && !isMobile) return null;

    return (
        <div
            ref={menuRef}
            id={id}
            role="menu"
            tabIndex={-1}
            onKeyDown={handleKeyNavigation}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`
                absolute origin-top transition-all duration-150 ease-out
                ${level === 0 ? "z-50" : "z-[60]"}
                ${level === 0
                    ? `top-full ${positionClass} min-w-[280px] max-w-[380px]`
                    : "left-full top-0 ml-[2px] min-w-[260px]"
                }
                ${level === 0 ? "mt-[-2px]" : ""}
                ${isVisible
                    ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none translate-y-1 scale-[0.98] opacity-0"
                }
                ${isMobile ? "fixed inset-x-4 top-20 max-h-[70vh] overflow-y-auto" : ""}
                ${enteredFromBottom ? "enter-from-bottom" : ""}
            `}
            style={{
                animation: isMobile && isVisible ? "slideInUp 0.2s ease-out" : "none",
                ...(isNested && { marginTop: "-4px" }),
            }}
        >
            {level === 0 && !isMobile && (
                <div
                    className={`
                        absolute -top-1 h-2 w-2 rotate-45 bg-white
                        ${positionClass === "right-0" ? "right-4" : "left-4"}
                    `}
                />
            )}

            {level === 0 && !isMobile && (
                <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
            )}

            {isNested && !isMobile && (
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-transparent" />
            )}

            <div
                className={`
                    rounded-lg bg-white shadow-lg ring-1 ring-black/10
                    ${level === 0 ? "border-t border-red-600" : ""}
                    ${isNested ? "shadow-xl" : ""}
                `}
            >
                <div className="py-1.5">
                    {nodes.map((node) => {
                        const hasChildren = !!node.children?.length;
                        const nodePath = [...parentPath, node.id];
                        const isNodeExternal = isExternalNewTabUrl(node.href);
                        const Icon = hasChildren ? ChevronRight : ExternalLink;

                        return (
                            <div
                                key={node.id}
                                className="relative group"
                                onMouseEnter={() => {
                                    if (isMobile) return;
                                    clearCloseTimer();
                                    if (hasChildren) setOpenPath(nodePath);
                                }}
                            >
                                <a
                                    href={node.href || "#"}
                                    className={`
                                        flex items-center justify-between px-4 py-2.5
                                        text-sm font-medium text-gray-900 transition-colors duration-150
                                        hover:bg-red-50
                                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50
                                        ${hasChildren ? "pr-3" : ""}
                                        ${isNested ? "pl-5" : ""}
                                    `}
                                    onClick={(e) => {
                                        if (hasChildren && !isMobile) {
                                            e.preventDefault();
                                            setOpenPath(nodePath);
                                            return;
                                        }

                                        e.preventDefault();
                                        onNavigate(node.href);
                                    }}
                                    target={isNodeExternal ? "_blank" : undefined}
                                    rel={isNodeExternal ? "noopener noreferrer" : undefined}
                                    role="menuitem"
                                >
                                    <div className="flex items-center gap-3">
                                        {node.icon && (
                                            <span className="text-red-600" aria-hidden="true">
                                                {node.icon}
                                            </span>
                                        )}
                                        <span className="flex-1">{node.label}</span>
                                    </div>

                                    {(hasChildren || isNodeExternal) && (
                                        <Icon className="h-3.5 w-3.5 text-gray-400 transition-colors group-hover:text-red-600" />
                                    )}
                                </a>

                                {hasChildren && (
                                    <FlyoutMenu
                                        nodes={(node.children ?? []).filter((c) => c.enabled !== false)}
                                        level={level + 1}
                                        openPath={openPath}
                                        setOpenPath={setOpenPath}
                                        onNavigate={onNavigate}
                                        clearCloseTimer={clearCloseTimer}
                                        closeSoon={closeSoon}
                                        closeAll={closeAll}
                                        parentPath={nodePath}
                                        isMobile={isMobile}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {isMobile && isVisible && (
                <div
                    className="fixed inset-0 -z-10 bg-black/20"
                    onClick={closeAll}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}