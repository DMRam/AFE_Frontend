import { useEffect, useState } from "react";
import { auth, db, functions, storage } from "../../../services/firebase";
import {
  updateProfile,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  onAuthStateChanged,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User, ShieldPlus, Mail, Image as ImgIcon } from "lucide-react";

type Role = "admin" | "editor" | "viewer";

function s(v: any) {
  return String(v ?? "").trim();
}

export function SettingsManager() {
  const [tab, setTab] = useState<"me" | "team">("me");
  const [loading, setLoading] = useState(true);

  const [meUid, setMeUid] = useState<string | null>(null);
  const [_meEmail, setMeEmail] = useState("");
  const [meName, setMeName] = useState("");
  const [mePhoto, setMePhoto] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  // My profile form
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Team create user
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("editor");
  const [teamMsg, setTeamMsg] = useState<string | null>(null);
  const [teamErr, setTeamErr] = useState<string | null>(null);

  // Listen auth + claims
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      setErr(null);
      setStatus(null);

      if (!u) {
        setMeUid(null);
        setLoading(false);
        return;
      }

      setMeUid(u.uid);
      setMeEmail(u.email || "");
      setMeName(u.displayName || "");
      setMePhoto(u.photoURL || "");

      setNameInput(u.displayName || "");
      setEmailInput(u.email || "");

      const token = await u.getIdTokenResult();
      setIsAdmin(!!token.claims.admin);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Optional: keep Firestore admin_users in sync for this user
  useEffect(() => {
    if (!meUid) return;
    const refDoc = doc(db, "admin_users", meUid);
    const unsub = onSnapshot(refDoc, (snap) => {
      if (!snap.exists()) return;
      const d = snap.data() as any;
      if (typeof d.displayName === "string" && d.displayName !== meName) {
        // don’t auto-overwrite UI while user is typing; just keep for future
      }
    });
    return () => unsub();
  }, [meUid, meName]);

  async function saveMyProfile() {
    setErr(null);
    setStatus(null);

    const u = auth.currentUser;
    if (!u) return;

    const newNameTrim = s(nameInput);
    if (!newNameTrim) return setErr("Le nom affiché est requis.");

    try {
      // Update Auth profile
      await updateProfile(u, { displayName: newNameTrim });

      // Mirror to Firestore (safe merge)
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

      setMeName(newNameTrim);
      setStatus("Profil mis à jour ✅");
    } catch (e: any) {
      setErr(e?.message || "Impossible de mettre à jour le profil.");
    }
  }

  async function changeMyEmail() {
    setErr(null);
    setStatus(null);

    const u = auth.currentUser;
    if (!u) return;

    const nextEmail = s(emailInput).toLowerCase();
    if (!nextEmail.includes("@")) return setErr("Email invalide.");
    if (!currentPassword) return setErr("Entrez votre mot de passe actuel (sécurité).");

    try {
      // re-auth required by Firebase
      const cred = EmailAuthProvider.credential(u.email || "", currentPassword);
      await reauthenticateWithCredential(u, cred);

      await updateEmail(u, nextEmail);

      await setDoc(
        doc(db, "admin_users", u.uid),
        { email: nextEmail, updatedAt: new Date() },
        { merge: true }
      );

      setMeEmail(nextEmail);
      setCurrentPassword("");
      setStatus("Email mis à jour ✅");
    } catch (e: any) {
      setErr(e?.message || "Impossible de changer l'email.");
    }
  }

  async function uploadAvatar(file: File) {
    setErr(null);
    setStatus(null);

    const u = auth.currentUser;
    if (!u) return;

    try {
      const avatarRef = ref(storage, `admin_avatars/${u.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(avatarRef, file);
      const url = await getDownloadURL(avatarRef);

      await updateProfile(u, { photoURL: url });

      await setDoc(
        doc(db, "admin_users", u.uid),
        { photoURL: url, updatedAt: new Date() },
        { merge: true }
      );

      setMePhoto(url);
      setStatus("Avatar mis à jour ✅");
    } catch (e: any) {
      setErr(e?.message || "Impossible de mettre à jour l'avatar.");
    }
  }

  async function createTeamUser() {
    setTeamErr(null);
    setTeamMsg(null);

    if (!isAdmin) return setTeamErr("Accès réservé aux administrateurs.");

    const email = s(newEmail).toLowerCase();
    const password = s(newPass);
    const displayName = s(newName) || "Utilisateur";

    if (!email.includes("@")) return setTeamErr("Email invalide.");
    if (password.length < 10) return setTeamErr("Mot de passe temporaire: min 10 caractères.");

    try {
      const fn = httpsCallable(functions, "createDashboardUser");
      const res: any = await fn({ email, password, displayName, role: newRole });

      if (res?.data?.ok) {
        setTeamMsg("Utilisateur créé ✅ (donnez-lui le mot de passe temporaire)");
        setNewEmail("");
        setNewPass("");
        setNewName("");
        setNewRole("editor");
      } else {
        setTeamErr("Erreur lors de la création.");
      }
    } catch (e: any) {
      setTeamErr(e?.message || "Impossible de créer l'utilisateur.");
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="text-sm text-gray-500">Chargement…</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-medium border ${
            tab === "me" ? "bg-rose-50/60 border-rose-200 text-rose-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setTab("me")}
          type="button"
        >
          <span className="inline-flex items-center gap-2"><User className="h-4 w-4" /> Mon profil</span>
        </button>

        {isAdmin && (
          <button
            className={`rounded-xl px-4 py-2 text-sm font-medium border ${
              tab === "team" ? "bg-sky-50/60 border-sky-200 text-sky-800" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setTab("team")}
            type="button"
          >
            <span className="inline-flex items-center gap-2"><ShieldPlus className="h-4 w-4" /> Accès équipe</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {(err || status) && (
        <div className={`rounded-2xl border p-4 text-sm ${err ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {err || status}
        </div>
      )}

      {tab === "me" && (
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
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-100"
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
            <div className="text-xs text-gray-500 mb-4">Changer votre email (sécurisé)</div>

            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="email@exemple.com"
            />

            <label className="block text-xs font-medium text-gray-600 mb-1 mt-3">
              Mot de passe actuel
            </label>
            <input
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100"
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
      )}

      {tab === "team" && isAdmin && (
        <div className="space-y-4">
          {(teamErr || teamMsg) && (
            <div className={`rounded-2xl border p-4 text-sm ${teamErr ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {teamErr || teamMsg}
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="text-sm font-semibold text-gray-900 mb-1">Créer un accès équipe</div>
            <div className="text-xs text-gray-500 mb-4">
              Crée un compte pour un intervenant (psychologue, coordonnateur, etc.)
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nom</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Julie Roy"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Rôle</label>
                <select
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                >
                  <option value="viewer">Lecture</option>
                  <option value="editor">Éditeur</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mot de passe temporaire</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="Min 10 caractères"
                />
              </div>
            </div>

            <button
              className="mt-4 w-full rounded-xl bg-gray-900 text-white py-2 text-sm font-medium hover:bg-black"
              type="button"
              onClick={createTeamUser}
            >
              Créer l’utilisateur
            </button>

            <div className="mt-3 text-xs text-gray-500">
              Astuce: envoyez ensuite à l’utilisateur le lien /admin + le mot de passe temporaire.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
