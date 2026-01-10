import { useMembershipContent } from "../../hooks/useMembershipContent";
import { Modal } from "../ui/Modal";


export function MemberModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const state = useMembershipContent();

    const handleCta = (href?: string) => {
        if (!href) return;

        // Close first for a nicer UX
        onClose();

        // Smooth scroll if it's an anchor
        if (href.startsWith("#")) {
            const id = href.slice(1);
            setTimeout(() => {
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 80);
            return;
        }

        // Otherwise, navigate
        window.location.href = href;
    };

    return (
        <Modal open={open} onClose={onClose} title={state.status === "success" ? state.data.title : "Devenir membre"}>
            {state.status === "loading" ? (
                <div className="space-y-3">
                    <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
                    <div className="h-24 rounded bg-gray-100 animate-pulse" />
                    <div className="h-24 rounded bg-gray-100 animate-pulse" />
                </div>
            ) : state.status === "error" ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {state.error}
                </div>
            ) : (
                <div className="px-5 py-5 pb-0 space-y-6">
                    {/* Intro */}
                    <div className="rounded-2xl bg-red-50/60 ring-1 ring-red-100 p-4">
                        <p className="text-sm font-bold text-gray-900">{state.data.subtitle}</p>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">{state.data.intro}</p>
                    </div>

                    {/* Pricing */}
                    <div className="rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200">
                        <h3 className="text-sm font-extrabold text-gray-900">Tarifs</h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-700">
                            {state.data.pricingIntro}
                        </p>

                        <div className="mt-4 rounded-xl bg-white p-3 ring-1 ring-gray-200">
                            <p className="text-sm leading-relaxed text-gray-700">{state.data.infoFiboNote}</p>
                        </div>
                    </div>

                    {/* Plans */}
                    <div className="grid gap-3 md:grid-cols-3">
                        {state.data.plans.map((p) => (
                            <div key={p.name} className="rounded-2xl border border-gray-200 bg-white p-4">
                                <p className="text-sm font-extrabold text-gray-900">{p.name}</p>
                                <p className="mt-1 text-sm text-gray-700">{p.desc}</p>
                                <p className="mt-3 text-sm font-semibold text-gray-900">
                                    {p.price}{p.period ? ` • ${p.period}` : ""}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Sticky footer actions */}
                    <div className="sticky bottom-0 -mx-5 border-t bg-white/95 backdrop-blur px-5 py-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                            <button
                                onClick={onClose}
                                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                            >
                                Fermer
                            </button>

                            <button
                                onClick={() => handleCta(state.data.ctaHref)}
                                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                            >
                                {state.data.ctaLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
