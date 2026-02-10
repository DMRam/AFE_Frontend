import { useMemo, useState } from "react";
import { Send, Mail, X, Image as ImageIcon, Link, Type, AlertCircle } from "lucide-react";
import { ImagePicker } from "../../../../../ui/ImagePicker";

interface CampaignFormProps {
    onSubmit: (campaignData: CampaignSubmitData) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    selectedCount: number;
}

type Mode = "send" | "test";

interface CampaignData {
    name: string;
    subject: string;
    preheader: string;
    title: string;
    message: string;
    ctaLabel: string;
    ctaHref: string;
    images: string[];
    testEmails: string; // raw string typed by user
}

export interface CampaignSubmitData extends CampaignData {
    mode: Mode;
    selectedCount: number;
    testEmailList: string[]; // parsed + unique
    images: string[]; // cleaned + max 3 + deduped
}

function parseEmails(raw: string): string[] {
    return raw
        .split(/[\s,;]+/g)
        .map((s) => s.trim())
        .filter(Boolean);
}

function uniqCaseInsensitive(arr: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of arr) {
        const key = e.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(e);
    }
    return out;
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function clampAndCleanImages(arr: string[], max = 3): string[] {
    const cleaned = arr.map((x) => (x ?? "").trim()).filter(Boolean);

    const uniq: string[] = [];
    const seen = new Set<string>();
    for (const url of cleaned) {
        if (seen.has(url)) continue;
        seen.add(url);
        uniq.push(url);
    }

    return uniq.slice(0, max);
}

