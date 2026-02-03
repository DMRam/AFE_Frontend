// src/scripts/seedMembers.ts
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../services/firebase";

const dummyMembers = [
    {
        fullName: "Marie Tremblay",
        email: "marie.tremblay@example.com",
        city: "Sherbrooke",
        age: 42,
        status: "active",
        tags: ["newsletter", "support-group"],
    },
    {
        fullName: "Jean Gagnon",
        email: "jean.gagnon@example.com",
        city: "Magog",
        age: 55,
        status: "active",
        tags: ["newsletter"],
    },
    {
        fullName: "Sophie Roy",
        email: "sophie.roy@example.com",
        city: "Sherbrooke",
        age: 33,
        status: "inactive",
        tags: ["volunteer"],
    },
    {
        fullName: "Alex Nguyen",
        email: "alex.nguyen@example.com",
        city: "Montréal",
        age: 29,
        status: "active",
        tags: ["support-group"],
    },
    {
        fullName: "Camille Bouchard",
        email: "camille.bouchard@example.com",
        city: "Longueuil",
        age: 47,
        status: "active",
        tags: ["newsletter", "volunteer"],
    },
];

export async function seedMembers() {
    const ref = collection(db, "members");

    for (const m of dummyMembers) {
        await addDoc(ref, {
            ...m,
            createdAt: Timestamp.now(),
        });
    }

    console.log("✅ Members seeded");
}


/**
 * <button
                onClick={seedMembers}
                className="rounded bg-red-600 px-4 py-2 text-white"
            >
                Seed members (RUN ONCE)
            </button>
 */
