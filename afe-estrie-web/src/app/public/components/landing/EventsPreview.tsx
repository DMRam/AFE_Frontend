import { useEffect, useMemo, useState } from "react";
import type { HomePageCMS } from "../../../../content/types/homePage";

type EventCMSItem = {
  id?: string;
  enabled?: boolean;
  order?: number;
  title?: string;
  description?: string;
  href?: string;
  meta?: string;
  date?: string; // recommended: ISO like "2026-03-10" or "2026-03-10T18:30:00"
};

type UiEvent = {
  id: string;
  title: string;
  dateRaw: string;      // original
  dateObj: Date | null; // parsed date
  summary: string;
  details: string;
  location: string;
  href: string;
};

function parseMaybeDate(raw?: string): Date | null {
  const s = String(raw ?? "").trim();
  if (!s || s === "—") return null;

  // Try native parse first (works for ISO)
  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1;

  // Try common manual formats: dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    const yyyy = Number(m[3]);
    const d2 = new Date(yyyy, mm - 1, dd);
    if (!isNaN(d2.getTime())) return d2;
  }

  return null;
}

function formatDateQC(d: Date): string {
  return d.toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function splitDateParts(d: Date) {
  return {
    day: d.getDate(),
    month: d.toLocaleDateString("fr-CA", { month: "short" }), // ex: "mars"
  };
}

export function EventsPreview({ home }: { home?: HomePageCMS | null }) {
  const block = home?.events;

  if (block?.enabled === false) return null;

  const heading = block?.header?.heading ?? "Événements";
  const subheading = block?.header?.subheading ?? "Prochains événements.";
  const ctaLabel = block?.ctaLabel ?? "Voir le calendrier";
  const ctaHref = block?.ctaHref ?? "/evenements";

  const items = useMemo<UiEvent[]>(() => {
    const raw = ((block as any)?.items ?? []) as EventCMSItem[];

    return raw
      .filter((x) => x?.enabled !== false)
      .slice()
      .sort((a, b) => (a?.order ?? 0) - (b?.order ?? 0))
      .map((it) => {
        const dateRaw = String(it.date ?? "").trim();
        const dateObj = parseMaybeDate(dateRaw);

        return {
          id: it.id || `${it.title || "event"}-${it.order ?? 0}`,
          title: it.title ?? "",
          dateRaw,
          dateObj,
          summary: it.description ?? "",
          details: it.description ?? "",
          location: it.meta ?? "",
          href: it.href ?? "#",
        };
      });
  }, [block]);

  const [openIndex, setOpenIndex] = useState<number | null>(items.length ? 0 : null);

  // Keep openIndex valid if items change
  useEffect(() => {
    setOpenIndex((prev) => {
      if (items.length === 0) return null;
      if (prev == null) return 0;
      if (prev >= items.length) return 0;
      return prev;
    });
  }, [items.length]);

  const toggle = (idx: number) => setOpenIndex((prev) => (prev === idx ? null : idx));

  return (
    <section className="bg-gray-50 py-16" id="evenements">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-red-700">{heading}</p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">{heading}</h2>
            <p className="mt-2 text-sm text-gray-600">{subheading}</p>
          </div>

          {ctaLabel && ctaHref ? (
            <a
              href={ctaHref}
              className="hidden shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 sm:inline-flex"
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
              const isOpen = openIndex === idx;
              const parts = it.dateObj ? splitDateParts(it.dateObj) : null;

              return (
                <div key={it.id} className={idx !== 0 ? "border-t border-gray-100" : ""}>
                  {/* HEADER BUTTON */}
                  <button
                    type="button"
                    onClick={() => toggle(idx)}
                    className={[
                      "group flex w-full items-center justify-between gap-6 px-6 py-5 text-left",
                      "transition-all duration-200",
                      "cursor-pointer",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",
                      isOpen
                        ? "bg-white"
                        : "bg-white hover:bg-gray-50",
                    ].join(" ")}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-5">
                      {/* DATE BADGE */}
                      <div
                        className={[
                          "flex min-w-[72px] flex-col items-center justify-center rounded-2xl px-3 py-3 shadow-sm",
                          parts ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700",
                          // soft hover to show clickable
                          "transition-transform duration-200 group-hover:-translate-y-0.5",
                        ].join(" ")}
                      >
                        {parts ? (
                          <>
                            <span className="text-xs uppercase tracking-wide opacity-90">
                              {parts.month}
                            </span>
                            <span className="text-xl font-extrabold leading-none">
                              {parts.day}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                              À venir
                            </span>
                            <span className="text-xs font-bold">—</span>
                          </>
                        )}
                      </div>

                      {/* TEXT */}
                      <div className="min-w-0">
                        <p className="text-lg font-bold text-gray-900">
                          {it.title || "Événement"}
                        </p>

                        {it.summary ? (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {it.summary}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm text-gray-500">
                            Cliquez pour voir les détails
                          </p>
                        )}

                        {/* subtle hover hint */}
                        <p className="mt-1 hidden text-xs text-gray-500 group-hover:block">
                          Cliquez pour {isOpen ? "réduire" : "déployer"}
                        </p>
                      </div>
                    </div>

                    {/* Chevron */}
                    <span
                      className={[
                        "inline-flex h-10 w-10 items-center justify-center rounded-xl",
                        "border border-gray-200 bg-white text-gray-600 shadow-sm",
                        "transition-all duration-200",
                        isOpen ? "rotate-180" : "",
                        "group-hover:border-gray-300 group-hover:shadow",
                      ].join(" ")}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>

                  {/* COLLAPSE */}
                  <div
                    className={[
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <div className="px-6 pb-6">
                        <div className="rounded-2xl bg-gray-50 p-5">
                          {/* FULL DATE line */}
                          {it.dateObj ? (
                            <p className="text-sm font-semibold text-gray-900">
                              🗓️ Date :{" "}
                              <span className="font-normal text-gray-700">
                                {formatDateQC(it.dateObj)}
                              </span>
                            </p>
                          ) : null}

                          {it.location ? (
                            <p className="mt-2 text-sm font-semibold text-gray-900">
                              📍 Lieu :{" "}
                              <span className="font-normal text-gray-700">
                                {it.location}
                              </span>
                            </p>
                          ) : null}

                          {it.details ? (
                            <p className="mt-3 text-sm leading-relaxed text-gray-700">
                              {it.details}
                            </p>
                          ) : null}

                          <div className="mt-5 flex flex-wrap gap-3">
                            <a
                              href={it.href || "#"}
                              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                            >
                              Voir les détails
                            </a>

                            <button
                              type="button"
                              onClick={() => toggle(idx)}
                              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                            >
                              Fermer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {ctaLabel && ctaHref ? (
          <div className="mt-6 sm:hidden">
            <a
              href={ctaHref}
              className="inline-flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
            >
              {ctaLabel}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}