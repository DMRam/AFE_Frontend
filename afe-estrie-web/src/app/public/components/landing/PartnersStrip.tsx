import { useEffect, useMemo, useState } from "react";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { storage } from "../../../../services/firebase";
import type { HomePageCMS } from "../../../../content/types/homePage";

function isHttp(s: string) {
    return /^https?:\/\//i.test(s);
}

async function resolveSrc(src: string): Promise<string> {
    if (!src) return "";
    if (isHttp(src)) return src;
    return await getDownloadURL(storageRef(storage, src));
}

// Color palette based on #af2511
const PRIMARY = "#af2511"; // Deep red/orange
const PRIMARY_LIGHT = "#e8452d"; // Lighter version
const PRIMARY_DARK = "#8a1e0d"; // Darker version
const ACCENT = "#f97316"; // Orange accent
const NEUTRAL_LIGHT = "#f8fafc"; // Light background
const NEUTRAL_MID = "#e2e8f0"; // Mid gray
const NEUTRAL_DARK = "#1e293b"; // Dark text

export function PartnersStrip({ home }: { home?: HomePageCMS | null }) {
    const block = home?.partners;
    if (!block?.enabled) return null;

    const logos = block.logos ?? [];

    const sorted = useMemo(() => {
        return logos
            .filter((l: any) => l?.enabled !== false)
            .slice()
            .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0));
    }, [logos]);

    const [resolved, setResolved] = useState<Record<string, string>>({});

    useEffect(() => {
        let alive = true;
        (async () => {
            const next: Record<string, string> = {};
            await Promise.all(
                sorted.map(async (l: any) => {
                    try {
                        next[l.id] = await resolveSrc(l.src);
                    } catch {
                        next[l.id] = "";
                    }
                })
            );
            if (alive) setResolved(next);
        })();
        return () => {
            alive = false;
        };
    }, [sorted]);

    const hasLogos = sorted.length > 0;

    return (
        <section
            className="relative overflow-hidden bg-gradient-to-b from-white to-[#fef7f5] py-20"
            id="partenaires"
            style={{ backgroundColor: NEUTRAL_LIGHT }}
        >
            {/* Decorative elements with primary color palette */}
            <div
                className="absolute -left-40 top-1/4 h-96 w-96 rounded-full blur-3xl opacity-20"
                style={{
                    background: `radial-gradient(circle, ${PRIMARY}30, ${ACCENT}20, transparent 70%)`
                }}
            />
            <div
                className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full blur-3xl opacity-20"
                style={{
                    background: `radial-gradient(circle, ${PRIMARY_DARK}30, ${ACCENT}20, transparent 70%)`
                }}
            />

            <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-16 text-center">
                    <div
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-sm"
                        style={{
                            backgroundColor: `${PRIMARY}15`,
                            border: `1px solid ${PRIMARY}30`
                        }}
                    >
                        <svg
                            className="h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: PRIMARY }}
                        >
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        <span
                            className="text-sm font-semibold"
                            style={{ color: PRIMARY }}
                        >
                            Partenariats stratégiques
                        </span>
                    </div>

                    <h2
                        className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl"
                        style={{ color: NEUTRAL_DARK }}
                    >
                        Partenaires & <span style={{ color: PRIMARY }}>Collaborateurs</span>
                    </h2>

                    <p
                        className="mx-auto mt-4 max-w-2xl text-lg"
                        style={{ color: NEUTRAL_DARK }}
                    >
                        Des organisations engagées qui <span style={{ color: PRIMARY, fontWeight: 600 }}>soutiennent notre mission</span> chaque jour
                    </p>

                    <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <a
                            href="#contact"
                            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                            style={{
                                background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_LIGHT})`,
                                boxShadow: `0 10px 25px ${PRIMARY}40`
                            }}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Devenir partenaire
                        </a>

                        <a
                            href="#don"
                            className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold shadow-sm transition-all hover:scale-105"
                            style={{
                                borderColor: `${PRIMARY}40`,
                                backgroundColor: 'white',
                                color: PRIMARY
                            }}
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            Soutenir l'association
                        </a>
                    </div>
                </div>

                {/* Premium Logos Container */}
                <div className="relative">
                    {/* Glowing border */}
                    <div
                        className="absolute -inset-0.5 rounded-3xl blur"
                        style={{
                            background: `linear-gradient(135deg, ${PRIMARY}40, ${ACCENT}40, ${PRIMARY}40)`
                        }}
                    />

                    <div
                        className="relative rounded-3xl p-8 shadow-2xl backdrop-blur-sm"
                        style={{
                            backgroundColor: 'white',
                            boxShadow: `0 20px 60px ${PRIMARY}15`
                        }}
                    >
                        {/* Grid header */}
                        <div className="mb-10 text-center">
                            <h3
                                className="text-2xl font-bold"
                                style={{ color: NEUTRAL_DARK }}
                            >
                                Ils nous <span style={{ color: PRIMARY }}>font confiance</span>
                            </h3>
                            <div
                                className="mx-auto mt-2 h-1 w-24 rounded-full"
                                style={{
                                    background: `linear-gradient(to right, ${PRIMARY}, ${ACCENT})`
                                }}
                            />
                        </div>

                        {/* Enhanced Logo Wall */}
                        <div className="relative">
                            {/* Gradient overlays for fade effect */}
                            <div
                                className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20"
                                style={{
                                    background: `linear-gradient(to right, white, transparent)`
                                }}
                            />
                            <div
                                className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20"
                                style={{
                                    background: `linear-gradient(to left, white, transparent)`
                                }}
                            />

                            <div className="flex overflow-x-auto pb-8 scrollbar-hide">
                                <div className="flex gap-8 px-4">
                                    {hasLogos ? (
                                        sorted.map((l: any, index: number) => {
                                            const url = resolved[l.id] ?? "";
                                            const clickable = !!l.href;
                                            const isPremium = l.premium === true;
                                            const Tile = clickable ? "a" : "div";
                                            const tileProps = clickable
                                                ? {
                                                    href: l.href,
                                                    target: l.href?.startsWith("http") ? "_blank" : undefined,
                                                    rel: l.href?.startsWith("http") ? "noreferrer" : undefined,
                                                }
                                                : {};

                                            return (
                                                <Tile
                                                    key={l.id}
                                                    {...(tileProps as any)}
                                                    className={`
                                                        group relative flex items-center justify-center
                                                        rounded-2xl p-8 shadow-lg
                                                        transition-all duration-300
                                                        hover:scale-105 hover:-translate-y-1
                                                        ${isPremium ? 'ring-2 ring-offset-2' : ''}
                                                        ${clickable ? 'cursor-pointer' : ''}
                                                        w-[280px] flex-shrink-0 h-[180px]
                                                    `}
                                                    style={{
                                                        border: `1px solid ${NEUTRAL_MID}`,
                                                        backgroundColor: 'white',
                                                        boxShadow: `0 10px 30px ${PRIMARY}10`,
                                                        ...(isPremium ? {
                                                            borderColor: PRIMARY,
                                                            boxShadow: `0 10px 40px ${PRIMARY}25`
                                                        } : {})
                                                    }}
                                                    aria-label={clickable ? l.alt || "Partenaire" : undefined}
                                                    title={l.alt || "Partenaire"}
                                                >
                                                    {/* Premium badge */}
                                                    {isPremium && (
                                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                            <span
                                                                className="rounded-full px-3 py-1 text-xs font-semibold text-white shadow-lg"
                                                                style={{
                                                                    background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
                                                                    boxShadow: `0 5px 15px ${PRIMARY}40`
                                                                }}
                                                            >
                                                                ★ Premium
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Hover background effect */}
                                                    <div
                                                        className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${PRIMARY}05, ${PRIMARY}02, ${PRIMARY}05)`
                                                        }}
                                                    />

                                                    {/* Logo container */}
                                                    <div className="relative z-20">
                                                        {url ? (
                                                            <img
                                                                src={url}
                                                                alt={l.alt ?? "Logo partenaire"}
                                                                loading="lazy"
                                                                className={`
                                                                    w-auto object-contain transition-all duration-300
                                                                    h-16 lg:h-20
                                                                    grayscale opacity-90 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110
                                                                `}
                                                            />
                                                        ) : (
                                                            <div
                                                                className="h-20 w-48 animate-pulse rounded-lg"
                                                                style={{
                                                                    background: `linear-gradient(90deg, ${NEUTRAL_LIGHT}, ${NEUTRAL_MID}, ${NEUTRAL_LIGHT})`,
                                                                    backgroundSize: '200% 100%'
                                                                }}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Hover info */}
                                                    <div className="absolute inset-0 z-30 flex items-end justify-center opacity-0 transition-all duration-300 group-hover:opacity-100">
                                                        <div
                                                            className="mb-4 rounded-full px-4 py-2 shadow-lg backdrop-blur-sm"
                                                            style={{
                                                                backgroundColor: `${PRIMARY}90`,
                                                                color: 'white'
                                                            }}
                                                        >
                                                            <p className="text-xs font-semibold">
                                                                {l.alt || l.name || "Partenaire"}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* External link indicator */}
                                                    {clickable && l.href?.startsWith("http") && (
                                                        <div
                                                            className="absolute right-3 top-3 z-40 rounded-full p-2 shadow-md opacity-0 transition-opacity group-hover:opacity-100"
                                                            style={{
                                                                backgroundColor: `${PRIMARY}90`,
                                                                color: 'white'
                                                            }}
                                                        >
                                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </Tile>
                                            );
                                        })
                                    ) : (
                                        // Loading skeleton
                                        Array.from({ length: 6 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-[280px] flex-shrink-0 h-[180px] rounded-2xl animate-pulse"
                                                style={{
                                                    background: `linear-gradient(90deg, ${NEUTRAL_LIGHT}, ${NEUTRAL_MID}, ${NEUTRAL_LIGHT})`,
                                                    backgroundSize: '200% 100%'
                                                }}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Scroll indicator */}
                            <div className="mt-6 flex items-center justify-center gap-2">
                                {Array.from({ length: hasLogos ? Math.min(6, sorted.length) : 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-1.5 w-1.5 rounded-full transition-all"
                                        style={{
                                            backgroundColor: i === 0 ? PRIMARY : NEUTRAL_MID
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Stats/Counter */}
                        <div
                            className="mt-12 grid grid-cols-2 gap-6 rounded-2xl p-6 backdrop-blur-sm sm:grid-cols-4"
                            style={{
                                background: `linear-gradient(135deg, ${PRIMARY}08, ${PRIMARY}04)`,
                                border: `1px solid ${PRIMARY}20`
                            }}
                        >
                            <div className="text-center">
                                <div
                                    className="text-3xl font-bold"
                                    style={{ color: PRIMARY }}
                                >
                                    {sorted.length}+
                                </div>
                                <div className="text-sm" style={{ color: NEUTRAL_DARK }}>
                                    Partenaires
                                </div>
                            </div>
                            <div className="text-center">
                                <div
                                    className="text-3xl font-bold"
                                    style={{ color: PRIMARY }}
                                >
                                    2024
                                </div>
                                <div className="text-sm" style={{ color: NEUTRAL_DARK }}>
                                    Année de création
                                </div>
                            </div>
                            <div className="text-center">
                                <div
                                    className="text-3xl font-bold"
                                    style={{ color: PRIMARY }}
                                >
                                    100%
                                </div>
                                <div className="text-sm" style={{ color: NEUTRAL_DARK }}>
                                    Engagement
                                </div>
                            </div>
                            <div className="text-center">
                                <div
                                    className="text-3xl font-bold"
                                    style={{ color: PRIMARY }}
                                >
                                    ∞
                                </div>
                                <div className="text-sm" style={{ color: NEUTRAL_DARK }}>
                                    Impact
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div
                            className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row"
                            style={{ borderColor: `${PRIMARY}20` }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-10 w-10 rounded-full p-2"
                                    style={{
                                        backgroundColor: `${PRIMARY}15`,
                                        color: PRIMARY
                                    }}
                                >
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: NEUTRAL_DARK }}>
                                        Ensemble, on va plus loin
                                    </p>
                                    <p className="text-xs" style={{ color: NEUTRAL_DARK, opacity: 0.7 }}>
                                        Rejoignez notre réseau de partenaires engagés
                                    </p>
                                </div>
                            </div>

                            <a
                                href="#contact"
                                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-sm transition-all hover:shadow-md"
                                style={{
                                    backgroundColor: 'white',
                                    color: PRIMARY,
                                    border: `1px solid ${PRIMARY}40`
                                }}
                            >
                                En savoir plus
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Add this to your global CSS for scrollbar hiding
const styles = `
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
`;

// Add the styles to your document head
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}