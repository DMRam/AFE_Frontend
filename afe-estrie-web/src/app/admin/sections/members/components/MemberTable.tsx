import { RefreshCw, Eye, Edit, Trash2 } from "lucide-react";
import type { Member } from "../../../../../services/membersRepo";

interface MemberTableProps {
    members: Member[];
    filtered: Member[];
    isLoading: boolean;
    selectedIds: Set<string>;
    selectedFilteredCount: number;
    onToggleOne: (id: string) => void;
    onSelectAllFiltered: () => void;
    onUnselectAllFiltered: () => void;
    onOpenDetails: (member: Member) => void;
    onOpenEdit: (member: Member) => void;
    onDelete: (member: Member) => void;
}

export function MemberTable({
    members,
    filtered,
    isLoading,
    selectedIds,
    selectedFilteredCount,
    onToggleOne,
    onSelectAllFiltered,
    onUnselectAllFiltered,
    onOpenDetails,
    onOpenEdit,
    onDelete,
}: MemberTableProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="mr-2 h-5 w-5 animate-spin text-gray-400" />
                <span className="text-gray-600">Chargement des membres...</span>
            </div>
        );
    }

    if (filtered.length === 0) {
        return (
            <div className="p-8 text-center">
                <div className="text-gray-400">Aucun membre trouvé</div>
                <div className="mt-2 text-sm text-gray-500">
                    {members.length === 0 ? "Commencez par ajouter un membre" : "Ajustez vos filtres pour voir plus de résultats"}
                </div>
            </div>
        );
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="p-3">
                                <input
                                    type="checkbox"
                                    checked={selectedFilteredCount === filtered.length && filtered.length > 0}
                                    onChange={() => {
                                        if (selectedFilteredCount === filtered.length) {
                                            onUnselectAllFiltered();
                                        } else {
                                            onSelectAllFiltered();
                                        }
                                    }}
                                    className="h-4 w-4 rounded border-gray-300"
                                />
                            </th>
                            <th className="p-3 text-left font-medium">Nom</th>
                            <th className="p-3 text-left font-medium hidden sm:table-cell">Email</th>
                            <th className="p-3 text-left font-medium hidden md:table-cell">Ville</th>
                            <th className="p-3 text-left font-medium hidden lg:table-cell">Âge</th>
                            <th className="p-3 text-left font-medium">Statut</th>
                            <th className="p-3 text-left font-medium hidden lg:table-cell">Tags</th>
                            <th className="p-3 text-left font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map((member) => {
                            const isSelected = selectedIds.has(member.id);
                            return (
                                <tr key={member.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => onToggleOne(member.id)}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <div className="font-medium">{member.fullName}</div>
                                        <div className="text-xs text-gray-500 sm:hidden">{member.email}</div>
                                        <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                                            <span className="text-xs text-gray-600">{member.city}</span>
                                            {member.age && <span className="text-xs text-gray-600">• {member.age} ans</span>}
                                        </div>
                                    </td>
                                    <td className="p-3 hidden sm:table-cell">
                                        <div className="truncate max-w-[150px]" title={member.email}>
                                            {member.email}
                                        </div>
                                    </td>
                                    <td className="p-3 hidden md:table-cell">{member.city}</td>
                                    <td className="p-3 hidden lg:table-cell">{member.age || "—"}</td>
                                    <td className="p-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${member.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                            }`}>
                                            {member.status === "active" ? "Actif" : "Inactif"}
                                        </span>
                                    </td>
                                    <td className="p-3 hidden lg:table-cell">
                                        <div className="flex flex-wrap gap-1">
                                            {member.tags?.slice(0, 2).map((tag) => (
                                                <span key={tag} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                                                    {tag}
                                                </span>
                                            ))}
                                            {member.tags && member.tags.length > 2 && (
                                                <span className="text-xs text-gray-500">+{member.tags.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => onOpenDetails(member)}
                                                className="rounded p-1 text-gray-600 hover:bg-gray-100"
                                                title="Détails"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => onOpenEdit(member)}
                                                className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                                title="Modifier"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(member)}
                                                className="rounded p-1 text-red-600 hover:bg-red-50"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}