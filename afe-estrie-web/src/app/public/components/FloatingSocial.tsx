import React, { useEffect, useMemo, useState } from "react";
import { Facebook, Linkedin, Instagram, Youtube } from "lucide-react";
import type { FooterCMS, SocialId } from "../../../content/types/footer";
import { getFooter } from "../../../services/footerRepo";

const ICONS: Record<SocialId, React.ReactNode> = {
    facebook: <Facebook className="h-6 w-6" />,
    linkedin: <Linkedin className="h-6 w-6" />,
    instagram: <Instagram className="h-6 w-6" />,
    youtube: <Youtube className="h-6 w-6" />,
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
        (async () => {
            const f = await getFooter();
            setFooter(f);
        })();
    }, []);

    const socials = useMemo(() => {
        const block = footer?.socialFloating;

        // 🔑 default ON unless explicitly false
        if (block?.enabled === false) return [];

        return (block?.items ?? [])
            .filter((x) => x.enabled !== false)
            .filter((x) => !!x.href?.trim())
            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
            .map((x) => ({
                ...x,
                icon: ICONS[x.id],
                color: hoverClassById(x.id),
            }));
    }, [footer]);

    if (!socials.length) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <div className="flex flex-col items-center gap-3">
                {/* top decorative line */}
                <div className="h-10 w-0.5 bg-gradient-to-b from-gray-300/50 to-transparent" />

                <div className="flex flex-col gap-3">
                    {socials.map((social) => (
                        <a
                            key={social.id}
                            href={social.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={social.label}
                            className={[
                                "group relative flex h-12 w-12 items-center justify-center rounded-full",
                                "border border-gray-200/80 bg-white/90 backdrop-blur-sm",
                                "shadow-lg transition-all duration-300",
                                "hover:scale-110 hover:shadow-xl",
                                social.color,
                            ].join(" ")}
                        >
                            {/* tooltip */}
                            <div className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                                {social.label}
                                <div className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 translate-x-1/2 rotate-45 bg-gray-900" />
                            </div>

                            {/* icon */}
                            <span className="text-gray-700 transition-colors duration-300 group-hover:text-white">
                                {social.icon}
                            </span>

                            {/* hover ring */}
                            <div className="absolute inset-0 rounded-full border-2 border-transparent transition-all duration-300 group-hover:border-white/30" />
                        </a>
                    ))}
                </div>

                {/* bottom decorative line */}
                <div className="h-4 w-0.5 bg-gradient-to-t from-gray-300/30 to-transparent" />
            </div>
        </div>
    );
};
