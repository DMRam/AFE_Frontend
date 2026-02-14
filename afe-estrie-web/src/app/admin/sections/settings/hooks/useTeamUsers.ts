import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import type { Role } from "../api/team";
import { db } from "../../../../../services/firebase";

export type TeamUser = {
  uid: string;
  email: string;
  displayName?: string;
  role?: Role;
  disabled?: boolean;
  mustChangePassword?: boolean;
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
};

export function useTeamUsers(enabled: boolean) {
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [teamErr, setTeamErr] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setTeamUsers([]);
      return;
    }

    const qy = query(collection(db, "admin_users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const users = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            uid: d.id,
            email: data.email || "",
            displayName: data.displayName || "",
            role: (data.role || "viewer") as Role,
            disabled: Boolean(data.disabled),
            mustChangePassword: Boolean(data.mustChangePassword),
            photoURL: data.photoURL || "",
            createdAt: data.createdAt ?? null,
            updatedAt: data.updatedAt ?? null,
          };
        });
        setTeamUsers(users);
      },
      (e) => {
        console.error(e);
        setTeamErr("Impossible de charger la liste des utilisateurs.");
      }
    );

    return () => unsub();
  }, [enabled]);

  return { teamUsers, teamErr };
}
