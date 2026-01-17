import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getNavigation, saveNavigation } from "../../../services/navigationRepo";
import type { NavItem, NavNode } from "../../../content/types/navTypes";
import {
    Plus, ChevronDown, ChevronRight, Trash2, Edit2,
    Save, RefreshCw, Search, X, Menu as MenuIcon, Folder, File,
    Layers, Check, Hash, Link, Globe
} from "lucide-react";

/** ---------------------------------------------
 * UX types
 * --------------------------------------------- */
type ToastType = "success" | "error" | "info";
type ToastMessage = { id: string; message: string; type: ToastType };

// Smart accordion state - tracks what's open at each level
type AccordionState = {
    navbarItems: Set<string>;    // Which navbar items are expanded
    menuItems: Set<string>;      // Which menu items are expanded (within their parent navbar)
    editMode: EditMode | null;   // What's currently being edited
};

type EditMode = {
    type: 'navbar' | 'menu' | 'submenu';
    id: string;
    parentId?: string;           // For menu items (parent navbar) and submenus (parent menu)
};

const TOAST_TIMEOUT = 3000;

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

// function move<T>(arr: T[], from: number, to: number) {
//     if (from === to) return arr;
//     const copy = [...arr];
//     const [item] = copy.splice(from, 1);
//     copy.splice(to, 0, item);
//     return copy;
// }

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

// function contains(q: string, value?: string) {
//     if (!q) return true;
//     return (value ?? "").toLowerCase().includes(q.toLowerCase());
// }

/** ---------------------------------------------
 * UI Components
 * --------------------------------------------- */
// function StatusBadge({ enabled, size = "sm" }: { enabled: boolean | undefined; size?: "sm" | "md" }) {
//     const sizeClasses = {
//         sm: "px-2 py-0.5 text-xs",
//         md: "px-3 py-1 text-sm"
//     };

//     return (
//         <span className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${enabled
//             ? "bg-green-100 text-green-700 border border-green-200"
//             : "bg-gray-100 text-gray-600 border border-gray-200"
//             }`}>
//             {enabled ? (
//                 <>
//                     <Eye className="w-3 h-3 mr-1" />
//                     Visible
//                 </>
//             ) : (
//                 <>
//                     <EyeOff className="w-3 h-3 mr-1" />
//                     Hidden
//                 </>
//             )}
//         </span>
//     );
// }

