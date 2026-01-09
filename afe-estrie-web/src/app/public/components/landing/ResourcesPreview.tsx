const resourceItems = [
    { title: "Guide – Comprendre la fibromyalgie", tag: "PDF" },
    { title: "Liste de ressources – Estrie", tag: "Lien" },
    { title: "Conseils – Sommeil & routine", tag: "Article" },
];

export function ResourcesPreview() {
    return (
        <section className="py-16" id="ressources">
            <div className="mx-auto max-w-7xl px-6">
                <p className="text-sm font-semibold text-red-700">Ressources</p>
                <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Ressources</h2>
                <p className="mt-2 text-sm text-gray-600">Documents et liens importants (placeholder).</p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {resourceItems.map((it) => (
                        <a
                            key={it.title}
                            href="#"
                            className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                        >
                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                {it.tag}
                            </span>
                            <p className="mt-3 text-base font-bold text-gray-900">{it.title}</p>
                            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                                Ouvrir <span className="transition group-hover:translate-x-0.5">→</span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
