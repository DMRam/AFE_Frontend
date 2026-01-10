const cards = [
    { title: "En bref", desc: "Qu’est-ce que la fibromyalgie? Un terme plutôt méconnu des gens. La fibromyalgie est un syndrome caractérisé par de la fatigue et des douleurs chroniques. La fibromyalgie est totalement invisible. Les personnes qui en souffrent semblent souvent en pleine santé. Par ailleurs, leur sommeil profond est perturbé; elles ne se sentent donc pas reposées au lever et éprouvent souvent des raideurs matinales. Pour en savoir plus sur la fibromyalgie, cliquer sur le bouton « Continuer » ci-dessous.", href: "#aide" },
    { title: "Diagnostic", desc: "Le médecin peut établir un diagnostic, il tient tout d’abord compte de l’historique médical de son patient et de la sévérité des symptômes majeurs. Il s’assure ensuite de l’absence d’autres maladies qui provoquent des symptômes semblables. Puis il effectue un examen clinique pour évaluer l’étendue et l’intensité de la douleur afin d’établir son diagnostic. Pour en savoir plus sur les méthodes utilisées permettant de diagnostiquer la fibromyalgie, cliquer sur le bouton « Continuer » ci-dessous.", href: "#groupes" },
    { title: "Symptômes", desc: "Vous vous demandez si vos symptômes correspondent à la fibromyalgie ou à autre chose. Les symptômes de la fibromyalgie sont divers et complexes. La douleur est le principal symptôme et s’accompagne souvent d’autres troubles métaboliques comme les migraines, le côlon irritable et certains problèmes de concentration et de mémoire. Des symptômes de confusion, de distraction sont aussi fréquents, on fait alors allusion au fibro brouillard. Pour en savoir plus, cliquer sur le bouton « Continuer ».", href: "#membre" },
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
