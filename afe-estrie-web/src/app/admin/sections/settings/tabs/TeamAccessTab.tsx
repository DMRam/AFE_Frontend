import { useState } from "react";
import { ShieldPlus } from "lucide-react";
import { FlashMessage } from "../components/FlashMessage";
import { TeamUserRow } from "../components/TeamUserRow";
import { useTeamUsers } from "../hooks/useTeamUsers";
import {
  apiCreateDashboardUser,
  apiDeleteDashboardUser,
  apiSetDashboardUserDisabled,
  apiSetDashboardUserRole,
  type Role,
} from "../api/team";

function s(v: any) {
  return String(v ?? "").trim();
}

type Props = {
  meUid: string | null;
};

export function TeamAccessTab({ meUid }: Props) {
  const { teamUsers, teamErr } = useTeamUsers(true);

  const [teamMsg, setTeamMsg] = useState<string | null>(null);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [teamBusy, setTeamBusy] = useState(false);

  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("editor");

  async function createTeamUser() {
    setLocalErr(null);
    setTeamMsg(null);

    const email = s(newEmail).toLowerCase();
    const password = s(newPass);
    const displayName = s(newName) || "Utilisateur";

    if (!email.includes("@")) return setLocalErr("Email invalide.");
    if (password.length < 10) return setLocalErr("Mot de passe temporaire: min 10 caractères.");

    try {
      setTeamBusy(true);
      const res: any = await apiCreateDashboardUser({ email, password, displayName, role: newRole });

      if (res?.ok) {
        setTeamMsg("Utilisateur créé. Transmettez le mot de passe temporaire.");
        setNewEmail("");
        setNewPass("");
        setNewName("");
        setNewRole("editor");
      } else {
        setLocalErr(res?.error || "Erreur lors de la création.");
      }
    } catch (e: any) {
      setLocalErr(e?.message || "Impossible de créer l'utilisateur.");
    } finally {
      setTeamBusy(false);
    }
  }

  async function setUserDisabled(uid: string, disabled: boolean) {
    setLocalErr(null);
    setTeamMsg(null);

    if (uid === meUid) {
      setLocalErr("Vous ne pouvez pas modifier votre propre statut.");
      return;
    }

    try {
      setTeamBusy(true);
      const res: any = await apiSetDashboardUserDisabled({ uid, disabled });

      if (res?.ok) setTeamMsg(disabled ? "Utilisateur désactivé." : "Utilisateur réactivé.");
      else setLocalErr(res?.error || "Impossible de modifier l'utilisateur.");
    } catch (e: any) {
      setLocalErr(e?.message || "Impossible de modifier l'utilisateur.");
    } finally {
      setTeamBusy(false);
    }
  }

  async function setUserRole(uid: string, role: Role) {
    setLocalErr(null);
    setTeamMsg(null);

    if (uid === meUid) {
      setLocalErr("Vous ne pouvez pas modifier votre propre rôle.");
      return;
    }

    try {
      setTeamBusy(true);
      const res: any = await apiSetDashboardUserRole({ uid, role });
      if (res?.ok) setTeamMsg("Rôle mis à jour.");
      else setLocalErr(res?.error || "Impossible de modifier le rôle.");
    } catch (e: any) {
      setLocalErr(e?.message || "Impossible de modifier le rôle.");
    } finally {
      setTeamBusy(false);
    }
  }

  async function deleteUser(uid: string) {
    setLocalErr(null);
    setTeamMsg(null);

    if (uid === meUid) {
      setLocalErr("Vous ne pouvez pas supprimer votre propre compte.");
      return;
    }

    if (!confirm("Supprimer cet utilisateur définitivement ?")) return;

    try {
      setTeamBusy(true);
      const res: any = await apiDeleteDashboardUser({ uid });
      if (res?.ok) setTeamMsg("Utilisateur supprimé.");
      else setLocalErr(res?.error || "Impossible de supprimer l'utilisateur.");
    } catch (e: any) {
      setLocalErr(e?.message || "Impossible de supprimer l'utilisateur.");
    } finally {
      setTeamBusy(false);
    }
  }

  const err = localErr || teamErr;

  return (
    <div className="space-y-4">
      {(err || teamMsg) ? <FlashMessage kind={err ? "error" : "success"} message={err || teamMsg || ""} /> : null}

      {/* Create */}
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
              type="password"
            />
          </div>
        </div>

        <button
          className="mt-4 w-full rounded-xl bg-gray-900 text-white py-2 text-sm font-medium hover:bg-black disabled:opacity-60"
          type="button"
          disabled={teamBusy}
          onClick={createTeamUser}
        >
          Créer l’utilisateur
        </button>

        <div className="mt-3 text-xs text-gray-500">
          Astuce: envoyez ensuite à l’utilisateur le lien /admin + le mot de passe temporaire.
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <ShieldPlus className="h-4 w-4" />
          Utilisateurs
        </div>
        <div className="text-xs text-gray-500 mb-4">Activer, désactiver, changer le rôle ou supprimer un compte</div>

        <div className="space-y-2">
          {teamUsers.length === 0 ? (
            <div className="text-sm text-gray-500">Aucun utilisateur.</div>
          ) : (
            teamUsers.map((u) => (
              <TeamUserRow
                key={u.uid}
                user={u}
                meUid={meUid}
                busy={teamBusy}
                onDisableToggle={setUserDisabled}
                onDelete={deleteUser}
                onRoleChange={setUserRole}
              />
            ))
          )}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          Recommandation: désactiver est plus sûr que supprimer. Supprimer est définitif.
        </div>
      </div>
    </div>
  );
}
