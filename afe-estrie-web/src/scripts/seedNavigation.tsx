import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { NAV_DUMMY } from "../content/navDummy";

export async function seedNavigation() {
  await setDoc(doc(db, "siteConfig", "navigation"), {
    items: NAV_DUMMY,
    version: 1,
    updatedAt: serverTimestamp(),
  });

  console.log("✅ Navigation seeded to Firestore");
}
