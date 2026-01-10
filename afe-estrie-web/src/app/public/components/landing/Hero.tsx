import { useEffect, useMemo, useRef, useState } from "react";

import v1 from "../../../../assets/videos/hero/v1.mp4";
import v2 from "../../../../assets/videos/hero/v2.mp4";
import v3 from "../../../../assets/videos/hero/v3.mp4";

const POSTER = "/images/afe-hero.jpg";

type HeroCTA = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type HeroSlide = {
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

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export function Hero({
  slides,
  intervalSeconds = 9,
  fadeMs = 1200,
}: {
  slides?: HeroSlide[];
  intervalSeconds?: number;
  fadeMs?: number;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const saveData = useSaveData();
  const { ref: rootRef, inView } = useInView<HTMLElement>(0.2);

  const heroSlides = useMemo<HeroSlide[]>(
    () =>
      slides?.length
        ? slides
        : [
          {
            videoSrc: v1,
            poster: POSTER,
            eyebrow: "Association • Estrie",
            title:
              "Bienvenue sur le site de l'association de la fibromyalgie de l'Estrie !",
            description:
              "Groupes de partage, ateliers, événements et information pour mieux vivre au quotidien.",
            ctas: [
              { label: "Voir les activités", href: "#activites", variant: "primary" },
              { label: "Nous contacter", href: "#contact", variant: "secondary" },
            ],
          },
          {
            videoSrc: v2,
            poster: POSTER,
            eyebrow: "Rencontres",
            title:
              "Rencontres d’information Association de la fibromyalgie de l'Estrie",
            description:
              "Des moments pour comprendre, poser vos questions et trouver du soutien.",
            ctas: [
              { label: "Prochains événements", href: "#evenements", variant: "primary" },
              { label: "Ressources", href: "#ressources", variant: "secondary" },
            ],
          },
          {
            videoSrc: v3,
            poster: POSTER,
            eyebrow: "Soutien",
            title: "Un accompagnement humain et des services concrets",
            description:
              "Relation d’aide, écoute, activités et communauté — selon vos besoins.",
            ctas: [
              { label: "Devenir membre", href: "#membre", variant: "primary" },
              { label: "Faire un don", href: "#don", variant: "secondary" },
            ],
          },
        ],
    [slides]
  );

  const [visibleIndex, setVisibleIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);

  const [visibleLayer, setVisibleLayer] = useState<"a" | "b">("a");
  const [pendingLayer, setPendingLayer] = useState<"a" | "b">("b");

  const [readyA, setReadyA] = useState(false);
  const [readyB, setReadyB] = useState(false);

  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);

  const visibleSlide = heroSlides[visibleIndex];

  const shouldUseVideo =
    !prefersReducedMotion &&
    !saveData &&
    inView &&
    heroSlides.length > 0 &&
    Boolean(visibleSlide.videoSrc);

  const getEl = (layer: "a" | "b") => (layer === "a" ? aRef.current : bRef.current);

  const resetReady = (layer: "a" | "b") => (layer === "a" ? setReadyA(false) : setReadyB(false));
  const markReady = (layer: "a" | "b") => (layer === "a" ? setReadyA(true) : setReadyB(true));

  const load = (el: HTMLVideoElement, src: string, play: boolean) => {
    el.src = src;
    el.load();
    if (!play) return;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => { });
  };

  // Pause playback when not in view / reduced motion
  useEffect(() => {
    if (shouldUseVideo) return;
    aRef.current?.pause();
    bRef.current?.pause();
  }, [shouldUseVideo]);

  // initial load current + preload next
  useEffect(() => {
    if (!shouldUseVideo) return;
    if (!visibleSlide.videoSrc) return;

    const currentEl = getEl(visibleLayer);
    if (!currentEl) return;

    resetReady(visibleLayer);
    load(currentEl, visibleSlide.videoSrc, true);

    if (heroSlides.length > 1) {
      const nextIdx = (visibleIndex + 1) % heroSlides.length;
      const nextSrc = heroSlides[nextIdx]?.videoSrc;
      const preEl = getEl(pendingLayer);
      if (preEl && nextSrc) {
        resetReady(pendingLayer);
        load(preEl, nextSrc, false);
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

  // schedule rotation
  useEffect(() => {
    if (!shouldUseVideo) return;
    if (heroSlides.length <= 1) return;

    const t = window.setInterval(() => {
      setPendingIndex((cur) => {
        if (cur != null) return cur;
        return (visibleIndex + 1) % heroSlides.length;
      });
    }, intervalSeconds * 1000);

    return () => window.clearInterval(t);
  }, [shouldUseVideo, heroSlides.length, intervalSeconds, visibleIndex]);

  // when pendingIndex set: load into pendingLayer and commit when ready
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
    load(el, slide.videoSrc, true);
  }, [pendingIndex, pendingLayer, shouldUseVideo, heroSlides]);

  // preload next after commit
  useEffect(() => {
    if (!shouldUseVideo) return;
    if (heroSlides.length <= 1) return;

    const nextIdx = (visibleIndex + 1) % heroSlides.length;
    const nextSrc = heroSlides[nextIdx]?.videoSrc;
    const preEl = getEl(pendingLayer);

    if (preEl && nextSrc) {
      resetReady(pendingLayer);
      load(preEl, nextSrc, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIndex, pendingLayer, shouldUseVideo]);

  const showA = visibleLayer === "a" && readyA;
  const showB = visibleLayer === "b" && readyB;

  const onLoadedData = (layer: "a" | "b") => {
    markReady(layer);
    if (pendingIndex != null && layer === pendingLayer) {
      commitPending();
    }
  };

  const goTo = (i: number) => {
    if (i === visibleIndex) return;
    setPendingIndex(i);
  };

  const primaryCta =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition shadow-sm";
  const secondaryCta =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold transition";

  return (
    <section ref={rootRef as any} className="relative bg-white">
      <div className="relative">
        {/* HERO BACKDROP */}
        <div className="relative w-full overflow-hidden bg-gray-100
                h-[580px] sm:h-[580px] lg:h-[620px]">

          {/* Poster always under videos */}
          <img
            src={visibleSlide.poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />

          {/* Videos */}
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
          <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/70 to-white/20" />
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* CONTENT */}
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-7xl items-center px-6">
            {/* Wider on desktop so FR titles use more horizontal space */}
            <div className="flex h-full w-full flex-col pt-20 sm:pt-24">
              <div className="max-w-xl lg:max-w-2xl xl:max-w-3xl">
                {/* Text block: stable spacing */}
                <p className="inline-flex rounded-full bg-red-50/90 px-4 py-2 text-xs font-semibold text-red-700 shadow-sm">
                  {visibleSlide.eyebrow}
                </p>

                <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl leading-[1.05]">
                  {visibleSlide.title}
                </h1>

                {visibleSlide.description ? (
                  <p className="mt-3 text-lg leading-relaxed text-gray-700">
                    {visibleSlide.description}
                  </p>
                ) : null}

                {/* CTAs */}
                {visibleSlide.ctas?.length ? (
                  <div className="mt-5 flex flex-wrap gap-3">
                    {visibleSlide.ctas.map((cta) => (
                      <a
                        key={cta.label}
                        href={cta.href}
                        className={
                          cta.variant === "primary"
                            ? `${primaryCta} bg-red-600 text-white hover:bg-red-700`
                            : `${secondaryCta} bg-white/80 backdrop-blur border border-gray-300 text-gray-900 hover:bg-white`
                        }
                      >
                        {cta.label}
                      </a>
                    ))}
                  </div>
                ) : null}

                {/* Dots / progress area (soft, minimal, always above cards) */}
                {heroSlides.length > 1 ? (
                  <div className="relative z-30 mt-6 inline-flex items-center gap-2 rounded-full bg-white/35 px-3 py-2 backdrop-blur-sm">
                    {heroSlides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`Aller à la diapositive ${i + 1}`}
                        className={`h-1 w-8 rounded-full transition ${i === visibleIndex
                          ? "bg-red-600"
                          : "bg-gray-300/70 hover:bg-gray-400/70"
                          }`}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Push content up a bit so it never collides with the overlap cards */}
              <div className="flex-1" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
