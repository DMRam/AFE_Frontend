import { useMemo, useState } from "react";

import { MemberHeader } from "./components/MemberHeader";
import { AutomationSection } from "./components/AutomationSection/AutomationSection";
import { MemberFilters } from "./components/MemberFilters";
import { MemberTable } from "./components/MemberTable";
import { MobileSelectionBar } from "./components/MobileSelectionBar";
import { MemberDetailsModal } from "./components/MemberDetailsModal";
import { useMembersData } from "./hooks/useMembersData";
import { useMembersSelection } from "./hooks/useMembersSelection";
import type { Member, MemberInput } from "../../../../services/membersRepo";
import { MemberFormModal } from "./MemberFormModal";

export function MembersManager() {
    const {
        members,
        isLoading,
        refreshMembers,
        handleCreateMember,
        handleUpdateMember,
        handleDeleteMember,
    } = useMembersData();

    const {
        selectedIds,
        selected,
        toggleOne,
        clearSelection,
        selectAllFiltered,
        unselectAllFiltered,
        getSelectedFilteredCount,
    } = useMembersSelection(members);

    const [showFilters, setShowFilters] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editing, setEditing] = useState<Member | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [detailsMember, setDetailsMember] = useState<Member | null>(null);
    const [isSending, setIsSending] = useState(false);

    const [filters, setFilters] = useState({
        search: "",
        city: "tous",
        status: "tous" as "tous" | Member["status"],
        minAge: 18,
        maxAge: 99,
        tag: "tous",
    });

    const filtered = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        return members.filter((m) => {
            if (filters.city !== "tous" && m.city !== filters.city) return false;
            if (filters.status !== "tous" && m.status !== filters.status) return false;
            if (m.age != null && (m.age < filters.minAge || m.age > filters.maxAge)) return false;
            if (filters.tag !== "tous" && !m.tags.includes(filters.tag)) return false;

            if (!q) return true;
            const hay = `${m.fullName} ${m.email} ${m.city} ${m.tags.join(" ")}`.toLowerCase();
            return hay.includes(q);
        });
    }, [members, filters]);

    const selectedFilteredCount = getSelectedFilteredCount(filtered);

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleOpenCreate = () => {
        setModalMode("create");
        setEditing(null);
        setModalOpen(true);
    };

    const handleOpenEdit = (member: Member) => {
        setModalMode("edit");
        setEditing(member);
        setModalOpen(true);
    };

    const handleOpenDetails = (member: Member) => {
        setDetailsMember(member);
        setDetailsOpen(true);
    };

    const handleSubmit = async (input: MemberInput) => {
        try {
            if (modalMode === "create") {
                await handleCreateMember(input);
            } else if (modalMode === "edit" && editing) {
                await handleUpdateMember(editing.id, input);
            }
            setModalOpen(false);
        } catch (e: any) {
            alert(`Échec de l'enregistrement : ${e?.message || String(e)}`);
        }
    };

    const handleDelete = async (member: Member) => {
        const ok = window.confirm(`Supprimer ${member.fullName} ?`);
        if (!ok) return;

        try {
            await handleDeleteMember(member.id);
            clearSelection();
            if (detailsMember?.id === member.id) {
                setDetailsOpen(false);
                setDetailsMember(null);
            }
        } catch (e: any) {
            alert(`Échec de la suppression : ${e?.message || String(e)}`);
        }
    };


    const handleSendToAutomation = async (webhookUrl: string, selectedMembers: Member[], campaignData?: any) => {
        setIsSending(true);
        try {
            const payload = {
                source: "AFE Admin Gestionnaire des Membres",
                sentAt: new Date().toISOString(),
                filters,
                summary: {
                    count: selectedMembers.length,
                    sample: selectedMembers.slice(0, 12).map(m => ({ fullName: m.fullName, email: m.email })),
                },
                members: selectedMembers.map((m) => ({
                    id: m.id,
                    fullName: m.fullName,
                    email: m.email,
                    city: m.city,
                    age: m.age,
                    tags: m.tags,
                    status: m.status,
                    planName: m.membership?.planName ?? "",
                    paymentStatus: m.membership?.paymentStatus ?? "",
                    phone: m.profile?.phone ?? "",
                    preferredLanguage: m.profile?.preferredLanguage ?? "",
                })),
                // Add campaign data if provided
                ...(campaignData && {
                    campaign: {
                        name: campaignData.name,
                        subject: campaignData.subject,
                        preheader: campaignData.preheader,
                        title: campaignData.title,
                        message: campaignData.message,
                        ctaLabel: campaignData.ctaLabel,
                        ctaHref: campaignData.ctaHref,
                        images: campaignData.images?.filter(Boolean) || [],
                        mode: campaignData.mode || "send",
                        ...(campaignData.testEmails && {
                            testEmails: campaignData.testEmails
                                .split(/[\s,;]+/g)
                                .map((s: string) => s.trim())
                                .filter(Boolean)
                        })
                    }
                })
            };

            const res = await fetch(webhookUrl.trim(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                throw new Error(`L'appel d'automatisation a échoué (${res.status}). ${text ? "Réponse : " + text.slice(0, 180) : ""}`);
            }

            const message = campaignData
                ? `Campagne "${campaignData.name}" envoyée à ${selectedMembers.length} membre${selectedMembers.length !== 1 ? 's' : ''} ✅`
                : `${selectedMembers.length} membre${selectedMembers.length !== 1 ? 's' : ''} envoyé${selectedMembers.length !== 1 ? 's' : ''} à l'automatisation ✅`;

            return { ok: true, message };
        } catch (e: any) {
            throw new Error(`Erreur réseau : ${e?.message || String(e)}`);
        } finally {
            setIsSending(false);
        }
    };

    const webhookUrl = (import.meta as any).env?.VITE_MEMBERS_WEBHOOK_URL || "";
    // const _webhookUrlTest = (import.meta as any).env?.VITE_MEMBERS_WEBHOOK_URL_TEST || "";

    return (
        <div className="space-y-4 p-3 sm:p-4 lg:p-6">
            <MemberHeader
                members={members}
                filtered={filtered}
                selected={selected}
                isLoading={isLoading}
                onRefresh={refreshMembers}
                onCreate={handleOpenCreate}
            />

            <AutomationSection
                selected={selected}
                webhookUrl={webhookUrl}
                onSendToAutomation={handleSendToAutomation}
                onClearSelection={clearSelection}
            />

            <MemberFilters
                members={members}
                filtered={filtered}
                selectedFilteredCount={selectedFilteredCount}
                filters={filters}
                showFilters={showFilters}
                onFilterChange={handleFilterChange}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onSelectAllFiltered={() => selectAllFiltered(filtered)}
                onUnselectAllFiltered={() => unselectAllFiltered(filtered)}
            />

            <MemberTable
                members={members}
                filtered={filtered}
                isLoading={isLoading}
                selectedIds={selectedIds}
                selectedFilteredCount={selectedFilteredCount}
                onToggleOne={toggleOne}
                onSelectAllFiltered={() => selectAllFiltered(filtered)}
                onUnselectAllFiltered={() => unselectAllFiltered(filtered)}
                onOpenDetails={handleOpenDetails}
                onOpenEdit={handleOpenEdit}
                onDelete={handleDelete}
            />

            <MobileSelectionBar
                selectedCount={selected.length}
                isSending={isSending}
                onSendToAutomation={() => handleSendToAutomation(webhookUrl, selected)}
                onClearSelection={clearSelection}
            />

            {detailsOpen && detailsMember && (
                <MemberDetailsModal
                    member={detailsMember}
                    onClose={() => setDetailsOpen(false)}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                />
            )}

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-100 p-1">
                        <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="text-sm text-amber-900">
                        <span className="font-medium">Confidentialité :</span> n'envoyez que les données nécessaires à votre automatisation. Évitez les informations sensibles telles que la santé ou les données financières.
                    </div>
                </div>
            </div>

            <MemberFormModal
                open={modalOpen}
                mode={modalMode}
                initial={editing}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
            />
        </div>
    );
}