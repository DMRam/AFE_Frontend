import React, { useEffect, useMemo, useState } from "react";
import {
    Mail,
    MapPin,
    Phone,
    Facebook,
    Linkedin,
    Instagram,
    Youtube,
    ExternalLink,
} from "lucide-react";
import type { FooterCMS } from "../../../../content/types/footer";
import { getFooter } from "../../../../services/footerRepo";

const FALLBACK_ADMIN_URL = "https://afe-sherdev.web.app/admin/login";

// -------- main component --------
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
        "Administration";

    const hasBrand = !!footer?.brand?.logoSrc;

    return (
        <footer className="bg-black text-white">
            <div className="mx-auto max-w-7xl px-6 py-12">
                {/* Top section with logo and contact */}
                <div className="border-b border-white/10 pb-8">
                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Logo and tagline */}
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
                                    <p className="text-sm text-white/70 max-w-xs">
                                        {(footer as any).brand.tagline}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        {/* Contact info */}
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
                                        <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white hover:text-[#af2511] transition-colors">
                                            {phone}
                                        </a>
                                    </div>
                                ))}
                                
                                {footer?.contact?.email ? (
                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                        <Mail className="h-4 w-4 text-[#af2511]" />
                                        <a href={`mailto:${footer.contact.email}`} className="hover:text-white hover:text-[#af2511] transition-colors">
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

                        {/* Social links */}
                        <div className="md:col-span-4">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    Nous suivre
                                </h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {footer?.social?.facebook && (
                                    <a
                                        href={footer.social.facebook}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/80 hover:text-white hover:border-[#af2511]/30 hover:bg-[#af2511]/10 transition-colors"
                                        aria-label="Facebook"
                                    >
                                        <Facebook className="h-5 w-5" />
                                    </a>
                                )}
                                {footer?.social?.linkedin && (
                                    <a
                                        href={footer.social.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/80 hover:text-white hover:border-[#af2511]/30 hover:bg-[#af2511]/10 transition-colors"
                                        aria-label="LinkedIn"
                                    >
                                        <Linkedin className="h-5 w-5" />
                                    </a>
                                )}
                                {footer?.social?.instagram && (
                                    <a
                                        href={footer.social.instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/80 hover:text-white hover:border-[#af2511]/30 hover:bg-[#af2511]/10 transition-colors"
                                        aria-label="Instagram"
                                    >
                                        <Instagram className="h-5 w-5" />
                                    </a>
                                )}
                                {footer?.social?.youtube && (
                                    <a
                                        href={footer.social.youtube}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-10 w-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/80 hover:text-white hover:border-[#af2511]/30 hover:bg-[#af2511]/10 transition-colors"
                                        aria-label="YouTube"
                                    >
                                        <Youtube className="h-5 w-5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content grid */}
                <div className="py-8">
                    <div className="grid gap-8 md:grid-cols-12">
                        {/* Quick links */}
                        <div className="md:col-span-3">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    {footer?.links?.title ?? "Liens rapides"}
                                </h3>
                            </div>
                            <ul className="space-y-2">
                                {links.map((link) => (
                                    <li key={link.id} className="flex items-center gap-3">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#af2511]" />
                                        <a 
                                            href={link.href} 
                                            className="text-sm text-white/70 hover:text-white hover:text-[#af2511] transition-colors"
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

                        {/* Recent news */}
                        <div className="md:col-span-3">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    {footer?.news?.title ?? "Actualités"}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {news.slice(0, 2).map((item) => (
                                    <a 
                                        key={item.id} 
                                        href={item.href}
                                        className="block group pl-2 border-l border-[#af2511]/30 hover:border-[#af2511] transition-colors"
                                    >
                                        <div className="text-xs text-white/60 mb-1">
                                            {item.date}
                                        </div>
                                        <div className="text-sm text-white/80 group-hover:text-white group-hover:text-[#af2511] transition-colors">
                                            {item.title}
                                        </div>
                                    </a>
                                ))}
                                {news.length === 0 && (
                                    <div className="flex items-center gap-3 pl-2 border-l border-[#af2511]/30">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#af2511]/30" />
                                        <div className="text-sm text-white/50">Aucune actualité</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Partners */}
                        <div className="md:col-span-3">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    {footer?.partner?.title ?? "Partenaires"}
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {partners.slice(0, 4).map((partner) => (
                                    <a
                                        key={partner.id}
                                        href={partner.href || '#'}
                                        target={partner.href ? "_blank" : undefined}
                                        rel={partner.href ? "noopener noreferrer" : undefined}
                                        className="aspect-square bg-white rounded-lg flex items-center justify-center p-2 hover:opacity-90 transition-opacity border border-transparent hover:border-[#af2511]/30"
                                    >
                                        {partner.imageSrc ? (
                                            <img 
                                                src={partner.imageSrc} 
                                                alt={partner.name}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-xs text-black/60 text-center">{partner.name}</span>
                                        )}
                                    </a>
                                ))}
                                {partners.length === 0 && (
                                    <div className="col-span-2 flex items-center gap-3 pl-2 border-l border-[#af2511]/30">
                                        <div className="h-1.5 w-1.5 rounded-full bg-[#af2511]/30" />
                                        <div className="text-sm text-white/50">Aucun partenaire</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Admin access */}
                        <div className="md:col-span-3">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="h-4 w-[2px] bg-gradient-to-b from-[#af2511] to-[#d9361f]" />
                                <h3 className="text-sm font-semibold text-white">
                                    Accès professionnel
                                </h3>
                            </div>
                            <a
                                href={adminHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-[#af2511]/10 hover:border-[#af2511]/30 hover:text-[#af2511] transition-colors"
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
                        {/* Copyright */}
                        <div className="text-sm text-white/60">
                            © {new Date().getFullYear()} {footer?.brand?.name || "AFE"}. Tous droits réservés.
                        </div>

                        {/* Legal links */}
                        <div className="flex items-center gap-4 text-sm text-white/60">
                            {footer?.bottom?.policyHref && (
                                <a 
                                    href={footer.bottom.policyHref}
                                    className="hover:text-white hover:text-[#af2511] transition-colors flex items-center gap-2"
                                >
                                    <div className="h-1 w-1 rounded-full bg-[#af2511]" />
                                    {footer.bottom.policyLabel ?? "Confidentialité"}
                                </a>
                            )}
                            {footer?.bottom?.cookiesHref && (
                                <a 
                                    href={footer.bottom.cookiesHref}
                                    className="hover:text-white hover:text-[#af2511] transition-colors flex items-center gap-2"
                                >
                                    <div className="h-1 w-1 rounded-full bg-[#af2511]" />
                                    {footer.bottom.cookiesLabel ?? "Cookies"}
                                </a>
                            )}
                            {footer?.bottom?.termsHref && (
                                <a 
                                    href={footer.bottom.termsHref}
                                    className="hover:text-white hover:text-[#af2511] transition-colors flex items-center gap-2"
                                >
                                    <div className="h-1 w-1 rounded-full bg-[#af2511]" />
                                    {footer.bottom.termsLabel ?? "Conditions d'utilisation"}
                                </a>
                            )}
                        </div>

                        {/* Credit */}
                        {footer?.bottom?.creditText && (
                            <a 
                                href="https://sherdev.com/"
                                className="text-sm text-white/60 hover:text-white hover:text-[#af2511] transition-colors flex items-center gap-2"
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