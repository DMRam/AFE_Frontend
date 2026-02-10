import { useEffect, useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../../services/firebase";

type Status = "idle" | "loading" | "success" | "error";

type FinalizeResponse =
    | { ok: true; memberId: string }
    | { ok: false; error?: string };

type N8NResponse =
    | { ok: true }
    | { ok: false; error?: string };

export function MembershipSuccessPage() {
    const sessionId = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get("session_id") ?? "";
    }, []);

    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");
    const [n8nWarning, setN8nWarning] = useState("");

    const displaySession = useMemo(
        () => (sessionId ? `${sessionId.slice(0, 10)}…${sessionId.slice(-6)}` : ""),
        [sessionId]
    );

    useEffect(() => {
        if (!sessionId) {
            setStatus("error");
            setMessage("Session Stripe manquante. Veuillez réessayer.");
            return;
        }

        let cancelled = false;

        const run = async () => {
            setStatus("loading");
            setMessage("");
            setN8nWarning("");

            try {
                // 1) Finalize membership 
                const finalize = httpsCallable<{ sessionId: string }, FinalizeResponse>(
                    functions,
                    "finalizeMembershipFromSession"
                );

                const res = await finalize({ sessionId });
                const data = res.data;

                if (!data || data.ok !== true) {
                    throw new Error((data as any)?.error ?? "Finalisation échouée.");
                }

                // 2) Send member to n8n
                try {
                    const sendToN8N = httpsCallable<{ memberId: string }, N8NResponse>(
                        functions,
                        "sendMemberToN8N"
                    );
                    const n8nRes = await sendToN8N({ memberId: data.memberId });

                    // optional: if function returns {ok:false}
                    if ((n8nRes.data as any)?.ok === false) {
                        setN8nWarning("Adhésion activée, mais l’envoi automatique a eu un souci (on va vérifier).");
                    }
                } catch (e) {
                    console.error("Erreur lors de l'envoi à n8n :", e);
                    if (!cancelled) {
                        setN8nWarning("Adhésion activée, mais l’envoi automatique a eu un souci (on va vérifier).");
                    }
                }

                if (cancelled) return;
                setStatus("success");
                setMessage("Paiement confirmé. Votre adhésion est activée ✅");
            } catch (e: any) {
                if (cancelled) return;
                setStatus("error");
                setMessage(e?.message ?? "Erreur lors de la finalisation. Contactez-nous si besoin.");
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [sessionId]);

    return (
        <div className="mx-auto max-w-2xl px-4 py-12">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                <h1 className="text-2xl font-extrabold text-gray-900">Merci 🎉</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Référence: <span className="font-mono">{displaySession}</span>
                </p>

                {status === "loading" && (
                    <div className="mt-6 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                        <p className="text-sm font-semibold text-gray-900">Finalisation en cours…</p>
                        <p className="mt-1 text-sm text-gray-700">
                            On confirme le paiement et on active votre adhésion.
                        </p>
                    </div>
                )}

                {status === "success" && (
                    <div className="mt-6 rounded-2xl bg-green-50 p-4 ring-1 ring-green-200">
                        <p className="text-sm font-semibold text-green-900">{message}</p>

                        {n8nWarning && (
                            <p className="mt-2 text-sm text-amber-800">{n8nWarning}</p>
                        )}

                        <p className="mt-2 text-sm text-green-800">
                            Vous recevrez un courriel de confirmation si une adresse est associée au paiement.
                        </p>
                    </div>
                )}

                {status === "error" && (
                    <div className="mt-6 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
                        <p className="text-sm font-semibold text-red-900">Oups…</p>
                        <p className="mt-1 text-sm text-red-800">{message}</p>
                        <p className="mt-3 text-sm text-red-800">
                            Si le paiement a été effectué, contactez-nous et on réglera ça rapidement.
                        </p>
                    </div>
                )}

                <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <a
                        href="/"
                        className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                        Retour à l’accueil
                    </a>
                    <a
                        href="/#membre"
                        className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                    >
                        Devenir membre (infos)
                    </a>
                </div>
            </div>
        </div>
    );
}
