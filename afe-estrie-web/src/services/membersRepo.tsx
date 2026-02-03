// src/services/membersRepo.ts
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
    Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type MemberStatus = "active" | "inactive";

export type Member = {
    id: string;
    fullName: string;
    email: string;
    city: string;
    age: number;
    status: MemberStatus;
    tags: string[];
    createdAt: string; // ISO date for UI
};

export type MemberInput = {
    fullName: string;
    email: string;
    city: string;
    age: number;
    status: MemberStatus;
    tags: string[];
};

function toISODate(ts: any): string {
    if (!ts) return "";
    if (typeof ts === "string") return ts;
    if (ts instanceof Date) return ts.toISOString().slice(0, 10);
    if (ts?.toDate) return ts.toDate().toISOString().slice(0, 10);
    return "";
}

function mapDoc(d: any): Member {
    const data = d.data();
    return {
        id: d.id,
        fullName: data.fullName ?? "",
        email: data.email ?? "",
        city: data.city ?? "",
        age: Number(data.age ?? 0),
        status: (data.status ?? "active") as MemberStatus,
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: toISODate(data.createdAt),
    };
}

const COL = "members";

export async function listMembers(): Promise<Member[]> {
    const q = query(collection(db, COL), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(mapDoc);
}

export async function createMember(input: MemberInput): Promise<Member> {
    const ref = await addDoc(collection(db, COL), {
        ...input,
        createdAt: serverTimestamp(),
    });

    // We return a Member immediately (createdAt might be empty until server resolves).
    return {
        id: ref.id,
        ...input,
        createdAt: new Date().toISOString().slice(0, 10),
    };
}

export async function updateMember(id: string, patch: Partial<MemberInput>): Promise<Member> {
    await updateDoc(doc(db, COL, id), {
        ...patch,
    });


    return {
        id,
        fullName: patch.fullName ?? "",
        email: patch.email ?? "",
        city: patch.city ?? "",
        age: Number(patch.age ?? 0),
        status: (patch.status ?? "active") as MemberStatus,
        tags: patch.tags ?? [],
        createdAt: "",
    };
}

export async function deleteMember(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}

/** Optional helper: seed with createdAt explicit (so ordering works immediately) */
export async function seedMembersBulk(rows: Array<Omit<MemberInput, "status"> & { status?: MemberStatus }>) {
    for (const r of rows) {
        await addDoc(collection(db, COL), {
            ...r,
            status: r.status ?? "active",
            createdAt: Timestamp.now(),
        });
    }
}
