import { useEffect } from "react";

export function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}) {
    useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            {/* Backdrop */}
            <button
                aria-label="Fermer"
                onClick={onClose}
                className="absolute inset-0 bg-black/40"
            />

            {/* Dialog */}
            <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
                <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b px-5 py-4">
                        <h2 className="text-base font-extrabold text-gray-900">{title}</h2>
                        <button
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                            aria-label="Fermer"
                        >
                            ✕
                        </button>
                    </div>

                    {/* ✅ Scroll container MUST be here */}
                    <div className="max-h-[78vh] overflow-y-auto">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
