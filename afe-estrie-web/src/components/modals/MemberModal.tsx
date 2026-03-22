import { useState } from "react";
import { useMembershipContent } from "../../hooks/useMembershipContent";
import { Modal } from "../ui/Modal";

type QuidigoPlanConfig = {
    url: string;
    perks?: string[];
};

const QUIDIGO_BY_PLAN: Record<string, QuidigoPlanConfig> = {
    "Membre actif": {
        url: "https://www.qidigo.com/u/Association-de-la-fibromyalgie-de-lEstrie/memberships/1818",
        perks: ["Accès membre", "Participation aux activités", "Soutien à l'association"],
    },
    "Membre famille": {
        url: "https://www.qidigo.com/u/Association-de-la-fibromyalgie-de-lEstrie/memberships/1840",
        perks: ["Adhésion familiale", "Accès aux ressources", "Participation aux activités"],
    },
    "Membre soutien": {
        url: "https://www.qidigo.com/u/Association-de-la-fibromyalgie-de-lEstrie/memberships/1839",
        perks: ["Contribution de soutien", "Appui à la mission", "Participation selon l'offre"],
    },
};

export function MemberModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const state = useMembershipContent();
    const [redirectingPlan, setRedirectingPlan] = useState<string | null>(null);

    function goToQuidigo(planName: string) {
        const cfg = QUIDIGO_BY_PLAN[planName];

        if (!cfg?.url) {
            alert(`Lien Quidigo non configuré pour "${planName}".`);
            return;
        }

        setRedirectingPlan(planName);

        // close modal first
        onClose();

        // open Quidigo in a new tab
        window.open(cfg.url, "_blank", "noopener,noreferrer");

        // optional cleanup
        window.setTimeout(() => {
            setRedirectingPlan(null);
        }, 300);
    }

    return (
        <Modal
            open={open}
            onClose={() => {
                if (redirectingPlan) return;
                onClose();
            }}
            title={state.status === "success" ? state.data.title : "Devenir membre"}
        >
            {state.status === "loading" ? (
                <div className="space-y-3">
                    <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
                    <div className="h-24 animate-pulse rounded bg-gray-100" />
                    <div className="h-24 animate-pulse rounded bg-gray-100" />
                </div>
            ) : state.status === "error" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {state.error}
                </div>
            ) : (
                <div className="space-y-6 px-5 py-5">
                    <div className="rounded-2xl bg-red-50/60 p-4 ring-1 ring-red-100">
                        <p className="text-sm font-bold text-gray-900">{state.data.subtitle}</p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                            {state.data.intro}
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {state.data.plans.map((p) => {
                            const cfg = QUIDIGO_BY_PLAN[p.name];
                            const perks = cfg?.perks ?? [];

                            return (
                                <button
                                    key={p.name}
                                    type="button"
                                    onClick={() => goToQuidigo(p.name)}
                                    disabled={redirectingPlan !== null}
                                    className="group relative rounded-2xl border border-gray-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-lg"
                                >
                                    <div className="flex items-start justify-between">
                                        <p className="text-base font-extrabold text-gray-900">{p.name}</p>

                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                                            Quidigo
                                        </span>
                                    </div>

                                    <p className="mt-2 text-sm text-gray-700">{p.desc}</p>

                                    <p className="mt-3 text-sm font-semibold text-gray-900">
                                        {p.price}
                                        {p.period ? ` • ${p.period}` : ""}
                                    </p>

                                    {perks.length > 0 && (
                                        <ul className="mt-4 space-y-1 text-xs text-gray-600">
                                            {perks.slice(0, 4).map((x) => (
                                                <li key={x} className="flex gap-2">
                                                    <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-gray-400" />
                                                    <span>{x}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {redirectingPlan === p.name && (
                                        <p className="mt-3 text-xs font-semibold text-red-700">
                                            Redirection...
                                        </p>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="text-center text-xs text-gray-600">
                        Vous serez redirigé vers Quidigo pour compléter votre adhésion.
                    </div>
                </div>
            )}
        </Modal>
    );
}