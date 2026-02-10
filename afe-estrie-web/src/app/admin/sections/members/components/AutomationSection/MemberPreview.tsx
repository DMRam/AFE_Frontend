import { Users, X } from "lucide-react";
import type { Member } from "../../../../../../services/membersRepo";
import type { SendPreview } from "../../utils/membersUtils";

interface MemberPreviewProps {
    selected: Member[];
    sendPreview: SendPreview;
    onClearSelection: () => void;
}

export function MemberPreview({ 
    selected, 
    sendPreview, 
    onClearSelection 
}: MemberPreviewProps) {
    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span className="font-medium">Aperçu de la sélection</span>
                    <span className="text-sm text-gray-600">({selected.length} membre{selected.length !== 1 ? 's' : ''})</span>
                </div>
                <button
                    onClick={onClearSelection}
                    disabled={selected.length === 0}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 disabled:opacity-50"
                >
                    <X size={14} />
                    Effacer
                </button>
            </div>

            {selected.length === 0 ? (
                <div className="mt-2 text-center text-sm text-gray-500">
                    Sélectionnez des membres dans le tableau pour voir l'aperçu
                </div>
            ) : (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {sendPreview.top.map((member) => (
                        <div key={member.email} className="rounded-lg border border-gray-200 bg-white p-3">
                            <div className="font-medium">{member.fullName}</div>
                            <div className="truncate text-sm text-gray-600">{member.email}</div>
                        </div>
                    ))}
                    {sendPreview.hasMore && (
                        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-3">
                            <span className="text-sm text-gray-500">
                                + {selected.length - sendPreview.top.length} autre{selected.length - sendPreview.top.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}