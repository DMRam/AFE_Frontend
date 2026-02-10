import { useState, useMemo, useCallback } from "react";
import type { Member } from "../../../../../services/membersRepo";

export function useMembersSelection(members: Member[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const selected = useMemo(() => 
        members.filter((m) => selectedIds.has(m.id)), 
        [members, selectedIds]
    );

    const getSelectedFilteredCount = useCallback((filtered: Member[]) => {
        let count = 0;
        for (const m of filtered) if (selectedIds.has(m.id)) count++;
        return count;
    }, [selectedIds]);

    const toggleOne = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const selectAllFiltered = useCallback((filtered: Member[]) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const m of filtered) next.add(m.id);
            return next;
        });
    }, []);

    const unselectAllFiltered = useCallback((filtered: Member[]) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const m of filtered) next.delete(m.id);
            return next;
        });
    }, []);

    return {
        selectedIds,
        selected,
        toggleOne,
        clearSelection,
        selectAllFiltered,
        unselectAllFiltered,
        getSelectedFilteredCount,
    };
}