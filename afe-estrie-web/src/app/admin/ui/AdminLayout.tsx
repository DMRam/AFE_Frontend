import { type ReactNode, useMemo, useState, useEffect, useCallback } from "react";
import {
    LayoutDashboard,
    Navigation,
    FileText,
    Home,
    CalendarDays,
    PanelBottom,
    Settings,
    Search,
    Menu,
    User,
    LogOut,
    ChevronDown,
    Key,
    Bell,
    Image as ImageIcon,
    Database,
    LayoutTemplate,
    Cookie,
} from "lucide-react";

export type AdminSectionId =
    | "overview"
    | "navigation"
    | "pages"
    | "homepage"
    | "events"
    | "footer"
    | "settings"
    | "campaigns"
    | "activity"
    | "footer"
    | "cookie"


interface UserInfo {
    name: string;
    role?: string;
    email?: string;
    avatarUrl?: string;
}

interface NavItem {
    id: AdminSectionId;
    label: string;
    icon: any;
    badge?: string;
    disabled?: boolean;
    description?: string;
    category?: string;
}

interface AdminLayoutProps {
    title: string;
    subtitle?: string;
    active: AdminSectionId;
    onChange: (id: AdminSectionId) => void;
    children: ReactNode;
    user?: UserInfo;
    rightActions?: ReactNode;
    isLoading?: boolean;
    onSeedEquipePage?: () => void;
    onPublish?: () => void;
    onPreview?: () => void;
    onLogout?: () => void;
}

function SearchInput({
    placeholder,
    className = ""
}: {
    placeholder: string;
    className?: string
}) {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
                placeholder={placeholder}
                className="w-full border border-gray-200 bg-white/70 pl-9 pr-3 py-2 text-sm rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-100 outline-none backdrop-blur-sm transition-all"
                disabled
                title="Recherche à venir"
            />
        </div>
    );
}

function UserAvatar({ user }: { user: UserInfo }) {
    if (user.avatarUrl) {
        return (
            <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-8 w-8 rounded-full object-cover border border-gray-200 ring-1 ring-white/50"
            />
        );
    }

    return (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
        </div>
    );
}

