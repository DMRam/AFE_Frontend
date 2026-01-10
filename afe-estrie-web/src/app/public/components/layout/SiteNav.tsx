import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react";
import { useNavigation } from "../../../../hooks/useNavigation";
import type { NavNode } from "../../../../content/types/navTypes";

const CLOSE_DELAY = 320;

// ---------- utils ----------
function isHash(href?: string) {
    return !!href && href.startsWith("#");
}

function scrollToHashWithOffset(href: string, offset = 92) {
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
}

function startsWithPath(openPath: string[], parentPath: string[]) {
    if (parentPath.length > openPath.length) return false;
    for (let i = 0; i < parentPath.length; i++) {
        if (openPath[i] !== parentPath[i]) return false;
    }
    return true;
}

// ---------- component ----------
export function SiteNav() {
    const { items: rawItems, loading } = useNavigation();
    const navId = useId();

    const [openPath, setOpenPath] = useState<string[]>([]);
    const closeTimer = useRef<number | null>(null);

    const items = useMemo(
        () => (rawItems ?? []).filter((x) => x.enabled !== false),
        [rawItems]
    );

    const clearCloseTimer = () => {
        if (closeTimer.current) {
            window.clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };

    const closeNow = () => {
        clearCloseTimer();
        setOpenPath([]);
    };

    const closeSoon = () => {
        clearCloseTimer();
        closeTimer.current = window.setTimeout(() => setOpenPath([]), CLOSE_DELAY);
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeNow();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onNavigate = (href?: string) => {
        closeNow();
        if (!href) return;

        window.setTimeout(() => {
            if (isHash(href)) scrollToHashWithOffset(href, 92);
            else window.location.href = href;
        }, 0);
    };

    if (loading) {
        return (
            <nav className="hidden md:block bg-red-700">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="py-3 text-center text-white/70">Loading navigation...</div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="hidden md:block bg-red-700">
            <div className="mx-auto max-w-7xl px-6">
                <ul className="flex flex-wrap items-center justify-center gap-2 py-3">
                    {items.map((item) => (
                        <TopItem
                            key={item.id}
                            item={item}
                            navAriaId={navId}
                            openPath={openPath}
                            setOpenPath={setOpenPath}
                            onNavigate={onNavigate}
                            closeSoon={closeSoon}
                            closeNow={closeNow}
                            clearCloseTimer={clearCloseTimer}
                        />
                    ))}
                </ul>
            </div>
        </nav>
    );
}

function TopItem({
    item,
    navAriaId,
    openPath,
    setOpenPath,
    onNavigate,
    closeSoon,
    closeNow,
    clearCloseTimer,
}: {
    item: NavNode;
    navAriaId: string;
    openPath: string[];
    setOpenPath: Dispatch<SetStateAction<string[]>>;
    onNavigate: (href?: string) => void;
    closeSoon: () => void;
    closeNow: () => void;
    clearCloseTimer: () => void;
}) {
    const hasChildren = !!item.children?.length;
    const isOpen = openPath[0] === item.id;

    const topHref = item.href ?? (hasChildren ? item.children?.[0]?.href : undefined);

    return (
        <li
            className="relative"
            onMouseEnter={
                hasChildren
                    ? () => {
                        clearCloseTimer();
                        setOpenPath([item.id]);
                    }
                    : undefined
            }
            onMouseLeave={hasChildren ? closeSoon : undefined}
        >
            <a
                href={topHref || "#"}
                onClick={(e) => {
                    if (hasChildren) {
                        e.preventDefault();
                        isOpen ? closeNow() : setOpenPath([item.id]);
                        return;
                    }

                    if (isHash(topHref)) e.preventDefault();
                    onNavigate(topHref);
                }}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white/95 hover:text-white hover:bg-white/10"
                aria-haspopup={hasChildren ? "menu" : undefined}
                aria-expanded={hasChildren ? isOpen : undefined}
                aria-controls={hasChildren ? `${navAriaId}-${item.id}` : undefined}
            >
                {item.label}
                {hasChildren ? <span className="text-white/80 text-xs translate-y-[1px]">▾</span> : null}
            </a>

            {hasChildren ? (
                <FlyoutMenu
                    id={`${navAriaId}-${item.id}`}
                    nodes={(item.children ?? []).filter((c) => c.enabled !== false)}
                    level={0}
                    openPath={openPath}
                    setOpenPath={setOpenPath}
                    onNavigate={onNavigate}
                    clearCloseTimer={clearCloseTimer}
                    closeSoon={closeSoon}
                    parentPath={[item.id]}
                />
            ) : null}
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
    parentPath,
}: {
    id?: string;
    nodes: NavNode[];
    level: number;
    openPath: string[];
    setOpenPath: Dispatch<SetStateAction<string[]>>;
    onNavigate: (href?: string) => void;
    clearCloseTimer: () => void;
    closeSoon: () => void;
    parentPath: string[];
}) {
    const isVisible = startsWithPath(openPath, parentPath);

    return (
        <div
            id={id}
            role="menu"
            onMouseEnter={() => {
                clearCloseTimer();
                // if menu is visible already, keep current; otherwise open the branch
                setOpenPath((prev) => (prev.length ? prev : parentPath));
            }}
            onMouseLeave={(e) => {
                const related = e.relatedTarget as HTMLElement | null;
                if (related && e.currentTarget.contains(related)) return;
                closeSoon();
            }}
            className={[
                "absolute overflow-visible origin-top-left transition duration-150",
                level === 0 ? "z-50" : "z-[60]",
                level === 0 ? "left-0 top-full translate-y-2" : "left-full top-[-6px] ml-1",
                isVisible ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-[0.98]",
                // Hover bridge to avoid the "dead zone" between trigger and menu
                level === 0
                    ? "after:content-[''] after:absolute after:left-0 after:right-0 after:top-[-14px] after:h-[14px]"
                    : "",
            ].join(" ")}
        >
            {/* IMPORTANT: no overflow-hidden here, or nested flyouts get clipped */}
            <div className="min-w-[320px] rounded-lg bg-white shadow-xl ring-1 ring-black/10">
                <div className="py-2">
                    {nodes.map((node) => {
                        const hasChildren = !!node.children?.length;
                        const nodePath = [...parentPath, node.id];
                        const childOpen = openPath[level + 1] === node.id;

                        return (
                            <div
                                key={node.id}
                                className="relative"
                                onMouseEnter={() => {
                                    clearCloseTimer();
                                    if (hasChildren) setOpenPath(nodePath);
                                }}
                            >
                                <a
                                    href={node.href || "#"}
                                    className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                                    onClick={(e) => {
                                        if (hasChildren) {
                                            e.preventDefault();
                                            setOpenPath(nodePath);
                                            return;
                                        }
                                        if (isHash(node.href)) e.preventDefault();
                                        onNavigate(node.href);
                                    }}
                                >
                                    <span>{node.label}</span>
                                    <span className="text-gray-400">{hasChildren ? "›" : "↗"}</span>
                                </a>

                                {hasChildren ? (
                                    <FlyoutMenu
                                        nodes={(node.children ?? []).filter((c) => c.enabled !== false)}
                                        level={level + 1}
                                        openPath={openPath}
                                        setOpenPath={setOpenPath}
                                        onNavigate={onNavigate}
                                        clearCloseTimer={clearCloseTimer}
                                        closeSoon={closeSoon}
                                        parentPath={nodePath}
                                    />
                                ) : null}

                                {/* keep nested menu mounted for smoother hover; just hide/show */}
                                {hasChildren && !childOpen ? null : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
