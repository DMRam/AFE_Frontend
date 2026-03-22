import { useState } from "react";

const AFE_RED = "#b33a22";

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

            // TODO: replace with real email provider + double opt-in flow later. 
            // For now, just send to n8n webhook which forwards to Mailchimp 
            // (or whatever) and handles duplicates, errors, etc.
            // Or from n8n send this to mailchimp.
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
        <section className="relative overflow-hidden py-10 sm:py-12">
            {/* background */}

            <div className="relative mx-auto max-w-screen-3xl px-4 sm:px-6 lg:px-8">
                <div
                    className={[
                        "relative overflow-hidden rounded-[28px]  bg-white/80 backdrop-blur",
                        "shadow-[0_24px_80px_-45px_rgba(0,0,0,0.35)]",
                        "ring-1 ring-black/5",
                    ].join(" ")}
                >
                    <div
                        className="absolute inset-x-0 top-0 h-1"
                        style={{
                            background: `linear-gradient(90deg, ${AFE_RED}, ${AFE_RED}AA, transparent)`,
                        }}
                    />

                    {/* ✅ tighter + better split */}
                    <div className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[420px_1fr] lg:gap-10 lg:p-10">
                        {/* LEFT illustration: bigger + fills */}
                        <div className="flex justify-center lg:justify-start">
                            <div className="w-full max-w-[420px] lg:max-w-none lg:w-[420px]">
                                <PremiumNewsletterIllustration />
                            </div>
                        </div>

                        {/* RIGHT content: cap width so it doesn’t feel empty */}
                        <div className="w-full max-w-[760px]">
                            <div className="flex flex-wrap items-center gap-2">
                                <span
                                    className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
                                    style={{ background: `${AFE_RED}14`, color: AFE_RED }}
                                >
                                    Infolettre AFE Estrie
                                </span>
                                <span className="text-xs text-gray-500">1 à 2 envois par mois</span>
                            </div>

                            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                                Abonnez-vous à notre infolettre.
                            </h2>

                            <p className="mt-3 text-base leading-relaxed text-gray-600">
                                Recevez nos activités, événements, ressources et nouveautés — directement dans
                                votre boîte courriel.
                            </p>

                            {isSuccess && (
                                <div className="mt-5 rounded-2xl border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                    ✓ Merci ! Votre inscription est confirmée.
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="mt-6">
                                {/* ✅ input row: consistent height, less dead space */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                                    <div className="relative flex-1">
                                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                                            <MailIcon />
                                        </span>

                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="votre@courriel.com"
                                            className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:ring-4"
                                            onFocus={(e) => {
                                                e.currentTarget.style.borderColor = AFE_RED;
                                                e.currentTarget.style.boxShadow = `0 0 0 6px ${AFE_RED}1F`;
                                            }}
                                            onBlur={(e) => {
                                                e.currentTarget.style.borderColor = "#d1d5db";
                                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
                                            }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed sm:min-w-[170px]"
                                        style={{ background: AFE_RED }}
                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#992f1b")}
                                        onMouseLeave={(e) => (e.currentTarget.style.background = AFE_RED)}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Spinner />
                                                <span>Inscription…</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>S’abonner</span>
                                                <span className="opacity-90">→</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                                    <span className="inline-flex items-center gap-2">
                                        <span aria-hidden>🔒</span>
                                        On ne partage jamais votre courriel.
                                    </span>
                                    <a
                                        href="/confidentialite"
                                        className="font-semibold hover:underline"
                                        style={{ color: AFE_RED }}
                                    >
                                        Politique de confidentialité
                                    </a>
                                </div>
                            </form>

                            <p className="mt-3 text-xs text-gray-400">
                                Vous pouvez vous désabonner en tout temps.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/** Cleaner, more “designed” illustration */
function PremiumNewsletterIllustration() {
    return (
        <svg viewBox="0 0 560 420" className="h-auto w-full">
            {/* shadow */}
            <ellipse cx="260" cy="370" rx="200" ry="26" fill="#000" opacity="0.06" />

            {/* back card */}
            <g>
                <rect x="180" y="70" width="320" height="230" rx="28" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
                <rect x="212" y="110" width="256" height="18" rx="9" fill="#f3f4f6" />
                <rect x="212" y="142" width="210" height="14" rx="7" fill="#f3f4f6" />
                <rect x="212" y="168" width="238" height="14" rx="7" fill="#f3f4f6" />
                <rect x="212" y="194" width="170" height="14" rx="7" fill="#f3f4f6" />

                {/* badge */}
                <rect x="212" y="228" width="132" height="36" rx="18" fill={AFE_RED} opacity="0.12" />
                <text
                    x="278"
                    y="252"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="800"
                    fill={AFE_RED}
                    fontFamily="ui-sans-serif, system-ui"
                >
                    NOUVEAUTÉS
                </text>
            </g>

            {/* front envelope */}
            <g>
                <rect x="70" y="140" width="240" height="170" rx="26" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
                <path d="M70 165 L190 250 L310 165" fill="none" stroke={AFE_RED} strokeWidth="3.2" />
                <path d="M70 310 L150 240" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                <path d="M310 310 L230 240" fill="none" stroke="#e5e7eb" strokeWidth="2" />

                {/* message lines */}
                <rect x="95" y="190" width="190" height="18" rx="9" fill={AFE_RED} opacity="0.10" />
                <rect x="95" y="216" width="150" height="14" rx="7" fill="#f3f4f6" />
                <rect x="95" y="238" width="170" height="14" rx="7" fill="#f3f4f6" />
            </g>

            {/* floating accents */}
            <circle cx="470" cy="110" r="16" fill={AFE_RED} opacity="0.16" />
            <circle cx="505" cy="145" r="10" fill="#f59e0b" opacity="0.28" />
            <circle cx="470" cy="190" r="12" fill="#60a5fa" opacity="0.20" />

            {/* tiny sparkles */}
            <g opacity="0.35" fill={AFE_RED}>
                <path d="M352 86l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10z" />
                <path d="M410 300l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z" />
            </g>
        </svg>
    );
}

function MailIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M4 6h16v12H4V6Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
            <path
                d="M4 7l8 6 8-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function Spinner() {
    return (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}