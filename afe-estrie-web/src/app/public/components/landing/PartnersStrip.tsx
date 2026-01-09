export function PartnersStrip() {
    return (
        <section className="bg-gray-50 py-16" id="apropos">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-red-700">Partenaires</p>
                        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                            Partenaires & collaborateurs
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                            Une bannière bien visible pour remercier et mettre en valeur nos partenaires.
                            (Cette section sera alimentée depuis le dashboard.)
                        </p>
                    </div>

                    <a
                        href="#contact"
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                        Devenir partenaire
                    </a>
                </div>

                <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="flex h-16 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-400"
                            >
                                LOGO
                            </div>
                        ))}
                    </div>

                    <p className="mt-4 text-xs text-gray-500">
                        Les logos seront importés (Firebase Storage) et gérés via le tableau de bord.
                    </p>
                </div>
            </div>
        </section>
    );
}
