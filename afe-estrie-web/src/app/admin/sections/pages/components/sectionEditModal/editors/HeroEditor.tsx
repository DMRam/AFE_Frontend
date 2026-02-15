import { Upload } from "lucide-react";
import { useRef } from "react";

import type { HeroCta } from "../hero/heroTypes";
import { normalizeCtas, normalizeVariant } from "../hero/ctaHelpers";
import { uploadImage } from "../../../../../../../services/storageRepo";
import type { AnySection, UploadTarget } from "../../../types";
import { isType } from "../textBody";

export function HeroEditor({
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
  setUploadError: (v: string) => void;
}) {
  const heroFileRef = useRef<HTMLInputElement | null>(null);

  if (!isType(section, "hero")) return null;

  async function handleUpload(file: File, target: UploadTarget) {
    setUploading(true);
    setUploadError("");
    try {
      const folder = target === "hero" ? "page-hero" : "page-images";
      const url = await uploadImage(file, folder);
      onChange({ ...(section as any), backgroundImage: url });
    } catch (e: any) {
      setUploadError(`Erreur de téléversement: ${e?.message ?? "Inconnue"}`);
    } finally {
      setUploading(false);
      if (heroFileRef.current) heroFileRef.current.value = "";
    }
  }

  const ctas = normalizeCtas((section as any).ctas);

  const setCtas = (next: HeroCta[]) => {
    onChange({ ...(section as any), ctas: next });
  };

  const addCta = () => {
    const next = normalizeCtas((section as any).ctas);
    if (next.length >= 3) return;
    next.push({
      id: `cta-${Date.now()}`,
      label: "",
      href: "#",
      variant: "primary",
      enabled: true,
      size: "md",
      icon: "none",
      newTab: false,
    });
    setCtas(next);
  };

  const updateCtaAt = (idx: number, patch: Partial<HeroCta>) => {
    const next = normalizeCtas((section as any).ctas);
    next[idx] = { ...next[idx], ...patch };
    setCtas(next);
  };

  const removeCtaAt = (idx: number) => {
    const next = normalizeCtas((section as any).ctas).filter((_, i) => i !== idx);
    setCtas(next);
  };

  const moveCta = (idx: number, delta: number) => {
    const next = normalizeCtas((section as any).ctas);
    const to = idx + delta;
    if (to < 0 || to >= next.length) return;
    const copy = [...next];
    const [item] = copy.splice(idx, 1);
    copy.splice(to, 0, item);
    setCtas(copy);
  };

  return (
    <div className="space-y-4">
      <label className="text-sm block">
        <div className="mb-2 font-medium text-gray-900">Titre</div>
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          value={(section as any).title ?? ""}
          onChange={(e) => onChange({ ...(section as any), title: e.target.value })}
        />
      </label>

      <label className="text-sm block">
        <div className="mb-2 font-medium text-gray-900">Sous-titre</div>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
          value={(section as any).subtitle ?? ""}
          onChange={(e) => onChange({ ...(section as any), subtitle: e.target.value })}
        />
      </label>

      <div className="space-y-2">
        <label className="text-sm block">
          <div className="mb-2 font-medium text-gray-900">Image de fond</div>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            value={(section as any).backgroundImage ?? ""}
            onChange={(e) => onChange({ ...(section as any), backgroundImage: e.target.value })}
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
            value={(section as any).align ?? "center"}
            onChange={(e) => onChange({ ...(section as any), align: e.target.value })}
          >
            <option value="left">Gauche</option>
            <option value="center">Centre</option>
          </select>
        </label>

        <label className="text-sm block">
          <div className="mb-2 font-medium text-gray-900">Couleur du texte</div>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            value={(section as any).textColor ?? "light"}
            onChange={(e) => onChange({ ...(section as any), textColor: e.target.value })}
          >
            <option value="light">Clair (blanc)</option>
            <option value="dark">Foncé (noir)</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm block">
          <div className="mb-2 font-medium text-gray-900">Couleur du texte (preset)</div>
          <select
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            value={(section as any).textColorPreset ?? "auto"}
            onChange={(e) => onChange({ ...(section as any), textColorPreset: e.target.value })}
          >
            <option value="auto">Auto</option>
            <option value="white">Blanc</option>
            <option value="black">Noir</option>
            <option value="gray">Gris</option>
            <option value="red">Rouge</option>
            <option value="blue">Bleu</option>
          </select>
        </label>

        <label className="text-sm block">
          <div className="mb-2 font-medium text-gray-900">Opacité du texte (0–100)</div>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            value={Number((section as any).textOpacity ?? 100)}
            onChange={(e) =>
              onChange({
                ...(section as any),
                textOpacity: Math.max(0, Math.min(100, Number(e.target.value || 0))),
              })
            }
          />
        </label>
      </div>

      {/* CTAs */}
      <div className="rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Boutons (CTA)</div>
            <div className="text-xs text-gray-500">Jusqu’à 3 boutons.</div>
          </div>

          <button
            type="button"
            onClick={addCta}
            disabled={ctas.length >= 3}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            + Ajouter
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {ctas.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              Aucun bouton. Cliquez sur “+ Ajouter”.
            </div>
          ) : (
            ctas.map((cta, idx) => (
              <div key={cta.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={cta.enabled !== false}
                      onChange={(e) => updateCtaAt(idx, { enabled: e.target.checked })}
                    />
                    <span className="font-medium text-gray-900">Actif</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveCta(idx, -1)}
                      disabled={idx === 0}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                      title="Monter"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCta(idx, 1)}
                      disabled={idx === ctas.length - 1}
                      className="rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                      title="Descendre"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCtaAt(idx)}
                      className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Libellé</label>
                    <input
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      value={cta.label}
                      onChange={(e) => updateCtaAt(idx, { label: e.target.value })}
                      placeholder="Ex.: Faire un don"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Lien</label>
                    <input
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      value={cta.href}
                      onChange={(e) => updateCtaAt(idx, { href: e.target.value })}
                      placeholder="Ex.: #donner ou https://…"
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Style</label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      value={cta.variant}
                      onChange={(e) => updateCtaAt(idx, { variant: normalizeVariant(e.target.value) })}
                    >
                      <option value="primary">Principal</option>
                      <option value="secondary">Secondaire</option>
                      <option value="outline">Contour</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Taille</label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      value={cta.size ?? "md"}
                      onChange={(e) => updateCtaAt(idx, { size: e.target.value as any })}
                    >
                      <option value="sm">Petite</option>
                      <option value="md">Moyenne</option>
                      <option value="lg">Grande</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Icône</label>
                    <select
                      className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                      value={cta.icon ?? "none"}
                      onChange={(e) => updateCtaAt(idx, { icon: e.target.value as any })}
                    >
                      <option value="none">Aucune</option>
                      <option value="external">External</option>
                      <option value="arrow">Flèche</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={!!cta.newTab}
                        onChange={(e) => updateCtaAt(idx, { newTab: e.target.checked })}
                      />
                      <span className="text-gray-900">Nouvel onglet</span>
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
