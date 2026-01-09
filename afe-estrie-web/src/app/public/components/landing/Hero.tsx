import { useEffect, useMemo, useRef, useState } from "react";

// IMPORTA TUS 3 VIDEOS (como ya lo hiciste)
import v1 from "../../../../assets/videos/hero/v1.mp4";
import v2 from "../../../../assets/videos/hero/v2.mp4";
import v3 from "../../../../assets/videos/hero/v3.mp4";

// (opcional) poster en public o importado
const POSTER = "/images/afe-hero.jpg";

type HeroCTA = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  ctas: HeroCTA[];
  poster?: string;
};

const DEFAULT_HERO: HeroContent = {
  eyebrow: "Association • Estrie • Support & activités",
  title: "Un accompagnement humain, des activités, et des ressources utiles.",
  description:
    "L’AFE aide les personnes vivant avec la fibromyalgie grâce à des groupes de partage, ateliers, événements et information.",
  ctas: [
    { label: "Voir les activités", href: "#activites", variant: "primary" },
    { label: "Ressources", href: "#ressources", variant: "secondary" },
  ],
  poster: POSTER,
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  return reduced;
}

export function Hero({ content = DEFAULT_HERO }: { content?: HeroContent }) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const videos = useMemo(() => [v1, v2, v3].filter(Boolean), []);
  const [active, setActive] = useState<"a" | "b">("a");
  const [index, setIndex] = useState(0);

  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);

  // Config
  const CLIP_SECONDS = 9;   // duración de cada video antes de cambiar
  const FADE_MS = 1400;     // fade suave

  // Inicializa el primer video
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (videos.length === 0) return;

    const first = aRef.current;
    if (!first) return;

    first.src = videos[0];
    first.load();
    first.play().catch(() => {});
  }, [prefersReducedMotion, videos]);

  // Rotación
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (videos.length <= 1) return;

    const t = setInterval(() => {
      setIndex((prev) => (prev + 1) % videos.length);
      setActive((prev) => (prev === "a" ? "b" : "a"));
    }, CLIP_SECONDS * 1000);

    return () => clearInterval(t);
  }, [prefersReducedMotion, videos.length]);

  // Cargar el video “next” en el elemento que entra
  useEffect(() => {
    if (prefersReducedMotion) return;
    if (videos.length === 0) return;

    const nextSrc = videos[index];
    const nextEl = active === "a" ? aRef.current : bRef.current;
    if (!nextEl) return;

    nextEl.src = nextSrc;
    nextEl.load();
    nextEl.play().catch(() => {});
  }, [active, index, prefersReducedMotion, videos]);

  return (
    <section className="relative bg-white">
      {/* HERO BACKGROUND */}
      <div className="relative">
        <div className="relative h-[560px] w-full overflow-hidden bg-gray-100 sm:h-[620px]">
          {/* Fallback para reduce motion */}
          {prefersReducedMotion ? (
            <img
              src={content.poster || POSTER}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <>
              {/* Video A */}
              <video
                ref={aRef}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[${FADE_MS}ms] ${
                  active === "a" ? "opacity-100" : "opacity-0"
                }`}
                muted
                playsInline
                autoPlay
                loop
                preload="metadata"
              />

              {/* Video B */}
              <video
                ref={bRef}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[${FADE_MS}ms] ${
                  active === "b" ? "opacity-100" : "opacity-0"
                }`}
                muted
                playsInline
                autoPlay
                loop
                preload="metadata"
              />
            </>
          )}

          {/* overlays para legibilidad + look pro */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/65 to-white/15" />
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* CONTENT */}
        <div className="absolute inset-0">
          <div className="mx-auto flex h-full max-w-7xl items-center px-6">
            <div className="max-w-xl">
              <p className="inline-flex rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700">
                {content.eyebrow}
              </p>

              <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
                {content.title}
              </h1>

              <p className="mt-4 text-lg leading-relaxed text-gray-700">
                {content.description}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {content.ctas.map((cta) => {
                  const base =
                    "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold transition";
                  const styles =
                    cta.variant === "primary"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-white/80 backdrop-blur border border-gray-300 text-gray-900 hover:bg-white";

                  return (
                    <a
                      key={cta.label}
                      href={cta.href}
                      className={`${base} ${styles}`}
                    >
                      {cta.label}
                    </a>
                  );
                })}
              </div>

              {/* Indicador sutil (opcional) */}
              {!prefersReducedMotion && videos.length > 1 ? (
                <div className="mt-6 flex gap-2">
                  {videos.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 w-8 rounded-full transition ${
                        i === index ? "bg-red-600" : "bg-gray-300/70"
                      }`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
