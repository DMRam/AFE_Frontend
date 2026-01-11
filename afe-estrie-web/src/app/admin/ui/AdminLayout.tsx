import { type ReactNode, useMemo, useState } from "react";
import {
    LayoutDashboard,
    Navigation,
    FileText,
    Home,
    CalendarDays,
    PanelBottom,
    Settings,
    Search,
    Eye,
    UploadCloud,
    Menu,
    X,
    ChevronRight,
    User,
    LogOut,
    ChevronDown,
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
    | "activity";

type UserInfo = {
    name: string;
    role?: string;
    email?: string;
    avatarUrl?: string; // later from Firebase auth profile
};

type Props = {
    title: string;
    subtitle?: string;
    active: AdminSectionId;
    onChange: (id: AdminSectionId) => void;
    children: ReactNode;

    // Optional: show who is logged in (later from Firebase Auth)
    user?: UserInfo;

    rightActions?: ReactNode;
};

export function AdminLayout({
    title,
    subtitle,
    active,
    onChange,
    children,
    rightActions,
    user = { name: "Admin", role: "Editor" },
}: Props) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);

    const items = useMemo(
        () => [
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "navigation", label: "Navigation", icon: Navigation },
            { id: "pages", label: "Pages", icon: FileText, badge: "Next" },
            { id: "homepage", label: "Homepage", icon: Home, badge: "Next" },
            { id: "events", label: "A & E", icon: CalendarDays, badge: "Next" },
            { id: "footer", label: "Footer", icon: PanelBottom, badge: "Next" },
            { id: "campaigns", label: "Campaigns", icon: UploadCloud, badge: "Next" },
            { id: "activity", label: "Activity", icon: Eye, badge: "Next" },
            { id: "settings", label: "Settings", icon: Settings, badge: "Next" },
        ],
        []
    );

    const activeItem = items.find((x) => x.id === active);

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Mobile overlay */}
            {mobileOpen ? (
                <button
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            ) : null}

            <div className="grid w-full lg:grid-cols-[260px_1fr]">

                {/* Sidebar */}
                <aside
                    className={[
                        "fixed z-50 h-full w-[260px] bg-white",
                        "border-r border-slate-200",
                        "lg:sticky lg:top-0 lg:block lg:h-screen",
                        mobileOpen ? "left-0" : "-left-[320px] lg:left-0",
                        "transition-all duration-200",
                    ].join(" ")}
                >
                    <div className="flex h-full flex-col">
                        {/* Brand */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                            <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">{title}</div>
                                <div className="text-xs text-slate-500 truncate">{subtitle ?? "Content editor"}</div>
                            </div>

                            <button
                                className="lg:hidden inline-flex items-center justify-center h-9 w-9 border border-slate-200 bg-white hover:bg-slate-50"
                                onClick={() => setMobileOpen(false)}
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Sidebar search */}
                        <div className="px-4 py-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                <input
                                    placeholder="Search sections…"
                                    className="w-full border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:border-slate-300"
                                />
                            </div>
                        </div>

                        {/* Nav */}
                        <nav className="flex-1 px-2 pb-3">
                            <div className="px-2 pb-2 text-[11px] font-semibold tracking-wide text-slate-500">
                                CONTENT
                            </div>

                            <div className="space-y-1">
                                {items.map((it) => {
                                    const Icon = it.icon;
                                    const isActive = it.id === active;

                                    return (
                                        <button
                                            key={it.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(it.id as AdminSectionId);
                                                setMobileOpen(false);
                                            }}
                                            className={[
                                                "group flex w-full items-center justify-between px-3 py-2",
                                                "border border-transparent",
                                                isActive
                                                    ? "bg-slate-100 text-slate-900 border-slate-200"
                                                    : "hover:bg-slate-50 text-slate-800",
                                            ].join(" ")}
                                        >
                                            <span className="flex items-center gap-3">
                                                <Icon className="h-4 w-4 text-slate-600" />
                                                <span className="text-sm font-medium">{it.label}</span>
                                            </span>

                                            <span className="flex items-center gap-2">
                                                {it.badge ? (
                                                    <span className="border border-slate-200 bg-white px-2 py-[2px] text-[11px] font-semibold text-slate-600">
                                                        {it.badge}
                                                    </span>
                                                ) : null}
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Sidebar footer actions */}
                        <div className="border-t border-slate-200 px-4 py-3">
                            <div className="text-[11px] text-slate-500">v0.1 • Firebase-ready</div>
                            <div className="mt-3 grid grid-cols-2 gap-2">
                                {/* <a
                                    href="/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                                >
                                    <Eye className="h-4 w-4" /> Preview
                                </a> */}
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center gap-2 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                                >
                                    <UploadCloud className="h-4 w-4" /> Publish
                                </button>

                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main */}
                <main className="min-h-screen">
                    {/* Topbar */}
                    <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
                            {/* left */}
                            <div className="flex items-center gap-3 min-w-0">
                                <button
                                    className="lg:hidden inline-flex items-center justify-center h-9 w-9 border border-slate-200 bg-white hover:bg-slate-50"
                                    onClick={() => setMobileOpen(true)}
                                    aria-label="Open menu"
                                >
                                    <Menu className="h-4 w-4" />
                                </button>

                                <div className="min-w-0">
                                    <div className="text-sm font-semibold truncate">
                                        {activeItem?.label ?? "Admin"}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">
                                        {subtitle ?? "Manage content"}
                                    </div>
                                </div>
                            </div>

                            {/* center search */}
                            <div className="hidden md:block w-full max-w-[520px]">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                                    <input
                                        placeholder="Search content… (later)"
                                        className="w-full border border-slate-200 bg-white pl-8 pr-3 py-2 text-sm outline-none focus:border-slate-300"
                                    />
                                </div>
                            </div>

                            {/* right */}
                            <div className="flex items-center gap-2 shrink-0">
                                {rightActions}

                                {/* <a
                                    href="/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hidden sm:inline-flex items-center gap-2 border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                                >
                                    <Eye className="h-4 w-4" /> Preview
                                </a> */}

                                <button className="inline-flex items-center gap-2 bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">
                                    <UploadCloud className="h-4 w-4" /> Publish
                                </button>

                                {/* User menu */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setUserOpen((v) => !v)}
                                        className="inline-flex items-center gap-2 border border-slate-200 bg-white px-2.5 py-2 hover:bg-slate-50"
                                        aria-expanded={userOpen}
                                        aria-label="User menu"
                                    >
                                        {user.avatarUrl ? (
                                            <img
                                                src={user.avatarUrl}
                                                alt=""
                                                className="h-7 w-7 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                                                <User className="h-4 w-4" />
                                            </span>
                                        )}

                                        <span className="hidden md:block text-left leading-tight">
                                            <span className="block text-sm font-semibold">{user.name}</span>
                                            <span className="block text-xs text-slate-500">{user.role ?? "Editor"}</span>
                                        </span>

                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </button>

                                    {userOpen ? (
                                        <>
                                            <button
                                                className="fixed inset-0 z-10"
                                                aria-label="Close user menu"
                                                onClick={() => setUserOpen(false)}
                                            />
                                            <div className="absolute right-0 z-20 mt-2 w-56 border border-slate-200 bg-white shadow-lg">
                                                <div className="border-b border-slate-200 px-3 py-2">
                                                    <div className="text-sm font-semibold">{user.name}</div>
                                                    {user.email ? (
                                                        <div className="text-xs text-slate-500">{user.email}</div>
                                                    ) : null}
                                                </div>

                                                <button
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                                                    type="button"
                                                    onClick={() => {
                                                        setUserOpen(false);
                                                        // later: navigate("/admin/settings")
                                                    }}
                                                >
                                                    <Settings className="h-4 w-4 text-slate-500" />
                                                    Account settings
                                                </button>

                                                <button
                                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50"
                                                    type="button"
                                                    onClick={() => {
                                                        setUserOpen(false);
                                                        // later: firebase auth signOut()
                                                    }}
                                                >
                                                    <LogOut className="h-4 w-4 text-slate-500" />
                                                    Sign out
                                                </button>
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-4 py-6 lg:px-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
