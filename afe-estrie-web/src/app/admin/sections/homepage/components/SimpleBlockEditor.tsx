import { uploadPdf } from "../../../../../services/storageUploads";
import { uid } from "../utils/ids";

export function SimpleBlockEditor({
  title,
  icon,
  block,
  onChange,
  kind,
}: {
  title: string;
  icon: string;
  block: any;
  onChange: (next: any) => void;
  kind?: "events" | "resources" | "activities" | "generic";
}) {
  const items = ((block as any)?.items ?? []) as any[];

  const addItem = () => {
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
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-l-4 border-purple-500">
        <div className="p-5 sm:p-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl leading-none">{icon}</span>
              <div>
                <h4 className="text-base font-semibold text-gray-900">{title}</h4>
                <p className="text-xs text-gray-500">
                  Configure l’en-tête, l’appel à l’action (CTA) et la liste d’items.
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <input
                type="checkbox"
                checked={block?.enabled !== false}
                onChange={(e) => onChange({ ...block, enabled: e.target.checked })}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-semibold text-gray-800">
                Activer la section
              </span>
            </label>
          </div>

          {/* Header + CTA */}
          <div className="mt-6 rounded-2xl bg-gray-50 p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Titre (heading)
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Ex. Activités à venir"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Sous-titre (subheading)
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
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Ex. Ateliers, rencontres et événements"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Bouton (CTA) — Texte
                </label>
                <input
                  type="text"
                  value={block?.ctaLabel ?? ""}
                  onChange={(e) => onChange({ ...block, ctaLabel: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Ex. Voir toutes les activités"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Bouton (CTA) — Lien
                </label>
                <input
                  type="text"
                  value={block?.ctaHref ?? ""}
                  onChange={(e) => onChange({ ...block, ctaHref: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  placeholder="Ex. /activites ou https://..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  Astuce : commence par <span className="font-mono">/</span> pour une page du site,
                  ou <span className="font-mono">https://</span> pour un lien externe.
                </p>
              </div>
            </div>
          </div>

          {/* Items CRUD */}
          <div className="mt-6 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h5 className="text-sm font-semibold text-gray-900">
                  Items ({items.length})
                </h5>
                <p className="text-xs text-gray-500">
                  Ajuste l’ordre, le titre, la description et les liens.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
              >
                + Ajouter un item
              </button>
            </div>

            {items.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-600">
                Aucun item pour le moment. Clique sur <span className="font-semibold">« Ajouter un item »</span> pour commencer.
              </div>
            )}

            {items
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((it, idx) => (
                <div
                  key={it.id ?? idx}
                  className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-extrabold text-purple-700">
                        {idx + 1}
                      </span>

                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {it.title?.trim() ? it.title : "Nouvel item"}
                        </p>

                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={it.enabled !== false}
                          onChange={(e) => {
                            const next = items.map((x) =>
                              x === it ? { ...x, enabled: e.target.checked } : x
                            );
                            onChange({ ...block, items: next });
                          }}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-sm font-semibold text-gray-800">
                          Afficher
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const next = items.filter((x) => x !== it);
                          onChange({ ...block, items: next });
                        }}
                        className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {kind === "events" && (
                    <div className="mt-4">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Date
                      </label>
                      <input
                        type="date"
                        value={(it.date ?? "").slice(0, 10)}
                        onChange={(e) => {
                          const next = items.map((x) =>
                            x === it ? { ...x, date: e.target.value } : x
                          );
                          onChange({ ...block, items: next });
                        }}
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                      <p className="mt-1 text-[11px] text-gray-500">
                        Format recommandé : AAAA-MM-JJ (ex. 2026-03-10)
                      </p>
                    </div>
                  )}

                  {kind === "resources" && (
                    <div className="mt-4 grid gap-3 md:grid-cols-6">
                      <div className="md:col-span-3">
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Type (tag)
                        </label>
                        <select
                          value={(it.meta ?? "").trim()}
                          onChange={(e) => {
                            const next = items.map((x) =>
                              x === it ? { ...x, meta: e.target.value } : x
                            );
                            onChange({ ...block, items: next });
                          }}
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">— Choisir —</option>
                          <option value="PDF">PDF</option>
                          <option value="Lien">Lien</option>
                          <option value="Article">Article</option>
                          <option value="Vidéo">Vidéo</option>
                        </select>
                      </div>

                      <div className="md:col-span-3">

                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-700">
                            PDF (téléversement)
                          </label>

                          <div className="flex items-center gap-3">
                            <label className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
                              Choisir un PDF
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={async (e) => {
                                  const input = e.currentTarget;
                                  const file = input.files?.[0];

                                  if (!file) return;

                                  const MAX_MB = 10;
                                  const MAX_BYTES = MAX_MB * 1024 * 1024;

                                  if (file.type !== "application/pdf") {
                                    alert("Veuillez choisir un fichier PDF.");
                                    return;
                                  }
                                  if (file.size > MAX_BYTES) {
                                    alert(`Le PDF est trop lourd. Maximum: ${MAX_MB} Mo.`);
                                    return;
                                  }

                                  try {
                                    const { url, path } = await uploadPdf(file);

                                    const next = items.map((x) =>
                                      x === it
                                        ? {
                                          ...x,
                                          meta: (x.meta ?? "").trim() || "PDF",
                                          href: url,
                                          filePath: path,
                                        }
                                        : x
                                    );

                                    onChange({ ...block, items: next });
                                    alert("PDF téléversé avec succès !");
                                  } catch (err) {
                                    console.error(err);
                                    alert("Impossible de téléverser le PDF. Vérifie Storage + extensions.");
                                  } finally {
                                    input.value = "";
                                  }
                                }}
                              />
                            </label>

                            {it.filePath ? (
                              <a
                                href={it.href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-semibold text-purple-700 underline"
                              >
                                Voir le PDF
                              </a>
                            ) : (
                              <span className="text-xs text-gray-500">
                                Aucun fichier téléversé.
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mt-1 text-[11px] text-gray-500">
                          Le PDF est stocké dans Firebase Storage, et le lien est sauvegardé dans l’item.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 md:grid-cols-6">
                    <div className="md:col-span-1">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Ordre
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
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div className="md:col-span-5">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Titre
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
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Ex. Atelier d’information"
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
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Décris brièvement l’activité / l’événement…"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Lien (href)
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
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="/activites ou https://..."
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Info (optionnel)
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
                        className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Ex. Atelier • 90 min"
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Tiny footer hint */}
          <p className="mt-5 text-xs text-gray-500">
            Conseil : garde les titres courts et mets l’info détaillée dans la description.
          </p>
        </div>
      </div>
    </div>
  );
}