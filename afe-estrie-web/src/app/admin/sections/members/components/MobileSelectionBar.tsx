import { Users } from "lucide-react";

interface MobileSelectionBarProps {
    selectedCount: number;
    isSending: boolean;
    onSendToAutomation: () => void;
    onClearSelection: () => void;
}

export function MobileSelectionBar({
    selectedCount,
    isSending,
    onSendToAutomation,
    onClearSelection,
}: MobileSelectionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-40 sm:hidden">
            <div className="rounded-lg bg-black px-4 py-3 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users size={18} />
                        <span className="font-medium">{selectedCount} sélectionné{selectedCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onSendToAutomation}
                            disabled={isSending}
                            className="rounded bg-white px-3 py-1 text-sm font-medium text-black hover:bg-gray-100 disabled:opacity-50"
                        >
                            {isSending ? "..." : "Envoyer"}
                        </button>
                        <button
                            onClick={onClearSelection}
                            className="rounded border border-white px-3 py-1 text-sm hover:bg-white/10"
                        >
                            Effacer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}