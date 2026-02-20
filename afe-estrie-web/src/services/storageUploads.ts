import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadPdf(file: File) {
  if (file.type !== "application/pdf") {
    throw new Error("Le fichier doit être un PDF.");
  }

  const safe = file.name.replace(/[^\w.-]+/g, "_");
  const path = `sitePages/home/resources/${Date.now()}_${safe}`;
  const r = ref(storage, path);

  const snap = await uploadBytes(r, file, { contentType: file.type });
  const url = await getDownloadURL(snap.ref);

  return { url, path };
}