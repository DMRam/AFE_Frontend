import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadImage(file: File, folder = "page-images") {
  const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
  const path = `${folder}/${Date.now()}-${safeName}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}

export async function uploadHomeMedia(file: File) {
  const safeName = file.name.replace(/[^\w.-]+/g, "_");
  const path = `sitePages/home/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, path);

  const snap = await uploadBytes(storageRef, file, { contentType: file.type });
  const url = await getDownloadURL(snap.ref);

  return { url, path };
}
