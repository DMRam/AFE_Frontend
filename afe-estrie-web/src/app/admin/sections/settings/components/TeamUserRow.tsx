import { useEffect, useState } from "react";
import { Ban, CheckCircle2, Trash2 } from "lucide-react";
import type { Role } from "../api/team";
import type { TeamUser } from "../hooks/useTeamUsers";

type Props = {
  user: TeamUser;
  meUid: string | null;
  busy: boolean;
  onDisableToggle: (uid: string, disabled: boolean) => Promise<void> | void;
  onDelete: (uid: string) => Promise<void> | void;
  onRoleChange: (uid: string, role: Role) => Promise<void> | void;
};

export function TeamUserRow({
  user,
  meUid,
  busy,
  onDisableToggle,
  onDelete,
  onRoleChange,
}: Props) {
  const isMe = Boolean(meUid && user.uid === meUid);
  const disabled = Boolean(user.disabled);

  const currentRole = (user.role || "viewer") as Role;

  // local state for select
  const [roleDraft, setRoleDraft] = useState<Role>(currentRole);
  const [savingRole, setSavingRole] = useState(false);

  // keep draft in sync when firestore updates
  useEffect(() => {
    setRoleDraft(currentRole);
  }, [currentRole]);

  async function handleRoleChange(next: Role) {
    setRoleDraft(next);
    setSavingRole(true);
    try {
      await onRoleChange(user.uid, next);
    } finally {
      setSavingRole(false);
    }
  }

  const name = user.displayName || "Utilisateur";

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${
        disabled ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-gray-900 truncate">{name}</div>

          {isMe ? (
            <span className="text-xs rounded-full border border-gray-200 px-2 py-0.5 text-gray-600">
              Vous
            </span>
          ) : null}

          {disabled ? (
            <span className="text-xs rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-red-700">
              Désactivé
            </span>
          ) : null}
        </div>

        <div className="text-xs text-gray-600 truncate">{user.email}</div>

        {/* Role editor */}
        <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
          <span>Rôle:</span>

          <select
            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs"
            value={roleDraft}
            disabled={busy || savingRole || isMe}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
          >
            <option value="viewer">viewer</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>

          {savingRole ? (
            <span className="text-[11px] text-gray-400">Mise à jour…</span>
          ) : (
            <span className="text-[11px] text-gray-400">(prend effet au prochain login)</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {disabled ? (
          <button
            type="button"
            disabled={busy || isMe}
            onClick={() => onDisableToggle(user.uid, false)}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
          >
            <CheckCircle2 className="h-4 w-4" />
            Réactiver
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || isMe}
            onClick={() => onDisableToggle(user.uid, true)}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60"
          >
            <Ban className="h-4 w-4" />
            Désactiver
          </button>
        )}

        <button
          type="button"
          disabled={busy || isMe}
          onClick={() => onDelete(user.uid)}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>
    </div>
  );
}
