import { useEffect, useMemo, useState } from "react";
import type { FooterCMS } from "../../../content/types/footer";
import { getFooter, patchFooter, seedFooterIfMissing } from "../../../services/footerRepo";
import { ImagePicker } from "../ui/ImagePicker";

function uid(prefix = "it") {
    const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${id}`;
}

function stableStringify(v: any) {
    return JSON.stringify(v ?? null);
}

export function FooterManager() {
    const [loading, setLoading] = useState(true);
    const [footer, setFooter] = useState<FooterCMS | null>(null);

    // snapshot to compute "dirty"
    const [initial, setInitial] = useState<FooterCMS | null>(null);

    // single-flight saving
    const [savingKey, setSavingKey] = useState<string | null>(null); // "all" | "contact" | "links" | ...
    const [savedToast, setSavedToast] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            await seedFooterIfMissing();
            const f = await getFooter();
            setFooter(f);
            setInitial(f);
            setLoading(false);
        })();
    }, []);

    const set = (patch: Partial<FooterCMS>) =>
        setFooter((p) => ({ ...(p as FooterCMS), ...patch }));

    function flashSaved(label: string) {
        setSavedToast(label);
        window.setTimeout(() => setSavedToast(null), 1200);
    }

    function isSectionDirty(section: keyof FooterCMS) {
        if (!footer || !initial) return false;
        return stableStringify((footer as any)[section]) !== stableStringify((initial as any)[section]);
    }

    const dirtyAll = useMemo(() => {
        if (!footer || !initial) return false;
        return stableStringify(footer) !== stableStringify(initial);
    }, [footer, initial]);

    async function saveAll() {
        if (!footer) return;
        setSavingKey("all");
        try {
            await patchFooter(footer);
            setInitial(footer);
            flashSaved("Tout est sauvegardé");
        } finally {
            setSavingKey(null);
        }
    }

    async function saveSection<K extends keyof FooterCMS>(key: K) {
        if (!footer) return;
        setSavingKey(String(key));

        try {
            // patch only that section (requires patchFooter to MERGE)
            const patch = { [key]: (footer as any)[key] } as Partial<FooterCMS>;
            await patchFooter(patch);

            // update snapshot only for that section
            setInitial((prev) => {
                const base = prev ?? ({} as FooterCMS);
                return { ...base, [key]: (footer as any)[key] } as FooterCMS;
            });

            flashSaved(`${String(key)} sauvegardé`);
        } finally {
            setSavingKey(null);
        }
    }

    if (loading) return <div className="p-6">Loading…</div>;
    if (!footer) return <div className="p-6">No footer doc found.</div>;

    const SaveSectionButton = ({ section }: { section: keyof FooterCMS }) => {
        const dirty = isSectionDirty(section);
        const busy = savingKey === String(section);
        return (
            <button
                onClick={() => saveSection(section)}
                disabled={!dirty || savingKey !== null}
                className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50"
            >
                {busy ? "Saving…" : dirty ? "Save" : "Saved"}
            </button>
        );
    };

    return (
        <div className="space-y-8">
            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
                <div className="p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <div className="text-xl font-semibold">Footer (CRUD)</div>
                        <div className="flex items-center gap-3">
                            {savedToast ? (
                                <span className="text-sm text-emerald-600">{savedToast} ✓</span>
                            ) : dirtyAll ? (
                                <span className="text-sm text-amber-600">Modifications non sauvegardées</span>
                            ) : (
                                <span className="text-sm text-gray-500">À jour</span>
                            )}
                            {savingKey ? (
                                <span className="text-xs text-gray-400">• sauvegarde en cours…</span>
                            ) : null}
                        </div>
                    </div>

                    <button
                        onClick={saveAll}
                        disabled={!dirtyAll || savingKey !== null}
                        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                    >
                        {savingKey === "all" ? "Saving…" : "Save all"}
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* BRAND */}
                <section className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Brand</h2>
                        <SaveSectionButton section="brand" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <ImagePicker
                            label="Logo"
                            value={footer.brand?.logoSrc ?? ""}
                            onChange={(url) =>
                                set({
                                    brand: {
                                        ...(footer.brand ?? {}),
                                        logoSrc: url,
                                    },
                                })
                            }
                            folder="site/brand"
                            maxList={5}
                        />

                        <label className="text-sm">
                            Alt text
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                value={footer.brand?.alt ?? ""}
                                onChange={(e) =>
                                    set({
                                        brand: {
                                            ...(footer.brand ?? {}),
                                            alt: e.target.value,
                                        },
                                    })
                                }
                                placeholder="AFE – Association de la fibromyalgie de l’Estrie"
                            />
                        </label>
                    </div>
                </section>


                {/* CONTACT */}
                <section className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Contact</h2>
                        <SaveSectionButton section="contact" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-sm">
                            Title
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                value={footer.contact?.title ?? ""}
                                onChange={(e) =>
                                    set({ contact: { ...(footer.contact ?? {}), title: e.target.value } })
                                }
                            />
                        </label>

                        <label className="text-sm">
                            Email
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                value={footer.contact?.email ?? ""}
                                onChange={(e) =>
                                    set({ contact: { ...(footer.contact ?? {}), email: e.target.value } })
                                }
                            />
                        </label>
                    </div>

                    <ArrayEditor
                        title="Phones"
                        items={footer.contact?.phones ?? []}
                        onChange={(phones) => set({ contact: { ...(footer.contact ?? {}), phones } })}
                        placeholder="+1 819 000-0000"
                    />

                    <ArrayEditor
                        title="Address lines"
                        items={footer.contact?.addressLines ?? []}
                        onChange={(addressLines) =>
                            set({ contact: { ...(footer.contact ?? {}), addressLines } })
                        }
                        placeholder="1013, rue Galt Ouest Sherbrooke (Qc) J1H 1Z9"
                    />
                </section>

                {/* LINKS */}
                <ListCrud
                    title="Links"
                    items={footer.links?.items ?? []}
                    onChange={(items) =>
                        set({ links: { ...(footer.links ?? { title: "Liens", items: [] }), items } })
                    }
                    createItem={() => ({
                        id: uid("link"),
                        label: "New link",
                        href: "/",
                        enabled: true,
                        order: (footer.links?.items?.length ?? 0) + 1,
                    })}
                    fields={["label", "href"]}
                    right={<SaveSectionButton section="links" />}
                />

                {/* NEWS */}
                <ListCrud
                    title="News"
                    items={footer.news?.items ?? []}
                    onChange={(items) =>
                        set({ news: { ...(footer.news ?? { title: "Nos Actualités", items: [] }), items } })
                    }
                    createItem={() => ({
                        id: uid("news"),
                        title: "New post",
                        href: "/",
                        date: "",
                        enabled: true,
                        order: (footer.news?.items?.length ?? 0) + 1,
                    })}
                    fields={["date", "title", "href"]}
                    right={<SaveSectionButton section="news" />}
                />

                {/* PARTNER */}
                <ListCrud
                    title="Partner"
                    items={footer.partner?.items ?? []}
                    onChange={(items) =>
                        set({
                            partner: {
                                ...(footer.partner ?? { title: "Partenaire Financier", items: [] }),
                                items,
                            },
                        })
                    }
                    createItem={() => ({
                        id: uid("partner"),
                        name: "Partner",
                        imageSrc: "",
                        href: "",
                        enabled: true,
                        order: (footer.partner?.items?.length ?? 0) + 1,
                    })}
                    fields={["name", "imageSrc", "href"]}
                    right={<SaveSectionButton section="partner" />}
                    renderField={({ item, field, set }) => {
                        if (field !== "imageSrc") return null;

                        return (
                            <div className="md:col-span-2">
                                <ImagePicker
                                    label="imageSrc (URL or upload)"
                                    value={(item as any).imageSrc ?? ""}
                                    onChange={(url) => set({ imageSrc: url } as any)}
                                    folder="site/footer/partners"
                                    maxList={24}
                                />
                            </div>
                        );
                    }}
                />

                {/* BOTTOM */}
                <section className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Bottom</h2>
                        <SaveSectionButton section="bottom" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-sm">
                            Policy label
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                value={footer.bottom?.policyLabel ?? ""}
                                onChange={(e) =>
                                    set({ bottom: { ...(footer.bottom ?? {}), policyLabel: e.target.value } })
                                }
                            />
                        </label>

                        <label className="text-sm">
                            Policy href
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                value={footer.bottom?.policyHref ?? ""}
                                onChange={(e) =>
                                    set({ bottom: { ...(footer.bottom ?? {}), policyHref: e.target.value } })
                                }
                            />
                        </label>

                        <label className="text-sm">
                            Cookies label
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                value={footer.bottom?.cookiesLabel ?? ""}
                                onChange={(e) =>
                                    set({ bottom: { ...(footer.bottom ?? {}), cookiesLabel: e.target.value } })
                                }
                            />
                        </label>

                        <label className="text-sm">
                            Cookies href
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                value={footer.bottom?.cookiesHref ?? ""}
                                onChange={(e) =>
                                    set({ bottom: { ...(footer.bottom ?? {}), cookiesHref: e.target.value } })
                                }
                            />
                        </label>
                    </div>

                    <label className="text-sm block">
                        Credit text
                        <input
                            className="mt-1 w-full rounded-lg border px-3 py-2"
                            value={footer.bottom?.creditText ?? ""}
                            onChange={(e) =>
                                set({ bottom: { ...(footer.bottom ?? {}), creditText: e.target.value } })
                            }
                        />
                    </label>
                </section>

                {/* SOCIAL */}
                <section className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Social</h2>
                        <SaveSectionButton section="social" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="text-sm">
                            Facebook URL
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                value={footer.social?.facebook ?? ""}
                                onChange={(e) =>
                                    set({ social: { ...(footer.social ?? {}), facebook: e.target.value } })
                                }
                            />
                        </label>
                        <label className="text-sm">
                            LinkedIn URL
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2"
                                value={footer.social?.linkedin ?? ""}
                                onChange={(e) =>
                                    set({ social: { ...(footer.social ?? {}), linkedin: e.target.value } })
                                }
                            />
                        </label>
                    </div>
                </section>

                {/* FLOATING SOCIAL (for the floating buttons) */}
                <section className="rounded-xl border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Floating Social</h2>
                        {/* if you add socialFloating to FooterCMS type, use SaveSectionButton section="socialFloating" */}
                        <button
                            onClick={() => saveSection("socialFloating" as any)}
                            disabled={!isSectionDirty("socialFloating" as any) || savingKey !== null}
                            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                            {savingKey === "socialFloating" ? "Saving…" : isSectionDirty("socialFloating" as any) ? "Save" : "Saved"}
                        </button>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={(footer as any).socialFloating?.enabled !== false}
                            onChange={(e) =>
                                set({
                                    socialFloating: {
                                        ...((footer as any).socialFloating ?? {}),
                                        enabled: e.target.checked,
                                        items: ((footer as any).socialFloating?.items ?? []).length
                                            ? (footer as any).socialFloating.items
                                            : [
                                                { id: "facebook", label: "Facebook", href: "", enabled: true, order: 1 },
                                                { id: "linkedin", label: "LinkedIn", href: "", enabled: true, order: 2 },
                                                { id: "instagram", label: "Instagram", href: "", enabled: true, order: 3 },
                                                { id: "youtube", label: "YouTube", href: "", enabled: true, order: 4 },
                                            ],
                                    },
                                } as any)
                            }
                        />
                        Enabled (show floating social buttons)
                    </label>

                    <ListCrud
                        title="Networks"
                        items={(footer as any).socialFloating?.items ?? []}
                        onChange={(items) =>
                            set({
                                socialFloating: {
                                    ...((footer as any).socialFloating ?? { enabled: true }),
                                    items,
                                },
                            } as any)
                        }
                        createItem={() => ({
                            id: uid("social"),
                            label: "New social",
                            href: "",
                            enabled: true,
                            order: (((footer as any).socialFloating?.items?.length ?? 0) + 1),
                        })}
                        // IMPORTANT: keep id/label/href editable; enabled & order are already handled by ListCrud UI
                        fields={["id", "label", "href"]}
                    />
                </section>

            </div>
        </div>
    );
}

function ArrayEditor(props: {
    title: string;
    items: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
}) {
    const { title, items, onChange, placeholder } = props;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{title}</div>
                <button
                    type="button"
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                    onClick={() => onChange([...(items ?? []), ""])}
                >
                    + Add
                </button>
            </div>

            <div className="space-y-2">
                {items.map((v, idx) => (
                    <div key={idx} className="flex gap-2">
                        <input
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                            value={v}
                            placeholder={placeholder}
                            onChange={(e) => {
                                const next = [...items];
                                next[idx] = e.target.value;
                                onChange(next);
                            }}
                        />
                        <button
                            type="button"
                            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                            onClick={() => onChange(items.filter((_, i) => i !== idx))}
                            title="Remove"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ListCrud<T extends { id: string; enabled?: boolean; order?: number }>(props: {
    title: string;
    items: T[];
    onChange: (next: T[]) => void;
    createItem: () => T;
    fields: string[];
    right?: React.ReactNode;
    renderField?: (args: {
        item: T;
        field: string;
        set: (patch: Partial<T>) => void;
    }) => React.ReactNode | null;
}) {
    const { title, items, onChange, createItem, fields, right, renderField } = props;

    const sorted = [...items].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    function update(id: string, patch: Partial<T>) {
        onChange(items.map((x) => (x.id === id ? ({ ...x, ...patch } as T) : x)));
    }

    function move(id: string, dir: -1 | 1) {
        const arr = [...sorted];
        const i = arr.findIndex((x) => x.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= arr.length) return;

        const a = arr[i];
        const b = arr[j];
        const ao = a.order ?? i + 1;
        const bo = b.order ?? j + 1;

        update(a.id, { order: bo } as Partial<T>);
        update(b.id, { order: ao } as Partial<T>);
    }

    return (
        <section className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">{title}</h2>
                <div className="flex items-center gap-2">
                    {right}
                    <button
                        type="button"
                        className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                        onClick={() => onChange([...(items ?? []), createItem()])}
                    >
                        + Add
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {sorted.map((x, idx) => (
                    <div key={x.id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm text-gray-600">#{idx + 1}</div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
                                    onClick={() => move(x.id, -1)}
                                >
                                    ↑
                                </button>
                                <button
                                    type="button"
                                    className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
                                    onClick={() => move(x.id, 1)}
                                >
                                    ↓
                                </button>

                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={x.enabled !== false}
                                        onChange={(e) => update(x.id, { enabled: e.target.checked } as Partial<T>)}
                                    />
                                    enabled
                                </label>

                                <button
                                    type="button"
                                    className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
                                    onClick={() => onChange(items.filter((it) => it.id !== x.id))}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                            {fields.map((f) => {
                                const custom = renderField?.({
                                    item: x,
                                    field: f,
                                    set: (patch) => update(x.id, patch),
                                });
                                if (custom) return <div key={f}>{custom}</div>;

                                return (
                                    <label key={f} className="text-xs text-gray-600">
                                        {f}
                                        <input
                                            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm text-black"
                                            value={(x as any)[f] ?? ""}
                                            onChange={(e) => update(x.id, { [f]: e.target.value } as any)}
                                        />
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
