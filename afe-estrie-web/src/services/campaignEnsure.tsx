import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { CampaignDoc } from "./campaignRepo";

export async function ensureCampaignExists(
  id: string,
  payload: CampaignDoc
) {
  const ref = doc(db, "campaigns", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      ...payload,
      status: payload.status ?? "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
