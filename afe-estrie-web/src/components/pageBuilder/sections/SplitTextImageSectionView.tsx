import type { SplitTextImageSection } from "../../../content/types/pageBlocks";
import { useMemo } from "react";

interface SplitTextImageSectionViewProps {
    data: SplitTextImageSection;
}

export function SplitTextImageSectionView({ data }: SplitTextImageSectionViewProps) {
    const imageOnLeft = data.imageSide === "left";

    const sectionId = data.id ? `section-${data.id}` : undefined;
    const imageAlt = data.imageAlt || data.title || "Section image";

    const containerClasses = useMemo(() => [
        "flex justify-center",
        imageOnLeft ? "md:order-1 md:justify-start" : "md:order-2 md:justify-end",
    ].join(" "), [imageOnLeft]);

    const textContainerClasses = useMemo(() =>
        imageOnLeft ? "md:order-2" : "md:order-1",
        [imageOnLeft]);

    return (
        <section
            id={sectionId}
            className="scroll-mt-28"
            aria-labelledby={data.title ? `${sectionId}-title` : undefined}
        >
            <div className="grid items-center gap-10 md:grid-cols-2">
                {/* Image Container */}
                {data.imageUrl && (
                    <div className={containerClasses}>
                        <figure className="relative w-full max-w-md">
                            <img
                                src={data.imageUrl}
                                alt={imageAlt}
                                className="w-full rounded-2xl object-cover shadow-lg ring-1 ring-black/5"
                                loading="lazy"
                                decoding="async"
                                width={800}
                                height={600}
                                onError={(e) => {
                                    // Fallback handling
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    // Could add a placeholder image here
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

                {/* Text Content */}
                <div className={textContainerClasses}>
                    {data.title && (
                        <div className="space-y-3">
                            <h2
                                id={`${sectionId}-title`}
                                className="text-3xl md:text-4xl font-bold tracking-tight text-red-800"
                            >
                                {data.title}
                            </h2>
                            <div
                                className="h-1 w-14 rounded-full bg-red-700"
                                aria-hidden="true"
                            />
                        </div>
                    )}

                    <div className="mt-6 space-y-4">
                        {data.content && (
                            <p className="text-base md:text-lg leading-relaxed text-gray-800 whitespace-pre-line">
                                {data.content}
                            </p>
                        )}

                        {/* Optional CTA Button */}
                        {/* {data.ctaText && data.ctaLink && (
                            <div className="pt-2">
                                <a
                                    href={data.ctaLink}
                                    className="inline-flex items-center px-5 py-3 text-base font-medium text-red-800 hover:text-red-900 transition-colors"
                                    aria-label={`${data.ctaText} - ${data.title || 'Learn more'}`}
                                >
                                    {data.ctaText}
                                    <svg
                                        className="ml-2 w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                            </div>
                        )} */}
                    </div>
                </div>
            </div>
        </section>
    );
}