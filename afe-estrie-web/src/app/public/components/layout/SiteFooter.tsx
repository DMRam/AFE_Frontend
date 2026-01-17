import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import type { FooterCMS } from "../../../../content/types/footer";
import { getFooter } from "../../../../services/footerRepo";

const FALLBACK_ADMIN_URL = "https://afe-sherdev.web.app/admin/login";

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <div className="mb-4">
            <h3 className="text-sm font-medium text-white/85">{children}</h3>
            <div className="mt-2 h-[2px] w-5 rounded bg-[#af2511]" />
        </div>
    );
}

export function SiteFooter() {
    const [footer, setFooter] = useState<FooterCMS | null>(null);

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

    const adminHref =
        (footer as any)?.admin?.loginHref ||
        (footer as any)?.bottom?.adminHref ||
        FALLBACK_ADMIN_URL;

    const adminLabel =
        (footer as any)?.admin?.label ||
        (footer as any)?.bottom?.adminLabel ||
        "Ouverture de session";

    return (
        <footer className="bg-black text-white">
            <div className="mx-auto max-w-6xl px-6 py-14">
                {/* top row (logo left, social right) */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {footer?.brand?.logoSrc ? (
                            <img
                                src={footer.brand.logoSrc}
                                alt={footer.brand.alt ?? "AFE"}
                                className="h-10 w-auto"
                            />
                        ) : (
                            <div className="h-10 w-28 rounded bg-white/10" />
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-white/85">
                        {footer?.social?.facebook ? (
                            <a
                                href={footer.social.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white"
                                aria-label="Facebook"
                                title="Facebook"
                            >
                                f
                            </a>
                        ) : null}
                        {footer?.social?.linkedin ? (
                            <a
                                href={footer.social.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:text-white"
                                aria-label="LinkedIn"
                                title="LinkedIn"
                            >
                                in
                            </a>
                        ) : null}
                    </div>
                </div>

                <div className="mt-10 border-t border-white/10" />

                {/* 4 columns */}
                <div className="mt-10 grid gap-10 md:grid-cols-4">
                    {/* Contact */}
                    <div>
                        <SectionTitle>{footer?.contact?.title ?? "Nous contacter"}</SectionTitle>

                        <div className="space-y-3 text-sm text-white/80">
                            {(footer?.contact?.phones ?? []).map((p, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <Phone className="mt-0.5 h-4 w-4 text-white/70" />
                                    <span>{p}</span>
                                </div>
                            ))}

                            {footer?.contact?.email ? (
                                <div className="flex items-start gap-3">
                                    <Mail className="mt-0.5 h-4 w-4 text-white/70" />
                                    <a className="hover:text-white" href={`mailto:${footer.contact.email}`}>
                                        {footer.contact.email}
                                    </a>
                                </div>
                            ) : null}

                            {(footer?.contact?.addressLines ?? []).length ? (
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 text-white/70" />
                                    <div className="space-y-1">
                                        {(footer?.contact?.addressLines ?? []).map((l, i) => (
                                            <div key={i}>{l}</div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            {/* Admin login (team) */}
                            <div className="pt-2">
                                <a
                                    href={adminHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white"
                                >
                                    {adminLabel}
                                    <span className="text-white/50">↗</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <SectionTitle>{footer?.links?.title ?? "Liens"}</SectionTitle>
                        <ul className="space-y-3 text-sm text-white/80">
                            {links.map((x) => (
                                <li key={x.id}>
                                    <a className="hover:text-white" href={x.href}>
                                        {x.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* News */}
                    <div>
                        <SectionTitle>{footer?.news?.title ?? "Nos Actualités"}</SectionTitle>
                        <div className="space-y-5 text-sm text-white/80">
                            {news.slice(0, 3).map((n) => (
                                <a key={n.id} href={n.href} className="block hover:text-white">
                                    {n.date ? (
                                        <div className="mb-1 text-xs uppercase tracking-wide text-white/45">
                                            {n.date}
                                        </div>
                                    ) : null}
                                    <div className="line-clamp-2 font-medium text-white/85">{n.title}</div>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Partners */}
                    <div>
                        <SectionTitle>{footer?.partner?.title ?? "Partenaires"}</SectionTitle>

                        {partners.length ? (
                            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
                                {partners.map((p) => (
                                    <a
                                        key={p.id}
                                        href={p.href || "#"}
                                        target={p.href ? "_blank" : undefined}
                                        rel={p.href ? "noreferrer" : undefined}
                                        className="block overflow-hidden rounded-lg bg-white p-2"
                                    >
                                        {p.imageSrc ? (
                                            <img
                                                src={p.imageSrc}
                                                alt={p.name}
                                                className="h-24 w-full object-contain"
                                            />
                                        ) : (
                                            <div className="h-24 w-full rounded bg-black/5" />
                                        )}
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="h-24 w-full rounded-lg bg-white/10" />
                        )}
                    </div>
                </div>

                {/* bottom row (policies left, credit right) */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/60 md:flex-row">
                    <div className="flex flex-col items-center gap-3 md:items-start">
                        {footer?.bottom?.policyHref ? (
                            <a className="hover:text-white" href={footer.bottom.policyHref}>
                                {footer.bottom.policyLabel ?? "Politique de confidentialité"}
                            </a>
                        ) : null}
                        {footer?.bottom?.cookiesHref ? (
                            <a className="hover:text-white" href={footer.bottom.cookiesHref}>
                                {footer.bottom.cookiesLabel ?? "Politique de cookies"}
                            </a>
                        ) : null}
                    </div>

                    {footer?.bottom?.creditText ? (
                        <div className="text-center md:text-right">{footer.bottom.creditText}</div>
                    ) : null}
                </div>
            </div>
        </footer>
    );
}
