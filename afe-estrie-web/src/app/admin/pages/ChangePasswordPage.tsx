import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
} from "firebase/auth";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../../services/firebase";

function isStrongEnough(pw: string) {
    return pw.length >= 10;
}

export function ChangePasswordPage() {
    const nav = useNavigate();

    const email = useMemo(() => auth.currentUser?.email ?? "", [auth.currentUser]);

    const [currentPw, setCurrentPw] = useState(""); // temporary password (current)
    const [pw1, setPw1] = useState(""); // new password
    const [pw2, setPw2] = useState(""); // confirm new password

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [ok, setOk] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setOk(null);

        const user = auth.currentUser;

        if (!user || !user.email) {
            setError("Session expirée. Veuillez vous reconnecter.");
            return;
        }

        if (!currentPw) {
            setError("Veuillez entrer le mot de passe temporaire.");
            return;
        }

        if (!pw1 || !pw2) {
            setError("Veuillez remplir les deux champs du nouveau mot de passe.");
            return;
        }

        if (pw1 !== pw2) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        if (!isStrongEnough(pw1)) {
            setError("Mot de passe trop faible. Minimum 10 caractères.");
            return;
        }

        try {
            setBusy(true);

            // 1) Re-authenticate using the current/temporary password
            const cred = EmailAuthProvider.credential(user.email, currentPw);
            await reauthenticateWithCredential(user, cred);

            // 2) Update Firebase Auth password
            await updatePassword(user, pw1);

            // 3) Clear the mustChangePassword flag in Firestore
            await updateDoc(doc(db, "admin_users", user.uid), {
                mustChangePassword: false,
                updatedAt: serverTimestamp(),
            });

            setOk("Mot de passe mis à jour.");
            setCurrentPw("");
            setPw1("");
            setPw2("");

            // 4) Go back to admin dashboard
            nav("/admin/login", { replace: true });
        } catch (err: any) {
            console.error("ChangePassword error FULL:", err);

            const code = String(err?.code || "");
            if (code === "auth/wrong-password") {
                setError("Mot de passe temporaire incorrect.");
            } else if (code === "auth/too-many-requests") {
                setError("Trop de tentatives. Réessayez plus tard.");
            } else if (code === "auth/weak-password") {
                setError("Mot de passe trop faible.");
            } else if (code === "auth/requires-recent-login") {
                setError(
                    "Pour des raisons de sécurité, veuillez vous déconnecter puis vous reconnecter, et réessayez."
                );
            } else {
                setError(err?.message || "Erreur lors de la mise à jour du mot de passe.");
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h1 className="text-lg font-bold text-gray-900">Changer votre mot de passe</h1>
                <p className="mt-1 text-sm text-gray-600">
                    Pour des raisons de sécurité, vous devez remplacer le mot de passe temporaire.
                </p>

                {email ? (
                    <div className="mt-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                        Connecté en: <span className="font-semibold">{email}</span>
                    </div>
                ) : null}

                <form onSubmit={onSubmit} className="mt-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Mot de passe temporaire (actuel)
                        </label>
                        <input
                            type="password"
                            value={currentPw}
                            onChange={(e) => setCurrentPw(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:border-gray-400"
                            placeholder="Entrez le mot de passe temporaire"
                            autoComplete="current-password"
                            disabled={busy}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nouveau mot de passe
                        </label>
                        <input
                            type="password"
                            value={pw1}
                            onChange={(e) => setPw1(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:border-gray-400"
                            placeholder="Minimum 10 caractères"
                            autoComplete="new-password"
                            disabled={busy}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Confirmer le mot de passe
                        </label>
                        <input
                            type="password"
                            value={pw2}
                            onChange={(e) => setPw2(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-2 outline-none focus:border-gray-400"
                            placeholder="Répétez le mot de passe"
                            autoComplete="new-password"
                            disabled={busy}
                        />
                    </div>

                    {error ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
                            {error}
                        </div>
                    ) : null}

                    {ok ? (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 whitespace-pre-wrap">
                            {ok}
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        disabled={busy}
                        className="w-full rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                    >
                        {busy ? "Mise à jour..." : "Enregistrer"}
                    </button>
                </form>

                <div className="mt-4 text-xs text-gray-500">
                    Astuce: utilisez une phrase de passe (ex: 3-4 mots + chiffres).
                </div>
            </div>
        </div>
    );
}
