import { Outlet } from "react-router-dom";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SiteNav } from "./components/layout/SiteNav";
import { SiteFooter } from "./components/layout/SiteFooter";
import { InfoLetterSection } from "./pages/InfoLetterSection";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <SiteNav />
      <main>
        <Outlet />
        <InfoLetterSection />
      </main>
      <SiteFooter />
    </div>
  );
}
