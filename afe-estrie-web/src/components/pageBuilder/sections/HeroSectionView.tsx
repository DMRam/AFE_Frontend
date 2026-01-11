import type { HeroSection } from "../../../content/types/pageBlocks";

export function HeroSectionView({ data }: { data: HeroSection }) {
  return (
    <section
      className="relative w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${data.backgroundImage})` }}
    >
      <div className="bg-black/40">
        <div className="mx-auto max-w-5xl px-6 py-24 text-white text-center">
          <h1 className="text-4xl md:text-5xl font-semibold">
            {data.title}
          </h1>
          {data.subtitle && (
            <p className="mt-4 text-lg opacity-90">
              {data.subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
