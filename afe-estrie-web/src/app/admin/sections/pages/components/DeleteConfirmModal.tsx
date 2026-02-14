export function DeleteConfirmModal({
    open,
    title,
    message,
    confirmLabel = "Supprimer",
    cancelLabel = "Annuler",
    onConfirm,
    onCancel,
    busy = false,
}: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    busy?: boolean;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <button
                type="button"
                className="absolute inset-0 bg-black/30"
                onClick={() => !busy && onCancel()}
                aria-label="Fermer"
            />
            <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl">
                <div className="border-b border-gray-200 px-5 py-4">
                    <div className="text-lg font-semibold text-gray-900">{title}</div>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-gray-600">{message}</p>
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={busy}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={busy}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                        >
                            {busy ? "Suppression…" : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
