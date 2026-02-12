import { useEffect, useMemo, useState } from "react";
import { Send, RefreshCw, Mail } from "lucide-react";
import { getSendPreview } from "../../utils/membersUtils";
import type { Member } from "../../../../../../services/membersRepo";
import { MemberPreview } from "./MemberPreview";
import { CampaignForm } from "./CampaignForm/CampaignForm";

interface AutomationSectionProps {
    selected: Member[];
    webhookUrl: string; // optional initial value from parent
    onSendToAutomation: (
        webhookUrl: string,
        selected: Member[],
        campaignData?: any
    ) => Promise<{ ok: boolean; message: string }>;
    onClearSelection: () => void;
}

export function AutomationSection({
    selected,
    webhookUrl: initialWebhookUrl,
    onSendToAutomation,
    onClearSelection,
}: AutomationSectionProps) {
    // const ENV_WEBHOOK = ((import.meta as any).env?.VITE_N8N_CAMPAIGN_WEBHOOK_TEST as string | undefined) ?? "";
    const ENV_WEBHOOK = ((import.meta as any).env?.VITE_N8N_CAMPAIGN_WEBHOOK as string | undefined) ?? "";

    // ((import.meta as any).env?.VITE_N8N_CAMPAIGN_WEBHOOK as string | undefined) ?? "";

    const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl || "");

    // keep in sync if parent changes
    useEffect(() => {
        setWebhookUrl(initialWebhookUrl || "");
    }, [initialWebhookUrl]);

    const effectiveWebhookUrl = (webhookUrl.trim() || ENV_WEBHOOK.trim());
    const isConfigured = Boolean(effectiveWebhookUrl);

    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);
    const [showCampaignForm, setShowCampaignForm] = useState(false);
    const [_campaignData, setCampaignData] = useState<any>(null);

    const sendPreview = useMemo(() => getSendPreview(selected), [selected]);

    const handleSendToAutomation = async (campaignData?: any) => {
        setSendResult(null);

        if (!isConfigured) {
            setSendResult({
                ok: false,
                message:
                    "Webhook n8n non configuré. Ajoutez VITE_N8N_CAMPAIGN_WEBHOOK dans .env ou fournissez une URL.",
            });
            return;
        }

        if (selected.length === 0) {
            setSendResult({ ok: false, message: "Aucun membre sélectionné. Sélectionnez au moins un membre." });
            return;
        }

        setIsSending(true);
        try {
            const result = await onSendToAutomation(effectiveWebhookUrl, selected, campaignData);
            setSendResult(result);
            if (result.ok) {
                setShowCampaignForm(false);
                setCampaignData(null);
            }
        } catch (error: any) {
            setSendResult({ ok: false, message: error?.message ?? "Erreur inconnue" });
        } finally {
            setIsSending(false);
        }
    };

    const handleCampaignSubmit = (data: any) => {
        setCampaignData(data);
        handleSendToAutomation(data);
    };

    function AutomationBadge({ ok }: { ok: boolean }) {
        return (
            <span
                className={[
                    "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    ok ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-gray-50 text-gray-500 border-gray-200",
                ].join(" ")}
                title={ok ? "Automatisation connectée (n8n)" : "Automatisation non configurée. Ajoutez VITE_N8N_CAMPAIGN_WEBHOOK."}
            >
                <span className={["h-1.5 w-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-gray-400"].join(" ")} />
                {ok ? "Automatisation connectée" : "Automatisation non configurée"}
            </span>
        );
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Send size={18} className="text-gray-700" />
                    <h3 className="font-medium">Envoi vers n8n</h3>
                    <AutomationBadge ok={isConfigured} />
                </div>

                {/* If you want: add an input to override webhookUrl and call setWebhookUrl(...) */}

                <MemberPreview selected={selected} sendPreview={sendPreview} onClearSelection={onClearSelection} />

                {selected.length > 0 && (
                    <div className="space-y-4">
                        <div className="border-t border-gray-100 pt-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Options d'envoi</h4>
                                    <p className="text-sm text-gray-600">
                                        {isConfigured ? "Choisissez comment envoyer aux membres sélectionnés" : "Configurez l'URL n8n pour activer l'envoi"}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleSendToAutomation()}
                                        disabled={isSending || selected.length === 0 || !isConfigured}
                                        className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!isConfigured ? "Configurez l'URL n8n d'abord" : undefined}
                                    >
                                        {isSending ? (
                                            <>
                                                <RefreshCw size={16} className="animate-spin" />
                                                Envoi...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                Envoyer directement
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setShowCampaignForm((v) => !v)}
                                        disabled={!isConfigured}
                                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!isConfigured ? "Configurez l'URL n8n d'abord" : undefined}
                                    >
                                        <Mail size={16} />
                                        {showCampaignForm ? "Masquer" : "Créer une campagne"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {showCampaignForm && isConfigured && (
                            <div className="rounded-lg border border-gray-200 bg-white">
                                <CampaignForm
                                    onSubmit={handleCampaignSubmit}
                                    onCancel={() => setShowCampaignForm(false)}
                                    isSubmitting={isSending}
                                    selectedCount={selected.length}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* optional: render sendResult */}
                {sendResult && (
                    <div
                        className={[
                            "rounded-lg border p-3 text-sm",
                            sendResult.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800",
                        ].join(" ")}
                    >
                        {sendResult.message}
                    </div>
                )}
            </div>
        </section>
    );
}
