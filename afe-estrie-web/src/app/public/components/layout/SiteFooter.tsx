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
const SEARCH_PATH = "/recherche"; 

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
        <footer className="bg-white text-gray-900">
            <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                {/* TOP STRIP */}
                <div className="border-t border-gray-200/70 pt-12">
                    <div className="grid gap-10 md:grid-cols-12">
                        {/* Brand */}
                        <div className="md:col-span-4">
                            <div className="space-y-4">
                                {hasBrand ? (
                                    <img
                                        src={footer!.brand!.logoSrc}
                                        alt={footer?.brand?.alt ?? "AFE"}
                                        className="h-16 w-auto"
                                    />
                                ) : (
                                    <div className="h-10 w-32 rounded-xl bg-gray-100" />
                                )}

                                {(footer as any)?.brand?.tagline ? (
                                    <p className="max-w-sm text-sm leading-relaxed text-gray-600">
                                        {(footer as any).brand.tagline}
                                    </p>
                                ) : (
                                    <p className="max-w-sm text-sm leading-relaxed text-gray-600">
                                        Soutenir, informer et accompagner les personnes vivant avec la fibromyalgie.
                                    </p>
                                )}

                                {/* tiny accent line */}
                                <div className="h-[2px] w-16 rounded-full bg-[#af2511]/80" />
                            </div>
                        </div>

                        {/* Contact */}
                        <div className="md:col-span-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {footer?.contact?.title ?? "Nous joindre"}
                                </h3>
                                <span className="h-6 w-6 rounded-full bg-[#af2511]/10" />
                            </div>

                            <div className="space-y-3">
                                {footer?.contact?.phones?.map((phone, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm text-gray-700">
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#af2511]/10">
                                            <Phone className="h-4 w-4 text-[#af2511]" />
                                        </span>
                                        <a
                                            href={`tel:${phone.replace(/\s/g, "")}`}
                                            className="font-medium hover:text-[#af2511]"
                                        >
                                            {phone}
                                        </a>
                                    </div>
                                ))}

                                {footer?.contact?.email ? (
                                    <div className="flex items-center gap-3 text-sm text-gray-700">
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#af2511]/10">
                                            <Mail className="h-4 w-4 text-[#af2511]" />
                                        </span>
                                        <a
                                            href={`mailto:${footer.contact.email}`}
                                            className="font-medium hover:text-[#af2511]"
                                        >
                                            {footer.contact.email}
                                        </a>
                                    </div>
                                ) : null}

                                {footer?.contact?.addressLines?.length ? (
                                    <div className="flex items-start gap-3 text-sm text-gray-700">
                                        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#af2511]/10">
                                            <MapPin className="h-4 w-4 text-[#af2511]" />
                                        </span>
                                        <div className="space-y-1">
                                            {footer.contact.addressLines.map((line, i) => (
                                                <div key={i} className="leading-relaxed">
                                                    {line}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Search */}
                        <div className="md:col-span-4">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">
                                    {(footer as any)?.search?.title ?? "Rechercher"}
                                </h3>
                                <span className="h-6 w-6 rounded-full bg-[#af2511]/10" />
                            </div>

                            <form onSubmit={onSearchSubmit} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder={
                                            (footer as any)?.search?.placeholder ??
                                            "Trouver une page, un sujet, une ressource…"
                                        }
                                        className="
                    w-full rounded-2xl border border-gray-200 bg-white
                    py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400
                    outline-none transition
                    focus:border-[#af2511]/50 focus:ring-4 focus:ring-[#af2511]/10
                  "
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="
                  rounded-2xl bg-[#af2511] px-4 py-2.5 text-sm font-semibold text-white
                  shadow-sm transition hover:opacity-95
                "
                                >
                                    {(footer as any)?.search?.buttonLabel ?? "OK"}
                                </button>
                            </form>

                            <p className="mt-3 text-xs text-gray-500">
                                {(footer as any)?.search?.hint ?? "Accès direct aux contenus du site."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="mt-10 border-t border-gray-200/70 py-10">
                    <div className="grid gap-10 md:grid-cols-12">
                        {/* Links */}
                        <div className="md:col-span-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                {footer?.links?.title ?? "Liens"}
                            </h3>
                            <ul className="mt-4 space-y-2">
                                {links.map((link) => (
                                    <li key={link.id} className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#af2511]/70" />
                                        <a href={link.href} className="text-sm text-gray-700 hover:text-[#af2511]">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                                {links.length === 0 && (
                                    <li className="text-sm text-gray-500">Aucun lien</li>
                                )}
                            </ul>
                        </div>

                        {/* News */}
                        <div className="md:col-span-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                {footer?.news?.title ?? "Nos actualités"}
                            </h3>

                            <div className="mt-4 space-y-4">
                                {news.slice(0, 2).map((item) => (
                                    <a
                                        key={item.id}
                                        href={item.href}
                                        className="group block rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-[#af2511]/30 hover:shadow-sm"
                                    >
                                        <div className="text-xs text-gray-500">{item.date}</div>
                                        <div className="mt-1 text-sm font-semibold text-gray-900 group-hover:text-[#af2511]">
                                            {item.title}
                                        </div>
                                    </a>
                                ))}

                                {news.length === 0 && <div className="text-sm text-gray-500">Aucune actualité</div>}
                            </div>
                        </div>

                        {/* Partners */}
                        <div className="md:col-span-3">
                            <h3 className="text-sm font-semibold text-gray-900">
                                {(footer as any)?.partner?.financialTitle ?? "Partenaire financier"}
                            </h3>

                            <div className="mt-4">
                                {financialPartner ? (
                                    <a
                                        href={(financialPartner as any).href || "#"}
                                        target={(financialPartner as any).href ? "_blank" : undefined}
                                        rel={(financialPartner as any).href ? "noopener noreferrer" : undefined}
                                        className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#af2511]/30 hover:shadow-md"
                                    >
                                        {(financialPartner as any).imageSrc ? (
                                            <img
                                                src={(financialPartner as any).imageSrc}
                                                alt={(financialPartner as any).name}
                                                className="h-24 w-full object-contain"
                                            />
                                        ) : (
                                            <div className="py-10 text-center text-sm text-gray-600">
                                                {(financialPartner as any).name}
                                            </div>
                                        )}
                                    </a>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                                        Aucun partenaire financier
                                    </div>
                                )}
                            </div>

                            {/* Collaborators */}
                            {collaborators.length ? (
                                <div className="mt-6">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Collaborateurs
                                    </p>

                                    <div className="mt-3 grid grid-cols-2 gap-3">
                                        {collaborators.slice(0, 4).map((p: any) => (
                                            <a
                                                key={p.id}
                                                href={p.href || "#"}
                                                target={p.href ? "_blank" : undefined}
                                                rel={p.href ? "noopener noreferrer" : undefined}
                                                className="flex aspect-square items-center justify-center rounded-2xl border border-gray-200 bg-white p-2 transition hover:border-[#af2511]/30 hover:shadow-sm"
                                            >
                                                {p.imageSrc ? (
                                                    <img src={p.imageSrc} alt={p.name} className="max-h-full max-w-full object-contain" />
                                                ) : (
                                                    <span className="text-center text-xs text-gray-600">{p.name}</span>
                                                )}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Admin */}
                        <div className="md:col-span-3">
                            {/* <h3 className="text-sm font-semibold text-gray-900">Administration</h3> */}

                            <div className="mt-4">
                                <a
                                    href={adminHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                  inline-flex items-center gap-2 rounded-2xl
                   border-gray-200 bg-white px-4 py-2.5
                  text-sm font-semibold text-gray-900 shadow-sm
                  transition hover:border-[#af2511]/30 hover:text-[#af2511]
                "
                                >
                                    {adminLabel}
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>

                            <p className="mt-3 text-xs text-gray-500">
                                Accès sécurisé pour la gestion du contenu.
                            </p>
                        </div>
                    </div>
                </div>

                {/* BOTTOM BAR */}
                <div className="border-t border-gray-200/70 py-6">
                    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                        <div className="text-sm text-gray-500">
                            © {new Date().getFullYear()} {footer?.brand?.name || "AFE"}. Tous droits réservés.
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-500">
                            {footer?.bottom?.policyHref && (
                                <a href={footer.bottom.policyHref} className="hover:text-[#af2511]">
                                    {footer.bottom.policyLabel ?? "Politique de confidentialité"}
                                </a>
                            )}
                            {footer?.bottom?.cookiesHref && (
                                <a href={footer.bottom.cookiesHref} className="hover:text-[#af2511]">
                                    {footer.bottom.cookiesLabel ?? "Politique de cookies"}
                                </a>
                            )}
                            {footer?.bottom?.termsHref && (
                                <a href={footer.bottom.termsHref} className="hover:text-[#af2511]">
                                    {footer.bottom.termsLabel ?? "Conditions d'utilisation"}
                                </a>
                            )}
                        </div>

                        {footer?.bottom?.creditText ? (
                            <a
                                href="https://sherdev.com/"
                                className="text-sm text-gray-500 hover:text-[#af2511]"
                            >
                                {footer.bottom.creditText}
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>
        </footer>
    )
}