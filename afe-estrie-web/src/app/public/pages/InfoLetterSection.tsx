import { useState } from "react";

export function InfoLetterSection() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [email, setEmail] = useState("");

    const N8N_INFOLETTER_WEBHOOK_URL =
        (import.meta as any).env?.VITE_N8N_INFOLETTER_WEBHOOK || "";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const res = await fetch(N8N_INFOLETTER_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) throw new Error("Webhook failed");

            setIsSuccess(true);
            setEmail("");
            setTimeout(() => setIsSuccess(false), 5000);
        } catch (error) {
            console.error("Subscription error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-50 py-16">
            {/* Decorative background - subtle */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-red-100/30 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-red-100/30 blur-3xl" />
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="grid items-center gap-6 md:grid-cols-12 md:gap-4">

                    {/* LEFT IMAGE - subtle */}
                    <div className="hidden md:col-span-3 md:block">
                        <div className="opacity-80 hover:opacity-100 transition-opacity">
                            <NewsletterLeft />
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="md:col-span-6 text-center">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                            Abonnez-vous à notre
                            <span className="block text-red-700 mt-1">infolettre</span>
                        </h2>

                        <p className="mt-4 text-gray-600 max-w-lg mx-auto">
                            Recevez nos actualités, événements et ressources pour mieux vivre avec la fibromyalgie.
                        </p>

                        {isSuccess && (
                            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-emerald-700 text-sm border border-emerald-200">
                                ✓ Merci ! Votre inscription est confirmée.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@courriel.com"
                                        className="
                                            w-full rounded-lg border border-gray-300 
                                            pl-10 pr-4 py-3 text-sm
                                            focus:border-red-500 focus:ring-2 focus:ring-red-100 
                                            outline-none transition
                                        "
                                    />
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="
                                        inline-flex items-center justify-center gap-2
                                        rounded-lg bg-red-700 px-5 py-3 text-sm font-medium text-white
                                        hover:bg-red-800 transition
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        whitespace-nowrap
                                    "
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            <span>Inscription...</span>
                                        </>
                                    ) : (
                                        "S'abonner"
                                    )}
                                </button>
                            </div>
                        </form>

                        <p className="mt-4 text-xs text-gray-500">
                            Nous ne partageons jamais vos informations.
                            <a href="/confidentialite" className="text-red-700 hover:underline ml-1">
                                Politique de confidentialité
                            </a>
                        </p>
                    </div>

                    {/* RIGHT IMAGE - subtle */}
                    <div className="hidden md:col-span-3 md:block">
                        <div className="opacity-80 hover:opacity-100 transition-opacity">
                            <NewsletterRight />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function NewsletterLeft() {
    return (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
            <rect x="30" y="60" width="140" height="90" rx="8" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1.5" />
            <rect x="45" y="72" width="110" height="55" rx="6" fill="#fee2e2" />
            <path d="M45 72 L100 107 L155 72" stroke="#ef4444" strokeWidth="2" fill="none" />
            <circle cx="55" cy="45" r="10" fill="#fecaca" />
            <circle cx="95" cy="35" r="7" fill="#fde68a" />
            <circle cx="145" cy="40" r="8" fill="#bfdbfe" />
        </svg>
    );
}

function NewsletterRight() {
    return (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
            <rect x="30" y="70" width="140" height="80" rx="8" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1.5" />
            <path d="M30 70 L100 120 L170 70" stroke="#ef4444" strokeWidth="2" fill="none" />
            <rect x="60" y="45" width="80" height="35" rx="6" fill="#fde68a" />
            <path d="M60 45 L100 65 L140 45" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
            <circle cx="140" cy="55" r="7" fill="#fecaca" />
            <circle cx="45" cy="100" r="7" fill="#bfdbfe" />
        </svg>
    );
}