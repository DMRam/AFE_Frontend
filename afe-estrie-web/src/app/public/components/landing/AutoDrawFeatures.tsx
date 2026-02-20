import { useEffect, useMemo, useRef, useState } from "react";
import type { HomePageCMS } from "../../../../content/types/homePage";

type IconKey = "warmEmbrace" | "gentleMovement" | "lightbulbHeart" | "holdingHands";

type CMSItem = {
  id?: string;
  enabled?: boolean;
  order?: number;
  title?: string;
  description?: string;
  body?: string;
  icon?: any;
  ctaText?: string;
  ctaLink?: string;
};

type Block = {
  enabled?: boolean;
  heading?: string;
  subheading?: string;
  items?: CMSItem[];
  ctaText?: string;
  ctaLink?: string;
  ctaEnabled?: boolean;
};

function useInViewOnce<T extends HTMLElement>(rootMargin = "-10% 0px -10% 0px") {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}

/** Default content for the 4 axes d'intervention */
const FALLBACK: Array<{ id: string; icon: IconKey; title: string; body: string }> = [
  {
    id: "axis1",
    icon: "warmEmbrace",
    title: "Soutien et accompagnement",
    body:
      "Un espace chaleureux d'écoute et de partage, où chaque personne trouve sa place et se sent comprise.",
  },
  {
    id: "axis2",
    icon: "gentleMovement",
    title: "Activités adaptées",
    body:
      "Des moments de bien-être en douceur, adaptés au rythme de chacun, pour se sentir vivant et connecté.",
  },
  {
    id: "axis3",
    icon: "lightbulbHeart",
    title: "Information et sensibilisation",
    body:
      "Des connaissances qui éclairent le chemin, avec bienveillance et sans jugement, pour mieux comprendre.",
  },
  {
    id: "axis4",
    icon: "holdingHands",
    title: "Défense des droits",
    body:
      "Ensemble, main dans la main, pour faire entendre nos voix et être reconnus dans nos besoins.",
  },
];

function normalizeIcon(raw: any, fallback: IconKey): IconKey {
  const v = String(raw ?? "").trim().toLowerCase();

  if (v === "warmembrace" || v === "gentlemovement" || v === "lightbulbheart" || v === "holdinghands")
    return v as IconKey;

  return fallback;
}

function CircleIcon({ icon, animate }: { icon: IconKey; animate: boolean }) {
  return (
    <svg viewBox="0 0 120 120" className="h-28 w-28 sm:h-32 sm:w-32" aria-hidden="true">
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className={["text-white/90", "draw", animate ? "draw-on" : "draw-off"].join(" ")}
        pathLength={1}
      />

      {icon === "warmEmbrace" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={["text-white", "draw", animate ? "draw-on delay-150" : "draw-off"].join(" ")}
          pathLength={1}
        >
          {/* Cœur doux et enveloppant */}
          <path d="M60 45c-8-10-24-8-28 2-4 10 4 20 28 30 24-10 32-20 28-30-4-10-20-12-28-2z"
            fill="none" stroke="currentColor" />
          {/* Bras qui enlacent */}
          <path d="M35 55c6 8 15 12 25 12" stroke="currentColor" />
          <path d="M85 55c-6 8-15 12-25 12" stroke="currentColor" />
          {/* Petites étoiles de bienveillance */}
          <circle cx="45" cy="45" r="2" fill="currentColor" />
          <circle cx="75" cy="45" r="2" fill="currentColor" />
        </g>
      )}

      {icon === "gentleMovement" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={["text-white", "draw", animate ? "draw-on delay-150" : "draw-off"].join(" ")}
          pathLength={1}
        >
          {/* Fleurs qui s'épanouissent */}
          <path d="M45 55c-2-8 4-15 10-15 6 0 12 7 10 15" stroke="currentColor" />
          <path d="M75 55c-2-8 4-15 10-15 6 0 12 7 10 15" stroke="currentColor" />
          {/* Mouvements doux et ondulants */}
          <path d="M30 70c8 3 16 3 24 0" stroke="currentColor" />
          <path d="M66 70c8 3 16 3 24 0" stroke="currentColor" />
          {/* Petites feuilles */}
          <path d="M52 45l-4-8" stroke="currentColor" />
          <path d="M68 45l4-8" stroke="currentColor" />
        </g>
      )}

      {icon === "lightbulbHeart" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={["text-white", "draw", animate ? "draw-on delay-150" : "draw-off"].join(" ")}
          pathLength={1}
        >
          {/* Ampoule douce avec cœur */}
          <path d="M60 30c-8 0-14 6-14 14 0 8 6 14 14 14s14-6 14-14c0-8-6-14-14-14z"
            stroke="currentColor" />
          <path d="M60 58v10" stroke="currentColor" />
          <path d="M50 72h20" stroke="currentColor" />
          {/* Rayons de lumière chaleureux */}
          <path d="M84 44l6-2" stroke="currentColor" />
          <path d="M30 44l-6-2" stroke="currentColor" />
          <path d="M74 30l4-6" stroke="currentColor" />
          <path d="M46 30l-4-6" stroke="currentColor" />
          {/* Petit cœur au centre */}
          <path d="M60 45c-2-3-6-2-7 0-1 2 0 5 7 8 7-3 8-6 7-8-1-2-5-3-7 0z"
            fill="currentColor" stroke="none" />
        </g>
      )}

      {icon === "holdingHands" && (
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          className={["text-white", "draw", animate ? "draw-on delay-150" : "draw-off"].join(" ")}
          pathLength={1}
        >
          {/* Cercle de personnes main dans la main */}
          <path d="M40 55c-4 0-8 4-8 8v6" stroke="currentColor" />
          <path d="M80 55c4 0 8 4 8 8v6" stroke="currentColor" />
          <path d="M45 70c0 4 5 8 15 8s15-4 15-8" stroke="currentColor" />
          {/* Mains qui se tiennent */}
          <path d="M48 60l-6 6" stroke="currentColor" />
          <path d="M72 60l6 6" stroke="currentColor" />
          <path d="M55 66l2 4" stroke="currentColor" />
          <path d="M65 66l-2 4" stroke="currentColor" />
          {/* Visages souriants (simples points) */}
          <circle cx="45" cy="52" r="2" fill="currentColor" />
          <circle cx="75" cy="52" r="2" fill="currentColor" />
          <circle cx="60" cy="58" r="2" fill="currentColor" />
        </g>
      )}
    </svg>
  );
}

