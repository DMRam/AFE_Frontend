import type { SplitTextImageSection } from "../../../content/types/pageBlocks";
import { useMemo } from "react";
import { ChevronRight, ExternalLink } from "lucide-react";
import DOMPurify from "dompurify";

type CtaVariant = "primary" | "secondary" | "outline";
type CtaSize = "sm" | "md" | "lg";
type CtaIcon = "none" | "arrow" | "external";

type CTA = {
    id?: string;
    enabled?: boolean;
    label?: string;
    href?: string;
    variant?: CtaVariant | string;
    size?: CtaSize | string;
    icon?: CtaIcon | string;
    newTab?: boolean;
    [k: string]: any; // tolerate extra DB props
};

type SplitTextImageSectionX = SplitTextImageSection & {
    body?: string;
    content?: string;
    titleColor?: "auto" | "dark" | "light" | "red" | "blue";
    textColorPreset?: "auto" | "dark" | "light";
    textOpacity?: number; // 0..100
    ctas?: CTA[];
};

interface SplitTextImageSectionViewProps {
    data: SplitTextImageSectionX;
}

function isExternal(href: string) {
    return /^https?:\/\//i.test(href);
}

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

function getBody(data: SplitTextImageSectionX) {
    return String(data.body ?? data.content ?? "");
}

function titleColorClass(preset: SplitTextImageSectionX["titleColor"]) {
    switch (preset) {
        case "light":
            return "text-white";
        case "dark":
            return "text-gray-900";
        case "blue":
            return "text-blue-900";
        case "red":
            return "text-red-800";
        default:
            return "text-red-800";
    }
}

function textColorClass(preset: SplitTextImageSectionX["textColorPreset"]) {
    switch (preset) {
        case "light":
            return "text-gray-100";
        case "dark":
            return "text-gray-800";
        default:
            return "text-gray-800";
    }
}

function normalizeVariant(v: unknown): CtaVariant {
    if (v === "secondary") return "secondary";
    if (v === "outline") return "outline";
    return "primary";
}
function normalizeSize(v: unknown): CtaSize {
    if (v === "sm") return "sm";
    if (v === "lg") return "lg";
    return "md";
}
function normalizeIcon(v: unknown): CtaIcon {
    if (v === "arrow") return "arrow";
    if (v === "external") return "external";
    return "none";
}

function ctaClass(variant: CtaVariant) {
    if (variant === "primary") return "bg-red-700 text-white hover:bg-red-800";
    if (variant === "secondary") return "bg-gray-900 text-white hover:bg-gray-800";
    return "border border-gray-300 text-gray-900 hover:bg-gray-50";
}

function ctaSizeClass(size: CtaSize) {
    if (size === "sm") return "px-4 py-2 text-sm";
    if (size === "lg") return "px-6 py-3 text-base";
    return "px-5 py-2.5 text-sm";
}

function normalizeCtas(input: any): Array<{
    id: string;
    enabled: boolean;
    label: string;
    href: string;
    variant: CtaVariant;
    size: CtaSize;
    icon: CtaIcon;
    newTab: boolean;
}> {
    if (!Array.isArray(input)) return [];

    return input
        .filter(Boolean)
        .map((c: any, idx: number) => {
            const label = String(c?.label ?? "").trim();
            const href = String(c?.href ?? "").trim();
            return {
                id: String(c?.id ?? `cta-${idx}-${label || "x"}`),
                enabled: c?.enabled !== false,
                label,
                href,
                variant: normalizeVariant(c?.variant),
                size: normalizeSize(c?.size),
                icon: normalizeIcon(c?.icon),
                newTab: Boolean(c?.newTab),
            };
        })
        .filter((c) => c.enabled && c.label && c.href)
        .slice(0, 3);
}

function looksLikeHtml(s: string) {
    const t = (s || "").trim();
    return t.startsWith("<") && /<\/?[a-z][\s\S]*>/i.test(t);
}

function imageFigureClass(size?: "sm" | "md" | "lg") {
    switch (size) {
        case "sm":
            return "max-w-[420px]";
        case "lg":
            return "max-w-[760px]";
        case "md":
        default:
            return "max-w-[580px]";
    }
}

