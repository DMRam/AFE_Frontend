import type { HeroSection } from "../../../content/types/pageBlocks";
import { useMemo } from "react";

interface HeroSectionViewProps {
  data: HeroSection;
}

export function HeroSectionView({ data }: HeroSectionViewProps) {
  if (data.enabled === false) return null;

  const hasBackground = !!data.backgroundImage;
  const alignment = data.align || "center";

  const heroId = useMemo(() => data.id ? `hero-${data.id}` : undefined, [data.id]);

  return (
    <header
      role="banner"
      id={heroId}
      className="relative w-full overflow-hidden"
      aria-labelledby={data.title ? `${heroId}-title` : undefined}
    >
      {/* Background Image */}
      {hasBackground && (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${data.backgroundImage})` }}
            role="img"
            aria-label="Hero background"
          />
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Content Container */}
      <div className={`relative z-10 ${hasBackground ? 'bg-black/30' : 'bg-gradient-to-br from-red-800 to-red-600'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className={`${alignment === 'center' ? 'text-center' : 'text-left max-w-3xl'}`}>
            {/* Title */}
            <h1
              id={`${heroId}-title`}
              className={`text-4xl font-semibold tracking-tight ${data.textColor === 'dark' ? 'text-black' : 'text-white'} sm:text-5xl md:text-6xl lg:text-7xl ${alignment === 'left' ? 'md:max-w-3xl' : ''
                }`}
            >
              {data.title}
            </h1>

            {/* Subtitle */}
            {data.subtitle && (
              <p className={`mt-6 text-lg md:text-xl text-gray-100 ${alignment === 'center' ? 'mx-auto max-w-2xl' : 'max-w-2xl'
                }`}>
                {data.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Optional decorative bottom gradient */}
      {hasBackground && (
        <div
          className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      )}
    </header>
  );
}