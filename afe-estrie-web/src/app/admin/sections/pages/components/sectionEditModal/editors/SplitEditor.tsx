import { Upload } from "lucide-react";
import { useRef } from "react";

import { getTextBody, isType, setTextBody } from "../textBody";
import type { AnySection, UploadTarget } from "../../../types";
import { uploadImage } from "../../../../../../../services/storageRepo";
import { CtasEditor } from "./CtasEditor";

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
    setUploadError: (v: string) => void;
}) {
    const splitFileRef = useRef<HTMLInputElement | null>(null);

    async function handleUpload(file: File, target: UploadTarget) {
        setUploading(true);
        setUploadError("");
        try {
            const folder = target === "hero" ? "page-hero" : "page-images";
            const url = await uploadImage(file, folder);
            if (target === "split" && isType(section, "split")) {
                onChange({ ...(section as any), imageUrl: url });
            }
        } catch (e: any) {
            setUploadError(`Erreur de téléversement: ${e?.message ?? "Inconnue"}`);
        } finally {
            setUploading(false);
            if (splitFileRef.current) splitFileRef.current.value = "";
        }
    }

    if (!isType(section, "split")) return null;

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
                            value={(section as any).imageUrl ?? ""}
                            onChange={(e) => onChange({ ...(section as any), imageUrl: e.target.value })}
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
                            value={(section as any).imageSide ?? "right"}
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
                            value={(section as any).variant ?? "default"}
                            onChange={(e) => onChange({ ...(section as any), variant: e.target.value })}
                        >
                            <option value="default">Blanc</option>
                            <option value="soft">Gris pâle</option>
                        </select>
                    </label>
                </div>
            </div>

            <label className="text-sm block">
                <div className="mb-2 font-medium text-gray-900">Texte alternatif (accessibilité)</div>
                <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                    value={(section as any).imageAlt ?? ""}
                    onChange={(e) => onChange({ ...(section as any), imageAlt: e.target.value })}
                    placeholder="Ex.: Photo d’un bureau chaleureux"
                />
            </label>

            <CtasEditor section={section} onChange={onChange} title="Boutons (CTA) — Texte" />

        </div>
    );
}
