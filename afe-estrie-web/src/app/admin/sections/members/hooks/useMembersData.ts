import { useState, useEffect, useCallback } from "react";
import { type Member, listMembers, createMember, updateMember, deleteMember, type MemberInput } from "../../../../../services/membersRepo";

export function useMembersData() {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshMembers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const rows = await listMembers();
            setMembers(rows);
        } catch (e: any) {
            console.error(e);
            setError(`Échec du chargement des membres : ${e?.message || String(e)}`);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleCreateMember = useCallback(async (input: MemberInput) => {
        try {
            const created = await createMember(input);
            setMembers((prev) => [created, ...prev]);
            await refreshMembers();
            return created;
        } catch (e: any) {
            console.error(e);
            throw new Error(`Échec de la création : ${e?.message || String(e)}`);
        }
    }, [refreshMembers]);

    const handleUpdateMember = useCallback(async (id: string, input: Partial<MemberInput>) => {
        try {
            await updateMember(id, input);
            await refreshMembers();
        } catch (e: any) {
            console.error(e);
            throw new Error(`Échec de la mise à jour : ${e?.message || String(e)}`);
        }
    }, [refreshMembers]);

    const handleDeleteMember = useCallback(async (id: string) => {
        try {
            await deleteMember(id);
            setMembers((prev) => prev.filter((m) => m.id !== id));
        } catch (e: any) {
            console.error(e);
            throw new Error(`Échec de la suppression : ${e?.message || String(e)}`);
        }
    }, []);

    useEffect(() => {
        refreshMembers();
    }, [refreshMembers]);

    return {
        members,
        isLoading,
        error,
        refreshMembers,
        handleCreateMember,
        handleUpdateMember,
        handleDeleteMember,
    };
}