import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { NavItem } from "../content/types/navTypes";

const NAV_DOC = doc(db, "siteConfig", "navigation");

export async function getNavigation(): Promise<NavItem[]> {
  const snap = await getDoc(NAV_DOC);
  const data = snap.data();
  return (data?.items ?? []) as NavItem[];
}

export async function saveNavigation(items: NavItem[]) {

  console.log("Saving navigation to Firestore...", items);
  await setDoc(NAV_DOC, { items }, { merge: true });
}
