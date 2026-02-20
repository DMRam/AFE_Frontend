import type { HomePageCMS } from "../../../../content/types/homePage";

export function NewsPreview({ home }: { home?: HomePageCMS | null }) {
    const block = (home as any)?.news;
    if (block?.enabled === false) return null;

    const items = (block?.items ?? [])
        .filter((x: any) => x?.enabled !== false)
        .slice()
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));

    const eyebrow = block?.eyebrow ?? "Nos actualités";
    const heading = block?.heading ?? "Nos actualités";

    return (
        <section className="bg-white py-16" id="actualites">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-red-700">{eyebrow}</p>
                        <h2 className="mt-2 text-3xl font-extrabold text-gray-900">{heading}</h2>
                        {block?.subheading ? (
                            <p className="mt-2 max-w-2xl text-sm text-gray-600">{block.subheading}</p>
                        ) : null}
                    </div>

                    {block?.ctaLabel && block?.ctaHref ? (
                        <a
                            href={block.ctaHref}
                            className="
                inline-flex items-center justify-center rounded-xl
                bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm
                transition hover:bg-red-700
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40
              "
                        >
                            {block.ctaLabel}
                        </a>
                    ) : null}
                </div>

                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {!items.length ? (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                            Aucune actualité pour le moment.
                            {block?.ctaLabel && block?.ctaHref ? (
                                <>
                                    {" "}
                                    <a className="font-semibold text-red-700 underline" href={block.ctaHref}>
                                        {block.ctaLabel}
                                    </a>
                                </>
                            ) : null}
                        </div>
                    ) : (
                        items.map((it: any) => (
                            <a
                                key={it.id}
                                href={it.href || "#"}
                                className="
                  group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm
                  transition-all duration-200
                  hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40
                "
                            >
                                <div className="relative h-48 w-full bg-gray-100">
                                    {it.coverSrc ? (
                                        <img
                                            src={it.coverSrc}
                                            alt={it.coverAlt || it.title || "Actualité"}
                                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200" />
                                    )}

                                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-extrabold text-white shadow-sm">
                                        Lire <span aria-hidden="true">→</span>
                                    </div>
                                </div>

                                <div className="p-5">
                                    <h3 className="line-clamp-2 text-base font-extrabold text-red-700 group-hover:underline">
                                        {it.title}
                                    </h3>

                                    {it.excerpt ? (
                                        <p className="mt-2 line-clamp-3 text-sm text-gray-600">{it.excerpt}</p>
                                    ) : null}

                                    {(it.date || it.readingTime) && (
                                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                            {it.date ? <span className="font-semibold">{it.date}</span> : null}
                                            {it.readingTime ? <span>• {it.readingTime}</span> : null}
                                        </div>
                                    )}

                                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                                        Ouvrir{" "}
                                        <span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                                            →
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}