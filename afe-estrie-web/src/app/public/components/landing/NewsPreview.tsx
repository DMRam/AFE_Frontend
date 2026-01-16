import type { HomePageCMS } from "../../../../content/types/homePage";

export function NewsPreview({ home }: { home?: HomePageCMS | null }) {
    const block = (home as any)?.news;
    if (block?.enabled === false) return null;

    const items = (block?.items ?? [])
        .filter((x: any) => x?.enabled !== false)
        .slice()
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));

    return (
        <section className="bg-white py-16" id="actualites">
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold text-red-700">{block?.eyebrow ?? "Nos actualités"}</p>
                        <h2 className="mt-2 text-3xl font-extrabold text-gray-900">{block?.heading ?? "Nos actualités"}</h2>
                        {block?.subheading ? (
                            <p className="mt-2 max-w-2xl text-sm text-gray-600">{block.subheading}</p>
                        ) : null}
                    </div>

                    {block?.ctaLabel && block?.ctaHref ? (
                        <a
                            href={block.ctaHref}
                            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                        >
                            {block.ctaLabel}
                        </a>
                    ) : null}
                </div>

                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((it: any) => (
                        <a
                            key={it.id}
                            href={it.href || "#"}
                            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                            <div className="relative h-44 w-full bg-gray-100">
                                {it.coverSrc ? (
                                    <img
                                        src={it.coverSrc}
                                        alt={it.coverAlt || it.title || "Actualité"}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                                        loading="lazy"
                                    />
                                ) : null}

                                <div className="absolute left-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white">
                                    +
                                </div>
                            </div>

                            <div className="p-5">
                                <h3 className="line-clamp-2 text-base font-extrabold text-red-700 group-hover:underline">
                                    {it.title}
                                </h3>

                                {it.excerpt ? (
                                    <p className="mt-2 line-clamp-3 text-sm text-gray-600">{it.excerpt}</p>
                                ) : null}

                                <div className="mt-4 flex items-center gap-3 text-xs text-gray-500">
                                    {it.date ? <span className="font-semibold">{it.date}</span> : null}
                                    {it.readingTime ? <span>• {it.readingTime}</span> : null}
                                </div>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
