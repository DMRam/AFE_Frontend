import { Outlet } from "react-router-dom";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SiteNav } from "./components/layout/SiteNav";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <SiteNav />

      <main>
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
}
