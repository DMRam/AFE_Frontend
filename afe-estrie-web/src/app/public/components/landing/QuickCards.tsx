type QuickCard = {
    id: string;
    title: string;
    description?: string;
    href?: string;
};

export function QuickCards({
    heading,
    cards,
    moreLabel = "En savoir plus",
}: {
    heading?: string;
    cards: QuickCard[];
    moreLabel?: string;
}) {
    const safeCards = (cards ?? []).filter((c) => c?.title);

    if (!safeCards.length) return null;

    return (
        <section className="relative z-10 -mt-4 lg:-mt-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                {heading ? (
                    <div className="mb-6">
                        {/* <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">{heading}</h2> */}
                    </div>
                ) : null}

                <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
                    {safeCards.map((c) => {
                        const Wrapper: any = c.href ? "a" : "div";
                        const wrapperProps = c.href ? { href: c.href } : {};

                        return (
                            <Wrapper
                                key={c.id}
                                {...wrapperProps}
                                className="group rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                            >
                                <p className="text-base font-bold text-gray-900 sm:text-lg">{c.title}</p>

                                {c.description ? (
                                    <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-4 sm:line-clamp-5">
                                        {c.description}
                                    </p>
                                ) : null}

                                {c.href ? (
                                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-red-700">
                                        {moreLabel}{" "}
                                        <span className="transition group-hover:translate-x-1">→</span>
                                    </div>
                                ) : null}
                            </Wrapper>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}