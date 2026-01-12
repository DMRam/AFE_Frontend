import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import type { PageDoc } from "../content/types/pageBlocks";
import { enBrefPage } from "../content/pages/a-propos/en-bref";

// helper to keep doc ids consistent
function pageDocIdFromPageId(pageId: string) {
  return pageId.replace(/\//g, "__");
}

export async function seedPage(page: PageDoc) {
  const docId = pageDocIdFromPageId(page.id);

  await setDoc(
    doc(db, "pages", docId),
    {
      ...page,
      version: 1,
      published: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true } // safe to re-run
  );

  console.log(`✅ Page seeded: ${page.id}`);
}

// specific seed (En bref)
export async function seedEnBrefPage() {
  await seedPage(enBrefPage);
}