function ActionButton({
    icon: Icon,
    label,
    onClick,
    variant = "default",
    disabled = false,
    loading = false,
    className = ""
}: {
    icon: any;
    label: string;
    onClick: () => void;
    variant?: "default" | "primary" | "danger" | "ghost";
    disabled?: boolean;
    loading?: boolean;
    className?: string;
}) {
    const variants = {
        default: "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        primary: "border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700",
        danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        ghost: "border-transparent bg-transparent text-gray-600 hover:bg-gray-100"
    };

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled || loading}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
        >
            {loading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 animate-spin rounded-full" />
            ) : (
                <Icon className="w-4 h-4" />
            )}
            {label}
        </button>
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
    const icons = {
        success: "✅",
        error: "❌",
        info: "💡"
    };

    return (
        <div className={`rounded-lg border p-3 shadow-lg animate-fadeIn ${type === "success" ? "bg-green-50 border-green-200" :
            type === "error" ? "bg-red-50 border-red-200" :
                "bg-blue-50 border-blue-200"
            }`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span>{icons[type]}</span>
                    <span className="font-medium text-sm">{message}</span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
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
    size = "md"
}: {
    icon?: string | React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    size?: "sm" | "md" | "lg";
}) {
    const sizes = {
        sm: "p-4",
        md: "p-8",
        lg: "p-12"
    };

    return (
        <div className={`rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center ${sizes[size]}`}>
            <div className="text-3xl text-gray-400 mb-3">
                {typeof icon === "string" ? icon : icon}
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
            {description && <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">{description}</p>}
            {action}
        </div>
    );
}

/** ---------------------------------------------
 * Form Components
 * --------------------------------------------- */
function NavbarItemEditForm({
    navbarItem,
    onUpdate,
    onSave,
    onCancel,
    onAddMenuItem
}: {
    navbarItem: NavItem;
    onUpdate: (updates: Partial<NavItem>) => void;
    onSave: () => void;
    onCancel: () => void;
    onAddMenuItem: () => void;
}) {
    return (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-slideDown">
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Navbar Item Label
                    </label>
                    <input
                        type="text"
                        value={navbarItem.label}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="e.g., About, Services, Contact"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Link URL
                    </label>
                    <input
                        type="text"
                        value={navbarItem.href || ""}
                        onChange={(e) => onUpdate({ href: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="/about or #section"
                    />
                </div>

                {/* Add menu item button inside navbar item edit form */}
                <button
                    onClick={onAddMenuItem}
                    className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg transition-all ${!navbarItem.children?.length
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
                        : 'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                >
                    <Plus className="w-3 h-3" />
                    {!navbarItem.children?.length
                        ? `Add menu item to "${navbarItem.label}"`
                        : `Add another menu item to "${navbarItem.label}"`
                    }
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={navbarItem.enabled}
                            onChange={(e) => onUpdate({ enabled: e.target.checked })}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-xs text-gray-700">Visible in navbar</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Check className="w-3 h-3" />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MenuItemEditForm({
    menuItem,
    onUpdate,
    onSave,
    onCancel,
    onAddSubmenu
}: {
    menuItem: NavNode;
    onUpdate: (updates: Partial<NavNode>) => void;
    onSave: () => void;
    onCancel: () => void;
    onAddSubmenu: () => void;
}) {
    return (
        <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 animate-slideDown">
            <div className="space-y-2">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Menu Item Label
                    </label>
                    <input
                        type="text"
                        value={menuItem.label}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Our Team, History"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Link URL
                    </label>
                    <input
                        type="text"
                        value={menuItem.href || ""}
                        onChange={(e) => onUpdate({ href: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                        placeholder="/about/team or #team"
                    />
                </div>

                {/* Add submenu button inside menu item edit form */}
                <button
                    onClick={onAddSubmenu}
                    className={`w-full inline-flex items-center justify-center gap-2 px-2 py-1.5 text-xs rounded-lg transition-all ${!menuItem.children?.length
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                        : 'border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                >
                    <Plus className="w-3 h-3" />
                    {!menuItem.children?.length
                        ? `Add submenu to "${menuItem.label}"`
                        : `Add another submenu to "${menuItem.label}"`
                    }
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <label className="flex items-center gap-1.5">
                        <input
                            type="checkbox"
                            checked={menuItem.enabled}
                            onChange={(e) => onUpdate({ enabled: e.target.checked })}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700">Visible</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Check className="w-3 h-3" />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SubmenuEditForm({
    submenu,
    onUpdate,
    onSave,
    onCancel
}: {
    submenu: NavNode;
    onUpdate: (updates: Partial<NavNode>) => void;
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="mt-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 animate-slideDown">
            <div className="space-y-2">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Submenu Label
                    </label>
                    <input
                        type="text"
                        value={submenu.label}
                        onChange={(e) => onUpdate({ label: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., Team Leadership, History Timeline"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                        Link URL
                    </label>
                    <input
                        type="text"
                        value={submenu.href || ""}
                        onChange={(e) => onUpdate({ href: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-transparent"
                        placeholder="/about/team/leadership or #leadership"
                    />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <label className="flex items-center gap-1">
                        <input
                            type="checkbox"
                            checked={submenu.enabled}
                            onChange={(e) => onUpdate({ enabled: e.target.checked })}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-xs text-gray-700">Visible</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onCancel}
                            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSave}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Check className="w-3 h-3" />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** ---------------------------------------------
 * Level Badges for visual hierarchy
 * --------------------------------------------- */
function LevelBadge({ level }: { level: 1 | 2 | 3 }) {
    const config = {
        1: { label: "NavBar", color: "bg-red-100 text-red-700 border-red-200" },
        2: { label: "Menu Item", color: "bg-blue-100 text-blue-700 border-blue-200" },
        3: { label: "Submenu", color: "bg-green-100 text-green-700 border-green-200" }
    };

    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${config[level].color}`}>
            {config[level].label}
        </span>
    );
}

/** ---------------------------------------------
 * Main Component
 * --------------------------------------------- */
export function NavManager() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState<NavItem[]>([]);
    const [original, setOriginal] = useState<NavItem[]>([]);
    const [query, setQuery] = useState("");
    const [accordion, setAccordion] = useState<AccordionState>({
        navbarItems: new Set(),
        menuItems: new Set(),
        editMode: null
    });
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

    // Load navigation
    const loadNavigation = useCallback(async () => {
        try {
            const data = await getNavigation();
            const normalized = normalizeNav(data ?? []);
            setItems(normalized);
            setOriginal(structuredClone(normalized));
            showToast("Navigation loaded", "success");
        } catch (error: any) {
            showToast(`Failed to load: ${error.message}`, "error");
        }
    }, [showToast]);

    // Initial load
    useEffect(() => {
        setLoading(true);
        loadNavigation().finally(() => setLoading(false));

        return () => {
            toastTimers.current.forEach((t) => window.clearTimeout(t));
            toastTimers.current.clear();
        };
    }, [loadNavigation]);

    /** ---------------------------------------------
     * Accordion Management
     * --------------------------------------------- */
    const toggleNavbarItem = useCallback((navbarItemId: string) => {
        setAccordion(prev => {
            const newNavbarItems = new Set(prev.navbarItems);
            if (newNavbarItems.has(navbarItemId)) {
                newNavbarItems.delete(navbarItemId);
                // Also close any menu items within this navbar item
                const newMenuItems = new Set(prev.menuItems);
                Array.from(newMenuItems).forEach(menuId => {
                    // Find if this menu item belongs to the closing navbar item
                    const navbarItem = items.find(n => n.id === navbarItemId);
                    if (navbarItem?.children?.some(m => m.id === menuId)) {
                        newMenuItems.delete(menuId);
                    }
                });
                return { ...prev, navbarItems: newNavbarItems, menuItems: newMenuItems };
            } else {
                newNavbarItems.add(navbarItemId);
                return { ...prev, navbarItems: newNavbarItems };
            }
        });
    }, [items]);

    const toggleMenuItem = useCallback((menuItemId: string) => {
        setAccordion(prev => {
            const newMenuItems = new Set(prev.menuItems);
            if (newMenuItems.has(menuItemId)) {
                newMenuItems.delete(menuItemId);
            } else {
                newMenuItems.add(menuItemId);
            }
            return { ...prev, menuItems: newMenuItems };
        });
    }, []);

    const isNavbarItemOpen = useCallback((navbarItemId: string) => {
        return accordion.navbarItems.has(navbarItemId);
    }, [accordion.navbarItems]);

    const isMenuItemOpen = useCallback((menuItemId: string) => {
        return accordion.menuItems.has(menuItemId);
    }, [accordion.menuItems]);

    /** ---------------------------------------------
     * Level 1: Navbar Item Operations
     * --------------------------------------------- */
    const addNavbarItem = useCallback(() => {
        const used = collectIds(items);
        const label = "New Navbar Item";
        const id = uniqueId(slugifyId(label), used);

        const newNavbarItem: NavItem = {
            id,
            label,
            href: "/",
            enabled: true,
            order: items.length + 1,
            children: []
        };

        setItems(prev => normalizeNav([...prev, newNavbarItem]));
        // Auto-open the new navbar item
        setAccordion(prev => {
            const newNavbarItems = new Set(prev.navbarItems);
            newNavbarItems.add(id);
            return {
                ...prev,
                navbarItems: newNavbarItems,
                editMode: { type: 'navbar', id }
            };
        });
        showToast("Navbar item added", "success");
    }, [items, showToast]);

    const updateNavbarItem = useCallback((navbarItemId: string, updates: Partial<NavItem>) => {
        setItems(prev =>
            prev.map(item => item.id === navbarItemId ? { ...item, ...updates } : item)
        );
    }, []);

    const deleteNavbarItem = useCallback((navbarItemId: string) => {
        if (!window.confirm("Delete this navbar item and all its menu items?")) return;

        setItems(prev => normalizeNav(prev.filter(m => m.id !== navbarItemId)));
        // Remove from accordion state
        setAccordion(prev => {
            const newNavbarItems = new Set(prev.navbarItems);
            newNavbarItems.delete(navbarItemId);
            return { ...prev, navbarItems: newNavbarItems, editMode: null };
        });
        showToast("Navbar item deleted", "success");
    }, []);

    /** ---------------------------------------------
     * Level 2: Menu Item Operations
     * --------------------------------------------- */
    const addMenuItem = useCallback((navbarItemId: string) => {
        setItems(prev => {
            const used = collectIds(prev);
            const label = "New Menu Item";
            const id = uniqueId(slugifyId(label), used);

            return prev.map(navbarItem => {
                if (navbarItem.id !== navbarItemId) return navbarItem;

                const newMenuItem: NavNode = {
                    id,
                    label,
                    href: "/",
                    enabled: true,
                    order: (navbarItem.children?.length || 0) + 1,
                    children: []
                };

                const updated = {
                    ...navbarItem,
                    children: normalizeNodes([...(navbarItem.children || []), newMenuItem])
                };

                // Auto-open the parent navbar item and new menu item
                setAccordion(prev => {
                    const newNavbarItems = new Set(prev.navbarItems);
                    newNavbarItems.add(navbarItemId);
                    const newMenuItems = new Set(prev.menuItems);
                    newMenuItems.add(id);
                    return {
                        ...prev,
                        navbarItems: newNavbarItems,
                        menuItems: newMenuItems,
                        editMode: { type: 'menu', id, parentId: navbarItemId }
                    };
                });

                return updated;
            });
        });

        showToast("Menu item added", "success");
    }, [showToast]);

    const updateMenuItem = useCallback((navbarItemId: string, menuItemId: string, updates: Partial<NavNode>) => {
        setItems(prev =>
            prev.map(navbarItem => {
                if (navbarItem.id !== navbarItemId) return navbarItem;

                const updatedChildren = (navbarItem.children || []).map(child =>
                    child.id === menuItemId ? { ...child, ...updates } : child
                );

                return { ...navbarItem, children: normalizeNodes(updatedChildren) };
            })
        );
    }, []);

    const deleteMenuItem = useCallback((navbarItemId: string, menuItemId: string) => {
        if (!window.confirm("Delete this menu item and all its submenus?")) return;

        setItems(prev =>
            prev.map(navbarItem => {
                if (navbarItem.id !== navbarItemId) return navbarItem;

                const updatedChildren = (navbarItem.children || []).filter(child => child.id !== menuItemId);
                return { ...navbarItem, children: normalizeNodes(updatedChildren) };
            })
        );

        // Remove from accordion state
        setAccordion(prev => {
            const newMenuItems = new Set(prev.menuItems);
            newMenuItems.delete(menuItemId);
            return { ...prev, menuItems: newMenuItems, editMode: null };
        });
        showToast("Menu item deleted", "success");
    }, []);

    /** ---------------------------------------------
     * Level 3: Submenu Operations
     * --------------------------------------------- */
    const addSubmenu = useCallback((navbarItemId: string, menuItemId: string) => {
        setItems(prev => {
            const used = collectIds(prev);
            const label = "New Submenu";
            const id = uniqueId(slugifyId(label), used);

            return prev.map(navbarItem => {
                if (navbarItem.id !== navbarItemId) return navbarItem;

                const updatedChildren = (navbarItem.children || []).map(menuItem => {
                    if (menuItem.id !== menuItemId) return menuItem;

                    const newSubmenu: NavNode = {
                        id,
                        label,
                        href: "/",
                        enabled: true,
                        order: (menuItem.children?.length || 0) + 1
                    };

                    return {
                        ...menuItem,
                        children: normalizeNodes([...(menuItem.children || []), newSubmenu])
                    };
                });

                return { ...navbarItem, children: normalizeNodes(updatedChildren) };
            });
        });

        // Auto-open the parent menu item
        setAccordion(prev => {
            const newMenuItems = new Set(prev.menuItems);
            newMenuItems.add(menuItemId);
            return { ...prev, menuItems: newMenuItems };
        });

        showToast("Submenu added", "success");
    }, [showToast]);

    const updateSubmenu = useCallback((navbarItemId: string, menuItemId: string, submenuId: string, updates: Partial<NavNode>) => {
        setItems(prev =>
            prev.map(navbarItem => {
                if (navbarItem.id !== navbarItemId) return navbarItem;

                const updatedChildren = (navbarItem.children || []).map(menuItem => {
                    if (menuItem.id !== menuItemId) return menuItem;

                    const updatedSubmenus = (menuItem.children || []).map(submenu =>
                        submenu.id === submenuId ? { ...submenu, ...updates } : submenu
                    );

                    return { ...menuItem, children: normalizeNodes(updatedSubmenus) };
                });

                return { ...navbarItem, children: normalizeNodes(updatedChildren) };
            })
        );
    }, []);

    const deleteSubmenu = useCallback((navbarItemId: string, menuItemId: string, submenuId: string) => {
        if (!window.confirm("Delete this submenu?")) return;

        setItems(prev =>
            prev.map(navbarItem => {
                if (navbarItem.id !== navbarItemId) return navbarItem;

                const updatedChildren = (navbarItem.children || []).map(menuItem => {
                    if (menuItem.id !== menuItemId) return menuItem;

                    const updatedSubmenus = (menuItem.children || []).filter(submenu => submenu.id !== submenuId);
                    return { ...menuItem, children: normalizeNodes(updatedSubmenus) };
                });

                return { ...navbarItem, children: normalizeNodes(updatedChildren) };
            })
        );

        showToast("Submenu deleted", "success");
    }, []);

    /** ---------------------------------------------
     * Save & Reset
     * --------------------------------------------- */
    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const normalized = normalizeNav(items);
            await saveNavigation(normalized);
            setOriginal(structuredClone(normalized));
            setAccordion(prev => ({ ...prev, editMode: null }));
            showToast("Navigation saved successfully!", "success");
        } catch (error: any) {
            showToast(`Save failed: ${error.message}`, "error");
        } finally {
            setSaving(false);
        }
    }, [items, showToast]);

    const handleReset = useCallback(() => {
        if (!dirty || !window.confirm("Discard all changes?")) return;
        setItems(structuredClone(original));
        setAccordion({ navbarItems: new Set(), menuItems: new Set(), editMode: null });
        showToast("Changes discarded", "info");
    }, [dirty, original, showToast]);

    const handleRefresh = useCallback(async () => {
        if (dirty && !window.confirm("You have unsaved changes. Refresh anyway?")) return;

        setLoading(true);
        await loadNavigation();
        setLoading(false);
        setAccordion({ navbarItems: new Set(), menuItems: new Set(), editMode: null });
    }, [dirty, loadNavigation]);

    // Function to save a single navbar item immediately
    const handleSaveItem = useCallback(async (navbarItem: NavItem) => {
        try {
            // Find the item in the current items array
            const updatedItems = items.map(item =>
                item.id === navbarItem.id ? navbarItem : item
            );

            // Save to Firestore
            await saveNavigation(normalizeNav(updatedItems));

            // Update local state
            setItems(updatedItems);
            setOriginal(structuredClone(updatedItems));
            setAccordion(prev => ({ ...prev, editMode: null }));

            showToast("Item saved successfully", "success");
        } catch (error: any) {
            showToast(`Failed to save item: ${error.message}`, "error");
        }
    }, [items, showToast]);

    /** ---------------------------------------------
     * Filtering
     * --------------------------------------------- */
    const filteredItems = useMemo(() => {
        if (!query.trim()) return items;

        const q = query.toLowerCase();
        return items
            .map(navbarItem => {
                const navbarMatches =
                    navbarItem.label.toLowerCase().includes(q) ||
                    navbarItem.href?.toLowerCase().includes(q) ||
                    navbarItem.id.toLowerCase().includes(q);

                const filteredMenuItems = (navbarItem.children || [])
                    .map(menuItem => {
                        const menuMatches =
                            menuItem.label.toLowerCase().includes(q) ||
                            menuItem.href?.toLowerCase().includes(q) ||
                            menuItem.id.toLowerCase().includes(q);

                        const filteredSubmenus = (menuItem.children || [])
                            .filter(submenu =>
                                submenu.label.toLowerCase().includes(q) ||
                                submenu.href?.toLowerCase().includes(q) ||
                                submenu.id.toLowerCase().includes(q)
                            );

                        if (!menuMatches && filteredSubmenus.length === 0) return null;
                        return { ...menuItem, children: filteredSubmenus };
                    })
                    .filter(Boolean) as NavNode[];

                if (!navbarMatches && filteredMenuItems.length === 0) return null;
                return { ...navbarItem, children: filteredMenuItems };
            })
            .filter(Boolean) as NavItem[];
    }, [items, query]);

    /** ---------------------------------------------
     * Keyboard Shortcuts
     * --------------------------------------------- */
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (dirty) handleSave();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dirty, handleSave]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
                <p className="text-gray-600">Loading navigation...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Layers className="w-8 h-8 text-red-600" />
                            Navigation Manager
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Manage your site's navigation structure with 3-level hierarchy
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search navigation items..."
                                className="pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 bg-white w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <ActionButton
                            icon={RefreshCw}
                            label="Refresh"
                            onClick={handleRefresh}
                            disabled={loading}
                            loading={loading}
                            variant="ghost"
                        />
                    </div>
                </div>

                {/* Status Bar with Level Indicators */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${dirty ? 'animate-pulse bg-amber-500' : 'bg-green-500'}`} />
                            <span className="text-sm font-medium">
                                {dirty ? 'Unsaved changes' : 'All changes saved'}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <MenuIcon className="w-4 h-4 text-red-600" />
                                <span>{items.length} navbar items</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Folder className="w-4 h-4 text-blue-600" />
                                <span>{items.reduce((acc, n) => acc + (n.children?.length || 0), 0)} menu items</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <File className="w-4 h-4 text-green-600" />
                                <span>{items.reduce((acc, n) => acc + (n.children?.reduce((sum, m) => sum + (m.children?.length || 0), 0) || 0), 0)} submenus</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <ActionButton
                            icon={Plus}
                            label="Add Navbar Item"
                            onClick={addNavbarItem}
                            variant="primary"
                        />

                        <ActionButton
                            icon={Save}
                            label={saving ? "Saving..." : "Save All"}
                            onClick={handleSave}
                            disabled={!dirty || saving}
                            loading={saving}
                        />

                        <button
                            onClick={handleReset}
                            disabled={!dirty || saving}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Hierarchy Guide */}
                <div className="flex flex-wrap items-center justify-center gap-6 p-3 bg-white/80 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <MenuIcon className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-900">NavBar Items</div>
                            <div className="text-xs text-gray-500">Top-level (About, Services)</div>
                        </div>
                    </div>
                    <div className="text-gray-300">→</div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Folder className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-900">Menu Items</div>
                            <div className="text-xs text-gray-500">Second-level (Our Team, History)</div>
                        </div>
                    </div>
                    <div className="text-gray-300">→</div>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                            <File className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-gray-900">Submenus</div>
                            <div className="text-xs text-gray-500">Third-level (Team Leadership)</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div>
                {filteredItems.length === 0 ? (
                    <EmptyState
                        icon={<MenuIcon className="w-12 h-12 mx-auto text-gray-400" />}
                        title={query ? "No matching items found" : "No navbar items yet"}
                        description={query ? `Try a different search term` : "Start by adding your first navbar item"}
                        action={
                            <button
                                onClick={addNavbarItem}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                            >
                                <Plus className="w-4 h-4" />
                                Add First Navbar Item
                            </button>
                        }
                        size="lg"
                    />
                ) : (
                    <div className="space-y-4">
                        {filteredItems.map((navbarItem, _index) => (
                            <div key={navbarItem.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                                {/* Level 1: Navbar Item */}
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <button
                                                onClick={() => toggleNavbarItem(navbarItem.id)}
                                                className="flex-shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors group"
                                                title={navbarItem.children?.length ? `${navbarItem.children.length} menu items - Click to expand` : "No menu items"}
                                            >
                                                {navbarItem.children?.length ? (
                                                    isNavbarItemOpen(navbarItem.id) ? (
                                                        <ChevronDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                    )
                                                ) : (
                                                    <div className="w-4 h-4 flex items-center justify-center text-gray-300">
                                                        –
                                                    </div>
                                                )}
                                            </button>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-2 h-2 rounded-full ${navbarItem.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                    <LevelBadge level={1} />
                                                    <span className="font-semibold text-gray-900 truncate">{navbarItem.label}</span>
                                                    {navbarItem.children?.length ? (
                                                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                            {navbarItem.children.length}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                                                    {navbarItem.href?.startsWith('#') ? (
                                                        <Hash className="w-3 h-3 flex-shrink-0" />
                                                    ) : navbarItem.href?.startsWith('http') ? (
                                                        <Globe className="w-3 h-3 flex-shrink-0" />
                                                    ) : (
                                                        <Link className="w-3 h-3 flex-shrink-0" />
                                                    )}
                                                    <span className="truncate">{navbarItem.href || "No link"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => setAccordion(prev => ({
                                                    ...prev,
                                                    editMode: prev.editMode?.id === navbarItem.id ? null : { type: 'navbar', id: navbarItem.id }
                                                }))}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit navbar item"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => addMenuItem(navbarItem.id)}
                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Add menu item"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => deleteNavbarItem(navbarItem.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete navbar item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Navbar Item Edit Form */}
                                    {accordion.editMode?.type === 'navbar' && accordion.editMode.id === navbarItem.id && (
                                        <NavbarItemEditForm
                                            navbarItem={navbarItem}
                                            onUpdate={(updates) => updateNavbarItem(navbarItem.id, updates)}
                                            onSave={() => handleSaveItem(navbarItem)}
                                            onCancel={() => setAccordion(prev => ({ ...prev, editMode: null }))}
                                            onAddMenuItem={() => {
                                                addMenuItem(navbarItem.id);
                                                setAccordion(prev => ({ ...prev, editMode: null }));
                                            }}
                                        />
                                    )}
                                </div>

                                {/* Level 2: Menu Items (only shown if navbar item is open) */}
                                {isNavbarItemOpen(navbarItem.id) && navbarItem.children && navbarItem.children.length > 0 && (
                                    <div className="bg-gray-50 p-4 border-t border-gray-100">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                <Folder className="w-4 h-4 text-blue-600" />
                                                Menu Items under "{navbarItem.label}"
                                            </h4>
                                            <button
                                                onClick={() => addMenuItem(navbarItem.id)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:border-gray-400"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Add Menu Item
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {navbarItem.children.map((menuItem, _menuIndex) => (
                                                <div key={menuItem.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
                                                    {/* Level 2: Menu Item Header */}
                                                    <div className="p-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                <button
                                                                    onClick={() => toggleMenuItem(menuItem.id)}
                                                                    className="flex-shrink-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors group"
                                                                    title={menuItem.children?.length ? `${menuItem.children.length} submenus - Click to expand` : "No submenus"}
                                                                >
                                                                    {menuItem.children?.length ? (
                                                                        isMenuItemOpen(menuItem.id) ? (
                                                                            <ChevronDown className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                                                        ) : (
                                                                            <ChevronRight className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                                                        )
                                                                    ) : (
                                                                        <div className="w-3 h-3 flex items-center justify-center text-gray-300">
                                                                            –
                                                                        </div>
                                                                    )}
                                                                </button>

                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-1.5 mb-0.5">
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${menuItem.enabled ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                                                        <LevelBadge level={2} />
                                                                        <span className="text-sm font-medium text-gray-900 truncate">{menuItem.label}</span>
                                                                        {menuItem.children?.length ? (
                                                                            <span className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                                                                                {menuItem.children.length}
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                                                                        {menuItem.href?.startsWith('#') ? (
                                                                            <Hash className="w-2.5 h-2.5 flex-shrink-0" />
                                                                        ) : menuItem.href?.startsWith('http') ? (
                                                                            <Globe className="w-2.5 h-2.5 flex-shrink-0" />
                                                                        ) : (
                                                                            <Link className="w-2.5 h-2.5 flex-shrink-0" />
                                                                        )}
                                                                        <span className="truncate">{menuItem.href || "No link"}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                <button
                                                                    onClick={() => setAccordion(prev => ({
                                                                        ...prev,
                                                                        editMode: prev.editMode?.id === menuItem.id ? null : {
                                                                            type: 'menu',
                                                                            id: menuItem.id,
                                                                            parentId: navbarItem.id
                                                                        }
                                                                    }))}
                                                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Edit menu item"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>

                                                                <button
                                                                    onClick={() => addSubmenu(navbarItem.id, menuItem.id)}
                                                                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                                    title="Add submenu"
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </button>

                                                                <button
                                                                    onClick={() => deleteMenuItem(navbarItem.id, menuItem.id)}
                                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                    title="Delete menu item"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Menu Item Edit Form */}
                                                        {accordion.editMode?.type === 'menu' && accordion.editMode.id === menuItem.id && (
                                                            <MenuItemEditForm
                                                                menuItem={menuItem}
                                                                onUpdate={(updates) => updateMenuItem(navbarItem.id, menuItem.id, updates)}
                                                                onSave={() => handleSaveItem(navbarItem)}
                                                                onCancel={() => setAccordion(prev => ({ ...prev, editMode: null }))}
                                                                onAddSubmenu={() => {
                                                                    addSubmenu(navbarItem.id, menuItem.id);
                                                                    setAccordion(prev => ({ ...prev, editMode: null }));
                                                                }}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Level 3: Submenus (only shown if menu item is open) */}
                                                    {isMenuItemOpen(menuItem.id) && menuItem.children && menuItem.children.length > 0 && (
                                                        <div className="border-t border-gray-200 bg-gray-50 p-3">
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <h5 className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                                                    <File className="w-3 h-3 text-green-600" />
                                                                    Submenus under "{menuItem.label}"
                                                                </h5>
                                                                <button
                                                                    onClick={() => addSubmenu(navbarItem.id, menuItem.id)}
                                                                    className="text-xs px-2 py-0.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded hover:border-gray-400"
                                                                >
                                                                    + Add Submenu
                                                                </button>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                {menuItem.children.map((submenu) => (
                                                                    <div key={submenu.id} className="bg-white rounded border border-gray-200 p-2 hover:bg-gray-50 transition-colors">
                                                                        <div className="flex items-center justify-between gap-2">
                                                                            <div className="flex items-center gap-2 flex-1">
                                                                                <div className={`w-1.5 h-1.5 rounded-full ${submenu.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                                                                                <LevelBadge level={3} />
                                                                                <span className="text-xs text-gray-900 truncate">{submenu.label}</span>
                                                                                <span className="text-xs text-gray-400 truncate hidden sm:inline">{submenu.href}</span>
                                                                            </div>

                                                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                                                <button
                                                                                    onClick={() => setAccordion(prev => ({
                                                                                        ...prev,
                                                                                        editMode: { type: 'submenu', id: submenu.id, parentId: menuItem.id }
                                                                                    }))}
                                                                                    className="p-0.5 text-gray-400 hover:text-blue-600"
                                                                                    title="Edit submenu"
                                                                                >
                                                                                    <Edit2 className="w-3 h-3" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => deleteSubmenu(navbarItem.id, menuItem.id, submenu.id)}
                                                                                    className="p-0.5 text-gray-400 hover:text-red-600"
                                                                                    title="Delete submenu"
                                                                                >
                                                                                    <Trash2 className="w-3 h-3" />
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Submenu Edit Form */}
                                                                        {accordion.editMode?.type === 'submenu' && accordion.editMode.id === submenu.id && (
                                                                            <SubmenuEditForm
                                                                                submenu={submenu}
                                                                                onUpdate={(updates) => updateSubmenu(navbarItem.id, menuItem.id, submenu.id, updates)}
                                                                                onSave={() => handleSaveItem(navbarItem)}
                                                                                onCancel={() => setAccordion(prev => ({ ...prev, editMode: null }))}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Toasts */}
            {toasts.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50 space-y-2 w-full max-w-sm">
                    {toasts.map((toast) => (
                        <Toast
                            key={toast.id}
                            message={toast.message}
                            type={toast.type}
                            onClose={() => removeToast(toast.id)}
                        />
                    ))}
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px); max-height: 0; }
                    to { opacity: 1; transform: translateY(0); max-height: 500px; }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out;
                }
            `}</style>
        </div>
    );
}