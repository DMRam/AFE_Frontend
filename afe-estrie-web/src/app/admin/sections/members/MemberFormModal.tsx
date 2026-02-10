import React, { useEffect, useMemo, useState } from "react";
import { X, User, Mail, MapPin, Calendar, Tag, Hash, Save, AlertCircle } from "lucide-react";
import type { Member, MemberInput, MemberStatus } from "../../../../services/membersRepo";

type Props = {
    open: boolean;
    mode: "create" | "edit";
    initial?: Member | null;
    onClose: () => void;
    onSubmit: (input: MemberInput) => Promise<void> | void;
};

function parseTags(v: string) {
    return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

function formatTags(tags: string[]): string {
    return tags.join(", ");
}

export function MemberFormModal({ open, mode, initial, onClose, onSubmit }: Props) {
    const title = mode === "create" ? "Ajouter un nouveau membre" : "Modifier le membre";

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        city: "",
        age: 0,
        status: "active" as MemberStatus,
        tagsText: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const canSubmit = useMemo(() => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = "Le nom complet est requis";
        }

        if (!formData.email.trim()) {
            newErrors.email = "L'email est requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            newErrors.email = "Format d'email invalide";
        }

        if (!formData.city.trim()) {
            newErrors.city = "La ville est requise";
        }

        if (!Number.isFinite(formData.age) || formData.age <= 0) {
            newErrors.age = "L'âge doit être un nombre positif";
        } else if (formData.age > 120) {
            newErrors.age = "Veuillez entrer un âge valide";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    useEffect(() => {
        if (!open) return;

        if (mode === "edit" && initial) {
            setFormData({
                fullName: initial.fullName ?? "",
                email: initial.email ?? "",
                city: initial.city ?? "",
                age: initial.age ?? 0,
                status: initial.status ?? "active",
                tagsText: formatTags(initial.tags ?? []),
            });
        } else {
            setFormData({
                fullName: "",
                email: "",
                city: "",
                age: 0,
                status: "active",
                tagsText: "",
            });
        }
        setErrors({});
        setIsSubmitting(false);
    }, [open, mode, initial]);

    const handleChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const input: MemberInput = {
                fullName: formData.fullName.trim(),
                email: formData.email.trim(),
                city: formData.city.trim(),
                age: formData.age,
                status: formData.status,
                tags: parseTags(formData.tagsText),
            };

            await onSubmit(input);
            onClose();
        } catch (error) {
            console.error("Submission error:", error);
            setErrors(prev => ({
                ...prev,
                submit: "Une erreur est survenue lors de l'enregistrement"
            }));
        } finally {
            setIsSubmitting(false);
        }
    }

    const tagSuggestions = ["newsletter", "bénévole", "adhérent", "donateur", "équipe", "événement", "formation"];

    const addTagSuggestion = (tag: string) => {
        const currentTags = formData.tagsText ? formData.tagsText.split(",").map(t => t.trim()).filter(Boolean) : [];
        if (!currentTags.includes(tag)) {
            const newTags = [...currentTags, tag];
            handleChange("tagsText", newTags.join(", "));
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop with animation */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal with animation */}
            <div className="relative w-full max-w-2xl transform rounded-2xl bg-white shadow-2xl transition-all duration-200 sm:max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-gray-100 p-2">
                            <User className="h-5 w-5 text-gray-700 sm:h-6 sm:w-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">{title}</h3>
                            {mode === "edit" && initial && (
                                <p className="text-sm text-gray-600">
                                    ID: <span className="font-mono text-xs">{initial.id.slice(0, 8)}...</span>
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                        aria-label="Fermer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(100vh-12rem)]">
                    <div className="p-4 sm:p-6 space-y-6">
                        {/* Personal Information Section */}
                        <div>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                                Informations personnelles
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Full Name */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <User className="h-4 w-4" />
                                        Nom complet *
                                    </label>
                                    <input
                                        className={`w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 ${errors.fullName ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                        value={formData.fullName}
                                        onChange={(e) => handleChange("fullName", e.target.value)}
                                        placeholder="Jean Dupont"
                                        autoFocus
                                    />
                                    {errors.fullName && (
                                        <div className="flex items-center gap-1 text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.fullName}
                                        </div>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Mail className="h-4 w-4" />
                                        Adresse email *
                                    </label>
                                    <input
                                        type="email"
                                        className={`w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 ${errors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        placeholder="jean.dupont@email.com"
                                    />
                                    {errors.email && (
                                        <div className="flex items-center gap-1 text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.email}
                                        </div>
                                    )}
                                </div>

                                {/* City */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <MapPin className="h-4 w-4" />
                                        Ville *
                                    </label>
                                    <input
                                        className={`w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none focus:ring-2 ${errors.city ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                        value={formData.city}
                                        onChange={(e) => handleChange("city", e.target.value)}
                                        placeholder="Paris"
                                    />
                                    {errors.city && (
                                        <div className="flex items-center gap-1 text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.city}
                                        </div>
                                    )}
                                </div>

                                {/* Age */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Calendar className="h-4 w-4" />
                                        Âge *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="120"
                                            className={`w-full rounded-lg border px-4 py-3 pl-10 text-sm transition-colors focus:outline-none focus:ring-2 ${errors.age ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                            value={formData.age || ""}
                                            onChange={(e) => handleChange("age", parseInt(e.target.value) || 0)}
                                            placeholder="30"
                                        />
                                        <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    </div>
                                    {errors.age && (
                                        <div className="flex items-center gap-1 text-sm text-red-600">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.age}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Status and Tags Section */}
                        <div>
                            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
                                Configuration
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Status */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Statut</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleChange("status", "active")}
                                            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${formData.status === "active"
                                                ? "bg-green-100 text-green-800 border-2 border-green-500"
                                                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${formData.status === "active" ? "bg-green-500" : "bg-gray-300"}`} />
                                                Actif
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleChange("status", "inactive")}
                                            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${formData.status === "inactive"
                                                ? "bg-gray-100 text-gray-800 border-2 border-gray-500"
                                                : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${formData.status === "inactive" ? "bg-gray-500" : "bg-gray-300"}`} />
                                                Inactif
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <Tag className="h-4 w-4" />
                                        Étiquettes
                                    </label>
                                    <div className="space-y-3">
                                        <input
                                            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            value={formData.tagsText}
                                            onChange={(e) => handleChange("tagsText", e.target.value)}
                                            placeholder="newsletter, bénévole, adhérent"
                                        />

                                        {/* Tag Suggestions */}
                                        <div className="space-y-2">
                                            <span className="text-xs text-gray-500">Suggestions rapides :</span>
                                            <div className="flex flex-wrap gap-2">
                                                {tagSuggestions.map((tag) => (
                                                    <button
                                                        type="button"
                                                        key={tag}
                                                        onClick={() => addTagSuggestion(tag)}
                                                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                                                    >
                                                        + {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tags Preview */}
                                        {formData.tagsText && (
                                            <div className="space-y-2">
                                                <span className="text-xs text-gray-500">Aperçu des étiquettes :</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {parseTags(formData.tagsText).map((tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit Error */}
                        {errors.submit && (
                            <div className="rounded-lg bg-red-50 p-4">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    <div className="text-sm text-red-700">{errors.submit}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-xs text-gray-600">
                                Les champs marqués d'un * sont obligatoires.
                                <div className="mt-1">
                                    {parseTags(formData.tagsText).length} étiquette{parseTags(formData.tagsText).length !== 1 ? 's' : ''} sélectionnée{parseTags(formData.tagsText).length !== 1 ? 's' : ''}
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors sm:w-auto"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={!canSubmit || isSubmitting}
                                    className="w-full rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 sm:w-auto"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {mode === "create" ? "Créer le membre" : "Enregistrer les modifications"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}