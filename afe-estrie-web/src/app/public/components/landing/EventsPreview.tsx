import { useState } from "react";

type EventItem = {
  title: string;
  dateLabel: string; // "Jan 20"
  summary: string;   // "Détails et inscription."
  details?: string;
  location?: string;
  href?: string;
};

const eventItems: EventItem[] = [
  {
    title: "Conférence — Gestion de la douleur",
    dateLabel: "Jan 20",
    summary: "Détails et inscription.",
    details:
      "Présentation et échanges autour de stratégies concrètes pour gérer la douleur au quotidien. Inscription requise.",
    location: "Sherbrooke",
    href: "#",
  },
  {
    title: "Rencontre d’information",
    dateLabel: "Feb 05",
    summary: "Détails et inscription.",
    details:
      "Rencontre ouverte pour découvrir les services de l’AFE, poser vos questions et connaître nos activités.",
    location: "En ligne / Présentiel",
    href: "#",
  },
  {
    title: "Atelier en ligne",
    dateLabel: "Feb 18",
    summary: "Détails et inscription.",
    details:
      "Atelier pratique en ligne avec des outils simples: routine, respiration, ressources et échanges.",
    location: "En ligne",
    href: "#",
  },
];

export function EventsPreview() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="bg-gray-50 py-16" id="evenements">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-sm font-semibold text-red-700">Événements</p>
        <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Événements</h2>
        <p className="mt-2 text-sm text-gray-600">Prochains événements (placeholder).</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {eventItems.map((it, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div key={it.title} className={idx !== 0 ? "border-t border-gray-200" : ""}>
                {/* HEADER */}
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className={`flex w-full items-center justify-between gap-4 p-5 text-left transition
                    ${isOpen ? "bg-gray-50" : "bg-white hover:bg-gray-50/70"}
                  `}
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-20 rounded-xl bg-red-50 px-3 py-2 text-center">
                      <p className="text-xs font-semibold text-red-700">Date</p>
                      <p className="text-sm font-extrabold text-red-700">{it.dateLabel}</p>
                    </div>

                    <div>
                      <p className="text-base font-bold text-gray-900">{it.title}</p>
                      <p className="text-sm text-gray-600">{it.summary}</p>
                    </div>
                  </div>

                  {/* Chevron suave */}
                  <span
                    className={`ml-4 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700
                      transition-transform duration-300 ${isOpen ? "rotate-180" : ""}
                    `}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                {/* SOFT COLLAPSE: grid rows trick + opacity */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`px-5 pb-6 transition-opacity duration-300 ${
                        isOpen ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <div className="rounded-xl border border-gray-200 bg-white p-4">
                        {it.location ? (
                          <p className="text-sm font-semibold text-gray-900">
                            Lieu:{" "}
                            <span className="font-normal text-gray-700">{it.location}</span>
                          </p>
                        ) : null}

                        {it.details ? (
                          <p className="mt-2 text-sm leading-relaxed text-gray-700">
                            {it.details}
                          </p>
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
          })}
        </div>
      </div>
    </section>
  );
}
