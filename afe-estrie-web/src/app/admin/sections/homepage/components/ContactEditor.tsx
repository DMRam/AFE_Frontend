import type { ContactBlock } from "../types";

export function ContactEditor({
  block,
  onChange,
}: {
  block?: ContactBlock;
  onChange: (next: ContactBlock) => void;
}) {
  const hours = (block?.hours ?? []) as { label: string; value: string }[];
  const phones = (block?.phones ?? []) as { label?: string; value: string }[];

  const set = (patch: Partial<ContactBlock>) => onChange({ ...(block ?? {}), ...patch });

  const setHour = (idx: number, patch: Partial<{ label: string; value: string }>) => {
    const next = [...hours];
    next[idx] = { ...(next[idx] ?? { label: "", value: "" }), ...patch };
    set({ hours: next });
  };

  const addHour = () => set({ hours: [...hours, { label: "", value: "" }] });
  const removeHour = (idx: number) => set({ hours: hours.filter((_, i) => i !== idx) });

  const setPhone = (idx: number, patch: Partial<{ label?: string; value: string }>) => {
    const next = [...phones];
    next[idx] = { ...(next[idx] ?? { label: "", value: "" }), ...patch };
    set({ phones: next });
  };

  const addPhone = () => set({ phones: [...phones, { label: "", value: "" }] });
  const removePhone = (idx: number) => set({ phones: phones.filter((_, i) => i !== idx) });

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-l-4 border-rose-500">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">📍</span>
              <h4 className="font-semibold text-gray-900">Contact (map + details)</h4>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block?.enabled !== false}
                onChange={(e) => set({ enabled: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enabled</span>
            </label>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <div className="mb-1 font-medium text-gray-900">Organization name</div>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={block?.orgName ?? ""}
                onChange={(e) => set({ orgName: e.target.value })}
                placeholder="Association de la fibromyalgie de l’Estrie"
              />
            </label>

            <label className="text-sm">
              <div className="mb-1 font-medium text-gray-900">Email</div>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={block?.email ?? ""}
                onChange={(e) => set({ email: e.target.value })}
                placeholder="info@example.ca"
              />
            </label>

            <label className="text-sm md:col-span-2">
              <div className="mb-1 font-medium text-gray-900">Address</div>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={block?.address ?? ""}
                onChange={(e) => set({ address: e.target.value })}
                placeholder="1013, rue ... Sherbrooke (QC) ..."
              />
            </label>

            <label className="text-sm md:col-span-2">
              <div className="mb-1 font-medium text-gray-900">Google Maps embed URL</div>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs"
                value={block?.mapEmbedUrl ?? ""}
                onChange={(e) => set({ mapEmbedUrl: e.target.value })}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <div className="mt-1 text-xs text-gray-500">
                Google Maps → Share → <b>Embed a map</b> → copy the <span className="font-mono">src</span> URL.
              </div>
            </label>

            <label className="text-sm md:col-span-2">
              <div className="mb-1 font-medium text-gray-900">Directions link</div>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={block?.directionsUrl ?? ""}
                onChange={(e) => set({ directionsUrl: e.target.value })}
                placeholder="https://maps.google.com/?q=..."
              />
            </label>
          </div>

          {/* Hours */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-gray-900">Opening hours</h5>
              <button
                type="button"
                onClick={addHour}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Add
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {hours.map((h, idx) => (
                <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={h.label ?? ""}
                    onChange={(e) => setHour(idx, { label: e.target.value })}
                    placeholder="Monday to Friday"
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={h.value ?? ""}
                    onChange={(e) => setHour(idx, { value: e.target.value })}
                    placeholder="9:00 AM to 12:00 PM"
                  />
                  <button
                    type="button"
                    onClick={() => removeHour(idx)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}

              {!hours.length ? (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                  No hours yet. Click <b>“Add”</b>.
                </div>
              ) : null}
            </div>
          </div>

          {/* Phones */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-gray-900">Phone numbers</h5>
              <button
                type="button"
                onClick={addPhone}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + Add
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {phones.map((p, idx) => (
                <div key={idx} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={p.label ?? ""}
                    onChange={(e) => setPhone(idx, { label: e.target.value })}
                    placeholder="Local / Toll-free (optional)"
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={p.value ?? ""}
                    onChange={(e) => setPhone(idx, { value: e.target.value })}
                    placeholder="819-566-1067"
                  />
                  <button
                    type="button"
                    onClick={() => removePhone(idx)}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}

              {!phones.length ? (
                <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                  No phone numbers yet. Click <b>“Add”</b>.
                </div>
              ) : null}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
