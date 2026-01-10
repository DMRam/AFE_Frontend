import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getNavigation, saveNavigation } from "../../../services/navigationRepo";
import type { NavItem, NavNode } from "../../../content/types/navTypes";

/** ---------------------------------------------
 * UX types
 * --------------------------------------------- */
type ToastType = "success" | "error" | "info";
type ToastMessage = { id: string; message: string; type: ToastType };

type OpenPath = {
    menuId: string | null;     // level 1 open
    submenuId: string | null;  // level 2 open
    pageId: string | null;     // level 3 (optional)
};

const TOAST_TIMEOUT = 1800;

/** ---------------------------------------------
 * Helpers
 * --------------------------------------------- */
function slugifyId(label: string) {
    return label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "")
        .slice(0, 40);
}

function makeUid(prefix = "id") {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function deepEqual(a: any, b: any) {
    return JSON.stringify(a) === JSON.stringify(b);
}

function move<T>(arr: T[], from: number, to: number) {
    if (from === to) return arr;
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
}

function collectIds(items: NavItem[]) {
    const used = new Set<string>();

    const walkNodes = (nodes?: NavNode[]) => {
        for (const n of nodes ?? []) {
            if (n?.id) used.add(n.id);
            walkNodes(n.children);
        }
    };

    for (const it of items ?? []) {
        if (it?.id) used.add(it.id);
        walkNodes(it.children);
    }
    return used;
}

function uniqueId(base: string, used: Set<string>) {
    let id = base || makeUid("id");
    let n = 2;
    while (used.has(id)) {
        id = base ? `${base}-${n++}` : makeUid("id");
    }
    used.add(id);
    return id;
}

/** ---------------------------------------------
 * Normalize (recursive)
 * Always sorts by order and rewrites order sequentially
 * --------------------------------------------- */
function normalizeNodes(nodes: NavNode[] = []): NavNode[] {
    return [...nodes]
        .filter(Boolean)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map((n, idx) => ({
            ...n,
            enabled: n.enabled !== false,
            order: idx + 1,
            children: normalizeNodes(n.children ?? []),
        }));
}

function normalizeNav(items: NavItem[] = []): NavItem[] {
    return [...items]
        .filter(Boolean)
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map((m, idx) => ({
            ...m,
            enabled: m.enabled !== false,
            order: idx + 1,
            children: normalizeNodes(m.children ?? []),
        }));
}

function contains(q: string, value?: string) {
    if (!q) return true;
    return (value ?? "").toLowerCase().includes(q.toLowerCase());
}

/** ---------------------------------------------
 * Small UI bits (same style)
 * --------------------------------------------- */
function Badge({
    tone,
    children,
    className = "",
}: {
    tone: "ok" | "warn" | "muted" | "error";
    children: React.ReactNode;
    className?: string;
}) {
    const toneClasses = {
        ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warn: "bg-amber-50 text-amber-800 border-amber-200",
        error: "bg-red-50 text-red-700 border-red-200",
        muted: "bg-gray-50 text-gray-600 border-gray-200",
    };
    return (
        <span
            className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
        >
            {children}
        </span>
    );
}

function IconButton({
    title,
    disabled,
    onClick,
    children,
    variant = "ghost",
    className = "",
}: {
    title: string;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
    variant?: "default" | "danger" | "ghost";
    className?: string;
}) {
    const variantClasses = {
        default: "border bg-white hover:bg-gray-50",
        danger: "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
        ghost: "border-transparent bg-transparent hover:bg-gray-100",
    };
    return (
        <button
            type="button"
            title={title}
            aria-label={title}
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

function Loader({ size = "sm", text }: { size?: "sm" | "md"; text?: string }) {
    const sizeClasses = { sm: "h-4 w-4", md: "h-6 w-6" };
    return (
        <div className="flex items-center gap-2">
            <div
                className={`animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 ${sizeClasses[size]}`}
            />
            {text ? <span className="text-sm text-gray-600">{text}</span> : null}
        </div>
    );
}

function Toast({
    message,
    type,
    onClose,
}: {
    message: string;
    type: ToastType;
    onClose: () => void;
}) {
    const bg = {
        success: "bg-green-50 border-green-200",
        error: "bg-red-50 border-red-200",
        info: "bg-blue-50 border-blue-200",
    }[type];

    return (
        <div className={`rounded-md border p-3 text-sm ${bg}`}>
            <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{message}</span>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

function EmptyState({
    icon = "📋",
    title,
    description,
    action,
}: {
    icon?: string;
    title: string;
    description?: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-white p-8 text-center">
            <div className="text-4xl mb-3">{icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            {description ? <p className="text-sm text-gray-600 mb-4">{description}</p> : null}
            {action}
        </div>
    );
}

/** ---------------------------------------------
 * NavManager (Fully fixed: menu -> submenu -> sub-submenu)
 * --------------------------------------------- */
export function NavManager() {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [items, setItems] = useState<NavItem[]>([]);
    const [original, setOriginal] = useState<NavItem[]>([]);

    // UX
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState<OpenPath>({ menuId: null, submenuId: null, pageId: null });

    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const toastTimers = useRef<Map<string, number>>(new Map());

    const dirty = useMemo(() => !deepEqual(items, original), [items, original]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = makeUid("toast");
        setToasts((prev) => [...prev, { id, message, type }]);

        const t = window.setTimeout(() => {
            setToasts((prev) => prev.filter((x) => x.id !== id));
            toastTimers.current.delete(id);
        }, TOAST_TIMEOUT);

        toastTimers.current.set(id, t);
    }, []);

    const removeToast = useCallback((id: string) => {
        const t = toastTimers.current.get(id);
        if (t) window.clearTimeout(t);
        toastTimers.current.delete(id);
        setToasts((prev) => prev.filter((x) => x.id !== id));
    }, []);

    const reload = useCallback(
        async (opts?: { force?: boolean }) => {
            if (!opts?.force && dirty) {
                const ok = window.confirm("You have unsaved changes. Refresh will discard them. Continue?");
                if (!ok) return;
            }
            setRefreshing(true);
            try {
                const data = await getNavigation();
                const normalized = normalizeNav(data ?? []);
                setItems(normalized);
                setOriginal(structuredClone(normalized));
                setOpen({ menuId: null, submenuId: null, pageId: null });
                showToast("Navigation reloaded", "success");
            } catch (e: any) {
                console.error(e);
                showToast(`Reload failed: ${e?.message ?? "unknown error"}`, "error");
            } finally {
                setRefreshing(false);
            }
        },
        [dirty, showToast]
    );

    useEffect(() => {

        console.log("NavManager: loading navigation...");
        (async () => {
            setLoading(true);
            await reload({ force: true });
            setLoading(false);
        })();

        return () => {
            toastTimers.current.forEach((t) => window.clearTimeout(t));
            toastTimers.current.clear();
        };
    }, []);

    /** ---------------------------------------------
     * Open/close helpers (ALWAYS resets deeper levels)
     * --------------------------------------------- */
    const toggleMenu = useCallback((menuId: string) => {
        setOpen((prev) => {
            const isSame = prev.menuId === menuId;
            return isSame
                ? { menuId: null, submenuId: null, pageId: null }
                : { menuId, submenuId: null, pageId: null };
        });
    }, []);

    const toggleSubmenu = useCallback((menuId: string, submenuId: string) => {
        setOpen((prev) => {
            const isSame = prev.menuId === menuId && prev.submenuId === submenuId;
            return isSame
                ? { menuId, submenuId: null, pageId: null }
                : { menuId, submenuId, pageId: null };
        });
    }, []);

    /** ---------------------------------------------
     * Menu mutations (level 1)
     * IMPORTANT: every button is type="button" already (prevents parent form submit reload)
     * --------------------------------------------- */
    const onAddMenu = useCallback(() => {
        const createdIdRef = { current: "" };

        setItems((prev) => {
            const used = collectIds(prev);
            const label = "Nouveau menu";
            const id = uniqueId(slugifyId(label) || "menu", used);
            createdIdRef.current = id;

            return normalizeNav([
                ...prev,
                { id, label, href: `#${id}`, enabled: true, order: (prev.length ?? 0) + 1, children: [] },
            ]);
        });

        queueMicrotask(() => {
            setQuery(""); // avoid “it added but hidden by filter”
            setOpen({ menuId: createdIdRef.current, submenuId: null, pageId: null });
        });

        showToast("Menu added", "success");
    }, [showToast]);

    const onUpdateMenu = useCallback((menuId: string, patch: Partial<NavItem>) => {
        setItems((prev) => prev.map((m) => (m.id === menuId ? { ...m, ...patch } : m)));
    }, []);

    const onToggleMenuEnabled = useCallback((menuId: string, enabled: boolean) => {
        setItems((prev) => prev.map((m) => (m.id === menuId ? { ...m, enabled } : m)));
    }, []);

    const onMoveMenu = useCallback((menuId: string, dir: -1 | 1) => {
        setItems((prev) => {
            const idx = prev.findIndex((m) => m.id === menuId);
            if (idx < 0) return prev;
            const nextIdx = idx + dir;
            if (nextIdx < 0 || nextIdx >= prev.length) return prev;
            return normalizeNav(move(prev, idx, nextIdx));
        });
    }, []);

    const onDeleteMenu = useCallback(
        async (menuId: string) => {
            if (!window.confirm("Delete this menu and all its submenus?")) return;
            setDeletingId(menuId);
            try {
                setItems((prev) => normalizeNav(prev.filter((m) => m.id !== menuId)));
                setOpen((prev) => (prev.menuId === menuId ? { menuId: null, submenuId: null, pageId: null } : prev));
                showToast("Menu deleted", "success");
            } finally {
                setDeletingId(null);
            }
        },
        [showToast]
    );

    /** ---------------------------------------------
     * Submenu mutations (level 2)
     * --------------------------------------------- */
    const onAddSubmenu = useCallback(
        (menuId: string) => {
            const createdIdRef = { current: "" };

            setItems((prev) => {
                const used = collectIds(prev);
                const label = "Nouveau sous-menu";
                const id = uniqueId(slugifyId(label) || "sous-menu", used);
                createdIdRef.current = id;

                const next = prev.map((m) => {
                    if (m.id !== menuId) return m;
                    const child: NavNode = {
                        id,
                        label,
                        href: `#${id}`,
                        enabled: true,
                        order: (m.children?.length ?? 0) + 1,
                        children: [],
                    };
                    return { ...m, children: normalizeNodes([...(m.children ?? []), child]) };
                });

                return normalizeNav(next);
            });

            queueMicrotask(() => {
                setQuery("");
                setOpen({ menuId, submenuId: createdIdRef.current, pageId: null });
            });
            console.log("Adding submenu...")

            showToast("Submenu added", "success");
        },
        [showToast]
    );

    const onUpdateSubmenu = useCallback((menuId: string, submenuId: string, patch: Partial<NavNode>) => {
        setItems((prev) =>
            prev.map((m) => {
                if (m.id !== menuId) return m;
                const children = (m.children ?? []).map((c) => (c.id === submenuId ? { ...c, ...patch } : c));
                return { ...m, children: normalizeNodes(children) };
            })
        );
    }, []);

    const onMoveSubmenu = useCallback((menuId: string, submenuId: string, dir: -1 | 1) => {
        setItems((prev) =>
            prev.map((m) => {
                if (m.id !== menuId) return m;
                const arr = m.children ?? [];
                const idx = arr.findIndex((c) => c.id === submenuId);
                if (idx < 0) return m;
                const nextIdx = idx + dir;
                if (nextIdx < 0 || nextIdx >= arr.length) return m;
                return { ...m, children: normalizeNodes(move(arr, idx, nextIdx)) };
            })
        );
    }, []);

    const onDeleteSubmenu = useCallback(
        async (menuId: string, submenuId: string) => {
            if (!window.confirm("Delete this submenu and all its children?")) return;
            setDeletingId(submenuId);
            try {
                setItems((prev) =>
                    prev.map((m) => {
                        if (m.id !== menuId) return m;
                        const children = (m.children ?? []).filter((c) => c.id !== submenuId);
                        return { ...m, children: normalizeNodes(children) };
                    })
                );
                setOpen((prev) =>
                    prev.submenuId === submenuId ? { menuId, submenuId: null, pageId: null } : prev
                );
                showToast("Submenu deleted", "success");
            } finally {
                setDeletingId(null);
            }
        },
        [showToast]
    );

    /** ---------------------------------------------
     * Sub-submenu mutations (level 3)
     * --------------------------------------------- */
    const onAddSubSub = useCallback(
        (menuId: string, submenuId: string) => {
            const createdIdRef = { current: "" };

            setItems((prev) => {
                const used = collectIds(prev);
                const label = "Nouvelle page";
                const id = uniqueId(slugifyId(label) || "page", used);
                createdIdRef.current = id;

                const next = prev.map((m) => {
                    if (m.id !== menuId) return m;

                    const children = (m.children ?? []).map((sub) => {
                        if (sub.id !== submenuId) return sub;
                        const node: NavNode = {
                            id,
                            label,
                            href: `#${id}`,
                            enabled: true,
                            order: (sub.children?.length ?? 0) + 1,
                        };
                        return { ...sub, children: normalizeNodes([...(sub.children ?? []), node]) };
                    });

                    return { ...m, children: normalizeNodes(children) };
                });

                return normalizeNav(next);
            });

            queueMicrotask(() => {
                setQuery("");
                setOpen({ menuId, submenuId, pageId: createdIdRef.current });
            });

            showToast("Sub-submenu added", "success");

            console.log("Sub-submenu added", menuId, submenuId);
        },
        [showToast]
    );

    const onUpdateSubSub = useCallback((menuId: string, submenuId: string, subId: string, patch: Partial<NavNode>) => {
        setItems((prev) =>
            prev.map((m) => {
                if (m.id !== menuId) return m;
                const children = (m.children ?? []).map((sub) => {
                    if (sub.id !== submenuId) return sub;
                    const subs = (sub.children ?? []).map((x) => (x.id === subId ? { ...x, ...patch } : x));
                    return { ...sub, children: normalizeNodes(subs) };
                });
                return { ...m, children: normalizeNodes(children) };
            })
        );
    }, []);

    const onMoveSubSub = useCallback((menuId: string, submenuId: string, subId: string, dir: -1 | 1) => {
        setItems((prev) =>
            prev.map((m) => {
                if (m.id !== menuId) return m;
                const children = (m.children ?? []).map((sub) => {
                    if (sub.id !== submenuId) return sub;
                    const arr = sub.children ?? [];
                    const idx = arr.findIndex((x) => x.id === subId);
                    if (idx < 0) return sub;
                    const nextIdx = idx + dir;
                    if (nextIdx < 0 || nextIdx >= arr.length) return sub;
                    return { ...sub, children: normalizeNodes(move(arr, idx, nextIdx)) };
                });
                return { ...m, children: normalizeNodes(children) };
            })
        );
    }, []);

    const onDeleteSubSub = useCallback(
        async (menuId: string, submenuId: string, subId: string) => {
            if (!window.confirm("Delete this sub-submenu?")) return;
            setDeletingId(subId);
            try {
                setItems((prev) =>
                    prev.map((m) => {
                        if (m.id !== menuId) return m;
                        const children = (m.children ?? []).map((sub) => {
                            if (sub.id !== submenuId) return sub;
                            const arr = (sub.children ?? []).filter((x) => x.id !== subId);
                            return { ...sub, children: normalizeNodes(arr) };
                        });
                        return { ...m, children: normalizeNodes(children) };
                    })
                );
                setOpen((prev) => (prev.pageId === subId ? { menuId, submenuId, pageId: null } : prev));
                showToast("Sub-submenu deleted", "success");
            } finally {
                setDeletingId(null);
            }
        },
        [showToast]
    );

    /** ---------------------------------------------
     * Save / Reset
     * --------------------------------------------- */
    const onReset = useCallback(() => {
        if (!window.confirm("Reset all changes since last save?")) return;
        setItems(structuredClone(original));
        setOpen({ menuId: null, submenuId: null, pageId: null });
        showToast("Changes reset", "info");
    }, [original, showToast]);

    const onSave = useCallback(async () => {
        setSaving(true);
        try {
            const normalized = normalizeNav(items);

            console.log("Saving navigation...", normalized);
            await saveNavigation(normalized);
            // setItems(normalized);
            // setOriginal(structuredClone(normalized));
            // showToast("Saved successfully", "success");
        } catch (e: any) {
            console.error(e);
            showToast(`Save failed: ${e?.message ?? "unknown error"}`, "error");
        } finally {
            setSaving(false);
        }
    }, [items, showToast]);

    /** ---------------------------------------------
     * Filtering (display-only)
     * --------------------------------------------- */
    const filteredItems = useMemo(() => {
        const q = query.trim();
        if (!q) return items;

        return items
            .map((menu) => {
                const menuMatches = contains(q, menu.label) || contains(q, menu.href) || contains(q, menu.id);

                const children = (menu.children ?? [])
                    .map((sub) => {
                        const subMatches = contains(q, sub.label) || contains(q, sub.href) || contains(q, sub.id);

                        const subs = (sub.children ?? []).filter(
                            (x) => contains(q, x.label) || contains(q, x.href) || contains(q, x.id)
                        );

                        if (!subMatches && subs.length === 0) return null;
                        return { ...sub, children: subs };
                    })
                    .filter(Boolean) as NavNode[];

                if (!menuMatches && children.length === 0) return null;
                return { ...menu, children };
            })
            .filter(Boolean) as NavItem[];
    }, [items, query]);

    /** ---------------------------------------------
     * Shortcuts
     * --------------------------------------------- */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;
            const k = e.key.toLowerCase();
            if (k === "s") {
                e.preventDefault();
                if (dirty) onSave();
            }
            if (k === "r") {
                e.preventDefault();
                reload();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [dirty, onSave, reload]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <Loader size="md" text="Loading navigation..." />
            </div>
        );
    }

    /** ---------------------------------------------
     * Render
     * --------------------------------------------- */
    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="sticky top-0 z-20 border-b bg-white/95 px-4 py-4 backdrop-blur">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="relative flex-1 max-w-md">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                ⌕
                            </span>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search menus, submenus, pages..."
                                className="w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                            />
                            {query ? (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {dirty ? (
                                <Badge tone="warn" className="animate-pulse">
                                    Unsaved
                                </Badge>
                            ) : (
                                <Badge tone="ok">Saved</Badge>
                            )}
                            {refreshing ? <Badge tone="muted">Refreshing…</Badge> : null}
                            {saving ? <Badge tone="muted">Saving…</Badge> : null}
                            <Badge tone="muted">
                                {items.length} menu{items.length !== 1 ? "s" : ""}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={onAddMenu}
                            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 active:scale-95 transition-all"
                        >
                            + Add menu
                        </button>

                        <button
                            type="button"
                            onClick={() => reload()}
                            disabled={saving || refreshing}
                            className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                        >
                            {refreshing ? <Loader size="sm" /> : "Refresh"}
                        </button>

                        <button
                            type="button"
                            onClick={onReset}
                            disabled={!dirty || saving}
                            className="rounded-lg border px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                        >
                            Reset
                        </button>

                        <button
                            type="button"
                            disabled={saving || !dirty}
                            onClick={onSave}
                            className="rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:from-red-700 hover:to-red-800 disabled:opacity-60"
                        >
                            {saving ? <Loader size="sm" text="Saving..." /> : "Save Changes"}
                        </button>
                    </div>
                </div>

                {toasts.length ? (
                    <div className="absolute bottom-full left-0 right-0 mb-2 space-y-2 px-4">
                        {toasts.map((t) => (
                            <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                        ))}
                    </div>
                ) : null}
            </div>

            {/* List */}
            <div className="space-y-4 px-4">
                {filteredItems.length === 0 ? (
                    <EmptyState
                        icon="🔍"
                        title="No matches found"
                        description={query ? `No menus match "${query}"` : "No items"}
                        action={
                            <button
                                type="button"
                                className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                                onClick={() => setQuery("")}
                            >
                                Clear search
                            </button>
                        }
                    />
                ) : null}

                {filteredItems.map((menu) => {
                    const menuOpen = open.menuId === menu.id;
                    const deletingMenu = deletingId === menu.id;

                    return (
                        <div key={menu.id} className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-all">
                            {/* Menu header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
                                <div className="flex flex-1 items-center gap-3 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={menu.enabled !== false}
                                        onChange={(e) => onToggleMenuEnabled(menu.id, e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                        disabled={deletingMenu}
                                    />

                                    <button
                                        type="button"
                                        className="flex-1 text-left min-w-0"
                                        onClick={() => toggleMenu(menu.id)}
                                        disabled={deletingMenu}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm font-semibold text-gray-900 truncate">{menu.label}</span>
                                            {menu.enabled === false ? <Badge tone="muted">Disabled</Badge> : null}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate mt-1">
                                            {menu.href ?? ""} <span className="text-gray-400 hidden md:inline"> • #{menu.id}</span>
                                        </div>
                                    </button>

                                    <span className="text-gray-400">{menuOpen ? "▴" : "▾"}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <IconButton title="Move up" onClick={() => onMoveMenu(menu.id, -1)} disabled={deletingMenu}>
                                        ↑
                                    </IconButton>
                                    <IconButton title="Move down" onClick={() => onMoveMenu(menu.id, +1)} disabled={deletingMenu}>
                                        ↓
                                    </IconButton>

                                    <button
                                        type="button"
                                        onClick={() => onDeleteMenu(menu.id)}
                                        disabled={deletingMenu}
                                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                    >
                                        {deletingMenu ? <Loader size="sm" /> : "Delete"}
                                    </button>
                                </div>
                            </div>

                            {/* Menu body */}
                            {menuOpen ? (
                                <div className="border-t px-5 py-6 bg-gray-50/50 space-y-6">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Menu label *</label>
                                            <input
                                                value={menu.label}
                                                onChange={(e) => onUpdateMenu(menu.id, { label: e.target.value })}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Href *</label>
                                            <input
                                                value={menu.href ?? ""}
                                                onChange={(e) => onUpdateMenu(menu.id, { href: e.target.value })}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                                placeholder="#section or /page"
                                            />
                                        </div>
                                    </div>

                                    {/* Level 2 */}
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between gap-3 mb-4">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900">Submenus (Level 2)</h3>
                                                <p className="text-xs text-gray-500">{menu.children?.length ?? 0} submenu(s)</p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => onAddSubmenu(menu.id)}
                                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                                            >
                                                + Add submenu
                                            </button>
                                        </div>

                                        {(menu.children?.length ?? 0) === 0 ? (
                                            <EmptyState
                                                icon="📄"
                                                title="No submenus"
                                                description="Add submenus to organize your content"
                                                action={
                                                    <button
                                                        type="button"
                                                        onClick={() => onAddSubmenu(menu.id)}
                                                        className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                                                    >
                                                        Add first submenu
                                                    </button>
                                                }
                                            />
                                        ) : (
                                            <div className="space-y-4">
                                                {(menu.children ?? []).map((sub) => {
                                                    const subOpen = open.menuId === menu.id && open.submenuId === sub.id;
                                                    const deletingSub = deletingId === sub.id;

                                                    return (
                                                        <div key={sub.id} className="rounded-lg border bg-white p-4 hover:border-gray-400 transition-colors">
                                                            {/* Sub header */}
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                                <div className="flex flex-1 items-center gap-3 min-w-0">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={sub.enabled !== false}
                                                                        onChange={(e) => onUpdateSubmenu(menu.id, sub.id, { enabled: e.target.checked })}
                                                                        className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                                        disabled={deletingSub}
                                                                    />

                                                                    <button
                                                                        type="button"
                                                                        className="flex-1 text-left min-w-0"
                                                                        onClick={() => toggleSubmenu(menu.id, sub.id)}
                                                                        disabled={deletingSub}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <span className="text-sm font-medium text-gray-900 truncate">{sub.label}</span>
                                                                            {sub.enabled === false ? <Badge tone="muted">Disabled</Badge> : null}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 truncate mt-1">
                                                                            {sub.href} <span className="text-gray-400">• #{sub.id}</span>
                                                                        </div>
                                                                    </button>

                                                                    <span className="text-gray-400">{subOpen ? "▴" : "▾"}</span>
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    <IconButton title="Move up" onClick={() => onMoveSubmenu(menu.id, sub.id, -1)} disabled={deletingSub}>
                                                                        ↑
                                                                    </IconButton>
                                                                    <IconButton title="Move down" onClick={() => onMoveSubmenu(menu.id, sub.id, +1)} disabled={deletingSub}>
                                                                        ↓
                                                                    </IconButton>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onDeleteSubmenu(menu.id, sub.id)}
                                                                        disabled={deletingSub}
                                                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                                    >
                                                                        {deletingSub ? <Loader size="sm" /> : "Delete"}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* Sub details */}
                                                            <div className="grid gap-3 sm:grid-cols-2">
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Submenu label</label>
                                                                    <input
                                                                        value={sub.label}
                                                                        onChange={(e) => onUpdateSubmenu(menu.id, sub.id, { label: e.target.value })}
                                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Href</label>
                                                                    <input
                                                                        value={sub.href ?? ""}
                                                                        onChange={(e) => onUpdateSubmenu(menu.id, sub.id, { href: e.target.value })}
                                                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Level 3 */}
                                                            {subOpen ? (
                                                                <div className="border-t mt-4 pt-4">
                                                                    <div className="flex items-center justify-between gap-3 mb-3">
                                                                        <div>
                                                                            <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
                                                                                Sub-submenus (Level 3)
                                                                            </h4>
                                                                            <p className="text-xs text-gray-500">{sub.children?.length ?? 0} item(s)</p>
                                                                        </div>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onAddSubSub(menu.id, sub.id)}
                                                                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold hover:bg-gray-50"
                                                                        >
                                                                            + Add sub-submenu
                                                                        </button>
                                                                    </div>

                                                                    {(sub.children?.length ?? 0) === 0 ? (
                                                                        <EmptyState
                                                                            icon="🧩"
                                                                            title="No sub-submenus"
                                                                            description="Add a third-level item"
                                                                            action={
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => onAddSubSub(menu.id, sub.id)}
                                                                                    className="rounded-md border px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                                                                                >
                                                                                    Add first sub-submenu
                                                                                </button>
                                                                            }
                                                                        />
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {(sub.children ?? []).map((x) => {
                                                                                const deletingX = deletingId === x.id;
                                                                                return (
                                                                                    <div key={x.id} className="rounded-md border bg-gray-50 p-3">
                                                                                        <div className="flex items-center justify-between gap-2">
                                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                                <input
                                                                                                    type="checkbox"
                                                                                                    checked={x.enabled !== false}
                                                                                                    onChange={(e) => onUpdateSubSub(menu.id, sub.id, x.id, { enabled: e.target.checked })}
                                                                                                    className="h-3.5 w-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                                                                                                    disabled={deletingX}
                                                                                                />
                                                                                                <span className="text-xs text-gray-500 truncate">#{x.id}</span>
                                                                                            </div>

                                                                                            <div className="flex items-center gap-1">
                                                                                                <IconButton title="Up" onClick={() => onMoveSubSub(menu.id, sub.id, x.id, -1)} disabled={deletingX} className="h-7 w-7">
                                                                                                    ↑
                                                                                                </IconButton>
                                                                                                <IconButton title="Down" onClick={() => onMoveSubSub(menu.id, sub.id, x.id, +1)} disabled={deletingX} className="h-7 w-7">
                                                                                                    ↓
                                                                                                </IconButton>

                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => onDeleteSubSub(menu.id, sub.id, x.id)}
                                                                                                    disabled={deletingX}
                                                                                                    className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                                                                                                >
                                                                                                    {deletingX ? <Loader size="sm" /> : "Delete"}
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>

                                                                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                                                                            <input
                                                                                                value={x.label}
                                                                                                onChange={(e) => onUpdateSubSub(menu.id, sub.id, x.id, { label: e.target.value })}
                                                                                                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                                                                                placeholder="Label"
                                                                                            />
                                                                                            <input
                                                                                                value={x.href ?? ""}
                                                                                                onChange={(e) => onUpdateSubSub(menu.id, sub.id, x.id, { href: e.target.value })}
                                                                                                className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                                                                                                placeholder="#anchor or /route"
                                                                                            />
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
