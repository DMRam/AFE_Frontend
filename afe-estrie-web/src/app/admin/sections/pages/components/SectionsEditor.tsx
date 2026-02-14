import React from "react";
import type { AnySection } from "../types";
import {
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Type,
  FileText,
  Columns,
  AlertCircle,
} from "lucide-react";

function isHero(s: AnySection) {
  return s?.type === "hero";
}
function isRichText(s: AnySection) {
  return s?.type === "richText";
}
function isSplit(s: AnySection) {
  return s?.type === "split";
}

export function SectionsEditor({
  sections,
  onAddHero,
  onAddText,
  onAddSplit,
  onToggleEnabled,
  onEdit,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  sections: AnySection[];
  onAddHero: () => void;
  onAddText: () => void;
  onAddSplit: () => void;
  onToggleEnabled: (i: number) => void;
  onEdit: (i: number) => void;
  onRemove: (i: number) => void;
  onMoveUp: (i: number) => void;
  onMoveDown: (i: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-gray-900">Contenu</div>
          <div className="text-xs text-gray-500">
            {sections.length} section(s) • Ajoutez, modifiez et réorganisez.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddHero}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Type className="h-4 w-4" />
            Bandeau (Hero)
          </button>

          <button
            type="button"
            onClick={onAddText}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FileText className="h-4 w-4" />
            Texte
          </button>

          <button
            type="button"
            onClick={onAddSplit}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Columns className="h-4 w-4" />
            Image + texte
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-600">Aucune section</div>
          <div className="text-xs text-gray-500 mt-1">Ajoutez votre premier contenu.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s, i) => {
            const disabled = s?.enabled === false;

            const subtitle =
              isHero(s)
                ? s.subtitle
                : isSplit(s)
                  ? s.title
                  : isRichText(s)
                    ? (s.body ?? "").slice(0, 60) + (String(s.body ?? "").length > 60 ? "…" : "")
                    : "";

            const label =
              isHero(s) ? "Bandeau" : isSplit(s) ? "Image + texte" : isRichText(s) ? "Texte" : "Section";

            const title =
              isHero(s) ? (s.title || "Bandeau") : isSplit(s) ? (s.title || "Section") : isRichText(s) ? (s.heading || "Bloc de texte") : "Section";

            return (
              <div
                key={s.id ?? `${s.type}-${i}`}
                className={[
                  "rounded-lg border bg-white p-4 transition-colors",
                  disabled ? "border-gray-200 bg-gray-50" : "border-gray-300 hover:border-gray-400",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={[
                          "rounded-full px-2 py-1 text-xs font-medium",
                          disabled ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700",
                        ].join(" ")}
                      >
                        {label}
                      </span>

                      <span
                        className={[
                          "rounded-full px-2 py-1 text-xs font-medium",
                          disabled ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-800",
                        ].join(" ")}
                      >
                        {disabled ? "Masquée" : "Visible"}
                      </span>
                    </div>

                    <div className="text-sm font-medium text-gray-900">{title}</div>

                    {subtitle ? (
                      <div className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {subtitle}
                      </div>
                    ) : null}

                    <div className="mt-2 text-xs text-gray-500">ID: {s.id || "—"}</div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleEnabled(i)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded"
                      title={disabled ? "Afficher" : "Masquer"}
                    >
                      {disabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEdit(i)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemove(i)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer la section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => onMoveUp(i)}
                        disabled={i === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Monter"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveDown(i)}
                        disabled={i === sections.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"
                        title="Descendre"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
