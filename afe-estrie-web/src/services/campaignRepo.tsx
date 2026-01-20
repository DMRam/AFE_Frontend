// src/services/campaignRepo.ts
import {
    collection,
    doc,
    getDoc,
    getDocs,
    limit,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
    type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type CampaignStatus = "draft" | "queued" | "sent" | "failed";

export type CampaignDoc = {
    id: string;

    // content
    name: string;              // internal name (admin)
    subject: string;           // email subject
    preheader?: string;        // optional
    title?: string;            // optional heading
    message: string;           // main body (plain text for v1)
    ctaLabel?: string;
    ctaHref?: string;
    heroImage?: string;        // URL
    images?: string[];
    // sending
    status: CampaignStatus;
    lastError?: string | null;
    testEmails?: string;

    // audit
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    createdBy?: { uid?: string | null; email?: string | null; name?: string | null };
    updatedBy?: { uid?: string | null; email?: string | null; name?: string | null };
    sentAt?: Timestamp;
};

const COL = "campaigns";

export async function listCampaigns() {
    const q = query(collection(db, COL), orderBy("updatedAt", "desc"), limit(25));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as CampaignDoc[];
}

export async function getCampaign(id: string) {
    const ref = doc(db, COL, id);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as CampaignDoc) : null;
}

export async function upsertCampaign(id: string, patch: Partial<CampaignDoc>) {
    const ref = doc(db, COL, id);

    // Use setDoc merge to create if missing
    await setDoc(
        ref,
        {
            ...patch,
            updatedAt: serverTimestamp(),
        },
        { merge: true }
    );
}

export async function markCampaignStatus(
    id: string,
    status: CampaignStatus,
    extra?: { lastError?: string | null; sentAt?: any }
) {
    const ref = doc(db, COL, id);
    await updateDoc(ref, {
        status,
        lastError: extra?.lastError ?? null,
        ...(extra?.sentAt ? { sentAt: extra.sentAt } : {}),
        updatedAt: serverTimestamp(),
    });
}