export function AutoDrawFeatures({ home }: { home?: HomePageCMS | null }) {

  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  const block = (((home as any)?.features ?? (home as any)?.symptoms) as Block | undefined) ?? undefined;
  if (block?.enabled === false) return null;

  const heading = block?.heading ?? "Nos 4 axes d'intervention";
  const subheading =
    block?.subheading ??
    "Une approche humaine et chaleureuse, construite autour de vous et avec vous.";

  const ctaText = block?.ctaText ?? "Découvrir notre approche";
  const ctaLink = block?.ctaLink ?? "/p/a-propos/axes";
  const ctaEnabled = block?.ctaEnabled !== false;


  const items = useMemo(() => {
    const raw = (block?.items ?? [])
      .filter((x) => x?.enabled !== false)
      .slice()
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0));

    if (raw.length === 0) return FALLBACK;

    const defaultIcons: IconKey[] = ["warmEmbrace", "gentleMovement", "lightbulbHeart", "holdingHands"];

    return raw.map((it, idx) => {
      const fallbackIcon = defaultIcons[idx] ?? "warmEmbrace";
      return {
        id: it.id ?? `axis${idx + 1}`,
        icon: normalizeIcon(it.icon, fallbackIcon),
        title: it.title ?? "",
        body: (it.description ?? it.body ?? "") as string,
      };
    });
  }, [block?.items]);

  return (
    <section className="bg-[#b33a22] py-16 sm:py-20 overflow-hidden">
      <style>{`
        .draw { stroke-dasharray: 1; stroke-dashoffset: 1; }
        .draw-off { opacity: 0; }
        .draw-on { opacity: 1; animation: dash 1.2s ease forwards; }
        .delay-150 { animation-delay: .15s; }
        @keyframes dash { to { stroke-dashoffset: 0; } }
      `}</style>

      <div ref={ref} className="mx-auto max-w-8xl px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {heading}
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-white/85">
          {subheading}
        </p>

        <div className="mt-12 sm:mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className="flex flex-col items-center group">
              <div className="relative">
                {/* Halo lumineux au survol */}
                <div className="absolute inset-0 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all duration-500" />
                <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full transition-all duration-500 group-hover:scale-110 group-hover:rotate-2">
                  <CircleIcon icon={it.icon} animate={inView} />
                </div>
              </div>

              <h3 className="mt-4 text-base sm:text-lg font-bold text-white relative">
                <span className="relative">
                  {it.title}
                  {/* Petit souligné doux au survol */}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white/60 group-hover:w-full transition-all duration-300" />
                </span>
              </h3>

              <p className="mt-3 max-w-[260px] text-xs sm:text-sm leading-relaxed text-white/80">
                {it.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        {ctaEnabled && !!ctaLink && (
          <div className="mt-12 sm:mt-16">
            <a
              href={ctaLink}
              className="
              relative inline-flex items-center justify-center
              px-8 sm:px-10 py-4 sm:py-5
              bg-white text-[#b33a22] font-extrabold text-base sm:text-lg
              rounded-2xl shadow-xl
              transition-all duration-500 ease-out
              hover:bg-red-50 hover:scale-105 hover:shadow-2xl
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
              group
              overflow-hidden
            "
            >
              {/* Vague organique au fond */}
              <span className="absolute inset-0 bg-gradient-to-r from-red-100/50 to-white/50 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />

              <span className="relative flex items-center">
                {ctaText}
                <svg
                  className="ml-2 h-5 w-5 transition-all duration-500 group-hover:translate-x-2 group-hover:rotate-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}