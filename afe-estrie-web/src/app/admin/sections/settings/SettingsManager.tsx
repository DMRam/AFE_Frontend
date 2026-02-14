import { useState } from "react";
import { ShieldPlus, User } from "lucide-react";
import { useAdminClaims } from "./hooks/useAdminClaims";
import { MyProfileTab } from "./tabs/MyProfileTab";
import { TeamAccessTab } from "./tabs/TeamAccessTab";

export function SettingsManager() {
  const [tab, setTab] = useState<"me" | "team">("me");
  const { loading, meUid, meEmail, meName, mePhoto, isAdmin } = useAdminClaims();

  // local overrides (optional) - so UI updates immediately after save
  const [localMeEmail, setLocalMeEmail] = useState<string | null>(null);
  const [localMeName, setLocalMeName] = useState<string | null>(null);
  const [localMePhoto, setLocalMePhoto] = useState<string | null>(null);

  const effectiveEmail = localMeEmail ?? meEmail;
  const effectiveName = localMeName ?? meName;
  const effectivePhoto = localMePhoto ?? mePhoto;

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="text-sm text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button
          className={`rounded-xl px-4 py-2 text-sm font-medium border ${
            tab === "me"
              ? "bg-rose-50/60 border-rose-200 text-rose-800"
              : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
          onClick={() => setTab("me")}
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <User className="h-4 w-4" /> Mon profil
          </span>
        </button>

        {isAdmin && (
          <button
            className={`rounded-xl px-4 py-2 text-sm font-medium border ${
              tab === "team"
                ? "bg-sky-50/60 border-sky-200 text-sky-800"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setTab("team")}
            type="button"
          >
            <span className="inline-flex items-center gap-2">
              <ShieldPlus className="h-4 w-4" /> Accès équipe
            </span>
          </button>
        )}
      </div>

      {tab === "me" && (
        <MyProfileTab
          meUid={meUid}
          meEmail={effectiveEmail}
          meName={effectiveName}
          mePhoto={effectivePhoto}
          onMeUpdated={(patch) => {
            if (patch.meEmail) setLocalMeEmail(patch.meEmail);
            if (patch.meName) setLocalMeName(patch.meName);
            if (patch.mePhoto) setLocalMePhoto(patch.mePhoto);
          }}
        />
      )}

      {tab === "team" && isAdmin && <TeamAccessTab meUid={meUid} />}
    </div>
  );
}
