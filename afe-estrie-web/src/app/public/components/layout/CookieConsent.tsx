import { useEffect, useMemo, useState } from "react";
import type { CookieConsentCMS } from "../../../../content/types/cookieConsent";
import { readStoredConsent, useCookieConsentState, writeStoredConsent } from "../../../../hooks/useCookieConsentState";


type Props = { cms: CookieConsentCMS | null };

function posClass(pos: CookieConsentCMS["position"]) {
    if (pos === "bottom-left") return "left-4 bottom-4";
    if (pos === "bottom") return "left-1/2 -translate-x-1/2 bottom-4";
    return "right-4 bottom-4";
}

export function CookieConsent({ cms }: Props) {
    const { setStored, needsConsent } = useCookieConsentState(cms);
    const [openPrefs, setOpenPrefs] = useState(false);

    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    // init toggles from stored or cms defaults
    useEffect(() => {
        if (!cms) return;
        const s = readStoredConsent();
        if (s && s.version === cms.version) {
            setAnalytics(!!s.categories.analytics);
            setMarketing(!!s.categories.marketing);
        } else {
            setAnalytics(!!cms.categories.analytics.enabled);
            setMarketing(!!cms.categories.marketing.enabled);
        }
    }, [cms]);

    const show = !!cms?.enabled && needsConsent;

    const payload = useMemo(() => {
        return {
            version: cms?.version ?? 1,
            decidedAt: new Date().toISOString(),
            categories: {
                necessary: true,
                analytics,
                marketing,
            },
        };
    }, [cms?.version, analytics, marketing]);

    function acceptAll() {
        if (!cms) return;
        const v = {
            ...payload,
            categories: { necessary: true, analytics: true, marketing: true },
        };
        writeStoredConsent(v);
        setStored(v);
        setOpenPrefs(false);
    }

    function rejectAll() {
        if (!cms) return;
        const v = {
            ...payload,
            categories: { necessary: true, analytics: false, marketing: false },
        };
        writeStoredConsent(v);
        setStored(v);
        setOpenPrefs(false);
    }

    function savePrefs() {
        if (!cms) return;
        writeStoredConsent(payload);
        setStored(payload);
        setOpenPrefs(false);
    }

    if (!cms || !show) return null;

    return (
        <>
            <div className={`fixed z-[60] ${posClass(cms.position)} w-[min(520px,calc(100vw-2rem))]`}>
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-start gap-3 p-5">
                        <div className="min-w-0">
                            <div className="text-base font-semibold text-slate-900">{cms.title}</div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{cms.message}</p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    onClick={acceptAll}
                                    className="rounded-lg bg-[#af2511] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                                >
                                    {cms.acceptLabel}
                                </button>

                                <button
                                    onClick={rejectAll}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                >
                                    {cms.rejectLabel}
                                </button>

                                <button
                                    onClick={() => setOpenPrefs(true)}
                                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                                >
                                    {cms.prefsLabel}
                                </button>
                            </div>

                            <div className="mt-3 flex gap-4 text-xs">
                                {cms.cookiesPolicyUrl && (
                                    <a className="text-slate-500 hover:text-slate-800 underline underline-offset-2" href={cms.cookiesPolicyUrl}>
                                        {cms.cookiesPolicyLabel ?? "Politique de cookies"}
                                    </a>
                                )}
                                {cms.privacyPolicyUrl && (
                                    <a className="text-slate-500 hover:text-slate-800 underline underline-offset-2" href={cms.privacyPolicyUrl}>
                                        {cms.privacyPolicyLabel ?? "Politique de confidentialité"}
                                    </a>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => rejectAll()}
                            className="ml-auto rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Close"
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* Preferences modal */}
            {openPrefs && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-start justify-between border-b border-slate-200 p-5">
                            <div>
                                <div className="text-base font-semibold text-slate-900">{cms.title}</div>
                                <div className="mt-1 text-sm text-slate-600">Choisissez vos préférences.</div>
                            </div>
                            <button onClick={() => setOpenPrefs(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-slate-900">{cms.categories.necessary.label}</div>
                                        <div className="text-sm text-slate-600">{cms.categories.necessary.desc}</div>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500">Toujours actif</span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-slate-900">{cms.categories.analytics.label}</div>
                                        <div className="text-sm text-slate-600">{cms.categories.analytics.desc}</div>
                                    </div>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4"
                                            checked={analytics}
                                            onChange={(e) => setAnalytics(e.target.checked)}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-slate-900">{cms.categories.marketing.label}</div>
                                        <div className="text-sm text-slate-600">{cms.categories.marketing.desc}</div>
                                    </div>
                                    <label className="inline-flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4"
                                            checked={marketing}
                                            onChange={(e) => setMarketing(e.target.checked)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-5">
                            <button
                                onClick={rejectAll}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                            >
                                {cms.rejectLabel}
                            </button>
                            <button
                                onClick={savePrefs}
                                className="rounded-lg bg-[#af2511] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
