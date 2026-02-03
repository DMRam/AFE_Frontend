import { useEffect, useMemo, useState } from "react";
import {
    listMembers,
    createMember,
    updateMember,
    deleteMember,
    type Member,
    type MemberInput,
} from "../../../services/membersRepo";

import { MemberFormModal } from "./members/MemberFormModal";

function clampInt(v: string, fallback: number) {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
}

function uniq<T>(arr: T[]) {
    return Array.from(new Set(arr));
}

export function MembersManager() {
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal (Create/Edit)
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [editing, setEditing] = useState<Member | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [city, setCity] = useState<string>("tous");
    const [status, setStatus] = useState<"tous" | Member["status"]>("tous");
    const [minAge, setMinAge] = useState<number>(18);
    const [maxAge, setMaxAge] = useState<number>(99);
    const [tag, setTag] = useState<string>("tous");

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Automation
    const [webhookUrl, setWebhookUrl] = useState<string>(
        (import.meta as any).env?.VITE_MEMBERS_WEBHOOK_URL || ""
    );
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<null | { ok: boolean; message: string }>(null);

    async function refreshMembers() {
        setIsLoading(true);
        try {
            const rows = await listMembers();
            setMembers(rows);
        } catch (e: any) {
            console.error(e);
            setSendResult({ ok: false, message: `Échec du chargement des membres : ${e?.message || String(e)}` });
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        refreshMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---- CRUD actions ----
    function openCreate() {
        setModalMode("create");
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(m: Member) {
        setModalMode("edit");
        setEditing(m);
        setModalOpen(true);
    }

    async function handleSubmit(input: MemberInput) {
        try {
            if (modalMode === "create") {
                const created = await createMember(input);
                setMembers((prev) => [created, ...prev]);
                // optional: refresh to get serverTimestamp ordering
                await refreshMembers();
            } else if (modalMode === "edit" && editing) {
                await updateMember(editing.id, input);
                setMembers((prev) => prev.map((x) => (x.id === editing.id ? { ...x, ...input } : x)));
            }
        } catch (e: any) {
            console.error(e);
            alert(`Échec de l'enregistrement : ${e?.message || String(e)}`);
        }
    }

    async function handleDelete(m: Member) {
        const ok = window.confirm(`Supprimer ${m.fullName} ?`);
        if (!ok) return;

        try {
            await deleteMember(m.id);
            setMembers((prev) => prev.filter((x) => x.id !== m.id));
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(m.id);
                return next;
            });
        } catch (e: any) {
            console.error(e);
            alert(`Échec de la suppression : ${e?.message || String(e)}`);
        }
    }

    // ---- Filters helpers ----
    const cities = useMemo(() => ["tous", ...uniq(members.map((m) => m.city)).sort()], [members]);
    const tags = useMemo(() => ["tous", ...uniq(members.flatMap((m) => m.tags)).sort()], [members]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return members.filter((m) => {
            if (city !== "tous" && m.city !== city) return false;
            if (status !== "tous" && m.status !== status) return false;
            if (m.age < minAge || m.age > maxAge) return false;
            if (tag !== "tous" && !m.tags.includes(tag)) return false;

            if (!q) return true;
            const hay = `${m.fullName} ${m.email} ${m.city} ${m.tags.join(" ")}`.toLowerCase();
            return hay.includes(q);
        });
    }, [members, search, city, status, minAge, maxAge, tag]);

    // ---- Selection helpers ----
    const selected = useMemo(() => members.filter((m) => selectedIds.has(m.id)), [members, selectedIds]);

    const selectedFilteredCount = useMemo(() => {
        let count = 0;
        for (const m of filtered) if (selectedIds.has(m.id)) count++;
        return count;
    }, [filtered, selectedIds]);

    function toggleOne(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function clearSelection() {
        setSelectedIds(new Set());
    }

    function selectAllFiltered() {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const m of filtered) next.add(m.id);
            return next;
        });
    }

    function unselectAllFiltered() {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            for (const m of filtered) next.delete(m.id);
            return next;
        });
    }

    // ---- Preview summary for n8n ----
    const sendPreview = useMemo(() => {
        // show only first 12 to avoid huge UI
        const top = selected.slice(0, 12).map((m) => ({
            fullName: m.fullName,
            email: m.email,
        }));
        return {
            count: selected.length,
            top,
            hasMore: selected.length > top.length,
        };
    }, [selected]);

    async function sendToAutomation() {
        setSendResult(null);

        if (!webhookUrl.trim()) {
            setSendResult({
                ok: false,
                message: "URL du webhook est vide. Ajoutez VITE_MEMBERS_WEBHOOK_URL ou collez-la ci-dessus.",
            });
            return;
        }

        if (selected.length === 0) {
            setSendResult({ ok: false, message: "Aucun membre sélectionné. Sélectionnez au moins un membre." });
            return;
        }

        const payload = {
            source: "AFE Admin Gestionnaire des Membres",
            sentAt: new Date().toISOString(),
            filters: { search, city, status, minAge, maxAge, tag },
            summary: {
                count: selected.length,
                sample: sendPreview.top, // small sample so n8n logs aren't huge
            },
            members: selected.map((m) => ({
                id: m.id,
                fullName: m.fullName,
                email: m.email,
                city: m.city,
                age: m.age,
                tags: m.tags,
                status: m.status,
            })),
        };

        setIsSending(true);
        try {
            const res = await fetch(webhookUrl.trim(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                setSendResult({
                    ok: false,
                    message: `L'appel d'automatisation a échoué (${res.status}). ${text ? "Réponse : " + text.slice(0, 180) : ""}`,
                });
                return;
            }

            setSendResult({ ok: true, message: `${payload.members.length} membre(s) envoyé(s) à l'automatisation ✅` });
        } catch (e: any) {
            setSendResult({ ok: false, message: `Erreur réseau : ${e?.message || String(e)}` });
        } finally {
            setIsSending(false);
        }
    }

    return (
        <div className="space-y-6 p-3 sm:p-4 lg:p-6">
            {/* Header */}
            <header className="flex flex-col gap-2">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold sm:text-2xl">Gestionnaire des Membres</h2>
                        <p className="text-sm text-gray-600">Filtrez les membres et envoyez la liste sélectionnée à votre flux de travail d'automatisation (n8n).</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={openCreate}
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                        >
                            + Nouveau membre
                        </button>
                        <button
                            onClick={refreshMembers}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                            Actualiser
                        </button>
                    </div>
                </div>
            </header>

            {/* Automation */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                {/* <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">URL du Webhook d'Automatisation</label>
                    <input
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://automation.ulogicit.com/webhook/..."
                    />
                    <p className="text-xs text-gray-500">
                        Astuce : placez-la dans <code>.env</code> comme <code>VITE_MEMBERS_WEBHOOK_URL</code>.
                    </p>
                </div> */}

                {/* Preview summary */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-gray-700">
                            <b>Aperçu :</b> {sendPreview.count} sélectionné(s)
                            {sendPreview.count > 0 ? " → sera envoyé à n8n" : ""}
                        </div>
                        <div className="text-gray-600">
                            Sélectionnés (filtrés) : <b>{selectedFilteredCount}</b>
                        </div>
                    </div>

                    {sendPreview.count === 0 ? (
                        <div className="mt-2 text-gray-500">Sélectionnez des membres dans le tableau pour voir un aperçu.</div>
                    ) : (
                        <ul className="mt-2 space-y-1">
                            {sendPreview.top.map((x) => (
                                <li key={x.email} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="font-medium text-gray-800">{x.fullName}</span>
                                    <span className="text-gray-600 break-all sm:break-normal">{x.email}</span>
                                </li>
                            ))}
                            {sendPreview.hasMore && (
                                <li className="text-gray-500">…et {sendPreview.count - sendPreview.top.length} de plus</li>
                            )}
                        </ul>
                    )}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                        onClick={sendToAutomation}
                        disabled={isSending}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
                    >
                        {isSending ? "Envoi en cours..." : `Envoyer sélection (${selected.length})`}
                    </button>

                    <button
                        onClick={clearSelection}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                        Effacer la sélection
                    </button>

                    {sendResult && (
                        <span className={`text-sm ${sendResult.ok ? "text-green-700" : "text-red-700"}`}>
                            {sendResult.message}
                        </span>
                    )}
                </div>
            </section>

            {/* Filters */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Recherche</label>
                        <input
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="nom, email, étiquette..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Ville</label>
                        <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        >
                            {cities.map((c) => (
                                <option key={c} value={c}>
                                    {c === "tous" ? "Toutes les villes" : c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Statut</label>
                        <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                        >
                            <option value="tous">Tous</option>
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Étiquette</label>
                        <select
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                        >
                            {tags.map((t) => (
                                <option key={t} value={t}>
                                    {t === "tous" ? "Toutes les étiquettes" : t}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Âge minimum</label>
                        <input
                            type="number"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            value={minAge}
                            onChange={(e) => setMinAge(clampInt(e.target.value, 18))}
                            min={0}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Âge maximum</label>
                        <input
                            type="number"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            value={maxAge}
                            onChange={(e) => setMaxAge(clampInt(e.target.value, 99))}
                            min={0}
                        />
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1 xl:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Sélection des filtres</label>
                        <div className="flex gap-2">
                            <button
                                onClick={selectAllFiltered}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                            >
                                Tout sélectionner (filtrés)
                            </button>
                            <button
                                onClick={unselectAllFiltered}
                                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                            >
                                Tout désélectionner (filtrés)
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-600">
                        Filtrés : <b>{filtered.length}</b> • Sélection totale : <b>{selected.length}</b>
                    </div>
                </div>
            </section>

            {/* Table */}
            <section className="rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
                {isLoading ? (
                    <div className="text-sm text-gray-600">Chargement des membres...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-sm text-gray-600">Aucun membre ne correspond aux filtres.</div>
                ) : (
                    <div className="overflow-x-auto -mx-2 sm:-mx-0">
                        <table className="w-full min-w-[800px] text-left text-sm">
                            <thead className="border-b border-gray-200 text-gray-700">
                                <tr>
                                    <th className="py-2 pr-3">
                                        <span className="sr-only">Sélectionner</span>
                                    </th>
                                    <th className="py-2 pr-3">Nom</th>
                                    <th className="py-2 pr-3">Courriel</th>
                                    <th className="py-2 pr-3">Ville</th>
                                    <th className="py-2 pr-3">Âge</th>
                                    <th className="py-2 pr-3">Statut</th>
                                    <th className="py-2 pr-3">Étiquettes</th>
                                    <th className="py-2 pr-3">Créé le</th>
                                    <th className="py-2 pr-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((m) => {
                                    const checked = selectedIds.has(m.id);
                                    return (
                                        <tr key={m.id} className="border-b border-gray-100">
                                            <td className="py-2 pr-3">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleOne(m.id)}
                                                    className="h-4 w-4"
                                                />
                                            </td>
                                            <td className="py-2 pr-3 font-medium">{m.fullName}</td>
                                            <td className="py-2 pr-3 text-gray-700 break-all">{m.email}</td>
                                            <td className="py-2 pr-3">{m.city}</td>
                                            <td className="py-2 pr-3">{m.age}</td>
                                            <td className="py-2 pr-3">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs ${m.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                                                        }`}
                                                >
                                                    {m.status === "active" ? "Actif" : "Inactif"}
                                                </span>
                                            </td>
                                            <td className="py-2 pr-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {m.tags.length ? (
                                                        m.tags.map((t) => (
                                                            <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                                                                {t}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-2 pr-3 text-gray-600">{m.createdAt}</td>
                                            <td className="py-2 pr-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => openEdit(m)}
                                                        className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium hover:bg-gray-50"
                                                    >
                                                        Modifier
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(m)}
                                                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Safety note */}
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <b>Note de confidentialité :</b> gardez le contenu minimal (courriel + champs de segmentation). Évitez d'envoyer des données de santé sensibles.
            </section>

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