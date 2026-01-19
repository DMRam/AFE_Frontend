import React, { useEffect, useMemo, useState } from "react";
import type { FooterCMS, SocialId } from "../../../content/types/footer";
import { getFooter } from "../../../services/footerRepo";


const ICONS: Record<SocialId, React.ReactNode> = {
    facebook: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    ),
    linkedin: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    ),
    instagram: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
        </svg>
    ),
    youtube: (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    ),
};

function hoverClassById(id: SocialId) {
    switch (id) {
        case "facebook":
            return "hover:bg-[#1877F2]";
        case "linkedin":
            return "hover:bg-[#0A66C2]";
        case "instagram":
            return "hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#FCAF45]";
        case "youtube":
            return "hover:bg-[#FF0000]";
    }
}

export const FloatingSocial = () => {
    const [footer, setFooter] = useState<FooterCMS | null>(null);

    useEffect(() => {
        (async () => setFooter(await getFooter()))();
    }, []);

    const socials = useMemo(() => {
        const block = footer?.socialFloating;
        if (!block?.enabled) return [];

        return [...(block.items ?? [])]
            .filter((x) => x.enabled !== false)
            .filter((x) => !!x.href)
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map((x) => ({
                ...x,
                icon: ICONS[x.id],
                color: hoverClassById(x.id),
            }));
    }, [footer]);

    if (!socials.length) return null;

    return (
        <div className="fixed bottom-6 right-6 z-40">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-0.5 bg-gradient-to-b from-gray-300/50 to-transparent" />

                <div className="flex flex-col gap-3">
                    {socials.map((social) => (
                        <a
                            key={social.id}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={[
                                "group relative flex h-10 w-10 items-center justify-center rounded-full",
                                "border border-gray-200/80 bg-white/90 backdrop-blur-sm",
                                "shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl",
                                social.color,
                            ].join(" ")}
                            aria-label={social.label}
                            title={social.label}
                        >
                            <div className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                {social.label}
                                <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rotate-45 bg-gray-900" />
                            </div>

                            <span className="text-gray-700 transition-colors duration-300 group-hover:text-white">
                                {social.icon}
                            </span>

                            <div className="absolute inset-0 rounded-full border-2 border-transparent transition-all duration-300 group-hover:border-white/30" />
                        </a>
                    ))}
                </div>

                <div className="h-4 w-0.5 bg-gradient-to-t from-gray-300/30 to-transparent" />
            </div>
        </div>
    );
};
