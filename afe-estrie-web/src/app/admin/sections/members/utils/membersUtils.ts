export function clampInt(v: string, fallback: number) {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
}

export function uniq<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
}

export function parseTags(tagsText: string): string[] {
    return tagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

export function formatTags(tags: string[]): string {
    return tags.join(", ");
}

export function normalizeAge(age: any): number | null {
    if (age === null || age === undefined) return null;
    const n = Number(age);
    if (!Number.isFinite(n)) return null;
    if (n <= 0) return null;
    return Math.floor(n);
}

export interface SendPreview {
    count: number;
    top: Array<{ fullName: string; email: string }>;
    hasMore: boolean;
}

export function getSendPreview(selected: any[], maxPreview = 12): SendPreview {
    const top = selected.slice(0, maxPreview).map((m) => ({
        fullName: m.fullName,
        email: m.email,
    }));
    return {
        count: selected.length,
        top,
        hasMore: selected.length > top.length,
    };
}