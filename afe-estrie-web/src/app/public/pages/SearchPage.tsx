import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search } from "lucide-react";
import { listPublicPages } from "../../../services/pageRepo";

type PageHit = {
    slug: string;   // e.g. "a-propos" -> link becomes /p/a-propos
    title: string;
    excerpt?: string;
};

function normalize(t: string) {
    return (t ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .trim();
}

export function SearchPage() {
    const [sp, setSp] = useSearchParams();
    const q = sp.get("q") ?? "";
    const [input, setInput] = useState(q);
    const [pages, setPages] = useState<PageHit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setInput(q);
    }, [q]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const data = await listPublicPages();
                setPages(data ?? []);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const results = useMemo(() => {
        const nq = normalize(q);
        if (!nq) return [];
        return pages
            .map((p) => {
                const hay = normalize(`${p.title} ${p.excerpt ?? ""}`);
                const score =
                    (normalize(p.title).includes(nq) ? 3 : 0) +
                    (hay.includes(nq) ? 1 : 0);
                return { ...p, score };
            })
            .filter((x: any) => x.score > 0)
            .sort((a: any, b: any) => b.score - a.score)
            .slice(0, 20);
    }, [pages, q]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const next = input.trim();
        setSp(next ? { q: next } : {});
    };

    return (
        <div className="mx-auto max-w-4xl px-6 py-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                Recherche
            </h1>
            <p className="mt-2 text-sm text-gray-600">
                Recherchez dans les pages et ressources du site.
            </p>

            <form onSubmit={onSubmit} className="mt-6 flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ex: axes d’intervention, activités, membres…"
                        className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-9 pr-3 text-sm outline-none focus:border-gray-400"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
                >
                    Rechercher
                </button>
            </form>

            <div className="mt-8">
                {loading ? (
                    <div className="text-sm text-gray-600">Chargement…</div>
                ) : q.trim() === "" ? (
                    <div className="text-sm text-gray-600">Tapez un mot-clé pour commencer.</div>
                ) : results.length === 0 ? (
                    <div className="text-sm text-gray-600">
                        Aucun résultat pour <span className="font-semibold">“{q}”</span>.
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-xs text-gray-500">
                            {results.length} résultat(s) pour <span className="font-semibold">“{q}”</span>
                        </div>

                        {results.map((r: any) => (
                            <Link
                                key={r.slug}
                                to={`/p/${r.slug}`}
                                className="block rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300"
                            >
                                <div className="text-lg font-bold text-gray-900">{r.title}</div>
                                {r.excerpt ? (
                                    <div className="mt-2 text-sm text-gray-600 line-clamp-3">
                                        {r.excerpt}
                                    </div>
                                ) : null}
                                <div className="mt-3 text-xs text-gray-500">{`/p/${r.slug}`}</div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
