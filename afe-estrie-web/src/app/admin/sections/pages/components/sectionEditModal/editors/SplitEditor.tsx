import { RichTextInput } from "../../../../../../../components/RichTextInput";
import { uploadHomeMedia } from "../../../../../../../services/storageRepo";
import type { AnySection } from "../../../types";
import { isType } from "../textBody";
import { Upload } from "lucide-react";

export function SplitEditor({
  section,
  onChange,
  uploading,
  setUploading,
  setUploadError,
}: {
  section: AnySection;
  onChange: (next: AnySection) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  setUploadError: (msg: string) => void;
}) {
  if (!isType(section, "split")) return null;

  const title = String((section as any).title ?? "");
  const body = String((section as any).body ?? (section as any).content ?? "");
  const imageUrl = String((section as any).imageUrl ?? "");
  const imageAlt = String((section as any).imageAlt ?? "");
  const imageSide = String((section as any).imageSide ?? "right");
  const variant = String((section as any).variant ?? "default");

  const imageSize = String((section as any).imageSize ?? "md");
  const imageMaxWidth = Number((section as any).imageMaxWidth ?? 0);
  const imageObjectFit = String((section as any).imageObjectFit ?? "cover");

  async function onPickFile(file: File) {
    setUploading(true);
    setUploadError("");
    try {
      const { url } = await uploadHomeMedia(file);
      onChange({ ...(section as any), imageUrl: url });
    } catch (e: any) {
      setUploadError(`Erreur d'upload: ${e?.message ?? "Inconnue"}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold text-gray-900">Image + texte</div>

      <label className="text-sm block">
        <div className="mb-2 font-medium text-gray-900">Titre</div>
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          value={title}
          onChange={(e) => onChange({ ...(section as any), title: e.target.value })}
          placeholder="Titre de la section"
        />
      </label>

      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-900">Contenu</div>

        <RichTextInput
          value={body}
          onChange={(html) =>
            onChange({
              ...(section as any),
              body: html,
              content: html,
            })
          }
          placeholder="Écrivez votre texte ici…"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm block">
            <div className="mb-2 font-medium text-gray-900">URL de l'image</div>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              value={imageUrl}
              onChange={(e) => onChange({ ...(section as any), imageUrl: e.target.value })}
              placeholder="https://…"
            />
          </label>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span>{uploading ? "Téléchargement…" : "Télécharger"}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  void onPickFile(f);
                  e.currentTarget.value = "";
                }}
              />
            </label>

            <span className="text-xs text-gray-500">PNG, JPG, WebP</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm block">
            <div className="mb-2 font-medium text-gray-900">Côté de l'image</div>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              value={imageSide}
              onChange={(e) => onChange({ ...(section as any), imageSide: e.target.value })}
            >
              <option value="left">Gauche</option>
              <option value="right">Droite</option>
            </select>
          </label>

          <label className="text-sm block">
            <div className="mb-2 font-medium text-gray-900">Style</div>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              value={variant}
              onChange={(e) => onChange({ ...(section as any), variant: e.target.value })}
            >
              <option value="default">Blanc</option>
              <option value="soft">Gris clair</option>
            </select>
          </label>
        </div>
      </div>

      {/* NEW: Image sizing controls */}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm block">
          <div className="mb-2 font-medium text-gray-900">Taille de l'image</div>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            value={imageSize}
            onChange={(e) =>
              onChange({
                ...(section as any),
                imageSize: e.target.value,
              })
            }
          >
            <option value="sm">Petite</option>
            <option value="md">Moyenne</option>
            <option value="lg">Grande</option>
            <option value="full">Pleine largeur du bloc</option>
          </select>
        </label>

        <label className="text-sm block">
          <div className="mb-2 font-medium text-gray-900">Largeur max personnalisée (px)</div>
          <input
            type="number"
            min={0}
            step={10}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            value={imageMaxWidth || ""}
            onChange={(e) =>
              onChange({
                ...(section as any),
                imageMaxWidth: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="ex. 420"
          />
          <div className="mt-1 text-xs text-gray-500">
            Laissez vide pour utiliser la taille prédéfinie.
          </div>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm block">
          <div className="mb-2 font-medium text-gray-900">Ajustement de l'image</div>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            value={imageObjectFit}
            onChange={(e) =>
              onChange({
                ...(section as any),
                imageObjectFit: e.target.value,
              })
            }
          >
            <option value="cover">Recouvrir</option>
            <option value="contain">Contenir</option>
          </select>
        </label>
      </div>

      <label className="text-sm block">
        <div className="mb-2 font-medium text-gray-900">Texte alternatif (alt)</div>
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          value={imageAlt}
          onChange={(e) => onChange({ ...(section as any), imageAlt: e.target.value })}
          placeholder="Description de l'image"
        />
      </label>
    </div>
  );
}