import { Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import { clampInt, uniq } from "../utils/membersUtils";
import type { Member } from "../../../../../services/membersRepo";

interface MemberFiltersProps {
    members: Member[];
    filtered: Member[];
    selectedFilteredCount: number;
    filters: {
        search: string;
        city: string;
        status: "tous" | Member["status"];
        minAge: number;
        maxAge: number;
        tag: string;
    };
    showFilters: boolean;
    onFilterChange: (filters: Partial<MemberFiltersProps['filters']>) => void;
    onToggleFilters: () => void;
    onSelectAllFiltered: () => void;
    onUnselectAllFiltered: () => void;
}

export function MemberFilters({
    members,
    filtered,
    selectedFilteredCount,
    filters,
    showFilters,
    onFilterChange,
    onToggleFilters,
    onSelectAllFiltered,
    onUnselectAllFiltered,
}: MemberFiltersProps) {
    const cities = ["tous", ...uniq(members.map((m) => m.city)).sort()];
    const tags = ["tous", ...uniq(members.flatMap((m) => m.tags)).sort()];

    return (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <button
                onClick={onToggleFilters}
                className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-gray-50"
            >
                <div className="flex items-center gap-2">
                    <Filter size={18} />
                    <span className="font-medium">Filtres</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                        {filtered.length} sur {members.length}
                    </span>
                </div>
                {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {showFilters && (
                <div className="mt-4 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => onFilterChange({ search: e.target.value })}
                            placeholder="Rechercher un membre par nom, email, ville, tags..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ville</label>
                            <select
                                value={filters.city}
                                onChange={(e) => onFilterChange({ city: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            >
                                {cities.map((c) => (
                                    <option key={c} value={c}>
                                        {c === "tous" ? "Toutes les villes" : c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Statut</label>
                            <select
                                value={filters.status}
                                onChange={(e) => onFilterChange({ status: e.target.value as any })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            >
                                <option value="tous">Tous les statuts</option>
                                <option value="active">Actif</option>
                                <option value="inactive">Inactif</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tag</label>
                            <select
                                value={filters.tag}
                                onChange={(e) => onFilterChange({ tag: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            >
                                {tags.map((t) => (
                                    <option key={t} value={t}>
                                        {t === "tous" ? "Tous les tags" : t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Âge min</label>
                                <input
                                    type="number"
                                    value={filters.minAge}
                                    onChange={(e) => onFilterChange({ minAge: clampInt(e.target.value, 18) })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Âge max</label>
                                <input
                                    type="number"
                                    value={filters.maxAge}
                                    onChange={(e) => onFilterChange({ maxAge: clampInt(e.target.value, 99) })}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{selectedFilteredCount}</span> sélectionné{selectedFilteredCount !== 1 ? 's' : ''} sur {filtered.length} filtré{filtered.length !== 1 ? 's' : ''}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={onSelectAllFiltered}
                                disabled={filtered.length === 0}
                                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                            >
                                Tout sélectionner
                            </button>
                            <button
                                onClick={onUnselectAllFiltered}
                                disabled={selectedFilteredCount === 0}
                                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                            >
                                Tout désélectionner
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}