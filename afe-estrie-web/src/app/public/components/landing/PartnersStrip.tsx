import { useEffect, useMemo, useState } from "react";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { storage } from "../../../../services/firebase";
import type { HomePageCMS } from "../../../../content/types/homePage";

function isHttp(s: string) {
  return /^https?:\/\//i.test(s);
}

async function resolveSrc(src: string): Promise<string> {
  if (!src) return "";
  if (isHttp(src)) return src;
  return await getDownloadURL(storageRef(storage, src));
}

export function PartnersStrip({ home }: { home?: HomePageCMS | null }) {
  const block = home?.partners;
  if (block?.enabled === false) return null;

  const heading = block?.heading || "Nos partenaires financiers";
  const logos = block?.logos ?? [];

  const sorted = useMemo(
    () =>
      logos
        .filter((l: any) => l?.enabled !== false)
        .slice()
        .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0)),
    [logos]
  );

  const [resolved, setResolved] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const next: Record<string, string> = {};
      await Promise.all(
        sorted.map(async (l: any) => {
          try {
            next[l.id] = await resolveSrc(l.src);
          } catch {
            next[l.id] = "";
          }
        })
      );
      if (alive) setResolved(next);
    })();
    return () => {
      alive = false;
    };
  }, [sorted]);

  return (
    <section id="partenaires" className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 max-w-3xl">
          <h2 className="text-2xl font-semibold text-gray-900 sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Grâce à l’appui de nos partenaires, nous pouvons poursuivre notre
            mission auprès des personnes touchées par la fibromyalgie.
          </p>
        </div>

        {/* Logos container */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 sm:px-10">
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {sorted.map((l: any) => {
              const src = resolved[l.id];
              const clickable = !!l.href;
              const Tile = clickable ? "a" : "div";

              return (
                <Tile
                  key={l.id}
                  href={clickable ? l.href : undefined}
                  target={clickable && l.href?.startsWith("http") ? "_blank" : undefined}
                  rel={clickable && l.href?.startsWith("http") ? "noreferrer" : undefined}
                  className={[
                    "flex items-center justify-center rounded-xl bg-white px-4 py-6",
                    "border border-gray-200",
                    "transition",
                    clickable ? "hover:border-[#af2511]/40 hover:bg-gray-100" : "",
                  ].join(" ")}
                  title={l.alt || "Partenaire"}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={l.alt ?? "Logo partenaire"}
                      className="h-14 w-auto object-contain opacity-90"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-14 w-36 animate-pulse rounded bg-gray-200" />
                  )}
                </Tile>
              );
            })}
          </div>
        </div>

        {/* Soft closing line */}
        <p className="mt-6 max-w-3xl text-sm text-gray-600">
          Vous souhaitez soutenir notre mission ou devenir partenaire?{" "}
          <a
            href="#contact"
            className="font-semibold text-[#af2511] hover:underline"
          >
            Communiquez avec nous
          </a>
          .
        </p>
      </div>
    </section>
  );
}
