import { uid } from "../utils/ids";

export function SimpleBlockEditor({
  title,
  icon,
  block,
  onChange,
}: {
  title: string;
  icon: string;
  block: any;
  onChange: (next: any) => void;
}) {
  const items = ((block as any)?.items ?? []) as any[];

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-l-4 border-purple-500">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <h4 className="font-semibold text-gray-900">{title}</h4>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block?.enabled !== false}
                onChange={(e) => onChange({ ...block, enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>
          </div>

          {/* Header + CTA */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Heading
              </label>
              <input
                type="text"
                value={block?.header?.heading ?? ""}
                onChange={(e) =>
                  onChange({
                    ...block,
                    header: { ...(block?.header ?? {}), heading: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subheading
              </label>
              <input
                type="text"
                value={block?.header?.subheading ?? ""}
                onChange={(e) =>
                  onChange({
                    ...block,
                    header: { ...(block?.header ?? {}), subheading: e.target.value },
                  })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                CTA label
              </label>
              <input
                type="text"
                value={block?.ctaLabel ?? ""}
                onChange={(e) => onChange({ ...block, ctaLabel: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                CTA href
              </label>
              <input
                type="text"
                value={block?.ctaHref ?? ""}
                onChange={(e) => onChange({ ...block, ctaHref: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Items CRUD */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-gray-900">
                Items ({items.length})
              </h5>

              <button
                type="button"
                onClick={() => {
                  const next = [...items];
                  next.push({
                    id: uid("it"),
                    enabled: true,
                    order: next.length + 1,
                    title: "",
                    description: "",
                    href: "",
                    meta: "",
                    date: "",
                  });
                  onChange({ ...block, items: next });
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Add item
              </button>
            </div>

            {items
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((it, idx) => (
                <div
                  key={it.id ?? idx}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {it.title || "Item"}
                        </p>
                        <p className="text-xs text-gray-500">ID: {it.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={it.enabled !== false}
                          onChange={(e) => {
                            const next = items.map((x) =>
                              x === it ? { ...x, enabled: e.target.checked } : x
                            );
                            onChange({ ...block, items: next });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enabled</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const next = items.filter((x) => x !== it);
                          onChange({ ...block, items: next });
                        }}
                        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-6">
                    <div className="md:col-span-1">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Order
                      </label>
                      <input
                        type="number"
                        value={it.order ?? idx + 1}
                        onChange={(e) => {
                          const next = items.map((x) =>
                            x === it ? { ...x, order: Number(e.target.value) } : x
                          );
                          onChange({ ...block, items: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="md:col-span-5">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Title
                      </label>
                      <input
                        type="text"
                        value={it.title ?? ""}
                        onChange={(e) => {
                          const next = items.map((x) =>
                            x === it ? { ...x, title: e.target.value } : x
                          );
                          onChange({ ...block, items: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="md:col-span-6">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={it.description ?? ""}
                        onChange={(e) => {
                          const next = items.map((x) =>
                            x === it ? { ...x, description: e.target.value } : x
                          );
                          onChange({ ...block, items: next });
                        }}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Link (href)
                      </label>
                      <input
                        type="text"
                        value={it.href ?? ""}
                        onChange={(e) => {
                          const next = items.map((x) =>
                            x === it ? { ...x, href: e.target.value } : x
                          );
                          onChange({ ...block, items: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="/activities or https://..."
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Meta (optional)
                      </label>
                      <input
                        type="text"
                        value={it.meta ?? ""}
                        onChange={(e) => {
                          const next = items.map((x) =>
                            x === it ? { ...x, meta: e.target.value } : x
                          );
                          onChange({ ...block, items: next });
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="e.g., Workshop • 90 min"
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
