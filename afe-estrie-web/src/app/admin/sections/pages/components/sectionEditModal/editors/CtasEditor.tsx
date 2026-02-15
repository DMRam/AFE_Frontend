import type { AnySection } from "../../../types";

type CtaVariant = "primary" | "secondary" | "outline";

type CtaItem = {
  id?: string;
  label: string;
  href: string;
  variant?: CtaVariant;
  enabled?: boolean;
  newTab?: boolean;
};

function normalizeVariant(v: any): CtaVariant {
  if (v === "secondary") return "secondary";
  if (v === "outline") return "outline";
  return "primary";
}

function normalizeCtas(ctas: any): CtaItem[] {
  if (!Array.isArray(ctas)) return [];
  return ctas.filter(Boolean).map((c) => ({
    id: String(c?.id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`),
    label: String(c?.label ?? ""),
    href: String(c?.href ?? "#"),
    variant: normalizeVariant(c?.variant),
    enabled: c?.enabled !== false,
    newTab: !!c?.newTab,
  }));
}

export function CtasEditor({
  section,
  onChange,
  max = 3,
  title = "Boutons (CTA)",
}: {
  section: AnySection;
  onChange: (next: AnySection) => void;
  max?: number;
  title?: string;
}) {
  const ctas = normalizeCtas((section as any).ctas);

  const setCtas = (next: CtaItem[]) => onChange({ ...(section as any), ctas: next });

  const addCta = () => {
    if (ctas.length >= max) return;
    setCtas([...ctas, { label: "", href: "#", variant: "primary", enabled: true, newTab: false }]);
  };

  const updateAt = (idx: number, patch: Partial<CtaItem>) => {
    const next = [...ctas];
    next[idx] = { ...next[idx], ...patch, variant: normalizeVariant(patch.variant ?? next[idx].variant) };
    setCtas(next);
  };

  const removeAt = (idx: number) => setCtas(ctas.filter((_, i) => i !== idx));

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-500">Jusqu’à {max} boutons.</div>
        </div>

        <button
          type="button"
          onClick={addCta}
          disabled={ctas.length >= max}
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
            <div key={cta.id ?? idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300"
                    checked={cta.enabled !== false}
                    onChange={(e) => updateAt(idx, { enabled: e.target.checked })}
                  />
                  <span className="font-medium text-gray-900">Actif</span>
                </label>

                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="rounded border border-red-300 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Libellé</label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    value={cta.label}
                    onChange={(e) => updateAt(idx, { label: e.target.value })}
                    placeholder="Ex.: Faire un don"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Lien</label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    value={cta.href}
                    onChange={(e) => updateAt(idx, { href: e.target.value })}
                    placeholder="Ex.: #donner /donner https://…"
                  />
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Style</label>
                  <select
                    className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm"
                    value={cta.variant ?? "primary"}
                    onChange={(e) => updateAt(idx, { variant: normalizeVariant(e.target.value) })}
                  >
                    <option value="primary">Principal</option>
                    <option value="secondary">Secondaire</option>
                    <option value="outline">Contour</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={!!cta.newTab}
                      onChange={(e) => updateAt(idx, { newTab: e.target.checked })}
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
  );
}