export function CampaignForm({
    onSubmit,
    onCancel,
    isSubmitting,
    selectedCount,
}: CampaignFormProps) {
    const defaultName = useMemo(() => {
        const d = new Date().toLocaleDateString("fr-CA");
        return `Campagne du ${d}`;
    }, []);

    const [campaignData, setCampaignData] = useState<CampaignData>({
        name: defaultName,
        subject: "",
        preheader: "",
        title: "",
        message: "",
        ctaLabel: "",
        ctaHref: "",
        images: [],
        testEmails: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showTestFields, setShowTestFields] = useState(false);

    const parsedTestEmails = useMemo(() => {
        const parsed = parseEmails(campaignData.testEmails);
        return uniqCaseInsensitive(parsed);
    }, [campaignData.testEmails]);

    const testEmailsCount = parsedTestEmails.length;

    const update = (patch: Partial<CampaignData>) => {
        setCampaignData((prev) => ({ ...prev, ...patch }));

        // Clear related errors quickly (nice UX)
        setErrors((prevErr) => {
            const next = { ...prevErr };
            if (patch.subject !== undefined) delete next.subject;
            if (patch.message !== undefined) delete next.message;
            if (patch.testEmails !== undefined) delete next.testEmails;
            return next;
        });
    };

    const validate = (mode: Mode) => {
        const newErrors: Record<string, string> = {};

        if (!campaignData.subject.trim()) newErrors.subject = "Le sujet est requis";
        if (!campaignData.message.trim()) newErrors.message = "Le message est requis";

        if (mode === "test") {
            if (!showTestFields) {
                newErrors.testEmails = "Activez les options de test et ajoutez au moins un email";
            } else if (parsedTestEmails.length === 0) {
                newErrors.testEmails = "Ajoutez au moins un email de test";
            } else {
                const invalid = parsedTestEmails.filter((e) => !isValidEmail(e));
                if (invalid.length > 0) {
                    newErrors.testEmails = `Emails invalides: ${invalid.join(", ")}`;
                }
            }
        } else {
            // mode=send: if user filled test emails, validate lightly (optional)
            if (showTestFields && campaignData.testEmails.trim()) {
                const invalid = parsedTestEmails.filter((e) => !isValidEmail(e));
                if (invalid.length > 0) {
                    newErrors.testEmails = `Emails invalides: ${invalid.join(", ")}`;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (mode: Mode) => {
        if (!validate(mode)) return;

        const payload: CampaignSubmitData = {
            ...campaignData,
            mode,
            selectedCount,

            // ✅ keep raw string (so nobody does .split() on an array ever again)
            testEmails: campaignData.testEmails,

            // ✅ use this everywhere for sending tests
            testEmailList: parsedTestEmails,

            // ✅ always clean + clamp images at send time
            images: clampAndCleanImages(campaignData.images, 3),
        };

        onSubmit(payload);
    };

    const handleImageChange = (index: number, url: string) => {
        setCampaignData((prev) => {
            const next = [...(prev.images ?? [])];

            // IMPORTANT: must be <= index (not < index)
            while (next.length <= index) next.push("");

            next[index] = (url ?? "").trim();

            return {
                ...prev,
                images: clampAndCleanImages(next, 3),
            };
        });
    };

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Créer une campagne email</h3>
                    <p className="text-sm text-gray-600">
                        Sera envoyée à {selectedCount} membre{selectedCount !== 1 ? "s" : ""}
                    </p>
                </div>
                <button onClick={onCancel} className="rounded-lg p-2 hover:bg-gray-100">
                    <X size={20} />
                </button>
            </div>

            <div className="grid gap-6">
                {/* Basic Information */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Type size={16} />
                            Nom de la campagne
                        </label>
                        <input
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={campaignData.name}
                            onChange={(e) => update({ name: e.target.value })}
                            placeholder="Nom interne"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Mail size={16} />
                            Sujet de l'email *
                        </label>
                        <input
                            className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 ${errors.subject
                                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                }`}
                            value={campaignData.subject}
                            onChange={(e) => update({ subject: e.target.value })}
                            placeholder="Sujet de l'email"
                        />
                        {errors.subject && (
                            <p className="text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle size={14} />
                                {errors.subject}
                            </p>
                        )}
                    </div>
                </div>

                {/* Preheader */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Pré-en-tête</label>
                    <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={campaignData.preheader}
                        onChange={(e) => update({ preheader: e.target.value })}
                        placeholder="Court texte affiché avant l'ouverture"
                    />
                    <p className="text-xs text-gray-500">Apparaît dans l'aperçu de l'email</p>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Titre principal (optionnel)</label>
                    <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        value={campaignData.title}
                        onChange={(e) => update({ title: e.target.value })}
                        placeholder="Titre principal du message"
                    />
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Message *</label>
                    <textarea
                        className={`w-full min-h-[150px] rounded-lg border px-3 py-2 text-sm focus:ring-1 ${errors.message
                                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                            }`}
                        value={campaignData.message}
                        onChange={(e) => update({ message: e.target.value })}
                        placeholder="Écrivez votre message ici..."
                    />
                    {errors.message && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle size={14} />
                            {errors.message}
                        </p>
                    )}
                </div>

                {/* Call to Action */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Type size={16} />
                            Texte du bouton
                        </label>
                        <input
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={campaignData.ctaLabel}
                            onChange={(e) => update({ ctaLabel: e.target.value })}
                            placeholder="Ex: En savoir plus"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Link size={16} />
                            Lien du bouton
                        </label>
                        <input
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            value={campaignData.ctaHref}
                            onChange={(e) => update({ ctaHref: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                </div>

                {/* Images */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <ImageIcon size={16} />
                        Images (maximum 3)
                    </label>
                    <div className="grid gap-4 md:grid-cols-3">
                        {[0, 1, 2].map((index) => (
                            <div key={index} className="space-y-2">
                                <ImagePicker
                                    label={`Image ${index + 1}`}
                                    value={campaignData.images[index] || ""}
                                    onChange={(url) => handleImageChange(index, url)}
                                    folder="site/campaigns"
                                    maxList={20}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Test Emails Toggle */}
                <div className="space-y-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">Options de test</h4>
                            <p className="text-sm text-gray-600">Envoyer d'abord un test avant l'envoi massif</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowTestFields((v) => !v)}
                            className="text-sm text-blue-600 hover:text-blue-800"
                        >
                            {showTestFields ? "Masquer" : "Ajouter des tests"}
                        </button>
                    </div>

                    {showTestFields && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Emails de test</label>
                            <input
                                className={`w-full rounded-lg border px-3 py-2 text-sm focus:ring-1 ${errors.testEmails
                                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20"
                                    }`}
                                value={campaignData.testEmails}
                                onChange={(e) => update({ testEmails: e.target.value })}
                                placeholder="exemple@domaine.com, test@entreprise.ca"
                            />
                            {errors.testEmails && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} />
                                    {errors.testEmails}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Séparez les adresses par des virgules, espaces ou point-virgules. (Unique:{" "}
                                <span className="font-medium">{testEmailsCount}</span>)
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between border-t border-gray-200 pt-6">
                    <div className="text-sm text-gray-600">
                        <p>
                            Prêt à envoyer à {selectedCount} membre{selectedCount !== 1 ? "s" : ""}
                        </p>
                        {showTestFields && campaignData.testEmails.trim() && (
                            <p className="mt-1">
                                + {testEmailsCount} email{testEmailsCount !== 1 ? "s" : ""} de test (uniques)
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSubmit("test")}
                            disabled={isSubmitting || !showTestFields || testEmailsCount === 0}
                            className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            <Mail size={16} />
                            Envoyer un test
                        </button>

                        <button
                            onClick={() => handleSubmit("send")}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Envoi...
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
                                    Envoyer la campagne ({selectedCount})
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
