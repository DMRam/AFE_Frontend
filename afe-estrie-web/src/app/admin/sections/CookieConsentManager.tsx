import { useEffect, useMemo, useRef, useState } from "react";
import type { CookieConsentCMS } from "../../../content/types/cookieConsent";
import {
    getCookieConsent,
    patchCookieConsent,
    seedCookieConsentIfMissing,
} from "../../../services/cookieConsentRepo";

// ---------- small utils ----------
function stableStringify(v: any) {
    return JSON.stringify(v ?? null);
}

function safeNumber(v: any, fallback = 1) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

function clsx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

// ---------- UI atoms (simple, no extra deps) ----------
function Field({ label, hint, children }: any) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-end justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">{label}</div>
                {hint ? <div className="text-xs text-gray-500">{hint}</div> : null}
            </div>
            {children}
        </div>
    );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            className={clsx(
                "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
                "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#af2511]/20 focus:border-[#af2511]/40",
                props.className
            )}
        />
    );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={clsx(
                "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
                "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#af2511]/20 focus:border-[#af2511]/40",
                props.className
            )}
        />
    );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select
            {...props}
            className={clsx(
                "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-[#af2511]/20 focus:border-[#af2511]/40",
                props.className
            )}
        />
    );
}

function Toggle({
    checked,
    onChange,
    label,
    desc,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    desc?: string;
}) {
    return (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">{label}</div>
                {desc ? <div className="mt-1 text-sm text-gray-600">{desc}</div> : null}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={clsx(
                    "relative inline-flex h-6 w-11 items-center rounded-full border transition-colors",
                    checked
                        ? "bg-[#af2511] border-[#af2511]"
                        : "bg-gray-100 border-gray-200"
                )}
                aria-pressed={checked}
            >
                <span
                    className={clsx(
                        "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
                        checked ? "translate-x-5" : "translate-x-1"
                    )}
                />
            </button>
        </div>
    );
}

function Button({
    variant = "primary",
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "ghost" | "danger";
}) {
    const base =
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    const styles =
        variant === "primary"
            ? "bg-[#af2511] text-white hover:opacity-90"
            : variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50";
    return <button {...props} className={clsx(base, styles, props.className)} />;
}

// ---------- defaults ----------
function normalizeCMS(x: CookieConsentCMS | null): CookieConsentCMS {
    // keep in sync with your seed defaults; ensures UI never breaks if fields missing
    return {
        enabled: x?.enabled ?? true,
        version: safeNumber((x as any)?.version, 1),
        mode: (x?.mode as any) ?? "opt_in",
        title: x?.title ?? "Gérer le consentement aux cookies",
        message:
            x?.message ??
            "Pour offrir les meilleures expériences, nous utilisons des technologies telles que les cookies pour stocker et/ou accéder aux informations des appareils.",
        acceptLabel: x?.acceptLabel ?? "Accepter",
        rejectLabel: x?.rejectLabel ?? "Refuser",
        prefsLabel: x?.prefsLabel ?? "Voir les préférences",
        cookiesPolicyUrl: x?.cookiesPolicyUrl ?? "/cookies",
        privacyPolicyUrl: x?.privacyPolicyUrl ?? "/confidentialite",
        cookiesPolicyLabel: x?.cookiesPolicyLabel ?? "Politique de cookies",
        privacyPolicyLabel: x?.privacyPolicyLabel ?? "Politique de confidentialité",
        categories: {
            necessary: {
                enabled: x?.categories?.necessary?.enabled ?? true,
                locked: x?.categories?.necessary?.locked ?? true,
                label: x?.categories?.necessary?.label ?? "Nécessaires",
                desc:
                    x?.categories?.necessary?.desc ??
                    "Toujours actifs pour le fonctionnement du site.",
            },
            analytics: {
                enabled: x?.categories?.analytics?.enabled ?? false,
                label: x?.categories?.analytics?.label ?? "Analytique",
                desc:
                    x?.categories?.analytics?.desc ??
                    "Aide à améliorer le site via des statistiques d’utilisation.",
            },
            marketing: {
                enabled: x?.categories?.marketing?.enabled ?? false,
                label: x?.categories?.marketing?.label ?? "Marketing",
                desc:
                    x?.categories?.marketing?.desc ??
                    "Personnalisation et mesure des Infolettres.",
            },
        },
        position: (x?.position as any) ?? "bottom-right",
    };
}

