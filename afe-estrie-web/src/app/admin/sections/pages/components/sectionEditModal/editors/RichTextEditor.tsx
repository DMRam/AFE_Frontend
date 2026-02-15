import type { AnySection } from "../../../types";
import { getTextBody, isType, setTextBody } from "../textBody";
import { CtasEditor } from "./CtasEditor";

export function RichTextEditor({
  section,
  onChange,
}: {
  section: AnySection;
  onChange: (next: AnySection) => void;
}) {
  if (!isType(section, "richText")) return null;

  return (
    <>
      <div className="space-y-4">
        <label className="text-sm block">
          <div className="mb-2 font-medium text-gray-900">Titre (optionnel)</div>
          <input
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
            value={(section as any).heading ?? ""}
            onChange={(e) => onChange({ ...(section as any), heading: e.target.value })}
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
            value={(section as any).tone ?? "standard"}
            onChange={(e) => onChange({ ...(section as any), tone: e.target.value })}
          >
            <option value="standard">Standard</option>
            <option value="info">Info (mise en évidence)</option>
            <option value="important">Important</option>
          </select>
        </label>
      </div>

      <CtasEditor section={section} onChange={onChange} title="Boutons (CTA) — Texte" />
    </>
  );
}