export function SplitTextImageSectionView({ data }: SplitTextImageSectionViewProps) {
    if ((data as any).enabled === false) return null;

    const imageOnLeft = data.imageSide === "left";
    const sectionId = data.id ? `section-${data.id}` : undefined;

    const imageAlt = data.imageAlt || data.title || "Section image";
    const body = getBody(data);

    const opacity = clamp(Number(data.textOpacity ?? 100), 0, 100);
    const textStyle = opacity < 100 ? ({ opacity: opacity / 100 } as const) : undefined;

    const containerClasses = useMemo(
        () =>
            [
                "flex justify-center",
                imageOnLeft ? "md:order-1 md:justify-start" : "md:order-2 md:justify-end",
            ].join(" "),
        [imageOnLeft]
    );

    const textContainerClasses = useMemo(
        () => (imageOnLeft ? "md:order-2" : "md:order-1"),
        [imageOnLeft]
    );

    const visibleCtas = normalizeCtas((data as any).ctas);

    return (
        <section
            id={sectionId}
            className="scroll-mt-28"
            aria-labelledby={data.title ? `${sectionId}-title` : undefined}
        >

            <div className="grid items-center gap-8 lg:gap-10 md:grid-cols-2">

                {/* Image */}
                {data.imageUrl && (
                    <div className={containerClasses}>

                        <figure
                            className={[
                                "relative w-full",
                                "mx-auto md:mx-0",
                                imageFigureClass((data as any).imageSize),
                            ].join(" ")}
                            style={
                                typeof (data as any).imageMaxWidth === "number"
                                    ? { maxWidth: `${(data as any).imageMaxWidth}px` }
                                    : undefined
                            }
                        >

                            <img
                                src={data.imageUrl}
                                alt={imageAlt}
                                className="w-full rounded-2xl object-cover shadow-lg ring-1 ring-black/5"
                                loading="lazy"
                                decoding="async"
                                width={800}
                                height={600}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                }}
                            />
                            {data.imageAlt && (
                                <figcaption className="mt-2 text-sm text-gray-600 text-center">
                                    {data.imageAlt}
                                </figcaption>
                            )}
                        </figure>
                    </div>
                )}

                {/* Text */}
                <div className={textContainerClasses} style={textStyle}>
                    {data.title && (
                        <div className="space-y-3">
                            <h2
                                id={`${sectionId}-title`}
                                className={[
                                    "text-3xl md:text-4xl font-bold tracking-tight",
                                    titleColorClass(data.titleColor ?? "auto"),
                                ].join(" ")}
                            >
                                {data.title}
                            </h2>

                            <div
                                className={[
                                    "h-1 w-14 rounded-full",
                                    (data.titleColor ?? "auto") === "light" ? "bg-white/70" : "bg-red-700",
                                ].join(" ")}
                                aria-hidden="true"
                            />
                        </div>
                    )}

                    <div className="mt-6 space-y-4">
                        {body ? (
                            looksLikeHtml(body) ? (
                                <div
                                    className={[
                                        "text-base md:text-lg leading-relaxed",
                                        textColorClass(data.textColorPreset ?? "auto"),

                                        "[&_p]:my-3 [&_p:first-child]:mt-0",
                                        "[&_ul]:my-4 [&_ul]:pl-6 [&_ul]:list-disc",
                                        "[&_ol]:my-4 [&_ol]:pl-6 [&_ol]:list-decimal",
                                        "[&_li]:my-1",
                                        "[&_a]:text-red-700 [&_a]:underline hover:[&_a]:text-red-800",
                                        "[&_strong]:font-semibold",
                                    ].join(" ")}
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }}
                                />
                            ) : (
                                <p
                                    className={[
                                        "text-base md:text-lg leading-relaxed whitespace-pre-line",
                                        textColorClass(data.textColorPreset ?? "auto"),
                                    ].join(" ")}
                                >
                                    {body}
                                </p>
                            )
                        ) : null}

                        {/* CTAs */}
                        {visibleCtas.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-3">
                                {visibleCtas.map((cta) => {
                                    const external = isExternal(cta.href);
                                    const openBlank = cta.newTab || external;

                                    return (
                                        <a
                                            key={cta.id}
                                            href={cta.href}
                                            target={openBlank ? "_blank" : undefined}
                                            rel={openBlank ? "noopener noreferrer" : undefined}
                                            className={[
                                                "inline-flex items-center justify-center gap-2 rounded-full font-semibold shadow-sm transition",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
                                                ctaSizeClass(cta.size),
                                                ctaClass(cta.variant),
                                            ].join(" ")}
                                            aria-label={`${cta.label}${data.title ? ` - ${data.title}` : ""}`}
                                        >
                                            <span>{cta.label}</span>

                                            {cta.icon === "external" ? (
                                                <ExternalLink className="h-4 w-4" />
                                            ) : cta.icon === "arrow" ? (
                                                <ChevronRight className="h-4 w-4" />
                                            ) : cta.icon === "none" ? null : external ? (
                                                // fallback if icon not set but link is external
                                                <ExternalLink className="h-4 w-4" />
                                            ) : null}
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
