import { uid } from "../utils/ids";

export function FeaturesEditor({
  block,
  onChange,
}: {
  block: any;
  onChange: (next: any) => void;
}) {
  const items = block?.items ?? [];

  const addItem = () => {
    const next = [...items];
    next.push({
      id: uid("f"),
      enabled: true,
      order: next.length + 1,
      icon:
        next.length === 0
          ? "brain"
          : next.length === 1
            ? "sleep"
            : next.length === 2
              ? "balance"
              : "stairs",
      title: "",
      description: "",
    });
    onChange({ ...(block ?? {}), items: next });
  };

  const updateItem = (idx: number, patch: any) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...block, items: next });
  };

  const removeItem = (idx: number) => {
    const next = items.filter((_: any, i: number) => i !== idx);
    onChange({ ...block, items: next });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gray-50 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={block?.enabled !== false}
              onChange={(e) => onChange({ ...(block ?? {}), enabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Enabled</span>
          </label>

          <div />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Eyebrow</label>
            <input
              value={block?.eyebrow ?? ""}
              onChange={(e) => onChange({ ...(block ?? {}), eyebrow: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g., Support"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Heading</label>
            <input
              value={block?.heading ?? ""}
              onChange={(e) => onChange({ ...(block ?? {}), heading: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g., Fibromyalgia symptoms"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Subheading</label>
            <textarea
              value={block?.subheading ?? ""}
              onChange={(e) => onChange({ ...(block ?? {}), subheading: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* CTA */}
        <div className="md:col-span-2">
          <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">CTA (bouton)</h4>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={block?.ctaEnabled !== false}
                  onChange={(e) => onChange({ ...(block ?? {}), ctaEnabled: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600"
                />
                Activer
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Texte du bouton</label>
                <input
                  value={block?.ctaText ?? ""}
                  onChange={(e) => onChange({ ...(block ?? {}), ctaText: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="ex: Découvrir notre approche"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Lien</label>
                <input
                  value={block?.ctaLink ?? ""}
                  onChange={(e) => onChange({ ...(block ?? {}), ctaLink: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="ex: /p/a-propos/axes ou https://..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Astuce: commence par <span className="font-mono">/</span> pour une page interne, ou{" "}
                  <span className="font-mono">https://</span> pour externe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Items ({items.length})</h3>
        <button
          type="button"
          onClick={addItem}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {items
          .slice()
          .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
          .map((it: any, idx: number) => (
            <div key={it.id ?? idx} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">#{it.order ?? idx + 1}</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    icon: {it.icon ?? "brain"} (fixed)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={it.enabled !== false}
                      onChange={(e) => updateItem(idx, { enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    Enabled
                  </label>

                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Order</label>
                  <input
                    type="number"
                    value={it.order ?? idx + 1}
                    onChange={(e) => updateItem(idx, { order: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                  <input
                    value={it.title ?? ""}
                    onChange={(e) => updateItem(idx, { title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={it.description ?? ""}
                    onChange={(e) => updateItem(idx, { description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Icons are intentionally fixed (hand-drawn style). Only text is editable.
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}
