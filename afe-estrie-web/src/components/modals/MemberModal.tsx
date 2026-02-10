import { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { useMembershipContent } from "../../hooks/useMembershipContent";
import { Modal } from "../ui/Modal";
import { functions } from "../../services/firebase";
import type { MemberClientForm } from "../../content/types/members";
import { DEFAULT_FORM, STRIPE_BY_PLAN } from "../constants/MemberModalConstants";
import { useMemberFormValidations } from "./useMemberFormValidations";
import { MemberForm } from "./MemberForm";




export function MemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {

    const { validateForm } = useMemberFormValidations();
    const state = useMembershipContent();

    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [form, setForm] = useState<MemberClientForm>(DEFAULT_FORM);
    const [_formTouched, setFormTouched] = useState(false);

    const [isPaying, setIsPaying] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    const { ok: formOk, errors: _formErrors, normalized: normalizedForm } = useMemo(() => validateForm(form), [form]);

    async function startCheckout() {
        if (!selectedPlan) return;
        setFormTouched(true);

        const cfg = STRIPE_BY_PLAN[selectedPlan];
        const priceId = cfg?.priceId;
        const mode = cfg?.mode;

        setIsPaying(true);
        setPayError(null);

        try {
            if (!mode) throw new Error("Mode Stripe manquant.");
            if (!priceId || !priceId.startsWith("price_")) {
                throw new Error(`Stripe priceId non configuré pour "${selectedPlan}".`);
            }
            if (!formOk) throw new Error("Veuillez compléter le formulaire avant de continuer.");

            const createSession = httpsCallable(functions, "createCheckoutSession");
            const result = await createSession({
                priceId,
                mode,
                planName: selectedPlan,
                client: normalizedForm,
            });

            const url = (result.data as any)?.url as string | undefined;
            if (!url) throw new Error("URL Stripe manquante.");

            onClose();
            window.location.href = url;
        } catch (e: any) {
            setPayError(e?.message ?? "Erreur inconnue.");
            setIsPaying(false);
        }
    }

    const planCfg = selectedPlan ? STRIPE_BY_PLAN[selectedPlan] : null;
    const canPay = !!selectedPlan && !!planCfg?.priceId && planCfg.priceId.startsWith("price_") && !isPaying && formOk;

    return (
        <Modal
            open={open}
            onClose={() => {
                if (isPaying) return;
                onClose();
            }}
            title={state.status === "success" ? state.data.title : "Devenir membre"}
        >
            {state.status === "loading" ? (
                <div className="space-y-3">
                    <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
                    <div className="h-24 rounded bg-gray-100 animate-pulse" />
                    <div className="h-24 rounded bg-gray-100 animate-pulse" />
                </div>
            ) : state.status === "error" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{state.error}</div>
            ) : (
                <div className="px-5 py-5 pb-0 space-y-6">
                    {/* Intro */}
                    <div className="rounded-2xl bg-red-50/60 ring-1 ring-red-100 p-4">
                        <p className="text-sm font-bold text-gray-900">{state.data.subtitle}</p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">{state.data.intro}</p>
                    </div>

                    <MemberForm form={form} setForm={setForm} />


                    {/* Plans (with hover UX) */}
                    <div className="grid gap-3 md:grid-cols-3">
                        {state.data.plans.map((p) => {
                            const isSelected = selectedPlan === p.name;
                            const cfg = STRIPE_BY_PLAN[p.name];
                            const hasPrice = Boolean(cfg?.priceId && cfg.priceId.startsWith("price_"));
                            const modeLabel = cfg?.mode === "subscription" ? "Abonnement" : cfg?.mode === "payment" ? "Paiement unique" : "";
                            const perks = cfg?.perks ?? [];

                            return (
                                <button
                                    type="button"
                                    key={p.name}
                                    onClick={() => setSelectedPlan(p.name)}
                                    className={[
                                        "group relative text-left rounded-2xl border bg-white p-4 transition will-change-transform",
                                        "hover:-translate-y-0.5 hover:shadow-lg",
                                        isSelected ? "border-red-500 ring-2 ring-red-200 shadow-md" : "border-gray-200 hover:border-gray-300",
                                        !hasPrice ? "opacity-70" : "",
                                    ].join(" ")}
                                >
                                    {/* Hover glow */}
                                    <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition ring-1 ring-red-100" />

                                    <div className="relative">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm font-extrabold text-gray-900">{p.name}</p>
                                            {modeLabel ? (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                                                    {modeLabel}
                                                </span>
                                            ) : null}
                                        </div>

                                        <p className="mt-1 text-sm text-gray-700">{p.desc}</p>

                                        <p className="mt-3 text-sm font-semibold text-gray-900">
                                            {p.price}
                                            {p.period ? ` • ${p.period}` : ""}
                                        </p>

                                        {/* Hover details */}
                                        {perks.length ? (
                                            <div className="mt-3 rounded-xl bg-gray-50 ring-1 ring-gray-200 p-3 opacity-0 max-h-0 overflow-hidden transition-all duration-200 group-hover:opacity-100 group-hover:max-h-40">
                                                <p className="text-xs font-extrabold text-gray-800">Détails</p>
                                                <ul className="mt-2 space-y-1 text-xs text-gray-700">
                                                    {perks.slice(0, 4).map((x) => (
                                                        <li key={x} className="flex gap-2">
                                                            <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-gray-400" />
                                                            <span>{x}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}

                                        {isSelected && <p className="mt-3 text-xs font-semibold text-red-700">Sélectionné</p>}
                                        {!hasPrice && <p className="mt-2 text-xs text-gray-500">(Stripe priceId non configuré)</p>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {payError && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{payError}</div>
                    )}

                    {/* Sticky footer actions */}
                    <div className="sticky bottom-0 -mx-5 border-t bg-white/95 backdrop-blur px-5 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                onClick={onClose}
                                disabled={isPaying}
                                className={[
                                    "inline-flex items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold",
                                    isPaying ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50",
                                ].join(" ")}
                            >
                                Fermer
                            </button>

                            <button
                                disabled={!canPay}
                                onClick={() => void startCheckout()}
                                className={[
                                    "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white",
                                    !canPay ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700",
                                ].join(" ")}
                            >
                                {isPaying ? "Redirection..." : "Payer et devenir membre"}
                            </button>
                        </div>

                        <div className="mt-2 text-xs text-gray-600">
                            {!selectedPlan ? "Sélectionnez un plan pour continuer." : null}
                            {selectedPlan && !formOk ? <span> Complétez le formulaire (champs requis avec *).</span> : null}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
