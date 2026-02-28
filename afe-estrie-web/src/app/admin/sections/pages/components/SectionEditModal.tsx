import { useEffect, useMemo, useState } from "react";
import type { AnySection } from "../types";

import { AlertCircle } from "lucide-react";

import { HeroEditor } from "./sectionEditModal/editors/HeroEditor";
import { RichTextEditor } from "./sectionEditModal/editors/RichTextEditor";
import { SplitEditor } from "./sectionEditModal/editors/SplitEditor";

import { isType } from "./sectionEditModal/textBody";
import { ModalShell } from "./sectionEditModal/modalShell";

export function SectionEditModal({
  open,
  section,
  onChange,
  onCancel,
  onApply,
}: {
  open: boolean;
  section: AnySection | null;
  onChange: (next: AnySection | null) => void;
  onCancel: () => void;
  onApply: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // UX: reset transient upload state when section changes or modal closes
  useEffect(() => {
    if (!open) {
      setUploading(false);
      setUploadError("");
      return;
    }
    // modal opened => clear old errors when switching sections
    setUploadError("");
  }, [open, section?.id]);

  const title = useMemo(() => {
    if (!section) return "Modifier la section";
    if (isType(section, "hero")) return "Modifier la section • Bandeau (Hero)";
    if (isType(section, "richText")) return "Modifier la section • Texte";
    if (isType(section, "split")) return "Modifier la section • Image + texte";
    return "Modifier la section";
  }, [section]);

  function toggleEnabled(nextEnabled: boolean) {
    if (!section) return;
    onChange({ ...section, enabled: nextEnabled } as AnySection);
  }

  function handleClose() {
    if (uploading) return;  
    setUploadError("");
    setUploading(false);
    onCancel();
  }

  return (
    <ModalShell open={open} title={title} onClose={handleClose}>
      {!section ? null : (
        <div className="space-y-5">
          {uploadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={(section as any)?.enabled !== false}
              onChange={(e) => toggleEnabled(e.target.checked)}
              disabled={uploading}
            />
            <span className="font-medium text-gray-900">Section active</span>
          </label>

          {/* HERO */}
          <HeroEditor
            section={section}
            onChange={(next) => onChange(next)}
            uploading={uploading}
            setUploading={setUploading}
            setUploadError={setUploadError}
          />

          {/* RICH TEXT (uses RichTextInput inside RichTextEditor) */}
          <RichTextEditor section={section} onChange={(next) => onChange(next)} />

          {/* SPLIT (uses RichTextInput inside SplitEditor for body/content) */}
          <SplitEditor
            section={section}
            onChange={(next) => onChange(next)}
            uploading={uploading}
            setUploading={setUploading}
            setUploadError={setUploadError}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              onClick={handleClose}
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