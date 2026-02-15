import type { HomePageCMS } from "../../../../../content/types/homePage";

export function HeaderCtasEditor({
  homepage,
  setDraft,
}: {
  homepage: HomePageCMS;
  setDraft: (next: any) => void;
}) {
  const donate = homepage.headerCtas?.donate ?? {
    enabled: true,
    label: "Faire un don",
    href: "#don",
  };

  const member = homepage.headerCtas?.member ?? {
    enabled: true,
    label: "Devenir membre",
    mode: "stripe",
    href: "",
  };

  const setDonate = (patch: any) => {
    setDraft({
      ...homepage,
      headerCtas: {
        ...(homepage.headerCtas ?? {}),
        donate: { ...donate, ...patch },
      },
    });
  };

  const setMember = (patch: any) => {
    setDraft({
      ...homepage,
      headerCtas: {
        ...(homepage.headerCtas ?? {}),
        member: { ...member, ...patch },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Donate */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Bouton — « Faire un don »
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Peut pointer vers « #don » (ancre) ou une URL externe.
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={donate.enabled !== false}
              onChange={(e) => setDonate({ enabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Actif</span>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Libellé
            </label>
            <input
              type="text"
              value={donate.label ?? ""}
              onChange={(e) => setDonate({ label: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Faire un don"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Lien (href)
            </label>
            <input
              type="text"
              value={donate.href ?? ""}
              onChange={(e) => setDonate({ href: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="#don ou https://..."
            />
          </div>
        </div>
      </div>

      {/* Member */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Bouton — « Devenir membre »
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Choisis entre le flow Stripe (modal) ou un lien externe (ex. Quidigo).
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={member.enabled !== false}
              onChange={(e) => setMember({ enabled: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Actif</span>
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Libellé
            </label>
            <input
              type="text"
              value={member.label ?? ""}
              onChange={(e) => setMember({ label: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Devenir membre"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Mode
            </label>
            <select
              value={member.mode ?? "stripe"}
              onChange={(e) => setMember({ mode: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="stripe">Stripe (modal)</option>
              <option value="external">Lien externe</option>
            </select>
          </div>
        </div>

        {(member.mode ?? "stripe") === "external" && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              URL externe (Quidigo, etc.)
            </label>
            <input
              type="text"
              value={member.href ?? ""}
              onChange={(e) => setMember({ href: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="https://..."
            />
            <p className="mt-2 text-xs text-gray-500">
              Astuce: mets l’URL complète (https://...) pour éviter des surprises.
            </p>
          </div>
        )}

        {(member.mode ?? "stripe") === "stripe" && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            Le bouton ouvrira le <strong>MemberModal</strong> (Stripe) — aucun lien requis.
          </div>
        )}
      </div>
    </div>
  );
}
