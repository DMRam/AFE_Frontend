import { useEffect, useMemo, useState } from "react";
import {
    Mail,
    MapPin,
    Phone,
    Search,
    ExternalLink,
} from "lucide-react";
import type { FooterCMS } from "../../../../content/types/footer";
import { getFooter } from "../../../../services/footerRepo";

const FALLBACK_ADMIN_URL = "https://afe-sherdev.web.app/admin/login";
const SEARCH_PATH = "/recherche"; // <-- cambia a "/search" o la ruta real si quieres

function s(v: any) {
    return String(v ?? "").trim();
}

export function SiteFooter() {
    const [footer, setFooter] = useState<FooterCMS | null>(null);
    const [q, setQ] = useState("");

    useEffect(() => {
        (async () => setFooter(await getFooter()))();
    }, []);

    const links = useMemo(
        () =>
            [...(footer?.links?.items ?? [])]
                .filter((x) => x.enabled !== false)
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
        [footer]
    );

    const news = useMemo(
        () =>
            [...(footer?.news?.items ?? [])]
                .filter((x) => x.enabled !== false)
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
        [footer]
    );

    const partners = useMemo(
        () =>
            [...(footer?.partner?.items ?? [])]
                .filter((x) => x.enabled !== false)
                .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
        [footer]
    );

    // ✅ Financial partner logic:
    // - if any partner has isFinancial=true -> that one is featured
    // - else: first one is featured
    const financialPartner = useMemo(() => {
        const byFlag = partners.find((p: any) => p?.isFinancial === true);
        return byFlag ?? partners[0] ?? null;
    }, [partners]);

    const collaborators = useMemo(() => {
        if (!financialPartner) return partners;
        return partners.filter((p) => p.id !== (financialPartner as any).id);
    }, [partners, financialPartner]);

    const adminHref =
        (footer as any)?.admin?.loginHref ||
        (footer as any)?.bottom?.adminHref ||
        FALLBACK_ADMIN_URL;

    const adminLabel =
        (footer as any)?.admin?.label ||
        (footer as any)?.bottom?.adminLabel ||
        "Administration";

    const hasBrand = !!footer?.brand?.logoSrc;

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const query = s(q);
        if (!query) return;
        window.location.href = `${SEARCH_PATH}?q=${encodeURIComponent(query)}`;
    };

    return (
        <footer className="bg-black text-white">
            <div className="mx-auto max-w-7xl px-6 py-12">
                {/* Top section */}
                <div className="border-b border-white/10 pb-8">
                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Logo + tagline */}
                        <div className="md:col-span-4">
                            <div className="space-y-4">
                                {hasBrand ? (
                                    <img
                                        src={footer!.brand!.logoSrc}
                                        alt={footer?.brand?.alt ?? "AFE"}
                                        className="h-20 w-auto"
                                    />
                                ) : (
                                    <div className="h-10 w-32 rounded bg-white/10" />
                                )}

                                {(footer as any)?.brand?.tagline ? (
                                    <p className="max-w-xs text-sm text-white/70">
                                        {(footer as any).brand.tagline}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="md:col-span-4">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    {footer?.contact?.title ?? "Nous contacter"}
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {footer?.contact?.phones?.map((phone, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-white/80">
                                        <Phone className="h-4 w-4 text-[#af2511]" />
                                        <a
                                            href={`tel:${phone.replace(/\s/g, "")}`}
                                            className="transition-colors hover:text-[#af2511] hover:text-white"
                                        >
                                            {phone}
                                        </a>
                                    </div>
                                ))}

                                {footer?.contact?.email ? (
                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                        <Mail className="h-4 w-4 text-[#af2511]" />
                                        <a
                                            href={`mailto:${footer.contact.email}`}
                                            className="transition-colors hover:text-[#af2511] hover:text-white"
                                        >
                                            {footer.contact.email}
                                        </a>
                                    </div>
                                ) : null}

                                {footer?.contact?.addressLines?.length ? (
                                    <div className="flex items-start gap-3 text-sm text-white/80">
                                        <MapPin className="mt-0.5 h-4 w-4 text-[#af2511]" />
                                        <div className="space-y-1">
                                            {footer.contact.addressLines.map((line, i) => (
                                                <div key={i}>{line}</div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* ✅ Search instead of "Nous suivre" */}
                        <div className="md:col-span-4">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    {(footer as any)?.search?.title ?? "Rechercher"}
                                </h3>
                            </div>

                            <form onSubmit={onSearchSubmit} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                                    <input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder={(footer as any)?.search?.placeholder ?? "Trouver une page, un sujet, une ressource…"}
                                        className="w-full rounded-lg border border-white/15 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#af2511]/40"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:opacity-95"
                                >
                                    {(footer as any)?.search?.buttonLabel ?? "OK"}
                                </button>
                            </form>

                            <p className="mt-3 text-xs text-white/50">
                                {(footer as any)?.search?.hint ?? "Accès direct aux contenus du site."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main content grid */}
                <div className="py-8">
                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Links */}
                        <div className="md:col-span-3">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    {footer?.links?.title ?? "Liens"}
                                </h3>
                            </div>

                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.id} className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#af2511]" />
                                        <a
                                            href={link.href}
                                            className="text-sm text-white/70 transition-colors hover:text-[#af2511] hover:text-white"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                                {links.length === 0 && (
                                    <li className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#af2511]/30" />
                                        <span className="text-sm text-white/50">Aucun lien</span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* News */}
                        <div className="md:col-span-3">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    {footer?.news?.title ?? "Nos Actualités"}
                                </h3>
                            </div>

                            <div className="space-y-4">
                                {news.slice(0, 2).map((item) => (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        className="group block border-l border-[#af2511]/30 pl-2 transition-colors hover:border-[#af2511]"
                                    >
                                        <div className="mb-1 text-xs text-white/60">{item.date}</div>
                                        <div className="text-sm text-white/80 transition-colors group-hover:text-[#af2511] group-hover:text-white">
                                            {item.title}
                                        </div>
                                    </a>
                                ))}
                                {news.length === 0 && (
                                    <div className="flex items-center gap-3 border-l border-[#af2511]/30 pl-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#af2511]/30" />
                                        <div className="text-sm text-white/50">Aucune actualité</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Partners: Financial featured + Collaborators small */}
                        <div className="md:col-span-3">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    {(footer as any)?.partner?.financialTitle ?? "Partenaire financier"}
                                </h3>
                            </div>

                            {/* Featured financial partner */}
                            {financialPartner ? (
                                <a
                                    href={(financialPartner as any).href || "#"}
                                    target={(financialPartner as any).href ? "_blank" : undefined}
                                    rel={(financialPartner as any).href ? "noopener noreferrer" : undefined}
                                    className="block rounded-2xl bg-white p-4 shadow-sm transition hover:opacity-95"
                                >
                                    {(financialPartner as any).imageSrc ? (
                                        <img
                                            src={(financialPartner as any).imageSrc}
                                            alt={(financialPartner as any).name}
                                            className="h-28 w-full object-contain"
                                        />
                                    ) : (
                                        <div className="py-10 text-center text-sm text-black/70">
                                            {(financialPartner as any).name}
                                        </div>
                                    )}
                                </a>
                            ) : (
                                <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/50">
                                    Aucun partenaire financier
                                </div>
                            )}

                            {/* Collaborators */}
                            <div className="mt-6">
                                <div className="mb-3 text-xs font-semibold text-white/70">
                                    {(footer as any)?.partner?.collaboratorsTitle ?? "Collaborateurs"}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {collaborators.slice(0, 4).map((p: any) => (
                                        <a
                                            key={p.id}
                                            href={p.href || "#"}
                                            target={p.href ? "_blank" : undefined}
                                            rel={p.href ? "noopener noreferrer" : undefined}
                                            className="flex aspect-square items-center justify-center rounded-lg border border-transparent bg-white p-2 transition hover:border-[#af2511]/30 hover:opacity-95"
                                        >
                                            {p.imageSrc ? (
                                                <img
                                                    src={p.imageSrc}
                                                    alt={p.name}
                                                    className="max-h-full max-w-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-center text-xs text-black/60">{p.name}</span>
                                            )}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ✅ Administration */}
                        <div className="md:col-span-3">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">Administration</h3>
                            </div>

                            <a
                                href={adminHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-[#af2511]/30 hover:bg-[#af2511]/10 hover:text-[#af2511]"
                            >
                                {adminLabel}
                                <ExternalLink className="h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="text-sm text-white/60">
                            © {new Date().getFullYear()} {footer?.brand?.name || "AFE"}. Tous droits réservés.
                        </div>

                        <div className="flex items-center gap-4 text-sm text-white/60">
                            {footer?.bottom?.policyHref && (
                                <a
                                    href={footer.bottom.policyHref}
                                    className="flex items-center gap-2 transition-colors hover:text-[#af2511] hover:text-white"
                                >
                                    <div className="h-1 w-1 rounded-full bg-[#af2511]" />
                                    {footer.bottom.policyLabel ?? "Politique de confidentialité"}
                                </a>
                            )}
                            {footer?.bottom?.cookiesHref && (
                                <a
                                    href={footer.bottom.cookiesHref}
                                    className="flex items-center gap-2 transition-colors hover:text-[#af2511] hover:text-white"
                                >
                                    <div className="h-1 w-1 rounded-full bg-[#af2511]" />
                                    {footer.bottom.cookiesLabel ?? "Politique de cookies"}
                                </a>
                            )}
                            {footer?.bottom?.termsHref && (
                                <a
                                    href={footer.bottom.termsHref}
                                    className="flex items-center gap-2 transition-colors hover:text-[#af2511] hover:text-white"
                                >
                                    <div className="h-1 w-1 rounded-full bg-[#af2511]" />
                                    {footer.bottom.termsLabel ?? "Conditions d'utilisation"}
                                </a>
                            )}
                        </div>

                        {footer?.bottom?.creditText && (
                            <a
                                href="https://sherdev.com/"
                                className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-[#af2511] hover:text-white"
                            >
                                <div className="h-1 w-1 rounded-full bg-[#af2511]" />
                                {footer.bottom.creditText}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
