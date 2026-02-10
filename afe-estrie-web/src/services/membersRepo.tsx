import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export type MemberStatus = "active" | "inactive";

export type MembershipInfo = {
    activatedAt?: string;
    mode?: string;
    paymentStatus?: string;
    planName?: string;
    priceId?: string;
    stripeCustomerId?: string;
    stripeSessionId?: string;
    stripeSubscriptionId?: string;
    status?: string;
};

export type ProfileInfo = {
    addressLine1?: string;
    addressLine2?: string;
    availability?: string;
    city?: string;
    consent?: boolean;
    contactByEmail?: boolean;
    contactByPhone?: boolean;
    email?: string;
    fullName?: string;
    heardAbout?: string;
    newsletterOptIn?: boolean;
    notes?: string;
    phone?: string;
    postalCode?: string;
    preferredContactTime?: string;
    preferredLanguage?: string;
    province?: string;
    wantsToVolunteer?: boolean;
};

export type Member = {
    id: string;

    fullName: string;
    email: string;
    city: string;

    // ✅ allow unknown age
    age: number | null;

    status: MemberStatus;
    tags: string[];
    createdAt: string;

    updatedAt?: string;
    isFirstMember?: boolean;

    membership?: MembershipInfo;
    profile?: ProfileInfo;
    volunteerAreas?: string[];
};

export type MemberInput = {
    fullName: string;
    email: string;
    city: string;

    // ✅ optional
    age?: number | null;

    status: MemberStatus;
    tags: string[];
};

function toISO(ts: any): string {
    if (!ts) return "";
    if (typeof ts === "string") return ts;
    if (ts instanceof Date) return ts.toISOString();
    if (ts?.toDate) return ts.toDate().toISOString();
    return "";
}

function toISODate(ts: any): string {
    const iso = toISO(ts);
    return iso ? iso.slice(0, 10) : "";
}

function normalizeAge(v: any): number | null {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    if (n <= 0) return null; // treat 0 as unknown
    return Math.floor(n);
}

function mapDoc(d: any): Member {
    const data = d.data() || {};

    const fullName = data.fullName ?? data.profile?.fullName ?? "";
    const email = data.email ?? data.profile?.email ?? "";
    const city = data.city ?? data.profile?.city ?? "";

    return {
        id: d.id,
        fullName,
        email,
        city,
        age: normalizeAge(data.age),

        status: (data.status ?? "active") as MemberStatus,
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: toISODate(data.createdAt),

        updatedAt: toISODate(data.updatedAt),
        isFirstMember: Boolean(data.isFirstMember),

        membership: data.membership
            ? {
                ...data.membership,
                activatedAt: toISODate(data.membership.activatedAt),
            }
            : undefined,

        profile: data.profile
            ? {
                ...data.profile,
                consent: Boolean(data.profile.consent),
                contactByEmail: Boolean(data.profile.contactByEmail),
                contactByPhone: Boolean(data.profile.contactByPhone),
                newsletterOptIn: Boolean(data.profile.newsletterOptIn),
                wantsToVolunteer: Boolean(data.profile.wantsToVolunteer),
            }
            : undefined,

        volunteerAreas: Array.isArray(data.volunteerAreas) ? data.volunteerAreas : [],
    };
}

const COL = "members";

export async function listMembers(): Promise<Member[]> {
    const q = query(collection(db, COL), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(mapDoc);
}

export async function createMember(input: MemberInput): Promise<Member> {
    const age = normalizeAge(input.age);

    // ✅ do not store age if unknown
    const payload: any = {
        ...input,
        age: age ?? null, // store null (or omit; but null is clearer)
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, COL), payload);

    return {
        id: ref.id,
        ...input,
        age: age,
        createdAt: new Date().toISOString().slice(0, 10),
        membership: undefined,
        profile: undefined,
        volunteerAreas: [],
        isFirstMember: false,
    };
}

export async function updateMember(id: string, patch: Partial<MemberInput>): Promise<void> {
    const out: any = { ...patch, updatedAt: serverTimestamp() };

    // if age exists in patch, normalize it
    if ("age" in patch) out.age = normalizeAge(patch.age);

    await updateDoc(doc(db, COL, id), out);
}

export async function deleteMember(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}
