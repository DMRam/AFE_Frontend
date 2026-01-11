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
import { useNavigation } from "../../../../hooks/useNavigation";
import type { NavNode } from "../../../../content/types/navTypes";
import { ChevronDown, ExternalLink, ChevronRight, Loader2 } from "lucide-react";
import { usePreferredReducedMotion } from "../../../../hooks/usePreferredReduceMotion";
import { useClickOutside } from "../../../../hooks/useClickOutside";
import { useFocusTrap } from "../../../../hooks/useFocusTrap";
import { useNavigate } from "react-router-dom";


const CLOSE_DELAY = 320;
const MOBILE_BREAKPOINT = 768; // md

// ---------- types ----------
interface NavContextValue {
    openPath: string[];
    setOpenPath: Dispatch<SetStateAction<string[]>>;
    onNavigate: (href?: string) => void;
    closeAll: () => void;
    isMobile: boolean;
}

// ---------- utils ----------
function isHash(href?: string): boolean {
    return !!href && href.startsWith("#");
}

function isExternal(href?: string): boolean {
    return !!href && (href.startsWith("http://") || href.startsWith("https://"));
}

function scrollToHashWithOffset(href: string, offset = 92): void {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
}

function startsWithPath(openPath: string[], parentPath: string[]): boolean {
    if (parentPath.length > openPath.length) return false;
    for (let i = 0; i < parentPath.length; i++) {
        if (openPath[i] !== parentPath[i]) return false;
    }
    return true;
}

function getActivePathFromUrl(
    items: NavNode[],
    currentPath: string = window.location.pathname
): string[] {
    const findPath = (nodes: NavNode[], path: string[] = []): string[] | null => {
        for (const node of nodes) {
            if (node.enabled === false) continue;

            const nodePath = [...path, node.id];

            // Check if current node matches
            if (node.href === currentPath || node.href === `${currentPath}/`) {
                return nodePath;
            }

            // Check children
            if (node.children) {
                const childPath = findPath(node.children, nodePath);
                if (childPath) return childPath;
            }
        }
        return null;
    };

    return findPath(items) || [];
}

// ---------- components ----------

// Loading Skeleton Component
function NavLoadingSkeleton() {
    return (
        <nav className="hidden md:block bg-red-700">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex items-center justify-center gap-2 py-3">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="h-10 w-24 animate-pulse rounded-md bg-red-600"
                        />
                    ))}
                </div>
            </div>
        </nav>
    );
}

// Accessibility Announcement Component
function LiveRegion({ message }: { message: string }) {
    return (
        <div
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        >
            {message}
        </div>
    );
}

