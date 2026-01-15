import { auth } from "./firebase";

export type Actor = {
  uid: string | null;
  email: string | null;
  name: string | null;
};

export function getActor(): Actor {
  const u = auth.currentUser;
  return {
    uid: u?.uid ?? null,
    email: u?.email ?? null,
    name: u?.displayName ?? null,
  };
}

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";


export type AdminActivityType =
  | "NAV_SAVE"
  | "PAGE_SAVE"
  | "PAGE_DELETE";

export async function logAdminActivity(input: {
  type: AdminActivityType;
  title: string;
  detail?: string;
  meta?: Record<string, any>;
}) {
  const actor = getActor();

  await addDoc(collection(db, "admin_activity"), {
    type: input.type,
    title: input.title,
    detail: input.detail ?? "",
    at: serverTimestamp(),

    by: {
      uid: actor.uid,
      email: actor.email,
      name: actor.name,
    },

    meta: input.meta ?? {},
  });
}
