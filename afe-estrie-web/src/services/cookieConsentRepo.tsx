import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { CookieConsentCMS } from "../content/types/cookieConsent";

const PATH = ["siteConfig", "cookieConsent"] as const;

export async function getCookieConsent(): Promise<CookieConsentCMS | null> {
  const snap = await getDoc(doc(db, ...PATH));
  return snap.exists() ? (snap.data() as CookieConsentCMS) : null;
}

export async function patchCookieConsent(data: Partial<CookieConsentCMS>) {
  await setDoc(doc(db, ...PATH), data, { merge: true });
}

export async function seedCookieConsentIfMissing() {
  const snap = await getDoc(doc(db, ...PATH));
  if (snap.exists()) return;

  const seed: CookieConsentCMS = {
    enabled: true,
    version: 1,
    mode: "opt_in",

    // Banner text  
    title: "Gérer le consentement aux cookies",
    message:
      "Pour offrir les meilleures expériences, nous utilisons des technologies telles que les cookies pour stocker et/ou accéder aux informations des appareils. Le fait de consentir à ces technologies nous permettra de traiter des données telles que le comportement de navigation ou les ID uniques sur ce site. Le fait de ne pas consentir ou de retirer son consentement peut avoir un effet négatif sur certaines caractéristiques et fonctions.",

    // Buttons
    acceptLabel: "Accepter",
    rejectLabel: "Refuser",
    prefsLabel: "Voir les préférences",

    // IMPORTANT: point to your DynamicPage
    cookiesPolicyLabel: "Politique de cookies",
    privacyPolicyLabel: "Politique de confidentialité",
    cookiesPolicyUrl: "/p/politique-de-cookies",
    privacyPolicyUrl: "/p/politique-de-confidentialite",

    // Categories
    categories: {
      necessary: {
        enabled: true,
        locked: true,
        label: "Fonctionnel",
        desc: "Toujours activé. Assure le bon fonctionnement du site et la prise en compte de vos préférences.",
      },
      analytics: {
        enabled: false,
        label: "Statistiques",
        desc: "Aide à optimiser l’expérience des internautes via des statistiques d’utilisation.",
      },
      marketing: {
        enabled: false,
        label: "Marketing",
        desc: "Utilisé pour créer des profils d’utilisateurs et mesurer des campagnes marketing.",
      },
    },

    position: "bottom-right",
  };

  await setDoc(doc(db, ...PATH), seed, { merge: true });
}
