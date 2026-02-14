import { useEffect, useState } from "react";
import { updateEmail, updateProfile, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { Image as ImgIcon, Mail, User } from "lucide-react";
import { FlashMessage } from "../components/FlashMessage";
import { auth, db, storage } from "../../../../../services/firebase";

function s(v: any) {
  return String(v ?? "").trim();
}

type Props = {
  meUid: string | null;
  meEmail: string;
  meName: string;
  mePhoto: string;
  onMeUpdated?: (patch: { meEmail?: string; meName?: string; mePhoto?: string }) => void;
};

export function MyProfileTab({ meUid, meEmail, meName, mePhoto, onMeUpdated }: Props) {
  const [nameInput, setNameInput] = useState(meName || "");
  const [emailInput, setEmailInput] = useState(meEmail || "");
  const [currentPassword, setCurrentPassword] = useState("");

  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => setNameInput(meName || ""), [meName]);
  useEffect(() => setEmailInput(meEmail || ""), [meEmail]);

  async function saveMyProfile() {
    setErr(null);
    setStatus(null);

    const u = auth.currentUser;
    if (!u || !meUid) return;

    const newNameTrim = s(nameInput);
    if (!newNameTrim) return setErr("Le nom affiché est requis.");

    try {
      await updateProfile(u, { displayName: newNameTrim });

      await setDoc(
        doc(db, "admin_users", u.uid),
        {
          uid: u.uid,
          displayName: newNameTrim,
          email: u.email || "",
          photoURL: u.photoURL || "",
          updatedAt: new Date(),
        },
        { merge: true }
      );

      onMeUpdated?.({ meName: newNameTrim });
      setStatus("Profil mis à jour.");
    } catch (e: any) {
      setErr(e?.message || "Impossible de mettre à jour le profil.");
    }
  }

  async function changeMyEmail() {
    setErr(null);
    setStatus(null);

    const u = auth.currentUser;
    if (!u || !meUid) return;

    const nextEmail = s(emailInput).toLowerCase();
    if (!nextEmail.includes("@")) return setErr("Email invalide.");
    if (!currentPassword) return setErr("Entrez votre mot de passe actuel.");

    try {
      const cred = EmailAuthProvider.credential(u.email || "", currentPassword);
      await reauthenticateWithCredential(u, cred);

      await updateEmail(u, nextEmail);

      await setDoc(doc(db, "admin_users", u.uid), { email: nextEmail, updatedAt: new Date() }, { merge: true });

      onMeUpdated?.({ meEmail: nextEmail });
      setCurrentPassword("");
      setStatus("Email mis à jour.");
    } catch (e: any) {
      setErr(e?.message || "Impossible de changer l'email.");
    }
  }

  async function uploadAvatar(file: File) {
    setErr(null);
    setStatus(null);

    const u = auth.currentUser;
    if (!u || !meUid) return;

    try {
      const avatarRef = ref(storage, `admin_avatars/${u.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);

      await updateProfile(u, { photoURL: url });
      await setDoc(doc(db, "admin_users", u.uid), { photoURL: url, updatedAt: new Date() }, { merge: true });

      onMeUpdated?.({ mePhoto: url });
      setStatus("Avatar mis à jour.");
    } catch (e: any) {
      setErr(e?.message || "Impossible de mettre à jour l'avatar.");
    }
  }

  return (
    <div className="space-y-4">
      {(err || status) ? <FlashMessage kind={err ? "error" : "success"} message={err || status || ""} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm font-semibold text-gray-900 mb-1">Informations</div>
          <div className="text-xs text-gray-500 mb-4">Nom affiché et avatar</div>

          <div className="flex items-center gap-3 mb-4">
            {mePhoto ? (
              <img src={mePhoto} className="h-12 w-12 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                <User className="h-5 w-5" />
              </div>
            )}

            <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
              <ImgIcon className="h-4 w-4 text-gray-500" />
              Changer l’avatar
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadAvatar(f);
                }}
              />
            </label>
          </div>

          <label className="block text-xs font-medium text-gray-600 mb-1">Nom affiché</label>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ex: Marie Tremblay"
          />

          <button
            className="mt-4 w-full rounded-xl bg-gray-900 text-white py-2 text-sm font-medium hover:bg-black"
            type="button"
            onClick={saveMyProfile}
          >
            Enregistrer
          </button>
        </div>

        {/* Email */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="text-sm font-semibold text-gray-900 mb-1">Connexion</div>
          <div className="text-xs text-gray-500 mb-4">Changer votre email</div>

          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="email@exemple.com"
          />

          <label className="block text-xs font-medium text-gray-600 mb-1 mt-3">Mot de passe actuel</label>
          <input
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            type="password"
          />

          <button
            className="mt-4 w-full rounded-xl border border-sky-200 bg-sky-50/60 text-sky-800 py-2 text-sm font-semibold hover:bg-sky-50"
            type="button"
            onClick={changeMyEmail}
          >
            <span className="inline-flex items-center gap-2">
              <Mail className="h-4 w-4" /> Mettre à jour l’email
            </span>
          </button>

          <div className="mt-3 text-xs text-gray-500">
            Note: Firebase peut demander une reconnexion si la session est ancienne.
          </div>
        </div>
      </div>
    </div>
  );
}
