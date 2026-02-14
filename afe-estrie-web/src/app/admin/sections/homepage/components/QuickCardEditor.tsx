import { useState } from "react";

export function QuickCardEditor({
  card,
  index,
  draft,
  setDraft,
}: {
  card: any;
  index: number;
  draft: any;
  setDraft: (next: any) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-l-4 border-green-500">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-600">
                {index + 1}
              </span>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {card.title || `Card ${index + 1}`}
                </h4>
                <p className="text-xs text-gray-500">ID: {card.id}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={card.enabled !== false}
                  onChange={(e) => {
                    const next = (draft.quickCards.cards ?? []).map((x: any) =>
                      x === card ? { ...x, enabled: e.target.checked } : x
                    );
                    setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enabled</span>
              </label>

              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <svg
                  className={`h-5 w-5 text-gray-500 transition ${
                    expanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => {
                  const next = (draft.quickCards.cards ?? []).filter((x: any) => x !== card);
                  setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                }}
                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Display order
                  </label>
                  <input
                    type="number"
                    value={card.order ?? index + 1}
                    onChange={(e) => {
                      const next = (draft.quickCards.cards ?? []).map((x: any) =>
                        x === card ? { ...x, order: Number(e.target.value) } : x
                      );
                      setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={card.title ?? ""}
                  onChange={(e) => {
                    const next = (draft.quickCards.cards ?? []).map((x: any) =>
                      x === card ? { ...x, title: e.target.value } : x
                    );
                    setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g., Become a member"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={card.description ?? ""}
                  onChange={(e) => {
                    const next = (draft.quickCards.cards ?? []).map((x: any) =>
                      x === card ? { ...x, description: e.target.value } : x
                    );
                    setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                  }}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Short description..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Link (href)
                </label>
                <input
                  type="text"
                  value={card.href ?? ""}
                  onChange={(e) => {
                    const next = (draft.quickCards.cards ?? []).map((x: any) =>
                      x === card ? { ...x, href: e.target.value } : x
                    );
                    setDraft({ ...draft, quickCards: { ...draft.quickCards, cards: next } });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="/membership, /activities, #section..."
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
