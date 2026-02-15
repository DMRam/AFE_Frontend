import { ChevronRight, ExternalLink } from "lucide-react";
import type { HeroSection } from "../../../content/types/pageBlocks";
import { useMemo } from "react";

type CtaVariant = "primary" | "secondary" | "outline";
type CtaSize = "sm" | "md" | "lg";
type CtaIcon = "none" | "arrow" | "external";

type TextPreset = "auto" | "white" | "black" | "gray" | "red" | "blue";

type HeroCta = {
  id?: string;
  enabled?: boolean;
  label?: string;
  href?: string;
  variant?: CtaVariant | string; // allow legacy string from DB
  size?: CtaSize | string;
  icon?: CtaIcon | string;
  newTab?: boolean;
  [k: string]: any; // tolerate extra props
};

interface HeroSectionViewProps {
  data: HeroSection & {
    ctas?: HeroCta[];
    textColorPreset?: TextPreset;
    textOpacity?: number; // 0..100
  };
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
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

function ctaSizeClass(size: CtaSize) {
  if (size === "sm") return "px-4 py-2 text-sm";
  if (size === "lg") return "px-6 py-3 text-base";
  return "px-5 py-2.5 text-sm";
}

function textColorClasses(data: HeroSectionViewProps["data"], hasBackground: boolean) {
  const preset: TextPreset = (data.textColorPreset ?? "auto") as TextPreset;

  if (preset !== "auto") {
    switch (preset) {
      case "white":
        return { title: "text-white", subtitle: "text-white/90" };
      case "black":
        return { title: "text-black", subtitle: "text-black/80" };
      case "gray":
        return { title: "text-gray-100", subtitle: "text-gray-200" };
      case "red":
        return { title: "text-red-100", subtitle: "text-red-100/90" };
      case "blue":
        return { title: "text-blue-100", subtitle: "text-blue-100/90" };
      default:
        return { title: "text-white", subtitle: "text-white/90" };
    }
  }

  // Auto behavior: honor existing light/dark
  const dark = (data as any).textColor === "dark";
  if (dark) return { title: "text-black", subtitle: "text-black/80" };

  return {
    title: "text-white",
    subtitle: hasBackground ? "text-white/90" : "text-gray-100",
  };
}

function ctaClass(variant: CtaVariant, onDarkBg: boolean) {
  if (variant === "primary") {
    return onDarkBg
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-red-700 text-white hover:bg-red-800";
  }

  if (variant === "secondary") {
    return onDarkBg
      ? "bg-white/90 text-gray-900 hover:bg-white"
      : "bg-white text-gray-900 hover:bg-gray-50";
  }

  // outline
  return onDarkBg
    ? "border border-white/70 text-white hover:bg-white/10"
    : "border border-gray-300 text-gray-900 hover:bg-gray-50";
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

export function HeroSectionView({ data }: HeroSectionViewProps) {
  if (data.enabled === false) return null;

  const hasBackground = !!(data as any).backgroundImage;
  const alignment = (data as any).align || "center";

  const heroId = useMemo(() => (data.id ? `hero-${data.id}` : undefined), [data.id]);
  const colors = useMemo(() => textColorClasses(data, hasBackground), [data, hasBackground]);

  const opacity = Math.max(0, Math.min(100, Number((data as any).textOpacity ?? 100)));
  const textStyle = opacity < 100 ? ({ opacity: opacity / 100 } as const) : undefined;

  const visibleCtas = normalizeCtas((data as any).ctas);

  return (
    <header
      role="banner"
      id={heroId}
      className="relative w-full overflow-hidden"
      aria-labelledby={(data as any).title ? `${heroId}-title` : undefined}
    >
      {hasBackground && (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${(data as any).backgroundImage})` }}
            role="img"
            aria-label="Hero background"
          />
          <div className="absolute inset-0 bg-black/40" aria-hidden="true" />
        </div>
      )}

      <div
        className={[
          "relative z-10",
          hasBackground ? "bg-black/30" : "bg-gradient-to-br from-red-800 to-red-600",
        ].join(" ")}
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8 lg:py-32">
          <div className={alignment === "center" ? "text-center" : "text-left max-w-3xl"}>
            <h1
              id={`${heroId}-title`}
              className={[
                "text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl",
                colors.title,
                alignment === "left" ? "md:max-w-3xl" : "",
              ].join(" ")}
              style={textStyle}
            >
              {(data as any).title}
            </h1>

            {(data as any).subtitle && (
              <p
                className={[
                  "mt-6 text-lg md:text-xl",
                  colors.subtitle,
                  alignment === "center" ? "mx-auto max-w-2xl" : "max-w-2xl",
                ].join(" ")}
                style={textStyle}
              >
                {(data as any).subtitle}
              </p>
            )}

            {visibleCtas.length > 0 && (
              <div
                className={[
                  "mt-8 flex flex-wrap gap-3",
                  alignment === "center" ? "justify-center" : "justify-start",
                ].join(" ")}
              >
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
                        ctaClass(cta.variant, hasBackground),
                      ].join(" ")}
                    >
                      <span>{cta.label}</span>

                      {cta.icon === "external" ? (
                        <ExternalLink className="h-4 w-4" />
                      ) : cta.icon === "arrow" ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : cta.icon === "none" ? null : external ? (
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

      {hasBackground && (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent"
          aria-hidden="true"
        />
      )}
    </header>
  );
}
