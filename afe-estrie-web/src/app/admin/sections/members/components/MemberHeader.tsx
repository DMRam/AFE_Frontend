import { UserPlus, RefreshCw } from "lucide-react";
import type { Member } from "../../../../../services/membersRepo";

interface MemberHeaderProps {
    members: Member[];
    filtered: Member[];
    selected: Member[];
    isLoading: boolean;
    onRefresh: () => void;
    onCreate: () => void;
}

export function MemberHeader({ 
    members, 
    filtered, 
    selected, 
    isLoading, 
    onRefresh, 
    onCreate 
}: MemberHeaderProps) {
    return (
        <header className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold sm:text-2xl">Gestionnaire des Membres</h1>
                    <p className="text-sm text-gray-600">
                        Gérez vos membres et envoyez des listes à vos automatisations n8n.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={onCreate}
                        className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                        <UserPlus size={16} />
                        Nouveau membre
                    </button>
                    <button
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        Actualiser
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="text-sm text-gray-600">Total</div>
                    <div className="text-lg font-semibold">{members.length}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="text-sm text-gray-600">Filtrés</div>
                    <div className="text-lg font-semibold">{filtered.length}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="text-sm text-gray-600">Sélectionnés</div>
                    <div className="text-lg font-semibold">{selected.length}</div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                    <div className="text-sm text-gray-600">Actifs</div>
                    <div className="text-lg font-semibold">
                        {members.filter(m => m.status === "active").length}
                    </div>
                </div>
            </div>
        </header>
    );
}