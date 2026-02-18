import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { PageDoc } from "../content/types/pageBlocks";
import { logAdminActivity } from "./audit";

const PAGES_COL = "pages";

// consistent doc id
export function pageDocIdFromPageId(pageId: string) {
  // "a-propos/en-bref" -> "a-propos__en-bref"
  return pageId.replace(/\//g, "__");
}

export async function listPages(): Promise<PageDoc[]> {
  const q = query(collection(db, PAGES_COL), orderBy("title", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PageDoc);
}

export async function getPageByDocId(docId: string): Promise<PageDoc | null> {
  const ref = doc(db, PAGES_COL, docId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as PageDoc) : null;
}

export async function upsertPage(page: PageDoc): Promise<void> {
  const docId = pageDocIdFromPageId(page.id);
  const ref = doc(db, PAGES_COL, docId);

  await logAdminActivity({
    type: "PAGE_SAVE",
    title: "Page updated",
    detail: page.title ?? page.id,
    meta: {
      pageId: page.id,
      docId,
    },
  });


  // setDoc with merge lets you create or update
  await setDoc(
    ref,
    {
      ...page,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function patchPage(docId: string, patch: Partial<PageDoc>): Promise<void> {
  const ref = doc(db, PAGES_COL, docId);
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  } as any);
}

export async function removePage(docId: string): Promise<void> {

  await logAdminActivity({
    type: "PAGE_DELETE",
    title: "Page deleted",
    detail: docId,
  });

  const ref = doc(db, PAGES_COL, docId);
  await deleteDoc(ref);
}

export async function getPageByPageId(pageId: string): Promise<PageDoc | null> {
  const docId = pageDocIdFromPageId(pageId);
  return getPageByDocId(docId);
}

export type PublicPageHit = {
  slug: string;
  title: string;
  excerpt?: string;
};

function safeExcerptFromBlocks(page: any): string {
  const texts: string[] = [];

  const push = (v: any) => {
    const t = String(v ?? "").trim();
    if (t) texts.push(t);
  };

  push(page?.title);
  push(page?.subtitle);
  push(page?.description);

  const sections = page?.sections ?? [];
  if (Array.isArray(sections)) {
    for (const s of sections) {
      push(s?.title);
      push(s?.subtitle);
      push(s?.text);
      push(s?.body);
      push(s?.description);

      if (Array.isArray(s?.items)) {
        for (const it of s.items) {
          push(it?.title);
          push(it?.subtitle);
          push(it?.text);
          push(it?.body);
          push(it?.description);
        }
      }
    }
  }

  const joined = texts.join(" ").replace(/\s+/g, " ").trim();
  return joined.slice(0, 260);
}


export async function listPublicPages(): Promise<PublicPageHit[]> {
  const qy = query(collection(db, PAGES_COL), where("published", "==", true));
  const snap = await getDocs(qy);
  const pages = snap.docs.map((d) => d.data() as PageDoc);

  return pages.map((p: any) => ({
    slug: p.id,
    title: p.title ?? p.id,
    excerpt: p.excerpt ?? p.description ?? safeExcerptFromBlocks(p),
  }));
}
