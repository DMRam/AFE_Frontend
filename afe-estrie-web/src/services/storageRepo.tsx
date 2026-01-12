import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadImage(file: File, folder = "page-images") {
  const safeName = file.name.replace(/\s+/g, "-").toLowerCase();
  const path = `${folder}/${Date.now()}-${safeName}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return await getDownloadURL(r);
}
