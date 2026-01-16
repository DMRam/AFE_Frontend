import type { HomeContactCMS, HomePageCMS } from "../../../../content/types/homePage";

/**
 * BACKWARD COMPAT:
 * - If your HomeContactCMS type still has mapEmbedUrl/directionsUrl, this will work.
 * - New preferred field: mapUrl (single public Google Maps link).
 */
const FALLBACK: HomeContactCMS & {
    mapUrl?: string;
    mapEmbedUrl?: string;
    directionsUrl?: string;
} = {
    enabled: true,

    // NEW (single link)
    mapUrl: "",

    // legacy (still supported if present in DB)
    mapEmbedUrl: "",
    directionsUrl: "",

    hours: [
        { label: "Lundi au vendredi", value: "9h00 à 12h00" },
        { label: "Lundi au vendredi", value: "13h00 à 16h00" },
    ],
    orgName: "Association de la Fibromyalgie de l’Estrie",
    phones: [
        { label: "Local", value: "819-566-1067" },
        { label: "Sans frais", value: "1-877-566-1067" },
        { value: "819 566-0111" },
    ],
    email: "info@fibromyalgie.ca",
    address: "1013, rue Galt Ouest Sherbrooke (Qc) J1H 1Z9",
};

function clean(s?: string) {
    return (s ?? "").trim();
}

function telHref(value: string) {
    // keep digits + + only
    const v = value.replace(/[^\d+]/g, "");
    return `tel:${v}`;
}

function toDirectionsUrl(mapUrl?: string, address?: string) {
    const u = clean(mapUrl);
    if (u) return u;

    const a = clean(address);
    if (!a) return "";
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
}

/**
 * Builds an embeddable URL from a normal Google Maps link OR from an address fallback.
 * Works without API key (basic embed).
 */
function toEmbedUrl(mapUrl?: string, address?: string) {
    const u = clean(mapUrl);
    if (u) {
        // If user pasted an embed link already, keep it:
        if (u.includes("/maps/embed?") || u.includes("output=embed")) return u;

        // Convert to stable "q + output=embed"
        const a = clean(address);
        const query = a || u;
        return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    }

    const a = clean(address);
    if (!a) return "";
    return `https://www.google.com/maps?q=${encodeURIComponent(a)}&output=embed`;
}

export function HomeContactMap({ home }: { home?: HomePageCMS | null }) {
    const block: any = home?.contact;

    if (block?.enabled === false) return null;

    // merge fallback + DB (supports old fields)
    const b = { ...FALLBACK, ...(block ?? {}) };

    const mapUrl = clean((b as any).mapUrl) || clean((b as any).mapEmbedUrl);
    const embedUrl = toEmbedUrl(mapUrl, b.address);

    // Prefer computed directions URL, but allow legacy directionsUrl if stored.
    const directionsUrl =
        clean(b.directionsUrl) ||
        toDirectionsUrl(b.mapUrl, b.address);

    const hours = (b.hours ?? []).filter((x: any) => clean(x?.label) && clean(x?.value));
    const phones = (b.phones ?? []).filter((x: any) => clean(x?.value));

    return (
        <section id="contact" className="bg-white">
            <div className="mx-auto max-w-7xl px-0 py-0 sm:px-6 sm:py-10">
                <div className="overflow-hidden border border-gray-200 bg-white sm:rounded-2xl">
                    <div className="grid lg:grid-cols-[1fr_520px]">
                        {/* RIGHT PANEL */}
                        <aside className="order-1 bg-[#b33a22] text-white lg:order-2">
                            <div className="px-6 py-10 sm:px-10">
                                {/* Hours */}
                                <div>
                                    <h3 className="text-lg font-semibold">Heures d’ouverture</h3>

                                    <div className="mt-5 divide-y divide-white/15 text-sm">
                                        {hours.map((h: any, idx: number) => (
                                            <div
                                                key={`${h.label}-${idx}`}
                                                className="flex items-center justify-between gap-6 py-3"
                                            >
                                                <span className="text-white/85">{h.label}</span>
                                                <span className="font-semibold text-white">{h.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Contact */}
                                <div className="mt-10">
                                    <h3 className="text-lg font-semibold">Nous joindre</h3>

                                    {clean(b.orgName) ? (
                                        <p className="mt-3 text-sm text-white/80">{b.orgName}</p>
                                    ) : null}

                                    <div className="mt-6 space-y-3 text-sm">
                                        {phones.map((p: any, idx: number) => (
                                            <a
                                                key={`${p.value}-${idx}`}
                                                href={telHref(p.value)}
                                                className="flex items-start gap-2 text-white/90 hover:text-white"
                                            >
                                                <span className="mt-[2px] inline-block">📞</span>
                                                <span>
                                                    {p.label ? <span className="font-semibold">{p.label} : </span> : null}
                                                    {p.value}
                                                </span>
                                            </a>
                                        ))}

                                        {clean(b.email) ? (
                                            <a
                                                href={`mailto:${b.email}`}
                                                className="flex items-start gap-2 break-all text-white/90 hover:text-white"
                                            >
                                                <span className="mt-[2px] inline-block">✉️</span>
                                                <span>{b.email}</span>
                                            </a>
                                        ) : null}

                                        {clean(b.address) ? (
                                            <div className="flex items-start gap-2 text-white/90">
                                                <span className="mt-[2px] inline-block">📍</span>
                                                <span>{b.address}</span>
                                            </div>
                                        ) : null}

                                        {clean(directionsUrl) ? (
                                            <a
                                                href={directionsUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                                            >
                                                <span>➜</span>
                                                Itinéraire
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* MAP */}
                        <div className="order-2 lg:order-1">
                            <div className="h-[320px] sm:h-[420px] lg:h-full">
                                {clean(embedUrl) ? (
                                    <iframe
                                        title="Carte"
                                        src={embedUrl}
                                        className="h-full w-full"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                ) : (
                                    <div className="grid h-full w-full place-items-center bg-gray-100 text-sm text-gray-500">
                                        Lien Google Maps manquant (home.contact.mapUrl) ou adresse.
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
