import { useMemo, useRef, useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import type { AnySection, UploadTarget } from "../types";
import { uploadImage } from "../../../../../services/storageRepo";

function isType(section: AnySection, type: string) {
  return section?.type === type;
}

function getTextBody(section: AnySection) {
  // Support NEW (body) and LEGACY (content)
  return String(section?.body ?? section?.content ?? "");
}

function setTextBody(section: AnySection, value: string) {
  // Write both for compatibility
  return { ...section, body: value, content: value };
}

function ModalShell({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-label="Fermer"
      />
      <div className="relative w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function SectionEditModal({
  open,
  section,
  onChange,
  onCancel,
  onApply,
}: {
  open: boolean;
  section: AnySection | null;
  onChange: (next: AnySection) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const heroFileRef = useRef<HTMLInputElement | null>(null);
  const splitFileRef = useRef<HTMLInputElement | null>(null);

  const title = useMemo(() => {
    if (!section) return "Modifier la section";
    if (isType(section, "hero")) return "Modifier la section • Bannière (Hero)";
    if (isType(section, "richText")) return "Modifier la section • Texte";
    if (isType(section, "split")) return "Modifier la section • Image + texte";
    return "Modifier la section";
  }, [section]);

  async function handleUpload(file: File, target: UploadTarget) {
    if (!section) return;

    setUploading(true);
    setUploadError("");
    try {
      const folder = target === "hero" ? "page-hero" : "page-images";
      const url = await uploadImage(file, folder);

      if (target === "hero" && isType(section, "hero")) {
        onChange({ ...section, backgroundImage: url });
      }

      if (target === "split" && isType(section, "split")) {
        onChange({ ...section, imageUrl: url });
      }
    } catch (e: any) {
      setUploadError(`Erreur de téléversement: ${e?.message ?? "Inconnue"}`);
    } finally {
      setUploading(false);
      if (target === "hero" && heroFileRef.current) heroFileRef.current.value = "";
      if (target === "split" && splitFileRef.current) splitFileRef.current.value = "";
    }
  }

  return (
    <ModalShell open={open} title={title} onClose={onCancel}>
      {!section ? null : (
        <div className="space-y-5">
          {uploadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Activer / désactiver */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={section?.enabled !== false}
              onChange={(e) => onChange({ ...section, enabled: e.target.checked })}
            />
            <span className="font-medium text-gray-900">Section active</span>
          </label>

          {/* HERO */}
          {isType(section, "hero") && (
            <div className="space-y-4">
              <label className="text-sm block">
                <div className="mb-2 font-medium text-gray-900">Titre</div>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  value={section.title ?? ""}
                  onChange={(e) => onChange({ ...section, title: e.target.value })}
                />
              </label>

              <label className="text-sm block">
                <div className="mb-2 font-medium text-gray-900">Sous-titre</div>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  value={section.subtitle ?? ""}
                  onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
                />
              </label>

              <div className="space-y-2">
                <label className="text-sm block">
                  <div className="mb-2 font-medium text-gray-900">Image de fond</div>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                    value={section.backgroundImage ?? ""}
                    onChange={(e) =>
                      onChange({ ...section, backgroundImage: e.target.value })
                    }
                    placeholder="https://…"
                  />
                </label>

                <div className="flex items-center gap-3">
                  <input
                    ref={heroFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void handleUpload(f, "hero");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => heroFileRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? "Téléversement…" : "Téléverser une image"}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm block">
                  <div className="mb-2 font-medium text-gray-900">Alignement</div>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                    value={section.align ?? "center"}
                    onChange={(e) => onChange({ ...section, align: e.target.value })}
                  >
                    <option value="left">Gauche</option>
                    <option value="center">Centre</option>
                  </select>
                </label>

                <label className="text-sm block">
                  <div className="mb-2 font-medium text-gray-900">Couleur du texte</div>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                    value={section.textColor ?? "light"}
                    onChange={(e) => onChange({ ...section, textColor: e.target.value })}
                  >
                    <option value="light">Clair (blanc)</option>
                    <option value="dark">Foncé (noir)</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* RICH TEXT */}
          {isType(section, "richText") && (
            <div className="space-y-4">
              <label className="text-sm block">
                <div className="mb-2 font-medium text-gray-900">Titre (optionnel)</div>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  value={section.heading ?? ""}
                  onChange={(e) => onChange({ ...section, heading: e.target.value })}
                  placeholder="Ex.: Notre approche"
                />
              </label>

              <label className="text-sm block">
                <div className="mb-2 font-medium text-gray-900">Texte</div>
                <textarea
                  rows={10}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  value={getTextBody(section)}
                  onChange={(e) => onChange(setTextBody(section, e.target.value))}
                  placeholder="Écrivez le contenu ici…"
                />
              </label>

              <label className="text-sm block">
                <div className="mb-2 font-medium text-gray-900">Style du bloc</div>
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  value={section.tone ?? "standard"}
                  onChange={(e) => onChange({ ...section, tone: e.target.value })}
                >
                  <option value="standard">Standard</option>
                  <option value="info">Info (mise en évidence)</option>
                  <option value="important">Important</option>
                </select>
              </label>
            </div>
          )}

          {/* SPLIT */}
          {isType(section, "split") && (
            <div className="space-y-4">
              <label className="text-sm block">
                <div className="mb-2 font-medium text-gray-900">Titre</div>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  value={section.title ?? ""}
                  onChange={(e) => onChange({ ...section, title: e.target.value })}
                />
              </label>

              <label className="text-sm block">
                <div className="mb-2 font-medium text-gray-900">Texte</div>
                <textarea
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  value={getTextBody(section)}
                  onChange={(e) => onChange(setTextBody(section, e.target.value))}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-sm block">
                    <div className="mb-2 font-medium text-gray-900">Image (URL)</div>
                    <input
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                      value={section.imageUrl ?? ""}
                      onChange={(e) => onChange({ ...section, imageUrl: e.target.value })}
                      placeholder="https://…"
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    <input
                      ref={splitFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        void handleUpload(f, "split");
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => splitFileRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      <Upload className="h-4 w-4" />
                      {uploading ? "Téléversement…" : "Téléverser"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm block">
                    <div className="mb-2 font-medium text-gray-900">Côté de l’image</div>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                      value={section.imageSide ?? "right"}
                      onChange={(e) => onChange({ ...section, imageSide: e.target.value })}
                    >
                      <option value="left">Gauche</option>
                      <option value="right">Droite</option>
                    </select>
                  </label>

                  <label className="text-sm block">
                    <div className="mb-2 font-medium text-gray-900">Style</div>
                    <select
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                      value={section.variant ?? "default"}
                      onChange={(e) => onChange({ ...section, variant: e.target.value })}
                    >
                      <option value="default">Blanc</option>
                      <option value="soft">Gris pâle</option>
                    </select>
                  </label>
                </div>
              </div>

              <label className="text-sm block">
                <div className="mb-2 font-medium text-gray-900">
                  Texte alternatif (accessibilité)
                </div>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  value={section.imageAlt ?? ""}
                  onChange={(e) => onChange({ ...section, imageAlt: e.target.value })}
                  placeholder="Ex.: Photo d’un bureau chaleureux"
                />
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
              disabled={uploading}
            >
              Annuler
            </button>
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              onClick={onApply}
              disabled={uploading}
            >
              Appliquer
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

export default SectionEditModal;