function SidebarNavItem({
    item,
    isActive,
    onClick
}: {
    item: NavItem;
    isActive: boolean;
    onClick: () => void
}) {
    const Icon = item.icon;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={item.disabled}
            className={`
                group flex w-full items-center gap-3 px-3 py-2.5
                rounded-lg transition-all duration-150 mx-1
                ${isActive
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
                ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={item.disabled ? 'À venir' : item.description}
        >
            <Icon className={`
                h-4 w-4 transition-colors
                ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}
            `} />
            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
            {item.badge && (
                <span className={`
                    px-1.5 py-0.5 text-[10px] font-medium rounded
                    ${isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    }
                `}>
                    {item.badge}
                </span>
            )}
        </button>
    );
}

function UserMenu({
    user,
    isOpen,
    onClose,
    onSettings,
    onLogout
}: {
    user: UserInfo;
    isOpen: boolean;
    onClose: () => void;
    onSettings?: () => void;
    onLogout?: () => void;
}) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-10"
                onClick={onClose}
            />
            <div className="absolute right-0 z-20 mt-1.5 w-56 border border-gray-200 bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <UserAvatar user={user} />
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                            <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                    </div>
                </div>

                <div className="py-1">
                    {onSettings && (
                        <button
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            type="button"
                            onClick={() => {
                                onClose();
                                onSettings();
                            }}
                        >
                            <Settings className="h-4 w-4 text-gray-500" />
                            Paramètres
                        </button>
                    )}

                    <button
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        type="button"
                        onClick={() => {
                            onClose();
                            onLogout?.();
                        }}
                    >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                    </button>
                </div>
            </div>
        </>
    );
}

export function AdminLayout({
    title,
    subtitle,
    active,
    onChange,
    children,
    rightActions,
    user = { name: "Administrateur", role: "Admin", email: "admin@example.com" },
    isLoading = false,
    onSeedEquipePage,
    onLogout,
}: AdminLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024 && mobileOpen) {
                setMobileOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [mobileOpen]);

    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileOpen]);

    const navItems: NavItem[] = useMemo(() => [
        {
            id: "overview",
            label: "Tableau de bord",
            icon: LayoutDashboard,
            description: "Vue d'ensemble et métriques",
            category: "Général"
        },
        {
            id: "activity",
            label: "Activité",
            icon: Bell,
            badge: "Nouveau",
            description: "Historique des modifications",
            category: "Général"
        },
        {
            id: "pages",
            label: "Pages",
            icon: FileText,
            description: "Gérer toutes les pages",
            category: "Contenu"
        },
        {
            id: "homepage",
            label: "Page d'accueil",
            icon: Home,
            description: "Personnaliser l'accueil",
            category: "Contenu"
        },
        {
            id: "navigation",
            label: "Navigation",
            icon: Navigation,
            description: "Menus et structure",
            category: "Contenu"
        },
        {
            id: "campaigns",
            label: "Campagnes",
            icon: ImageIcon,
            badge: "Bientôt",
            description: "Contenus promotionnels",
            category: "Marketing"
        },
        {
            id: "events",
            label: "Événements",
            icon: CalendarDays,
            badge: "Bientôt",
            description: "Calendrier et annonces",
            category: "Marketing"
        },
        {
            id: "footer",
            label: "Pied de page",
            icon: PanelBottom,
            badge: "Bientôt",
            description: "Configuration du footer",
            category: "Configuration"
        },
        {
            id: "settings",
            label: "Paramètres",
            icon: Settings,
            badge: "Bientôt",
            description: "Système et sécurité",
            category: "Configuration"
        },
        {
            id: "footer",
            label: "Footer",
            icon: LayoutTemplate,
        },
        {
            id: "cookie",
            label: "Cookies",
            icon: Cookie,
            desc: "Consentement et liens",
        }
    ], []);

    const groupedNavItems = useMemo(() => {
        const groups: Record<string, NavItem[]> = {};
        navItems.forEach(item => {
            const category = item.category || "Autre";
            if (!groups[category]) groups[category] = [];
            groups[category].push(item);
        });
        return groups;
    }, [navItems]);

    const activeItem = navItems.find((x) => x.id === active);

    const handleNavClick = useCallback((id: AdminSectionId) => {
        onChange(id);
        setMobileOpen(false);
    }, [onChange]);

    const handleSeedEquipePage = useCallback(() => {
        if (onSeedEquipePage) {
            onSeedEquipePage();
        } else {
            alert('Fonction de création de page "Équipe" non implémentée');
        }
    }, [onSeedEquipePage]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div className="flex min-h-screen">
                {/* Sidebar */}
                <aside
                    className={`
                        fixed z-50 h-full w-64 bg-white border-r border-gray-200
                        lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64
                        transition-transform duration-200 ease-out
                        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        flex flex-col
                    `}
                >
                    {/* Brand header */}
                    <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <Database className="h-4 w-4 text-white" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                    {subtitle || "Gestion de contenu"}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-4 py-3 border-b border-gray-200">
                        <SearchInput placeholder="Rechercher…" />
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-3">
                        {Object.entries(groupedNavItems).map(([category, items]) => (
                            <div key={category} className="mb-4 px-3">
                                <div className="px-2 pb-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {category}
                                </div>
                                <div className="space-y-0.5">
                                    {items.map((item) => (
                                        <SidebarNavItem
                                            key={item.id}
                                            item={item}
                                            isActive={item.id === active}
                                            onClick={() => handleNavClick(item.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </nav>

                    {/* Sidebar footer */}
                    <div className="border-t border-gray-200 px-4 py-3">
                        <div className="mb-3 grid grid-cols-2 gap-2">
                            {/* <button
                                type="button"
                                onClick={handlePreview}
                                className="inline-flex items-center justify-center gap-1.5 border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 rounded transition-colors"
                            >
                                <Eye className="h-3 w-3" />
                                Aperçu
                            </button>

                            <button
                                type="button"
                                onClick={handlePublish}
                                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 text-white px-2.5 py-1.5 text-xs font-medium hover:bg-blue-700 rounded transition-colors"
                            >
                                <UploadCloud className="h-3 w-3" />
                                Publier
                            </button> */}
                        </div>

                        <button
                            onClick={handleSeedEquipePage}
                            className="w-full text-left text-xs text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded transition-colors flex items-center gap-1.5"
                        >
                            <Key className="h-3 w-3" />
                            Page "Équipe"
                        </button>
                    </div>
                </aside>

                {/* Main content area */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Topbar */}
                    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
                        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
                            {/* Left section */}
                            <div className="flex items-center gap-3">
                                <button
                                    className="lg:hidden inline-flex items-center justify-center h-9 w-9 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                    onClick={() => setMobileOpen(true)}
                                    aria-label="Ouvrir le menu"
                                >
                                    <Menu className="h-5 w-5" />
                                </button>

                                <div className="min-w-0">
                                    <h1 className="text-sm font-semibold text-gray-900 truncate">
                                        {activeItem?.label || "Administration"}
                                    </h1>
                                    {activeItem?.description && (
                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                            {activeItem.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Right section */}
                            <div className="flex items-center gap-3">
                                {rightActions}

                                {/* Notifications */}
                                <button
                                    type="button"
                                    className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Notifications"
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                                </button>

                                {/* Preview */}
                                {/* <button
                                    onClick={handlePreview}
                                    className="hidden sm:inline-flex items-center gap-2 border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 rounded-lg transition-colors"
                                >
                                    <Eye className="h-4 w-4" />
                                    Aperçu
                                </button> */}

                                {/* Publish */}
                                {/* <button
                                    onClick={handlePublish}
                                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    <UploadCloud className="h-4 w-4" />
                                    Publier
                                </button> */}

                                {/* User menu */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 pl-1 pr-2 py-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-expanded={userMenuOpen}
                                    >
                                        <UserAvatar user={user} />
                                        <div className="hidden md:block text-left min-w-0">
                                            <div className="text-xs font-medium text-gray-900 truncate">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {user.role}
                                            </div>
                                        </div>
                                        <ChevronDown className={`
                                            h-4 w-4 text-gray-400 transition-transform
                                            ${userMenuOpen ? 'rotate-180' : ''}
                                        `} />
                                    </button>

                                    <UserMenu
                                        user={user}
                                        isOpen={userMenuOpen}
                                        onClose={() => setUserMenuOpen(false)}
                                        onLogout={onLogout}
                                    />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Scrollable main content */}
                    <main className="flex-1 overflow-y-auto bg-gray-50">
                        <div className="p-4 lg:p-6">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="text-center">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                                        <p className="mt-3 text-sm text-gray-500">Chargement…</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-full">
                                    {children}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}