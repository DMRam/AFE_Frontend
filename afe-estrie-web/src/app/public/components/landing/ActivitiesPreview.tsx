import type { HomePageCMS } from "../../../../content/types/homePage";

export function ActivitiesPreview({ home }: { home?: HomePageCMS | null }) {
  const block = home?.activities;
  if (!block?.enabled) return null;

  const heading = block.header?.heading ?? "Activités";
  const subheading = block.header?.subheading ?? "";
  const ctaLabel = block.ctaLabel ?? "Voir tout →";
  const ctaHref = block.ctaHref ?? "#";

  // future-proof: if later you add `items`, it will use them automatically
  const items = (block as any).items ?? [];

  return (
    <section className="py-16" id="activites">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-red-700">{heading}</p>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900">{heading}</h2>
            {subheading ? <p className="mt-2 text-sm text-gray-600">{subheading}</p> : null}
          </div>

          <a className="text-sm font-semibold text-red-700 hover:underline" href={ctaHref}>
            {ctaLabel} →
          </a>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.length
            ? items.slice(0, 3).map((it: any) => (
                <div
                  key={it.id ?? it.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
                >
                  {it.meta ? (
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      {it.meta}
                    </span>
                  ) : null}
                  <p className="mt-3 text-base font-bold text-gray-900">{it.title}</p>
                  {it.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-3">
                      {it.description}
                    </p>
                  ) : null}
                  <div className="mt-6">
                    <a
                      href={it.href ?? ctaHref}
                      className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Détails
                    </a>
                  </div>
                </div>
              ))
            : Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="h-5 w-32 rounded bg-gray-100" />
                  <div className="mt-4 h-6 w-3/4 rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-full rounded bg-gray-100" />
                  <div className="mt-2 h-4 w-5/6 rounded bg-gray-100" />
                  <div className="mt-6 h-10 w-28 rounded-lg bg-gray-100" />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
