import { useState } from "react";

export function SlideCard({
  slide,
  index,
  draft,
  setDraft,
}: {
  slide: any;
  index: number;
  draft: any;
  setDraft: (next: any) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-l-4 border-blue-500">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                {index + 1}
              </span>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {slide.title || `Slide ${index + 1}`}
                </h4>
                <p className="text-xs text-gray-500">ID: {slide.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={slide.enabled !== false}
                  onChange={(e) => {
                    const next = (draft.hero.slides ?? []).map((x: any) =>
                      x === slide ? { ...x, enabled: e.target.checked } : x
                    );
                    setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enabled</span>
              </label>

              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="rounded-lg p-2 hover:bg-gray-100"
                title={expanded ? "Collapse" : "Expand"}
              >
                <svg
                  className={`h-5 w-5 text-gray-500 transition ${
                    expanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = (draft.hero.slides ?? []).filter((x: any) => x !== slide);
                  setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                }}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Display order
                  </label>
                  <input
                    type="number"
                    value={slide.order ?? index + 1}
                    onChange={(e) => {
                      const next = (draft.hero.slides ?? []).map((x: any) =>
                        x === slide ? { ...x, order: Number(e.target.value) } : x
                      );
                      setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Background video
                  </label>
                  <select
                    value={slide.videoKey ?? "v1"}
                    onChange={(e) => {
                      const next = (draft.hero.slides ?? []).map((x: any) =>
                        x === slide ? { ...x, videoKey: e.target.value as any } : x
                      );
                      setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="v1">Video 1</option>
                    <option value="v2">Video 2</option>
                    <option value="v3">Video 3</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={slide.eyebrow ?? ""}
                    onChange={(e) => {
                      const next = (draft.hero.slides ?? []).map((x: any) =>
                        x === slide ? { ...x, eyebrow: e.target.value } : x
                      );
                      setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g., Association • Estrie"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Main title
                  </label>
                  <input
                    type="text"
                    value={slide.title ?? ""}
                    onChange={(e) => {
                      const next = (draft.hero.slides ?? []).map((x: any) =>
                        x === slide ? { ...x, title: e.target.value } : x
                      );
                      setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g., Welcome — AFE"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={slide.description ?? ""}
                    onChange={(e) => {
                      const next = (draft.hero.slides ?? []).map((x: any) =>
                        x === slide ? { ...x, description: e.target.value } : x
                      );
                      setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                    }}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Short slide description..."
                  />
                </div>
              </div>

              {/* CTAs */}
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-gray-900">Call-to-actions</h5>
                  <button
                    type="button"
                    onClick={() => {
                      const ctas = [...(slide.ctas ?? [])];
                      ctas.push({ label: "", href: "#", variant: "primary" });
                      const next = (draft.hero.slides ?? []).map((x: any) =>
                        x === slide ? { ...x, ctas } : x
                      );
                      setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white"
                  >
                    + Add CTA
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {(slide.ctas ?? []).map((cta: any, cIdx: number) => (
                    <div
                      key={cIdx}
                      className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Button label
                          </label>
                          <input
                            type="text"
                            value={cta.label}
                            onChange={(e) => {
                              const nextCtas = [...(slide.ctas ?? [])];
                              nextCtas[cIdx] = {
                                ...nextCtas[cIdx],
                                label: e.target.value,
                              };
                              const next = (draft.hero.slides ?? []).map((x: any) =>
                                x === slide ? { ...x, ctas: nextCtas } : x
                              );
                              setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                            }}
                            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                            placeholder="e.g., View activities"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Link
                          </label>
                          <input
                            type="text"
                            value={cta.href}
                            onChange={(e) => {
                              const nextCtas = [...(slide.ctas ?? [])];
                              nextCtas[cIdx] = {
                                ...nextCtas[cIdx],
                                href: e.target.value,
                              };
                              const next = (draft.hero.slides ?? []).map((x: any) =>
                                x === slide ? { ...x, ctas: nextCtas } : x
                              );
                              setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                            }}
                            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                            placeholder="e.g., /activities"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            Style
                          </label>
                          <select
                            value={cta.variant}
                            onChange={(e) => {
                              const nextCtas = [...(slide.ctas ?? [])];
                              nextCtas[cIdx] = {
                                ...nextCtas[cIdx],
                                variant: e.target.value,
                              };
                              const next = (draft.hero.slides ?? []).map((x: any) =>
                                x === slide ? { ...x, ctas: nextCtas } : x
                              );
                              setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                            }}
                            className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                          >
                            <option value="primary">Primary</option>
                            <option value="secondary">Secondary</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const nextCtas = [...(slide.ctas ?? [])].filter((_: any, i: number) => i !== cIdx);
                            const next = (draft.hero.slides ?? []).map((x: any) =>
                              x === slide ? { ...x, ctas: nextCtas } : x
                            );
                            setDraft({ ...draft, hero: { ...draft.hero, slides: next } });
                          }}
                          className="rounded border border-red-300 bg-white px-3 py-1 text-sm text-red-600 hover:bg-red-50"
                        >
                          Remove CTA
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
