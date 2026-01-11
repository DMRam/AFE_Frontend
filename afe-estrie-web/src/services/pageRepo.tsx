import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { enBrefPage } from "../content/pages/a-propos/en-bref";


export async function getPageDoc(slug: string) {
  // Firestore path: pages/{slugEncoded}
  // ex: pages/a-propos__en-bref
  const id = slug.replace(/\//g, "_").replace(/^_/, "");
  const ref = doc(db, "pages", id);
  const snap = await getDoc(ref);

  if (snap.exists()) return snap.data();

  // fallback local
  if (slug === enBrefPage.slug) return enBrefPage;

  return null;
}
