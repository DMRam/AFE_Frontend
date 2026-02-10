import { useEffect, useMemo, useState } from "react";
import { ImagePicker } from "../ui/ImagePicker";
import {
    type CampaignDoc,
    listCampaigns,
    upsertCampaign,
    getCampaign,
    markCampaignStatus,
} from "../../../services/campaignRepo";
import { Save, Send, TestTube, Plus, Loader2 } from "lucide-react";

function uid(prefix = "camp") {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${id}`;
}

function stableStringify(v: any) {
    return JSON.stringify(v ?? null);
}

const DEFAULT_CAMPAIGN = (): CampaignDoc => ({
    id: uid(),
    name: "Nouvelle campagne",
    subject: "",
    preheader: "",
    title: "",
    message: "",
    ctaLabel: "",
    ctaHref: "",
    images: [],
    testEmails: "",
    status: "draft",
    lastError: null,
});

function StatusBadge({ status }: { status: CampaignDoc["status"] }) {
    const config = {
        draft: { color: "bg-gray-100 text-gray-700 border-gray-200", label: "Brouillon" },
        queued: { color: "bg-amber-100 text-amber-700 border-amber-200", label: "En attente" },
        sent: { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Envoyée" },
        failed: { color: "bg-red-100 text-red-700 border-red-200", label: "Échec" },
        sending: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Envoi..." },
    }[status];

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
            {config.label}
        </span>
    );
}

function AutomationBadge({ webhookUrl }: { webhookUrl: string }) {
    const ok = Boolean(webhookUrl);
    return (
        <span
            className={[
                "inline-flex items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                ok
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-gray-50 text-gray-500 border-gray-200",
            ].join(" ")}
            title={
                ok
                    ? "Automatisation connectée (n8n)"
                    : "Automatisation non configurée. Ajoutez VITE_N8N_CAMPAIGN_WEBHOOK."
            }
        >
            <span
                className={[
                    "h-1.5 w-1.5 rounded-full",
                    ok ? "bg-emerald-500" : "bg-gray-400",
                ].join(" ")}
            />
            {ok ? "Automatisation connectée" : "Automatisation non configurée"}
        </span>
    );
}


export function CampaignsManager() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<CampaignDoc[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [draft, setDraft] = useState<CampaignDoc | null>(null);
    const [initial, setInitial] = useState<CampaignDoc | null>(null);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const N8N_WEBHOOK_URL = (import.meta as any).env?.VITE_N8N_CAMPAIGN_WEBHOOK || "";
    // const N8N_WEBHOOK_URL = (import.meta as any).env?.VITE_N8N_CAMPAIGN_WEBHOOK_TEST || "";

    function parseEmails(input: string): string[] {
        return (input || "")
            .split(/[\s,;]+/g)
            .map((s) => s.trim())
            .filter(Boolean)
            .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    }

    function clampImages(arr: string[] | undefined, max = 3) {
        return (arr ?? []).filter(Boolean).slice(0, max);
    }

    useEffect(() => {
        (async () => {
            setLoading(true);
            const list = await listCampaigns();
            setItems(list);

            if (list[0]?.id) {
                setActiveId(list[0].id);
            } else {
                const fresh = DEFAULT_CAMPAIGN();
                setDraft(fresh);
                setInitial(fresh);
            }

            setLoading(false);
        })();
    }, []);

    useEffect(() => {
        if (!activeId) return;
        (async () => {
            const c = await getCampaign(activeId);
            if (c) {
                setDraft(c);
                setInitial(c);
            }
        })();
    }, [activeId]);

    function flash(msg: string) {
        setToast(msg);
        window.setTimeout(() => setToast(null), 1500);
    }

    const isDirty = useMemo(() => {
        if (!draft || !initial) return false;
        return stableStringify(draft) !== stableStringify(initial);
    }, [draft, initial]);

    async function createNew() {
        const fresh = DEFAULT_CAMPAIGN();
        setDraft(fresh);
        setInitial(fresh);
        setActiveId(null);
    }

    async function save() {
        if (!draft) return;
        setSaving(true);
        try {
            await upsertCampaign(draft.id, draft);
            const list = await listCampaigns();
            setItems(list);
            setInitial(draft);
            setActiveId(draft.id);
            flash("Sauvegardé ✓");
        } finally {
            setSaving(false);
        }
    }

    async function sendToN8n() {
        console.log("Sending to n8n...");
        if (!draft) return;

        if (!draft.subject.trim()) return flash("Le sujet est requis");
        if (!draft.message.trim()) return flash("Le message est requis");
        if (!N8N_WEBHOOK_URL) return flash("Configuration webhook manquante");

        setSending(true);

        const controller = new AbortController();
        const t = window.setTimeout(() => controller.abort(), 15000);

        const payload = {
            campaignId: draft.id,
            mode: "send" as const,
            subject: draft.subject,
            preheader: draft.preheader || "",
            title: draft.title || "",
            message: draft.message,
            ctaLabel: draft.ctaLabel || "",
            ctaHref: draft.ctaHref || "",
            images: clampImages(draft.images, 3),
        };

        try {
            console.log("Payload:", payload);

            // 1) Ensure the doc exists and has the latest content first (safe upsert)
            //    This prevents "No document to update" problems.
            await upsertCampaign(draft.id, {
                ...draft,
                lastError: null,
            });

            // 2) Mark as queued before triggering n8n (safe merge)
            await markCampaignStatus(draft.id, "queued", { lastError: null });

            // 3) Call n8n
            let res: Response;
            try {
                res = await fetch(N8N_WEBHOOK_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: controller.signal,
                });
                console.log("[n8n] fetch completed");
            } catch (err: any) {
                const msg =
                    err?.name === "AbortError"
                        ? "Timeout contacting n8n"
                        : (err?.message ?? "Network/CORS error contacting n8n");

                await markCampaignStatus(draft.id, "failed", { lastError: msg });
                flash("Échec de l'envoi (réseau/CORS)");
                return;
            }

            // 4) Parse response (best-effort)
            const text = await res.text().catch(() => "");
            let data: any = null;
            try {
                data = text ? JSON.parse(text) : null;
            } catch {
                // not JSON => keep text
            }

            console.log("[n8n] status:", res.status);
            console.log("[n8n] body:", data ?? text);

            // 5) Handle non-2xx
            if (!res.ok) {
                const errMsg =
                    (data && (data.message || JSON.stringify(data))) ||
                    text ||
                    `HTTP ${res.status}`;

                await markCampaignStatus(draft.id, "failed", { lastError: errMsg });
                flash("Échec de l'envoi");
                return;
            }

            // 6) Success
            await markCampaignStatus(draft.id, "sent", { lastError: null });
            flash("Campagne envoyée ✓");

            // 7) Refresh list + draft from Firestore
            const list = await listCampaigns();
            setItems(list);

            const updated = await getCampaign(draft.id);
            if (updated) {
                setDraft(updated);
                setInitial(updated);
            }
        } finally {
            window.clearTimeout(t);
            setSending(false);
        }
    }


    async function sendTestToN8n() {
        if (!draft) return;

        const emails = parseEmails(draft.testEmails || "");
        if (emails.length === 0) {
            flash("Ajoutez au moins un email de test valide");
            return;
        }
        if (!draft.subject.trim()) {
            flash("Le sujet est requis");
            return;
        }
        if (!draft.message.trim()) {
            flash("Le message est requis");
            return;
        }
        if (!N8N_WEBHOOK_URL) {
            flash("Configuration webhook manquante");
            return;
        }

        setSending(true);
        try {
            await upsertCampaign(draft.id, draft);

            const payload = {
                campaignId: draft.id,
                mode: "test",
                testEmails: emails,
                subject: draft.subject,
                preheader: draft.preheader || "",
                title: draft.title || "",
                message: draft.message,
                ctaLabel: draft.ctaLabel || "",
                ctaHref: draft.ctaHref || "",
                images: clampImages(draft.images, 3),
            };

            const res = await fetch(N8N_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                flash(`Échec du test: ${text || `HTTP ${res.status}`}`);
                return;
            }

            flash("Test envoyé ✓");
        } finally {
            setSending(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex items-center gap-3 text-gray-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Chargement des Infolettres...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* Left: Campaign list */}
            <div className="rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-900">Infolettres</h2>
                            <p className="text-xs text-gray-500">
                                {items.length} infolettre{items.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={createNew}
                            className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 text-sm text-white hover:bg-gray-800"
                        >
                            <Plus className="h-4 w-4" />
                            Nouvelle
                        </button>
                    </div>
                </div>

                <div className="p-2">
                    {items.length === 0 ? (
                        <div className="p-6 text-center">
                            <div className="text-sm text-gray-500 mb-2">
                                Aucune campagne créée
                            </div>
                            <button
                                type="button"
                                onClick={createNew}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Créer votre première campagne
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {items.map((campaign) => {
                                const active = campaign.id === activeId;
                                return (
                                    <button
                                        key={campaign.id}
                                        type="button"
                                        onClick={() => setActiveId(campaign.id)}
                                        className={`w-full rounded-lg p-3 text-left transition-colors ${active
                                            ? 'border border-blue-200 bg-blue-50'
                                            : 'border border-transparent hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium text-sm text-gray-900 truncate">
                                                    {campaign.name || "Sans titre"}
                                                </div>
                                                <div className="mt-1 text-xs text-gray-500 truncate">
                                                    {campaign.subject || "— (sans sujet)"}
                                                </div>
                                            </div>
                                            <StatusBadge status={campaign.status} />
                                        </div>
                                        {campaign.updatedAt && (
                                            <div className="mt-2 text-xs text-gray-400">
                                                {new Date(campaign.updatedAt.toDate()).toLocaleDateString('fr-CA')}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Editor */}
            <div className="rounded-lg border border-gray-200 bg-white">
                <div className="border-b border-gray-200 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-gray-900">
                                {draft?.name || "Nouvelle campagne"}
                            </h2>
                            <p className="text-xs text-gray-500">
                                Remplissez le formulaire, sauvegardez, puis envoyez
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <AutomationBadge webhookUrl={N8N_WEBHOOK_URL} />
                            {toast && (
                                <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
                                    {toast}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={save}
                                disabled={!draft || saving || sending || !isDirty}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                {saving ? "Sauvegarde..." : isDirty ? "Sauvegarder" : "Sauvegardé"}
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={sendTestToN8n}
                                    disabled={!draft || sending || saving}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <TestTube className="h-4 w-4" />
                                    Test
                                </button>

                                <button
                                    type="button"
                                    onClick={sendToN8n}
                                    disabled={!draft || sending || saving}
                                    className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    title={!N8N_WEBHOOK_URL ? "Configurez VITE_N8N_CAMPAIGN_WEBHOOK" : undefined}
                                >
                                    {sending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                    {sending ? "Envoi..." : "Envoyer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {draft ? (
                    <div className="p-6 space-y-8">
                        {/* Email Testing Section */}
                        <section className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Emails de test
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={draft.testEmails ?? ""}
                                    onChange={(e) => setDraft({ ...draft, testEmails: e.target.value })}
                                    placeholder="exemple@domaine.com, test@entreprise.ca"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Séparez les adresses par des virgules ou des espaces
                                </p>
                            </div>
                        </section>

                        {/* Basic Information */}
                        <section className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Nom interne
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={draft.name}
                                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                                    placeholder="Nom de la campagne"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Sujet de l'email *
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={draft.subject}
                                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                                    placeholder="Sujet de l'email"
                                    required
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Pré-en-tête
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={draft.preheader ?? ""}
                                    onChange={(e) => setDraft({ ...draft, preheader: e.target.value })}
                                    placeholder="Court texte affiché avant l'ouverture"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Titre (optionnel)
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={draft.title ?? ""}
                                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                                    placeholder="Titre principal du message"
                                />
                            </div>
                        </section>

                        {/* Message Content */}
                        <section className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Message *
                            </label>
                            <textarea
                                className="w-full min-h-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                value={draft.message}
                                onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                                placeholder="Écrivez votre message ici..."
                                required
                            />
                        </section>

                        {/* Call to Action */}
                        <section className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Texte du bouton
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={draft.ctaLabel ?? ""}
                                    onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })}
                                    placeholder="Ex: En savoir plus"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Lien du bouton
                                </label>
                                <input
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                    value={draft.ctaHref ?? ""}
                                    onChange={(e) => setDraft({ ...draft, ctaHref: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                        </section>

                        {/* Images */}
                        <section className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Images (maximum 3)
                            </label>
                            <div className="grid gap-4 md:grid-cols-3">
                                {[0, 1, 2].map((i) => {
                                    const current = (draft.images ?? [])[i] ?? "";
                                    return (
                                        <div key={i} className="space-y-2">
                                            <ImagePicker
                                                label={`Image ${i + 1}`}
                                                value={current}
                                                onChange={(url) => {
                                                    const next = [...(draft.images ?? [])];
                                                    while (next.length < i) next.push("");
                                                    next[i] = url;
                                                    setDraft({ ...draft, images: clampImages(next, 3) });
                                                }}
                                                folder="site/campaigns"
                                                maxList={20}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Error Display */}
                        {draft.lastError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-red-700 mb-2">
                                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                    Dernière erreur
                                </div>
                                <div className="text-sm text-red-600 whitespace-pre-wrap">
                                    {draft.lastError}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="text-sm text-gray-500 mb-2">
                            Sélectionnez une campagne ou créez-en une nouvelle
                        </div>
                        <button
                            type="button"
                            onClick={createNew}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Créer une campagne
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}