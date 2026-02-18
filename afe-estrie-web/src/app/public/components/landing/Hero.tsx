import { useEffect, useMemo, useRef, useState } from "react";

import v1 from "../../../../assets/videos/hero/v1.mp4";
import v2 from "../../../../assets/videos/hero/v2.mp4";
import v3 from "../../../../assets/videos/hero/v3.mp4";
import type { HeroSlideCMS } from "../../../../content/types/homePage";


const POSTER = "/images/afe-hero.jpg";
const HERO_VIDEOS = { v1, v2, v3 } as const;
type VideoKey = keyof typeof HERO_VIDEOS; // "v1" | "v2" | "v3"

function isVideoKey(v: unknown): v is VideoKey {
  return v === "v1" || v === "v2" || v === "v3";
}

type HeroCTA = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

type HeroSlideRuntime = {
  videoSrc?: string;
  poster: string;
  eyebrow: string;
  title: string;
  description?: string;
  ctas?: HeroCTA[];
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(Boolean(mq.matches));
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

function useSaveData() {
  const [saveData, setSaveData] = useState(false);

  useEffect(() => {
    const conn = (navigator as any).connection;
    const update = () => setSaveData(Boolean(conn?.saveData));
    update();
    conn?.addEventListener?.("change", update);
    return () => conn?.removeEventListener?.("change", update);
  }, []);

  return saveData;
}

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold,
    });

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function fallbackSlides(): HeroSlideRuntime[] {
  return [
    {
      videoSrc: v1,
      poster: POSTER,
      eyebrow: "Association • Estrie",
      title: "Bienvenue — Association de la fibromyalgie de l’Estrie",
      description: "Soutien, information et activités pour mieux vivre au quotidien.",
      ctas: [
        { label: "Voir les activités", href: "#activites", variant: "primary" },
        { label: "Nous contacter", href: "#contact", variant: "secondary" },
      ],
    },
    {
      videoSrc: v2,
      poster: POSTER,
      eyebrow: "Rencontres",
      title: "Rencontres d’information — Association de la fibromyalgie de l’Estrie",
      description:
        "Vous avez la fibromyalgie ou un de vos proches en est atteint? Cette rencontre d’information est pour vous!",
      ctas: [{ label: "En savoir plus", href: "#evenements", variant: "primary" }],
    },
    {
      videoSrc: v3,
      poster: POSTER,
      eyebrow: "Soutien",
      title: "Un accompagnement humain — Des services concrets",
      description: "Relation d’aide, écoute, activités et communauté — selon vos besoins.",
      ctas: [
        { label: "Devenir membre", href: "#membre", variant: "primary" },
        { label: "Faire un don", href: "#don", variant: "secondary" },
      ],
    },
  ];
}

/**
 * Split title into (red line, black lines) using:
 * - newline or
 * - "—"
 */
function splitTitle(title: string): { red?: string; black: string } {
  const t = (title ?? "").trim();
  if (!t) return { black: "" };

  if (t.includes("\n")) {
    const [a, ...rest] = t
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
    return { red: a, black: rest.join(" ") || "" };
  }

  const dash = "—";
  if (t.includes(dash)) {
    const [a, ...rest] = t
      .split(dash)
      .map((x) => x.trim())
      .filter(Boolean);
    return { red: a, black: rest.join(` ${dash} `) || "" };
  }

  return { black: t };
}

