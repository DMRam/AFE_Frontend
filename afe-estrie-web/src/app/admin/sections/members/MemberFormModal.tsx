import React, { useEffect, useMemo, useState } from "react";
import type { Member, MemberInput, MemberStatus } from "../../../../services/membersRepo";

type Props = {
    open: boolean;
    mode: "create" | "edit";
    initial?: Member | null;
    onClose: () => void;
    onSubmit: (input: MemberInput) => Promise<void> | void;
};

function parseTags(v: string) {
    return v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

export function MemberFormModal({ open, mode, initial, onClose, onSubmit }: Props) {
    const title = mode === "create" ? "Create member" : "Edit member";

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");
    const [age, setAge] = useState<number>(0);
    const [status, setStatus] = useState<MemberStatus>("active");
    const [tagsText, setTagsText] = useState("");

    const canSubmit = useMemo(() => {
        if (!fullName.trim()) return false;
        if (!email.trim()) return false;
        if (!city.trim()) return false;
        if (!Number.isFinite(age) || age <= 0) return false;
        return true;
    }, [fullName, email, city, age]);

    useEffect(() => {
        if (!open) return;

        if (mode === "edit" && initial) {
            setFullName(initial.fullName ?? "");
            setEmail(initial.email ?? "");
            setCity(initial.city ?? "");
            setAge(initial.age ?? 0);
            setStatus(initial.status ?? "active");
            setTagsText((initial.tags ?? []).join(", "));
        } else {
            setFullName("");
            setEmail("");
            setCity("");
            setAge(0);
            setStatus("active");
            setTagsText("");
        }
    }, [open, mode, initial]);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSubmit) return;

        const input: MemberInput = {
            fullName: fullName.trim(),
            email: email.trim(),
            city: city.trim(),
            age,
            status,
            tags: parseTags(tagsText),
        };

        await onSubmit(input);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                    <h3 className="text-base font-semibold">{title}</h3>
                    <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm hover:bg-gray-100">
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Full name *</label>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Email *</label>
                            <input
                                type="email"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">City *</label>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Age *</label>
                            <input
                                type="number"
                                min={1}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                value={age || ""}
                                onChange={(e) => setAge(Number.parseInt(e.target.value || "0", 10))}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Status</label>
                            <select
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as MemberStatus)}
                            >
                                <option value="active">active</option>
                                <option value="inactive">inactive</option>
                            </select>
                        </div>

                        <div className="space-y-1 md:col-span-2">
                            <label className="text-sm font-medium text-gray-700">Tags (comma separated)</label>
                            <input
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                value={tagsText}
                                onChange={(e) => setTagsText(e.target.value)}
                                placeholder="newsletter, volunteer, support-group"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSubmit}
                            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
