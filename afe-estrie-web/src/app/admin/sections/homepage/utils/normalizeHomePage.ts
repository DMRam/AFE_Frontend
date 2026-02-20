import { clampNumber } from "./numbers";

export const normItems = (items: any[] | undefined) =>
    (items ?? []).map((it, idx) => ({
        ...it,
        id: it.id || `it${idx + 1}`,
        enabled: it.enabled !== false,
        order: clampNumber(it.order ?? idx + 1, 0, 999, idx + 1),
        title: it.title ?? "",
        description: it.description ?? "",
        href: it.href ?? "",
        meta: it.meta ?? "",
        date: String(it.date ?? ""),
        filePath: String(it.filePath ?? ""),
    }));

export const normLogos = (logos: any[] | undefined) =>
    (logos ?? []).map((l, idx) => ({
        ...l,
        id: l.id || `p${idx + 1}`,
        enabled: l.enabled !== false,
        order: clampNumber(l.order ?? idx + 1, 0, 999, idx + 1),
        alt: l.alt ?? "",
        href: l.href ?? "",
        src: l.src ?? "",
        storagePath: l.storagePath ?? "",
    }));

export const normNewsItems = (items: any[] | undefined) =>
    (items ?? []).map((it, idx) => ({
        ...it,
        id: it.id || `n${idx + 1}`,
        enabled: it.enabled !== false,
        order: clampNumber(it.order ?? idx + 1, 0, 999, idx + 1),
        title: it.title ?? "",
        excerpt: it.excerpt ?? "",
        href: it.href ?? "",
        date: it.date ?? "",
        readingTime: it.readingTime ?? "",
        coverSrc: it.coverSrc ?? "",
        coverAlt: it.coverAlt ?? "",
        pageDocId: it.pageDocId ?? "",
    }));

export const normFeaturesItems = (items: any[] | undefined) =>
    (items ?? []).map((it, idx) => ({
        ...it,
        id: it.id || `f${idx + 1}`,
        enabled: it.enabled !== false,
        order: clampNumber(it.order ?? idx + 1, 0, 999, idx + 1),
        icon: (it.icon ?? "brain") as any,
        title: it.title ?? "",
        description: it.description ?? "",
    }));

export const normContact = (c: any | undefined) => ({
    enabled: c?.enabled !== false,
    mapEmbedUrl: c?.mapEmbedUrl ?? "",
    orgName: c?.orgName ?? "",
    email: c?.email ?? "",
    address: c?.address ?? "",
    directionsUrl: c?.directionsUrl ?? "",
    hours: (c?.hours ?? []).map((h: any, idx: number) => ({
        label: h?.label ?? "",
        value: h?.value ?? "",
        id: h?.id || `h${idx + 1}`,
    })),
    phones: (c?.phones ?? []).map((p: any, idx: number) => ({
        label: p?.label ?? "",
        value: p?.value ?? "",
        id: p?.id || `ph${idx + 1}`,
    })),
});
