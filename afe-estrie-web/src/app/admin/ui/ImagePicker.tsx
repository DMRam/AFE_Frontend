import { useEffect, useState } from "react";
import { getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage";
import { storage } from "../../../services/firebase";

type Props = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  folder: string;          // e.g. "site/footer/partners"
  maxList?: number;        // e.g. 30
  accept?: string;         // "image/*"
};

function filenameSafe(name: string) {
  return name.replace(/[^\w.-]+/g, "_");
}

export function ImagePicker({
  label,
  value,
  onChange,
  folder,
  maxList = 30,
  accept = "image/*",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<{ name: string; url: string }[]>([]);
  const [open, setOpen] = useState(false);

  async function refreshList() {
    try {
      const baseRef = ref(storage, folder);
      const res = await listAll(baseRef);

      // take last N (best-effort; Storage doesn't guarantee order)
      const last = res.items.slice(-maxList);

      const urls = await Promise.all(
        last.map(async (it) => ({
          name: it.name,
          url: await getDownloadURL(it),
        }))
      );

      setItems(urls.reverse());
    } catch {
      setItems([]);
    }
  }

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  async function handleUpload(file: File) {
    setBusy(true);
    try {
      const key = `${folder}/${Date.now()}-${filenameSafe(file.name)}`;
      const fileRef = ref(storage, key);
      await uploadBytes(fileRef, file, {
        contentType: file.type || "application/octet-stream",
      });
      const url = await getDownloadURL(fileRef);
      onChange(url);
      await refreshList();
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600">{label}</div>

      {/* URL input */}
      <div className="flex gap-2">
        <input
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={value ?? ""}
          placeholder="https://... (or upload)"
          onChange={(e) => onChange(e.target.value)}
        />

        <label className="cursor-pointer rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          {busy ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
              e.currentTarget.value = "";
            }}
          />
        </label>

        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide" : "Pick"}
        </button>
      </div>

      {/* Existing images */}
      {open && (
        <div className="rounded-lg border bg-white p-3">
          {items.length === 0 ? (
            <div className="text-sm text-gray-500">No images found in {folder}</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((it) => (
                <button
                  key={it.url}
                  type="button"
                  className="group rounded-lg border p-2 text-left hover:border-gray-400"
                  onClick={() => onChange(it.url)}
                >
                  <div className="aspect-[3/2] w-full overflow-hidden rounded bg-gray-50">
                    <img src={it.url} alt={it.name} className="h-full w-full object-contain" />
                  </div>
                  <div className="mt-2 truncate text-xs text-gray-600">{it.name}</div>
                  <div className="mt-1 text-xs text-blue-600 opacity-0 group-hover:opacity-100">
                    Use this
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {value ? (
        <div className="rounded-lg border bg-white p-2">
          <div className="text-xs text-gray-500 mb-2">Preview</div>
          <div className="aspect-[3/1] w-full overflow-hidden rounded bg-gray-50">
            <img src={value} alt="preview" className="h-full w-full object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
