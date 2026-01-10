import { useMemo, useState } from "react";
import { AdminLayout, type AdminSectionId } from "../ui/AdminLayout";
import { AdminPanel, AdminStat } from "../ui/AdminPanel";
import { NavManager } from "../sections/NavManager";

type ChangeItem = {
  id: string;
  when: string;
  title: string;
  detail: string;
};

export default function AdminDashboard() {
  const [active, setActive] = useState<AdminSectionId>("overview");

  // Dummy “recent changes” (later from Firestore audit/log)
  const recent: ChangeItem[] = useMemo(
    () => [
      {
        id: "1",
        when: "Today • 10:24",
        title: "Navigation updated",
        detail: "Added submenu item under À propos",
      },
      {
        id: "2",
        when: "Yesterday • 18:10",
        title: "Membership modal content",
        detail: "Updated pricing text block",
      },
      {
        id: "3",
        when: "Last week",
        title: "Homepage hero",
        detail: "Changed slide #2 title",
      },
    ],
    []
  );

  return (
    <AdminLayout
      title="AFE Admin"
      subtitle="Client edits content only"
      active={active}
      onChange={setActive}
    >
      {/* OVERVIEW */}
      {active === "overview" ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <AdminStat label="Editable areas" value="6" hint="Nav, pages, home, events, footer, settings" />
            <AdminStat label="Draft changes" value="3" hint="Saved locally for now • Firebase later" />
            <AdminStat label="Last publish" value="—" hint="Add publish pipeline when ready" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <AdminPanel
              title="Quick actions"
              description="Jump to the main places clients will edit."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <QuickAction
                  title="Edit navigation"
                  desc="Top menu + submenus"
                  onClick={() => setActive("navigation")}
                />
                <QuickAction
                  title="Edit pages"
                  desc="À propos > En bref…"
                  disabled
                  onClick={() => setActive("pages")}
                />
                <QuickAction
                  title="Homepage"
                  desc="Hero, quick cards…"
                  disabled
                  onClick={() => setActive("homepage")}
                />
                <QuickAction
                  title="Footer & contact"
                  desc="Address, phone, links"
                  disabled
                  onClick={() => setActive("footer")}
                />
              </div>
            </AdminPanel>

            <AdminPanel title="Recent changes" description="Activity feed (Firebase audit later)">
              <div className="space-y-3">
                {recent.map((x) => (
                  <div
                    key={x.id}
                    className="rounded-xl border bg-gray-50 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-gray-900">
                        {x.title}
                      </div>
                      <div className="text-xs text-gray-500">{x.when}</div>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">{x.detail}</div>
                  </div>
                ))}
              </div>
            </AdminPanel>
          </div>
        </div>
      ) : null}

      {/* NAVIGATION */}
      {active === "navigation" ? (
        <AdminPanel
          title="Navigation"
          description="Edit the top menu + submenus (dummy now, Firestore later)."
          right={
            <button
              type="button"
              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              onClick={() => setActive("overview")}
            >
              Back
            </button>
          }
        >
          <NavManager />
        </AdminPanel>
      ) : null}

      {/* PLACEHOLDERS */}
      {active !== "overview" && active !== "navigation" ? (
        <AdminPanel
          title="Planned section"
          description="We’ll add this next. The UI shell is ready."
          right={
            <button
              type="button"
              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              onClick={() => setActive("overview")}
            >
              Back
            </button>
          }
        >
          <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700">
            This section will edit content stored in Firebase. Styles remain developer-owned.
          </div>
        </AdminPanel>
      ) : null}
    </AdminLayout>
  );
}

function QuickAction({
  title,
  desc,
  onClick,
  disabled,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "rounded-2xl border bg-white p-4 text-left shadow-sm transition",
        "hover:shadow-md hover:-translate-y-[1px]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:translate-y-0",
      ].join(" ")}
    >
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-1 text-sm text-gray-600">{desc}</div>
      <div className="mt-3 text-xs font-semibold text-red-700">
        {disabled ? "Coming soon" : "Open"}
      </div>
    </button>
  );
}
