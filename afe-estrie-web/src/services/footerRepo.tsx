// services/footerRepo.ts
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { FooterCMS } from "../content/types/footer";

const FOOTER_REF = doc(db, "siteComponents", "footer");

export async function getFooter(): Promise<FooterCMS | null> {
  const snap = await getDoc(FOOTER_REF);
  return snap.exists() ? (snap.data() as FooterCMS) : null;
}

// Upsert/merge
export async function patchFooter(patch: Partial<FooterCMS>) {
  await setDoc(FOOTER_REF, patch, { merge: true });
}

// Optional: seed default doc once
export async function seedFooterIfMissing() {
  const snap = await getDoc(FOOTER_REF);
  if (snap.exists()) return;

  const seed: FooterCMS = {
    brand: { logoSrc: "", alt: "AFE" },
    contact: { title: "Nous contacter", phones: [], email: "", addressLines: [] },
    links: { title: "Liens", items: [] },
    news: { title: "Nos Actualités", items: [] },
    partner: { title: "Partenaire Financier", items: [] },
    social: { facebook: "", linkedin: "" },
    bottom: {
      policyLabel: "Politique de confidentialité",
      policyHref: "/confidentialite",
      cookiesLabel: "Politique de cookies",
      cookiesHref: "/cookies",
      creditText: "Powered by SherDev",
    },
    socialFloating: {
      enabled: true,
      items: [
        { id: "facebook", label: "Facebook", href: "https://facebook.com/yourpage", enabled: true, order: 1 },
        { id: "linkedin", label: "LinkedIn", href: "https://linkedin.com/company/yourpage", enabled: true, order: 2 },
        { id: "instagram", label: "Instagram", href: "https://instagram.com/yourpage", enabled: true, order: 3 },
        { id: "youtube", label: "YouTube", href: "https://youtube.com/c/yourchannel", enabled: true, order: 4 },
      ],
    },

  };

  await setDoc(FOOTER_REF, seed, { merge: false });
}