// Main Navigation Component
export function SiteNav() {
    const navigate = useNavigate();
    const { items: rawItems, loading, error } = useNavigation();
    const navId = useId();
    const navRef = useRef<HTMLElement>(null);
    const prefersReducedMotion = usePreferredReducedMotion();

    const [openPath, setOpenPath] = useState<string[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [announcement, setAnnouncement] = useState("");
    const closeTimer = useRef<number | null>(null);

    const items = useMemo(
        () => (rawItems ?? []).filter((x) => x.enabled !== false),
        [rawItems]
    );

    // Check mobile breakpoint
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Auto-close on click outside for mobile
    useClickOutside(navRef, () => {
        if (isMobile && openPath.length > 0) {
            closeAll();
        }
    });

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
        if (isMobile) return; // Don't auto-close on mobile

        clearCloseTimer();
        closeTimer.current = window.setTimeout(closeAll, CLOSE_DELAY);
    }, [clearCloseTimer, closeAll, isMobile]);

    const onNavigate = useCallback((href?: string) => {
        closeAll();

        if (!href) return;

        setTimeout(() => {
            if (isHash(href)) {
                if (!prefersReducedMotion) {
                    scrollToHashWithOffset(href, 92);
                } else {
                    // Instant scroll for reduced motion preference
                    const id = href.replace("#", "");
                    const el = document.getElementById(id);
                    if (el) {
                        el.scrollIntoView();
                        el.focus();
                    }
                }
            } else if (isExternal(href)) {
                window.open(href, "_blank", "noopener,noreferrer");
            } else {
                navigate(href)
            }
        }, 0);
    }, [closeAll, prefersReducedMotion]);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeAll();
            }

            // Close on Tab if focus leaves navigation
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

    // Focus trap for mobile menu
    useFocusTrap(navRef, openPath.length > 0 && isMobile);

    if (loading) {
        return <NavLoadingSkeleton />;
    }

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

    if (!items.length) {
        return null;
    }

    return (
        <>
            <LiveRegion message={announcement} />
            <nav
                ref={navRef}
                className="hidden md:block bg-gradient-to-r from-red-700 to-red-600 shadow-lg"
                aria-label="Main navigation"
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <ul className="flex flex-wrap items-center justify-center gap-1 py-2">
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
            </nav>
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
    const isExternalLink = isExternal(topHref);

    const handleMouseEnter = () => {
        if (hasChildren && !isMobile) {
            clearCloseTimer();
            setOpenPath([item.id]);
        }
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
        if (!hasChildren || isMobile) return;

        const related = e.relatedTarget as HTMLElement;
        const currentTarget = e.currentTarget as HTMLElement;

        // Check if mouse is moving to child menu
        const childMenu = currentTarget.querySelector('[role="menu"]');
        if (childMenu?.contains(related)) {
            // Mouse is moving to child menu, don't close
            return;
        }

        closeSoon();
    };

    const handleClick = (e: React.MouseEvent) => {
        if (hasChildren) {
            e.preventDefault();
            if (isOpen) {
                closeAll();
            } else {
                setOpenPath([item.id]);
            }
            return;
        }

        if (isHash(topHref)) {
            e.preventDefault();
        }
        onNavigate(topHref);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case " ":
            case "Enter":
                e.preventDefault();
                if (hasChildren) {
                    setOpenPath([item.id]);
                } else {
                    onNavigate(topHref);
                }
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

    return (
        <li
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {hasChildren ? (
                <button
                    ref={buttonRef}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    className={`
                        group relative inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 
                        text-sm font-semibold transition-all duration-150
                        ${isOpen
                            ? "bg-white/20 text-white shadow-inner"
                            : "text-white/95 hover:text-white hover:bg-white/10"
                        }
                        ${isOpen ? "before:absolute before:inset-x-0 before:bottom-0 before:h-0.5 before:bg-white/30" : ""}
                    `}
                    aria-haspopup="menu"
                    aria-expanded={isOpen}
                    aria-controls={`${navAriaId}-${item.id}`}
                >
                    <span>{item.label}</span>
                    <ChevronDown
                        className={`
                            h-3.5 w-3.5 transition-transform duration-150
                            ${isOpen ? "rotate-180" : ""}
                        `}
                        aria-hidden="true"
                    />
                </button>
            ) : (
                <a
                    href={topHref || "#"}
                    onClick={handleClick}
                    className={`
                        inline-flex items-center gap-2 rounded-lg px-4 py-2.5
                        text-sm font-semibold text-white/95 transition-all duration-150
                        hover:text-white hover:bg-white/10
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                    `}
                    target={isExternalLink ? "_blank" : undefined}
                    rel={isExternalLink ? "noopener noreferrer" : undefined}
                >
                    {item.label}
                    {isExternalLink && (
                        <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
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

    // Track if mouse entered from bottom
    const [enteredFromBottom, setEnteredFromBottom] = useState(false);
    const enterTimeoutRef = useRef<number | null>(null);

    // Auto-position based on available space
    const [positionClass, setPositionClass] = useState("left-0");
    const [alignmentClass, setAlignmentClass] = useState("");

    useEffect(() => {
        if (!menuRef.current || !triggerRef?.current || isMobile) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const menuWidth = 320;
        const viewportWidth = window.innerWidth;
        const spaceOnRight = viewportWidth - triggerRect.right;

        // Position horizontally
        if (spaceOnRight < menuWidth && triggerRect.left > menuWidth) {
            setPositionClass("right-0");
        } else {
            setPositionClass("left-0");
        }
    }, [isMobile, triggerRef, isVisible]);

    const handleKeyNavigation = useCallback((e: React.KeyboardEvent) => {
        const menuItems = menuRef.current?.querySelectorAll<HTMLElement>('a, button');
        if (!menuItems?.length) return;

        const currentIndex = Array.from(menuItems).findIndex(
            item => item === document.activeElement
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
            case "ArrowRight":
                if (isNested) {
                    e.preventDefault();
                    // Already in nested menu
                }
                break;
            case "ArrowLeft":
                e.preventDefault();
                if (isNested) {
                    setOpenPath(parentPath.slice(0, -1));
                } else {
                    closeAll();
                }
                break;
            case "Escape":
                e.preventDefault();
                closeAll();
                triggerRef?.current?.focus();
                break;
        }
    }, [isNested, parentPath, setOpenPath, closeAll, triggerRef]);

    // Handle mouse enter/leave to fix the hover issue
    const handleMouseEnter = useCallback(() => {
        clearCloseTimer();
        setEnteredFromBottom(false);

        // Clear any existing timeout
        if (enterTimeoutRef.current) {
            clearTimeout(enterTimeoutRef.current);
            enterTimeoutRef.current = null;
        }

        setOpenPath(parentPath);
    }, [clearCloseTimer, setOpenPath, parentPath]);

    const handleMouseLeave = useCallback((e: React.MouseEvent) => {
        if (isMobile) return;

        const related = e.relatedTarget as HTMLElement | null;
        const currentTarget = e.currentTarget as HTMLElement;

        // Check if mouse is moving to a child element within the same menu
        if (related && currentTarget.contains(related)) {
            // Mouse is moving to a child, don't close
            return;
        }

        // Check if mouse is moving to the parent menu (for nested menus)
        if (isNested) {
            const parentMenu = currentTarget.closest('[role="menu"]');
            if (parentMenu && parentMenu.contains(related)) {
                // Mouse is moving to parent menu, don't close
                return;
            }
        }

        // Check if mouse is moving to the trigger element
        if (triggerRef?.current && triggerRef.current.contains(related)) {
            // Mouse is moving back to trigger, don't close
            return;
        }

        // Only close if mouse is truly leaving the menu area
        closeSoon();
    }, [isMobile, isNested, triggerRef, closeSoon]);

    // Detect if mouse entered from bottom
    useEffect(() => {
        if (!menuRef.current || !isVisible) return;

        const menu = menuRef.current;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = menu.getBoundingClientRect();
            // If mouse is near the bottom edge when entering
            if (e.clientY > rect.bottom - 10) {
                setEnteredFromBottom(true);
            }
        };

        if (isVisible) {
            menu.addEventListener('mousemove', handleMouseMove);
        }

        return () => {
            menu.removeEventListener('mousemove', handleMouseMove);
        };
    }, [isVisible]);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (enterTimeoutRef.current) {
                clearTimeout(enterTimeoutRef.current);
            }
        };
    }, []);

    if (!isVisible && !isMobile) {
        return null;
    }

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
                    : "left-full top-0 ml-[2px] min-w-[260px]"  // Reduced gap with ml-[2px]
                }
                ${level === 0 ? "mt-[-2px]" : ""}  /* Remove gap for top-level */
                ${isVisible
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 scale-[0.98] translate-y-1 pointer-events-none"
                }
                ${isMobile ? "fixed inset-x-4 top-20 max-h-[70vh] overflow-y-auto" : ""}
                ${enteredFromBottom ? "enter-from-bottom" : ""}
            `}
            style={{
                animation: isMobile && isVisible
                    ? "slideInUp 0.2s ease-out"
                    : "none",
                // For nested menus, ensure they appear closer to parent item
                ...(isNested && {
                    marginTop: '-4px', // Pulls submenu up closer to parent
                }),
            }}
        >
            {/* Arrow pointer for top-level menu */}
            {level === 0 && !isMobile && (
                <div className={`
                    absolute -top-1 h-2 w-2 rotate-45 bg-white
                    ${positionClass === "right-0" ? "right-4" : "left-4"}
                `} />
            )}

            {/* Hover bridge to eliminate dead zone for top-level */}
            {level === 0 && !isMobile && (
                <div className="absolute -top-2 left-0 right-0 h-2 bg-transparent" />
            )}

            {/* Hover bridge for nested menus - connects to parent menu item */}
            {isNested && !isMobile && (
                <div className="absolute -left-1 top-0 bottom-0 w-1 bg-transparent" />
            )}

            <div className={`
                rounded-lg bg-white shadow-lg ring-1 ring-black/10
                ${isMobile ? "max-h-inherit" : ""}
                ${level === 0 ? "border-t border-red-600" : ""}
                ${isNested ? "shadow-xl" : ""}
            `}>
                <div className="py-1.5">
                    {nodes.map((node) => {
                        const hasChildren = !!node.children?.length;
                        const nodePath = [...parentPath, node.id];
                        const childOpen = openPath[level + 1] === node.id;
                        const isNodeExternal = isExternal(node.href);
                        const Icon = hasChildren ? ChevronRight : ExternalLink;

                        return (
                            <div
                                key={node.id}
                                className="relative group"
                                onMouseEnter={() => {
                                    if (isMobile) return;
                                    clearCloseTimer();

                                    // For nested menus, also clear parent's timer
                                    if (isNested) {
                                        const parentMenu = menuRef.current?.closest('[role="menu"]');
                                        if (parentMenu) {
                                            // Find the parent's clearCloseTimer somehow
                                            // We'll need to pass additional context
                                        }
                                    }

                                    if (hasChildren) {
                                        setOpenPath(nodePath);
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isMobile) return;

                                    const related = e.relatedTarget as HTMLElement;
                                    const currentTarget = e.currentTarget as HTMLElement;

                                    // If mouse is moving to child menu, don't trigger close
                                    if (related && hasChildren) {
                                        const childMenu = currentTarget.querySelector('[role="menu"]');
                                        if (childMenu?.contains(related)) {
                                            return;
                                        }
                                    }
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
                                        ${level === 0 && !isNested ? "first:rounded-t-[5px]" : ""}
                                        ${isNested ? "pl-5" : ""}  /* Add padding for nested items */
                                    `}
                                    onClick={(e) => {
                                        if (hasChildren && !isMobile) {
                                            e.preventDefault();
                                            setOpenPath(nodePath);
                                            return;
                                        }
                                        if (isHash(node.href) || isNodeExternal) {
                                            e.preventDefault();
                                        }
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
                                        <Icon
                                            className="h-3.5 w-3.5 text-gray-400 group-hover:text-red-600 transition-colors"
                                            aria-hidden="true"
                                        />
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

            {/* Mobile backdrop */}
            {isMobile && isVisible && (
                <div
                    className="fixed inset-0 bg-black/20 -z-10"
                    onClick={closeAll}
                    aria-hidden="true"
                />
            )}
        </div>
    );
}