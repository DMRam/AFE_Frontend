import type { MemberClientForm, StripeMode } from "../../content/types/members";

export const STRIPE_BY_PLAN: Record<string, { mode: StripeMode; priceId?: string; perks?: string[] }> = {
    "Membre actif": {
        mode: "payment",
        priceId: "price_1SxR7t0zYnT4ptIItOvvYwdI",
        perks: ["Soutien à la mission", "Accès aux communications", "Participation aux activités (si applicable)"],
    },
    "Membre soutien": {
        mode: "subscription",
        priceId: "price_1SxR6B0zYnT4ptIIR0zuWezu",
        perks: ["Soutien récurrent", "Impact durable", "Accès aux communications + activités"],
    },
    "Membre associé": {
        mode: "subscription",
        priceId: "price_1SxR7M0zYnT4ptII57QLR4Er",
        perks: ["Soutien récurrent", "Rôle associé (selon AFE)", "Accès aux communications + activités"],
    },
};


export const VOLUNTEER_AREAS = [
    "Accueil / événements",
    "Administration",
    "Animation / groupes",
    "Communications / réseaux sociaux",
    "Collecte de fonds",
    "Soutien logistique",
    "Autre",
] as const;

export const DEFAULT_FORM: MemberClientForm = {
    fullName: "",
    birthYear: "",
    email: "",
    phone: "",

    addressLine1: "",
    addressLine2: "",
    city: "",
    province: "QC",
    postalCode: "",

    preferredLanguage: "fr",

    newsletterOptIn: true,
    contactByEmail: true,
    contactByPhone: false,
    preferredContactTime: "",
    heardAbout: "",

    wantsToVolunteer: false,
    volunteerAreas: [],
    availability: "",

    consent: false,
    notes: "",
};