// ---------- component ----------
export function CookieConsentManager() {
    const [loading, setLoading] = useState(true);
    const [cms, setCms] = useState<CookieConsentCMS | null>(null);
    const [initial, setInitial] = useState<CookieConsentCMS | null>(null);

    const [saving, setSaving] = useState(false);
    const toastTimers = useRef<Map<string, number>>(new Map());
    const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(
        null
    );

    function showToast(kind: "ok" | "err", msg: string, ms = 2200) {
        setToast({ kind, msg });
        const id = window.setTimeout(() => setToast(null), ms);
        toastTimers.current.set("t", id);
    }

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                await seedCookieConsentIfMissing();
                const data = await getCookieConsent();
                const normalized = normalizeCMS(data);
                setCms(normalized);
                setInitial(normalized);
            } catch (e) {
                console.error(e);
                showToast("err", "Impossible de charger la configuration cookies");
            } finally {
                setLoading(false);
            }
        })();

        return () => {
            toastTimers.current.forEach((t) => window.clearTimeout(t));
            toastTimers.current.clear();
        };
    }, []);

    const dirty = useMemo(() => {
        return stableStringify(cms) !== stableStringify(initial);
    }, [cms, initial]);

    async function save() {
        if (!cms) return;
        try {
            setSaving(true);
            await patchCookieConsent(cms);
            setInitial(cms);
            showToast("ok", "Sauvegardé");
        } catch (e) {
            console.error(e);
            showToast("err", "Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    }

    async function bumpVersion() {
        if (!cms) return;
        const next = { ...cms, version: safeNumber(cms.version, 1) + 1 };
        setCms(next);
        try {
            setSaving(true);
            await patchCookieConsent({ version: next.version });
            setInitial((prev) => (prev ? { ...prev, version: next.version } : next));
            showToast("ok", `Version mise à jour (${next.version})`);
        } catch (e) {
            console.error(e);
            showToast("err", "Impossible de mettre à jour la version");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
                Chargement…
            </div>
        );
    }

    if (!cms) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                Configuration introuvable.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* top actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="text-lg font-bold text-gray-900">Cookie consent</div>
                    <div className="text-sm text-gray-600">
                        Bannière + préférences. Les liens et libellés sont éditables.
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={bumpVersion}
                        disabled={saving}
                        title="Force les visiteurs à reconsentir (si texte changé)"
                    >
                        +1 Version (re-consent)
                    </Button>

                    <Button type="button" onClick={save} disabled={!dirty || saving}>
                        {saving ? "Sauvegarde…" : dirty ? "Sauvegarder" : "Sauvegardé"}
                    </Button>
                </div>
            </div>

            {/* toast */}
            {toast && (
                <div
                    className={clsx(
                        "rounded-xl border p-4 text-sm font-medium",
                        toast.kind === "ok"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-800"
                    )}
                >
                    {toast.msg}
                </div>
            )}

            {/* main grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* General */}
                <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-bold text-gray-900">Général</div>

                    <Toggle
                        checked={!!cms.enabled}
                        onChange={(v) => setCms({ ...cms, enabled: v })}
                        label="Activer la bannière"
                        desc="Si désactivé, aucune bannière n'apparaît."
                    />

                    <Field label="Mode de consentement" hint="opt_in recommandé">
                        <Select
                            value={cms.mode}
                            onChange={(e) => setCms({ ...cms, mode: e.target.value as any })}
                        >
                            <option value="opt_in">Opt-in (bloquer analytics/marketing par défaut)</option>
                            <option value="opt_out">Opt-out (autoriser par défaut)</option>
                        </Select>
                    </Field>

                    <Field label="Position">
                        <Select
                            value={cms.position}
                            onChange={(e) =>
                                setCms({ ...cms, position: e.target.value as any })
                            }
                        >
                            <option value="bottom-right">Bas droite</option>
                            <option value="bottom-left">Bas gauche</option>
                            <option value="bottom">Bas centré</option>
                        </Select>
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Version" hint="Bump pour re-consent">
                            <Input
                                type="number"
                                value={cms.version}
                                onChange={(e) =>
                                    setCms({ ...cms, version: safeNumber(e.target.value, 1) })
                                }
                            />
                        </Field>

                        <Field
                            label="Astuce"
                            hint="Quand modifier?"
                        >
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                                Augmente la version si tu modifies le texte / catégories /
                                politiques pour forcer la ré-acceptation.
                            </div>
                        </Field>
                    </div>
                </div>

                {/* Text & buttons */}
                <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-bold text-gray-900">Texte & boutons</div>

                    <Field label="Titre">
                        <Input
                            value={cms.title}
                            onChange={(e) => setCms({ ...cms, title: e.target.value })}
                            placeholder="Gérer le consentement aux cookies"
                        />
                    </Field>

                    <Field label="Message">
                        <Textarea
                            rows={6}
                            value={cms.message}
                            onChange={(e) => setCms({ ...cms, message: e.target.value })}
                        />
                    </Field>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <Field label="Bouton accepter">
                            <Input
                                value={cms.acceptLabel}
                                onChange={(e) => setCms({ ...cms, acceptLabel: e.target.value })}
                            />
                        </Field>
                        <Field label="Bouton refuser">
                            <Input
                                value={cms.rejectLabel}
                                onChange={(e) => setCms({ ...cms, rejectLabel: e.target.value })}
                            />
                        </Field>
                        <Field label="Bouton préférences">
                            <Input
                                value={cms.prefsLabel}
                                onChange={(e) => setCms({ ...cms, prefsLabel: e.target.value })}
                            />
                        </Field>
                    </div>
                </div>

                {/* Policy links */}
                <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-bold text-gray-900">
                        Liens de politiques
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="URL politique cookies">
                            <Input
                                value={cms.cookiesPolicyUrl ?? ""}
                                onChange={(e) =>
                                    setCms({ ...cms, cookiesPolicyUrl: e.target.value })
                                }
                                placeholder="/cookies"
                            />
                        </Field>

                        <Field label="Label politique cookies">
                            <Input
                                value={cms.cookiesPolicyLabel ?? ""}
                                onChange={(e) =>
                                    setCms({ ...cms, cookiesPolicyLabel: e.target.value })
                                }
                                placeholder="Politique de cookies"
                            />
                        </Field>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="URL politique confidentialité">
                            <Input
                                value={cms.privacyPolicyUrl ?? ""}
                                onChange={(e) =>
                                    setCms({ ...cms, privacyPolicyUrl: e.target.value })
                                }
                                placeholder="/confidentialite"
                            />
                        </Field>

                        <Field label="Label politique confidentialité">
                            <Input
                                value={cms.privacyPolicyLabel ?? ""}
                                onChange={(e) =>
                                    setCms({ ...cms, privacyPolicyLabel: e.target.value })
                                }
                                placeholder="Politique de confidentialité"
                            />
                        </Field>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                        Recommandé: fais pointer ces URLs vers des pages CMS
                        (DynamicPage), comme <code className="px-1">/p/politique-de-cookies</code>.
                    </div>
                </div>

                {/* Categories */}
                <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-bold text-gray-900">Catégories</div>

                    <div className="space-y-4">
                        {/* necessary */}
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-gray-900">
                                        Nécessaires (toujours actifs)
                                    </div>
                                    <div className="mt-1 text-sm text-gray-600">
                                        {cms.categories.necessary.desc}
                                    </div>
                                </div>
                                <span className="text-xs font-semibold text-gray-500">
                                    Verrouillé
                                </span>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <Field label="Label">
                                    <Input
                                        value={cms.categories.necessary.label}
                                        onChange={(e) =>
                                            setCms({
                                                ...cms,
                                                categories: {
                                                    ...cms.categories,
                                                    necessary: {
                                                        ...cms.categories.necessary,
                                                        label: e.target.value,
                                                    },
                                                },
                                            })
                                        }
                                    />
                                </Field>
                                <Field label="Description">
                                    <Input
                                        value={cms.categories.necessary.desc}
                                        onChange={(e) =>
                                            setCms({
                                                ...cms,
                                                categories: {
                                                    ...cms.categories,
                                                    necessary: {
                                                        ...cms.categories.necessary,
                                                        desc: e.target.value,
                                                    },
                                                },
                                            })
                                        }
                                    />
                                </Field>
                            </div>
                        </div>

                        {/* analytics */}
                        <Toggle
                            checked={!!cms.categories.analytics.enabled}
                            onChange={(v) =>
                                setCms({
                                    ...cms,
                                    categories: {
                                        ...cms.categories,
                                        analytics: { ...cms.categories.analytics, enabled: v },
                                    },
                                })
                            }
                            label="Activer Analytique (par défaut)"
                            desc="Définit l'état initial du toggle Analytique."
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Label Analytique">
                                <Input
                                    value={cms.categories.analytics.label}
                                    onChange={(e) =>
                                        setCms({
                                            ...cms,
                                            categories: {
                                                ...cms.categories,
                                                analytics: {
                                                    ...cms.categories.analytics,
                                                    label: e.target.value,
                                                },
                                            },
                                        })
                                    }
                                />
                            </Field>
                            <Field label="Description Analytique">
                                <Input
                                    value={cms.categories.analytics.desc}
                                    onChange={(e) =>
                                        setCms({
                                            ...cms,
                                            categories: {
                                                ...cms.categories,
                                                analytics: {
                                                    ...cms.categories.analytics,
                                                    desc: e.target.value,
                                                },
                                            },
                                        })
                                    }
                                />
                            </Field>
                        </div>

                        {/* marketing */}
                        <Toggle
                            checked={!!cms.categories.marketing.enabled}
                            onChange={(v) =>
                                setCms({
                                    ...cms,
                                    categories: {
                                        ...cms.categories,
                                        marketing: { ...cms.categories.marketing, enabled: v },
                                    },
                                })
                            }
                            label="Activer Marketing (par défaut)"
                            desc="Définit l'état initial du toggle Marketing."
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Label Marketing">
                                <Input
                                    value={cms.categories.marketing.label}
                                    onChange={(e) =>
                                        setCms({
                                            ...cms,
                                            categories: {
                                                ...cms.categories,
                                                marketing: {
                                                    ...cms.categories.marketing,
                                                    label: e.target.value,
                                                },
                                            },
                                        })
                                    }
                                />
                            </Field>
                            <Field label="Description Marketing">
                                <Input
                                    value={cms.categories.marketing.desc}
                                    onChange={(e) =>
                                        setCms({
                                            ...cms,
                                            categories: {
                                                ...cms.categories,
                                                marketing: {
                                                    ...cms.categories.marketing,
                                                    desc: e.target.value,
                                                },
                                            },
                                        })
                                    }
                                />
                            </Field>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                            Note: “enabled par défaut” ne signifie pas “autorisé sans consentement”.
                            Le vrai blocage se fait côté code, en lisant le consent stocké.
                        </div>
                    </div>
                </div>
            </div>

            {/* bottom save */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
                <div className="text-sm text-gray-600">
                    {dirty ? "Modifications non sauvegardées" : "Aucune modification en attente"}
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setCms(initial)} disabled={!dirty || saving}>
                        Annuler
                    </Button>
                    <Button type="button" onClick={save} disabled={!dirty || saving}>
                        {saving ? "Sauvegarde…" : "Sauvegarder"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
