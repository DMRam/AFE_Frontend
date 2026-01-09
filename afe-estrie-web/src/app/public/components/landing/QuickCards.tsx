const cards = [
    { title: "Relation d’aide", desc: "Soutien et écoute, selon vos besoins.", href: "#aide" },
    { title: "Groupes de partage", desc: "Rencontres et échanges en communauté.", href: "#groupes" },
    { title: "Devenir membre", desc: "Accès aux activités et soutien de l’AFE.", href: "#membre" },
];

export function QuickCards() {
    return (
        <section className="-mt-16 relative z-10">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid gap-4 md:grid-cols-3">
                    {cards.map((c) => (
                        <a
                            key={c.title}
                            href={c.href}
                            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <p className="text-base font-bold text-gray-900">{c.title}</p>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600">{c.desc}</p>
                            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                                En savoir plus <span className="transition group-hover:translate-x-0.5">→</span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
