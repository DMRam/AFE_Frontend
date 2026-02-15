import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { HomePageCMS } from "../content/types/homePage";

const HOME_DOC = doc(db, "sitePages", "home");

export async function getHomePage(): Promise<HomePageCMS | null> {
    const snap = await getDoc(HOME_DOC);

    console.log("Home page data fetched:", snap.data());
    return snap.exists() ? (snap.data() as HomePageCMS) : null;
}

/**
 * Saves/updates the home page doc.
 * merge:true means partial updates are allowed.
 */
export async function saveHomePage(data: HomePageCMS): Promise<void> {
    await setDoc(
        HOME_DOC,
        {
            ...data,
            updatedAt: Date.now(),
            updatedAtServer: serverTimestamp(),
        },
        { merge: true }
    );
}

/**
 * Use this to "upload" a default structure to Firestore.
 */
export function seedHomePage(): HomePageCMS {
    return {
        hero: {
            enabled: true,
            intervalSeconds: 9,
            fadeMs: 1200,
            slides: [
                {
                    id: "s1",
                    enabled: true,
                    order: 1,
                    eyebrow: "Association • Estrie",
                    title: "Bienvenue à l’Association de la fibromyalgie de l’Estrie",
                    description:
                        "Soutien, information et activités pour mieux vivre au quotidien.",
                    videoKey: "v1",
                    ctas: [
                        { label: "Voir les activités", href: "#activites", variant: "primary" },
                        { label: "Nous contacter", href: "#contact", variant: "secondary" },
                    ],
                },
                {
                    id: "s2",
                    enabled: true,
                    order: 2,
                    eyebrow: "Rencontres",
                    title: "Rencontres d’information — Association de la fibromyalgie de l’Estrie",
                    description:
                        "Des moments pour comprendre, poser vos questions et trouver du soutien.",
                    videoKey: "v2",
                    ctas: [
                        { label: "Prochains événements", href: "#evenements", variant: "primary" },
                        { label: "Ressources", href: "#ressources", variant: "secondary" },
                    ],
                },
                {
                    id: "s3",
                    enabled: true,
                    order: 3,
                    eyebrow: "Soutien",
                    title: "Un accompagnement humain et des services concrets",
                    description:
                        "Relation d’aide, écoute, activités et communauté — selon vos besoins.",
                    videoKey: "v3",
                    ctas: [
                        { label: "Devenir membre", href: "#membre", variant: "primary" },
                        { label: "Faire un don", href: "#don", variant: "secondary" },
                    ],
                },
            ],
        },
        headerCtas: {
            donate: { enabled: true, label: "Faire un don", href: "#don" },
            member: { enabled: true, label: "Devenir membre", mode: "stripe", href: "" },
        },

        quickCards: {
            enabled: true,
            heading: "Accès rapide",
            cards: [
                {
                    id: "qc1",
                    enabled: true,
                    order: 1,
                    title: "Devenir membre",
                    description: "Adhésion, avantages et ressources.",
                    href: "/membre",
                    icon: "UserPlus",
                },
                {
                    id: "qc2",
                    enabled: true,
                    order: 2,
                    title: "Activités",
                    description: "Ateliers, rencontres et événements.",
                    href: "/activites",
                    icon: "Calendar",
                },
                {
                    id: "qc3",
                    enabled: true,
                    order: 3,
                    title: "Ressources",
                    description: "Guides, liens utiles et outils.",
                    href: "/ressources",
                    icon: "BookOpen",
                },
            ],
        },

        features: {
            enabled: true,
            eyebrow: "Soutien",
            heading: "Les symptômes de la fibromyalgie",
            subheading:
                "Trois principaux symptômes sont récurrents. Les douleurs diffuses, les troubles du sommeil et la fatigue chronique. Plusieurs autres symptômes sont liés à la fibromyalgie et diffèrent selon les personnes.",
            items: [
                {
                    id: "f1",
                    enabled: true,
                    order: 1,
                    icon: "brain",
                    title: "Douleur",
                    description:
                        "Le symptôme numéro un de la fibromyalgie est la douleur. Elle touche toutes les personnes atteintes de fibromyalgie.",
                },
                {
                    id: "f2",
                    enabled: true,
                    order: 2,
                    icon: "sleep",
                    title: "Troubles du sommeil",
                    description:
                        "80 % des personnes ayant la fibromyalgie éprouvent des troubles du sommeil prenant différentes formes.",
                },
                {
                    id: "f3",
                    enabled: true,
                    order: 3,
                    icon: "balance",
                    title: "Fatigue",
                    description:
                        "La fatigue est le troisième principal symptôme de la fibromyalgie et touche quelque 75 % des personnes atteintes.",
                },
                {
                    id: "f4",
                    enabled: true,
                    order: 4,
                    icon: "stairs",
                    title: "Troubles concomitants",
                    description:
                        "Plusieurs autres troubles peuvent toucher les personnes atteintes. Le mieux connu est un trouble de cognition qu’on surnomme le fibrofog.",
                },
            ],
        },


        partners: {
            enabled: true,
            heading: "Nos partenaires",
            logos: [
                // optional starter example:
                // { id: "p1", enabled: true, order: 1, alt: "Partenaire 1", href: "", src: "" },
            ],
        },

        activities: {
            enabled: true,
            header: { heading: "Activités à venir", subheading: "Participez à nos ateliers et rencontres." },
            ctaLabel: "Voir toutes les activités",
            ctaHref: "/activites",
            items: [
                // { id:"a1", enabled:true, order:1, title:"Atelier", description:"", href:"/activites", meta:"", date:"" }
            ],
        } as any,

        events: {
            enabled: true,
            header: { heading: "Événements", subheading: "Conférences et rendez-vous importants." },
            ctaLabel: "Voir le calendrier",
            ctaHref: "/evenements",
            items: [],
        } as any,

        resources: {
            enabled: true,
            header: { heading: "Ressources", subheading: "Pour vous informer et vous outiller." },
            ctaLabel: "Accéder aux ressources",
            ctaHref: "/ressources",
            items: [],
        } as any,

        news: {
            enabled: true,
            eyebrow: "Nos actualités",
            heading: "Nos actualités",
            subheading: "Pour être informé des dernières actualités de l'association.",
            ctaLabel: "Toutes nos actualités",
            ctaHref: "/actualites",
            items: [
                {
                    id: "n1",
                    enabled: true,
                    order: 1,
                    title: "Lunettes PSIO : Une révolution...",
                    excerpt: "La fibromyalgie est une affection chronique qui touche des millions de personnes...",
                    date: "28 OCTOBRE 2025",
                    href: "/actualites/lunettes-psio",
                    coverSrc: "https://images.unsplash.com/...", // replace later
                    coverAlt: "Couverture",
                },
                {
                    id: "n2",
                    enabled: true,
                    order: 2,
                    title: "Fibromyalgie et comportement...",
                    excerpt: "La fibromyalgie est un syndrome douloureux chronique étroitement associé...",
                    date: "20 OCTOBRE 2025",
                    href: "/actualites/fibromyalgie-comportement",
                    coverSrc: "https://images.unsplash.com/...",
                    coverAlt: "Couverture",
                },
            ],
        },

        contact: {
            enabled: true,

            orgName: "Association de la fibromyalgie de l’Estrie",
            email: "info@fibromyalgie.ca",
            address: "1013, rue Galt Ouest Sherbrooke (Qc) J1H 1Z9",

            // Put the real directions link here (Google Maps share link)
            directionsUrl: "",

            hours: [
                { label: "Lundi au vendredi", value: "9h00 à 12h00" },
                { label: "Lundi au vendredi", value: "13h00 à 16h00" },
            ],

            phones: [
                { label: "Local", value: "819-566-1067" },
                { label: "Sans frais", value: "1-877-566-1067" },
                { label: "", value: "819-566-0111" },
            ],
        },



    };
}


export function deepMergeDefaults<T>(defaults: T, existing: any): T {
    // existing wins; defaults fill the gaps
    if (Array.isArray(defaults)) {
        // arrays: keep existing as-is if present, otherwise default
        return (Array.isArray(existing) ? existing : defaults) as any;
    }

    if (defaults && typeof defaults === "object") {
        const out: any = { ...(defaults as any) };
        const ex = existing && typeof existing === "object" ? existing : {};
        for (const k of Object.keys(ex)) {
            const dv = (defaults as any)[k];
            const ev = ex[k];
            out[k] = dv === undefined ? ev : deepMergeDefaults(dv, ev);
        }
        return out;
    }

    return (existing ?? defaults) as any;
}
