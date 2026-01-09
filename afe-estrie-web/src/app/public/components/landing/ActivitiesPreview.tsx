const activityItems = [
    { title: "Atelier Méditation — Sherbrooke", meta: "Ateliers / Cours" },
    { title: "Club de marche", meta: "Activités sociales" },
    { title: "Yoga", meta: "Ateliers / Cours" },
];

export function ActivitiesPreview() {
    return (
        <section className="py-16" id="activites">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-red-700">Activités</p>
                        <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Activités</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Aperçu des activités (données dynamiques plus tard).
                        </p>
                    </div>
                    <a className="text-sm font-semibold text-red-700 hover:underline" href="#">
                        Voir tout →
                    </a>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {activityItems.map((it) => (
                        <div
                            key={it.title}
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                        >
                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                {it.meta}
                            </span>
                            <p className="mt-3 text-base font-bold text-gray-900">{it.title}</p>

                            <div className="mt-6">
                                <a
                                    href="#"
                                    className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                >
                                    Détails
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
