import { useState } from "react";
import {
    Settings,
    Eye,
    EyeOff,
    Copy,
    Check,
    Link,
    AlertCircle,
    ExternalLink,
    Link2Off,
} from "lucide-react";

interface WebhookConfigProps {
    webhookUrl: string;
    envVar: string;
    onTestConnection?: () => Promise<boolean>;
    showTestButton?: boolean;
}

export function WebhookConfig({
    webhookUrl,
    envVar,
    onTestConnection,
    showTestButton = true
}: WebhookConfigProps) {
    const [showUrl, setShowUrl] = useState(false);
    const [copied, setCopied] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const N8N_WEBHOOK_URL = (import.meta as any).env?.VITE_N8N_CAMPAIGN_WEBHOOK || "";
    // const N8N_WEBHOOK_URL_TEST = (import.meta as any).env?.VITE_N8N_CAMPAIGN_WEBHOOK_TEST || "";

    webhookUrl = webhookUrl || N8N_WEBHOOK_URL || "";

    const isConfigured = Boolean(webhookUrl);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const testConnection = async () => {
        if (!webhookUrl || !onTestConnection) return;

        setTesting(true);
        setTestResult(null);

        try {
            const success = await onTestConnection();
            setTestResult({
                success,
                message: success
                    ? "Connexion réussie avec n8n ✅"
                    : "Échec de la connexion. Vérifiez l'URL et les logs n8n."
            });
        } catch (error: any) {
            setTestResult({
                success: false,
                message: `Erreur: ${error?.message || "Impossible de se connecter"}`
            });
        } finally {
            setTesting(false);
        }
    };

    const maskedUrl = webhookUrl
        ? `${webhookUrl.substring(0, 25)}...${webhookUrl.substring(webhookUrl.length - 10)}`
        : "";

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    <div className={`rounded-full p-2 ${isConfigured ? 'bg-indigo-100' : 'bg-amber-100'}`}>
                        {isConfigured ? (
                            <Link size={18} className="text-indigo-600" />
                        ) : (
                            <Link2Off size={18} className="text-amber-600" />
                        )}
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">
                            Automatisation n8n
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${isConfigured
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                        : "bg-amber-50 text-amber-700 border border-amber-200"
                                    }`}
                            >
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${isConfigured ? "bg-emerald-500" : "bg-amber-500"
                                        }`}
                                />
                                {isConfigured ? "Connecté" : "Non configuré"}
                            </span>
                            {showTestButton && isConfigured && (
                                <button
                                    onClick={testConnection}
                                    disabled={testing}
                                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                >
                                    {testing ? "Test en cours..." : "Tester la connexion"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Status */}
            {testResult && (
                <div className={`mb-4 rounded-lg p-3 text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {testResult.message}
                </div>
            )}

            {/* Webhook Information */}
            {isConfigured ? (
                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                            URL du webhook
                        </label>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <code className="text-sm font-mono text-gray-700">
                                        {showUrl ? webhookUrl : maskedUrl}
                                    </code>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setShowUrl(!showUrl)}
                                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                        title={showUrl ? "Masquer l'URL" : "Afficher l'URL"}
                                    >
                                        {showUrl ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button
                                        onClick={copyToClipboard}
                                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                                        title="Copier l'URL"
                                    >
                                        {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {copied && (
                            <p className="mt-1 text-xs text-green-600">
                                URL copiée dans le presse-papier
                            </p>
                        )}
                    </div>

                    <div className="rounded-lg bg-blue-50 p-3">
                        <div className="flex items-start gap-2">
                            <Settings size={14} className="mt-0.5 text-blue-600" />
                            <div>
                                <p className="text-xs font-medium text-blue-800">
                                    Variable d'environnement
                                </p>
                                <code className="mt-1 block bg-blue-100 px-2 py-1 rounded text-xs font-mono text-blue-800">
                                    {envVar}=...
                                </code>
                                <p className="mt-2 text-xs text-blue-700">
                                    Cette configuration est définie dans les variables d'environnement.
                                    Pour la modifier, mettez à jour votre fichier <code className="bg-blue-100 px-1 py-0.5 rounded">.env</code> et redéployez.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Configuration Instructions */
                <div className="space-y-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={18} className="mt-0.5 text-amber-600" />
                            <div>
                                <p className="text-sm font-medium text-amber-800">
                                    Configuration requise
                                </p>
                                <p className="mt-1 text-sm text-amber-700">
                                    Pour utiliser l'automatisation n8n, vous devez configurer la variable d'environnement :
                                </p>
                                <div className="mt-2 rounded bg-amber-100 p-3">
                                    <code className="text-sm font-mono text-amber-800">
                                        {envVar}=https://votre-instance-n8n/webhook/votre-id
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Instructions de configuration
                        </h5>

                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                                    1
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Déployez votre workflow n8n</p>
                                    <p className="mt-0.5 text-xs text-gray-600">
                                        Créez un workflow dans n8n avec un déclencheur webhook
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                                    2
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Copiez l'URL du webhook</p>
                                    <p className="mt-0.5 text-xs text-gray-600">
                                        Dans n8n, copiez l'URL du déclencheur webhook
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                                    3
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Ajoutez la variable d'environnement</p>
                                    <p className="mt-0.5 text-xs text-gray-600">
                                        Ajoutez <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">VITE_MEMBERS_WEBHOOK_URL="votre-url"</code> à votre fichier <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">.env</code>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-700">
                                    4
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Redéployez l'application</p>
                                    <p className="mt-0.5 text-xs text-gray-600">
                                        Redémarrez ou redéployez votre application pour appliquer les changements
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <a
                                href="https://docs.n8n.io/integrations/core-nodes/n8n-nodes-base.webhook/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Documentation n8n
                                <ExternalLink size={12} />
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}