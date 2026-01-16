import { useMemo, useState } from "react";
import type { HomePageCMS } from "../../../../content/types/homePage";

type EventCMSItem = {
  id?: string;
  enabled?: boolean;
  order?: number;
  title?: string;
  description?: string; // <-- you already use "description" in activities/events/resources items
  href?: string;
  meta?: string;        // optional (ex: "En ligne / Présentiel")
  date?: string;        // optional (ISO or label)
};

export function EventsPreview({ home }: { home?: HomePageCMS | null }) {
  const block = home?.events;

  // If events block is disabled in CMS, don't render
  if (block?.enabled === false) return null;

  const heading = block?.header?.heading ?? "Événements";
  const subheading = block?.header?.subheading ?? "Prochains événements.";

  const ctaLabel = block?.ctaLabel ?? "Voir le calendrier";
  const ctaHref = block?.ctaHref ?? "/evenements";

  const items = useMemo(() => {
    const raw = ((block as any)?.items ?? []) as EventCMSItem[];

    return raw
      .filter((x) => x?.enabled !== false)
      .slice()
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
      .map((it) => ({
        id: it.id || `${it.title || "event"}-${it.order ?? 0}`,
        title: it.title ?? "",
        // "date" in your DB is currently a string (can be empty). Use it if present, else fallback.
        dateLabel: (it.date && it.date.trim()) ? it.date : "—",
        summary: it.description ?? "",
        details: it.description ?? "", // if later you want separate fields, split it
        location: it.meta ?? "",       // use meta as location label (nice reuse)
        href: it.href ?? "#",
      }));
  }, [block]);

  // Open first item if exists, else none
  const [openIndex, setOpenIndex] = useState<number | null>(items.length ? 0 : null);

  // If items list changes length, keep state safe
  const safeOpenIndex = openIndex != null && openIndex < items.length ? openIndex : null;

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="bg-gray-50 py-16" id="evenements">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-sm font-semibold text-red-700">{heading}</p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">{heading}</h2>
            <p className="mt-2 text-sm text-gray-600">{subheading}</p>
          </div>

          {/* Optional top CTA */}
          {ctaLabel && ctaHref ? (
            <a
              href={ctaHref}
              className="hidden shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 sm:inline-flex"
            >
              {ctaLabel}
            </a>
          ) : null}
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {!items.length ? (
            <div className="p-6 text-sm text-gray-600">
              Aucun événement pour le moment.
              {ctaLabel && ctaHref ? (
                <>
                  {" "}
                  <a className="font-semibold text-red-700 underline" href={ctaHref}>
                    {ctaLabel}
                  </a>
                </>
              ) : null}
            </div>
          ) : (
            items.map((it, idx) => {
              const isOpen = safeOpenIndex === idx;

              return (
                <div key={it.id} className={idx !== 0 ? "border-t border-gray-200" : ""}>
                  {/* HEADER */}
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    className={`flex w-full items-center justify-between gap-4 p-5 text-left transition ${isOpen ? "bg-gray-50" : "bg-white hover:bg-gray-50/70"
                      }`}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-4">
                      <div className="min-w-20 rounded-xl bg-red-50 px-3 py-2 text-center">
                        <p className="text-xs font-semibold text-red-700">Date</p>
                        <p className="text-sm font-extrabold text-red-700">{it.dateLabel}</p>
                      </div>

                      <div>
                        <p className="text-base font-bold text-gray-900">{it.title}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{it.summary}</p>
                      </div>
                    </div>

                    {/* Chevron soft */}
                    <span
                      className={`ml-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-transform duration-300 ${isOpen ? "rotate-180" : ""
                        }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>

                  {/* SOFT COLLAPSE */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                  >
                    <div className="overflow-hidden">
                      <div
                        className={`px-5 pb-6 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"
                          }`}
                      >
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          {it.location ? (
                            <p className="text-sm font-semibold text-gray-900">
                              Lieu: <span className="font-normal text-gray-700">{it.location}</span>
                            </p>
                          ) : null}

                          {it.details ? (
                            <p className="mt-2 text-sm leading-relaxed text-gray-700">{it.details}</p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap gap-3">
                            <a
                              href={it.href || "#"}
                              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                            >
                              Voir les détails
                            </a>
                            <button
                              type="button"
                              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                              onClick={() => toggle(idx)}
                            >
                              Fermer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* end collapse */}
                </div>
              );
            })
          )}
        </div>

        {/* Mobile CTA */}
        {ctaLabel && ctaHref ? (
          <div className="mt-6 sm:hidden">
            <a
              href={ctaHref}
              className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
            >
              {ctaLabel}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
