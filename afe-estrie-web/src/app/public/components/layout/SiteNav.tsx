const nav = [
    { label: "À propos", href: "#apropos" },
    { label: "Relation d’aide", href: "#aide" },
    { label: "Groupes de partage", href: "#groupes" },
    { label: "Activités", href: "#activites" },
    { label: "Événements", href: "#evenements" },
    { label: "Boutique", href: "#boutique" },
    { label: "Ressources", href: "#ressources" },
    { label: "Nous joindre", href: "#contact" },
];

export function SiteNav() {
    return (
        <nav className="hidden md:block bg-red-700">
            <div className="mx-auto max-w-7xl px-6">
                <ul className="flex flex-wrap items-center justify-center gap-6 py-3">
                    {nav.map((item) => (
                        <li key={item.label}>
                            <a
                                href={item.href}
                                className="inline-flex rounded-md px-2 py-2 text-sm font-semibold text-white/95 hover:text-white hover:bg-white/10"
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </nav>

    );
}

