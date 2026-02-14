import { useState } from "react";
import { uid } from "../utils/ids";
import { uploadHomeMedia } from "../../../../../services/storageRepo";

export function PartnersEditor({
  block,
  onChange,
}: {
  block: any;
  onChange: (next: any) => void;
}) {
  const logos = (block?.logos ?? []) as any[];
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const setLogo = (id: string, patch: any) => {
    const next = logos.map((l) => (l.id === id ? { ...l, ...patch } : l));
    onChange({ ...block, logos: next });
  };

  const removeLogo = (id: string) => {
    onChange({ ...block, logos: logos.filter((l) => l.id !== id) });
  };

  const addLogo = () => {
    const next = [...logos];
    next.push({
      id: uid("p"),
      enabled: true,
      order: next.length + 1,
      alt: "",
      href: "",
      src: "",
      storagePath: "",
    });
    onChange({ ...block, logos: next });
  };

  const onUpload = async (id: string, file?: File | null) => {
    if (!file) return;
    setErr(null);
    setUploadingId(id);

    try {
      const { url, path } = await uploadHomeMedia(file);
      setLogo(id, { src: url, storagePath: path });
    } catch (e: any) {
      console.error(e);
      setErr(e?.message ?? "Upload error");
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-l-4 border-orange-500">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🤝</span>
              <h4 className="font-semibold text-gray-900">Partners</h4>
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

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Section heading
              </label>
              <input
                type="text"
                value={block?.heading ?? ""}
                onChange={(e) => onChange({ ...block, heading: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g., Our partners"
              />
            </div>

            <div className="flex items-end justify-end">
              <button
                type="button"
                onClick={addLogo}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Add logo
              </button>
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {logos
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((logo, idx) => {
                const isUploading = uploadingId === logo.id;
                const src = logo.src || "";

                return (
                  <div key={logo.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                          {idx + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={logo.enabled !== false}
                                onChange={(e) => setLogo(logo.id, { enabled: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Enabled</span>
                            </label>

                            <div className="text-xs text-gray-500">ID: {logo.id}</div>
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white">
                              {src ? (
                                <img
                                  src={src}
                                  alt={logo.alt || "logo"}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-gray-400">Preview</span>
                              )}
                            </div>

                            <div className="grid flex-1 gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">
                                  Order
                                </label>
                                <input
                                  type="number"
                                  value={logo.order ?? idx + 1}
                                  onChange={(e) => setLogo(logo.id, { order: Number(e.target.value) })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-700">
                                  Alt text
                                </label>
                                <input
                                  type="text"
                                  value={logo.alt ?? ""}
                                  onChange={(e) => setLogo(logo.id, { alt: e.target.value })}
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  placeholder="e.g., Desjardins"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">
                                Image URL (option A)
                              </label>
                              <input
                                type="text"
                                value={logo.src ?? ""}
                                onChange={(e) =>
                                  setLogo(logo.id, { src: e.target.value, storagePath: "" })
                                }
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="https://.../logo.png"
                              />
                              <p className="mt-1 text-[11px] text-gray-500">
                                If you paste a URL, storagePath is cleared automatically.
                              </p>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">
                                Upload (option B)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => onUpload(logo.id, e.target.files?.[0])}
                                disabled={isUploading}
                                className="block w-full text-sm"
                              />
                              <div className="mt-2 text-[11px] text-gray-500">
                                {isUploading
                                  ? "Uploading..."
                                  : logo.storagePath
                                  ? `Storage: ${logo.storagePath}`
                                  : ""}
                              </div>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-medium text-gray-700">
                                Link (optional)
                              </label>
                              <input
                                type="text"
                                value={logo.href ?? ""}
                                onChange={(e) => setLogo(logo.id, { href: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="https://partner.org"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLogo(logo.id)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}

            {!logos.length ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
                No logos yet. Click <b>“Add logo”</b>.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