export function Hero({
  slides,
  intervalSeconds = 9,
  fadeMs = 1200,
}: {
  slides?: HeroSlideCMS[];
  intervalSeconds?: number;
  fadeMs?: number;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const saveData = useSaveData();
  const { ref: rootRef, inView } = useInView<HTMLElement>(0.2);

  const heroSlides = useMemo<HeroSlideRuntime[]>(() => {
    const input = slides?.length ? slides : [];

    const fromCms = input
      .filter((s) => (s as any).enabled !== false)
      .sort((a, b) => (((a as any).order ?? 0) as number) - (((b as any).order ?? 0) as number))
      .map<HeroSlideRuntime>((s) => {
        const poster = (s as any).poster ?? POSTER;

        let ctas: HeroCTA[] | undefined = (s as any).ctas?.filter(Boolean);

        // legacy support
        if ((!ctas || !ctas.length) && (s as any).ctaLabel && (s as any).ctaHref) {
          ctas = [{ label: (s as any).ctaLabel, href: (s as any).ctaHref, variant: "primary" }];
        }

        const vk = (s as any).videoKey;

        return {
          poster,
          videoSrc: isVideoKey(vk) ? HERO_VIDEOS[vk] : undefined,
          eyebrow: (s as any).eyebrow ?? "",
          title: (s as any).title ?? "",
          description: (s as any).description,
          ctas,
        };
      })
      .filter((s) => Boolean(s.title));

    return fromCms.length ? fromCms : fallbackSlides();
  }, [slides]);

  if (!heroSlides.length) return null;

  // carousel state
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const [visibleLayer, setVisibleLayer] = useState<"a" | "b">("a");
  const [pendingLayer, setPendingLayer] = useState<"a" | "b">("b");

  const [readyA, setReadyA] = useState(false);
  const [readyB, setReadyB] = useState(false);

  const [paused, setPaused] = useState(false);

  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setVisibleIndex((i) => Math.min(i, heroSlides.length - 1));
    setPendingIndex(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroSlides.length]);

  const visibleSlide = heroSlides[visibleIndex];
  const { red: titleRed, black: titleBlack } = splitTitle(visibleSlide.title);

  const shouldUseVideo =
    !prefersReducedMotion && !saveData && inView && !!visibleSlide.videoSrc;

  const getEl = (layer: "a" | "b") => (layer === "a" ? aRef.current : bRef.current);
  const resetReady = (layer: "a" | "b") => (layer === "a" ? setReadyA(false) : setReadyB(false));
  const markReady = (layer: "a" | "b") => (layer === "a" ? setReadyA(true) : setReadyB(true));

  const loadAndMaybePlay = (el: HTMLVideoElement, src: string, play: boolean) => {
    el.src = src;
    el.load();
    if (!play) return;
    const p = el.play();
    if (p && typeof (p as any).catch === "function") (p as any).catch(() => {});
  };

  useEffect(() => {
    const a = aRef.current;
    const b = bRef.current;

    if (!shouldUseVideo || paused) {
      a?.pause();
      b?.pause();
      return;
    }

    const activeEl = visibleLayer === "a" ? a : b;
    const p = activeEl?.play();
    if (p && typeof (p as any).catch === "function") (p as any).catch(() => {});
  }, [shouldUseVideo, paused, visibleLayer]);

  useEffect(() => {
    if (!shouldUseVideo) return;
    const el = getEl(visibleLayer);
    if (!el || !visibleSlide.videoSrc) return;

    resetReady(visibleLayer);
    loadAndMaybePlay(el, visibleSlide.videoSrc, true);

    // preload next
    if (heroSlides.length > 1) {
      const nextIdx = (visibleIndex + 1) % heroSlides.length;
      const next = heroSlides[nextIdx]?.videoSrc;
      const preEl = getEl(pendingLayer);
      if (preEl && next) {
        resetReady(pendingLayer);
        loadAndMaybePlay(preEl, next, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldUseVideo]);

  const commitPending = () => {
    if (pendingIndex == null) return;

    requestAnimationFrame(() => {
      setVisibleIndex(pendingIndex);
      setPendingIndex(null);
      setVisibleLayer(pendingLayer);
      setPendingLayer((p) => (p === "a" ? "b" : "a"));
    });
  };

  useEffect(() => {
    if (!shouldUseVideo) return;
    if (heroSlides.length <= 1) return;

    const t = window.setInterval(() => {
      setPendingIndex((currentPending) => {
        if (currentPending != null) return currentPending;
        return (visibleIndex + 1) % heroSlides.length;
      });
    }, intervalSeconds * 1000);

    return () => window.clearInterval(t);
  }, [shouldUseVideo, heroSlides.length, intervalSeconds, visibleIndex]);

  useEffect(() => {
    if (!shouldUseVideo) return;
    if (pendingIndex == null) return;

    const slide = heroSlides[pendingIndex];
    if (!slide?.videoSrc) {
      commitPending();
      return;
    }

    const el = getEl(pendingLayer);
    if (!el) return;

    resetReady(pendingLayer);
    loadAndMaybePlay(el, slide.videoSrc, true);
  }, [pendingIndex, pendingLayer, shouldUseVideo, heroSlides]);

  useEffect(() => {
    if (!shouldUseVideo) return;
    if (heroSlides.length <= 1) return;

    const nextIdx = (visibleIndex + 1) % heroSlides.length;
    const next = heroSlides[nextIdx]?.videoSrc;
    const preEl = getEl(pendingLayer);

    if (preEl && next) {
      resetReady(pendingLayer);
      loadAndMaybePlay(preEl, next, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIndex, pendingLayer, shouldUseVideo]);

  const showA = visibleLayer === "a" && readyA;
  const showB = visibleLayer === "b" && readyB;

  const goTo = (i: number) => {
    if (i === visibleIndex) return;
    setPendingIndex(i);
  };

  const onLoadedData = (layer: "a" | "b") => {
    markReady(layer);
    if (pendingIndex != null && layer === pendingLayer) commitPending();
  };

  return (
    <section ref={rootRef as any} className="relative bg-white">
      {/* MEDIA */}
      <div className="relative w-full overflow-hidden bg-gray-100 h-[320px] sm:h-[380px] lg:h-[620px]">
        <img
          src={visibleSlide.poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />

        {shouldUseVideo && (
          <>
            <video
              ref={aRef}
              onLoadedData={() => onLoadedData("a")}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: showA ? 1 : 0,
                transition: `opacity ${fadeMs}ms ease`,
                transform: "scale(1.03)",
                willChange: "opacity",
              }}
              muted
              playsInline
              autoPlay
              loop
              preload="auto"
            />
            <video
              ref={bRef}
              onLoadedData={() => onLoadedData("b")}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                opacity: showB ? 1 : 0,
                transition: `opacity ${fadeMs}ms ease`,
                transform: "scale(1.03)",
                willChange: "opacity",
              }}
              muted
              playsInline
              autoPlay
              loop
              preload="auto"
            />
          </>
        )}

        {/* overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/35 to-white/75 lg:bg-gradient-to-r lg:from-rose-200/45 lg:via-white/45 lg:to-white/70" />
        <div className="absolute inset-0 bg-black/5" />

        {/* Desktop overlay card */}
        <div className="absolute inset-0 hidden lg:block">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-end px-6">
            <div className="w-full max-w-xl">
              <HeroCard
                eyebrow={visibleSlide.eyebrow}
                titleRed={titleRed}
                titleBlack={titleBlack}
                description={visibleSlide.description}
                ctas={visibleSlide.ctas}
                paused={paused}
                setPaused={setPaused}
                heroSlidesLen={heroSlides.length}
                visibleIndex={visibleIndex}
                goTo={goTo}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile card in NORMAL FLOW (prevents QuickCards overlap) */}
      <div className="lg:hidden">
        <div className="mx-auto max-w-2xl px-4">
          {/* overlap only the hero media, but still stays in flow */}
          <div className="-mt-16 pb-6 sm:-mt-20">
            <HeroCard
              eyebrow={visibleSlide.eyebrow}
              titleRed={titleRed}
              titleBlack={titleBlack}
              description={visibleSlide.description}
              ctas={visibleSlide.ctas}
              paused={paused}
              setPaused={setPaused}
              heroSlidesLen={heroSlides.length}
              visibleIndex={visibleIndex}
              goTo={goTo}
              mobile
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCard({
  eyebrow,
  titleRed,
  titleBlack,
  description,
  ctas,
  paused,
  setPaused,
  heroSlidesLen,
  visibleIndex,
  goTo,
  mobile,
}: {
  eyebrow?: string;
  titleRed?: string;
  titleBlack: string;
  description?: string;
  ctas?: HeroCTA[];
  paused: boolean;
  setPaused: (v: any) => void;
  heroSlidesLen: number;
  visibleIndex: number;
  goTo: (i: number) => void;
  mobile?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-3xl bg-white/75 shadow-sm backdrop-blur-md ring-1 ring-black/5",
        mobile ? "p-6 sm:p-8 min-h-[420px]" : "p-8 sm:p-10",
        "flex flex-col",
      ].join(" ")}
    >
      {eyebrow ? (
        <p className={mobile ? "text-[11px] font-semibold uppercase tracking-wide text-gray-700" : "text-xs font-semibold uppercase tracking-wide text-gray-700"}>
          {eyebrow}
        </p>
      ) : null}

      <h1 className="mt-3 leading-tight tracking-tight">
        {titleRed ? (
          <>
            <span
              className={[
                "block font-extrabold text-red-700",
                mobile ? "text-3xl sm:text-4xl line-clamp-2" : "text-4xl sm:text-5xl line-clamp-2",
              ].join(" ")}
            >
              {titleRed}
            </span>
            {titleBlack ? (
              <span
                className={[
                  "mt-1 block font-light text-gray-900",
                  mobile ? "text-3xl sm:text-4xl line-clamp-2" : "mt-2 text-4xl sm:text-5xl line-clamp-2",
                ].join(" ")}
              >
                {titleBlack}
              </span>
            ) : null}
          </>
        ) : (
          <span
            className={[
              "block font-extrabold text-gray-900",
              mobile ? "text-3xl sm:text-4xl line-clamp-3" : "text-4xl sm:text-5xl line-clamp-3",
            ].join(" ")}
          >
            {titleBlack}
          </span>
        )}
      </h1>

      {description ? (
        <p className={mobile ? "mt-4 text-sm leading-relaxed text-gray-800 line-clamp-4" : "mt-6 text-sm leading-relaxed text-gray-800 sm:text-base line-clamp-4"}>
          {description}
        </p>
      ) : null}

      {/* CTA area */}
      {ctas?.length ? (
        <div className={mobile ? "mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap" : "mt-8 flex flex-wrap gap-3"}>
          {ctas.map((cta) => {
            const isPrimary = cta.variant === "primary";
            return (
              <a
                key={`${cta.label}-${cta.href}`}
                href={cta.href}
                className={
                  isPrimary
                    ? [
                        "inline-flex items-center justify-center rounded-md bg-red-700 text-white shadow-sm transition hover:bg-red-800",
                        mobile
                          ? "w-full px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider sm:w-auto"
                          : "px-6 py-3 text-xs font-extrabold uppercase tracking-wider",
                      ].join(" ")
                    : [
                        "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white/85 text-gray-900 shadow-sm transition hover:bg-white",
                        mobile
                          ? "w-full px-5 py-3 text-[11px] font-extrabold uppercase tracking-wider sm:w-auto"
                          : "px-6 py-3 text-xs font-extrabold uppercase tracking-wider",
                      ].join(" ")
                }
              >
                {cta.label}
              </a>
            );
          })}
        </div>
      ) : null}

      {/* push controls to bottom => stable card height */}
      <div className="mt-auto pt-5">
        {heroSlidesLen > 1 ? (
          <div
            className={mobile ? "flex flex-wrap items-center justify-between gap-3" : "inline-flex items-center gap-3 rounded-full bg-white/60 px-3 py-2 backdrop-blur"}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <button
              type="button"
              onClick={() => setPaused((p: boolean) => !p)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
              aria-label={paused ? "Reprendre le diaporama" : "Mettre en pause le diaporama"}
            >
              <span className={`h-2 w-2 rounded-full ${paused ? "bg-gray-400" : "bg-red-700"}`} />
              {paused ? "Reprendre" : "Pause"}
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: heroSlidesLen }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Aller à la diapositive ${i + 1}`}
                  className={`h-1.5 w-8 rounded-full transition ${
                    i === visibleIndex ? "bg-red-700" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
