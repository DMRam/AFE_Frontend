import { useMemo } from "react";
import type { HomePageCMS } from "../../../../content/types/homePage";

type ResourceCMSItem = {
    id?: string;
    enabled?: boolean;
    order?: number;
    title?: string;
    description?: string;
    href?: string;
    meta?: string; // on l'utilise comme "type" (PDF / Lien / Article)
};

export function ResourcesPreview({ home }: { home?: HomePageCMS | null }) {
    const block = home?.resources;

    if (block?.enabled === false) return null;

    const heading = block?.header?.heading ?? "Ressources";
    const subheading =
        block?.header?.subheading ?? "Documents, liens utiles et outils.";

    const ctaLabel = block?.ctaLabel ?? "Voir toutes les ressources";
    const ctaHref = block?.ctaHref ?? "/ressources";

    const items = useMemo(() => {
        const raw = ((block as any)?.items ?? []) as ResourceCMSItem[];

        return raw
            .filter((x) => x?.enabled !== false)
            .slice()
            .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
            .map((it, idx) => ({
                id: it.id ?? `r${idx + 1}`,
                title: it.title ?? "",
                description: it.description ?? "",
                href: it.href ?? "#",
                tag: (it.meta ?? "").trim(), // PDF/Lien/Article
            }))
            .filter((x) => x.title.trim().length > 0);
    }, [block]);

    return (
        <section className="py-16" id="ressources">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                <p className="text-sm font-semibold text-red-700">{heading}</p>

                <div className="mt-2 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900">{heading}</h2>
                        <p className="mt-2 text-sm text-gray-600">{subheading}</p>
                    </div>

                    {ctaLabel && ctaHref ? (
                        <a
                            href={ctaHref}
                            className="hidden shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 sm:inline-flex"
                        >
                            {ctaLabel}
                        </a>
                    ) : null}
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {!items.length ? (
                        <div className="md:col-span-3 rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                            Aucune ressource pour le moment.
                            {ctaLabel && ctaHref ? (
                                <>
                                    {" "}
                                    <a className="font-semibold text-red-700 underline" href={ctaHref}>
                                        {ctaLabel}
                                    </a>
                                </>
                            ) : null}
                        </div>
                    ) : (
                        items.map((it) => (
                            <a
                                key={it.id}
                                href={it.href}
                                target="_blank"
                                className={[
                                    "group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm",
                                    "transition-all duration-200",
                                    "hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",
                                ].join(" ")}
                            >
                                {it.tag ? (
                                    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                        {it.tag}
                                    </span>
                                ) : (
                                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                        Ressource
                                    </span>
                                )}

                                <p className="mt-3 text-base font-bold text-gray-900">
                                    {it.title}
                                </p>

                                {it.description ? (
                                    <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                                        {it.description}
                                    </p>
                                ) : null}

                                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                                    Ouvrir{" "}
                                    <span className="transition-transform group-hover:translate-x-0.5">
                                        →
                                    </span>
                                </div>
                            </a>
                        ))
                    )}
                </div>

                {/* Mobile CTA */}
                {ctaLabel && ctaHref ? (
                    <div className="mt-6 sm:hidden">
                        <a
                            href={ctaHref}
                            className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
                        >
                            {ctaLabel}
                        </a>
                    </div>
                ) : null}
            </div>
        </section>
    );
}