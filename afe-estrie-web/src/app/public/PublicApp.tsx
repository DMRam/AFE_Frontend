import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "./PublicLayout";
import Landing from "./pages/Landing";
import DynamicPage from "./pages/DynamicPage";
import { useEffect, useState } from "react";

import type { CookieConsentCMS } from "../../content/types/cookieConsent";
import {
  getCookieConsent,
  seedCookieConsentIfMissing,
} from "../../services/cookieConsentRepo";
import { CookieConsent } from "./components/layout/CookieConsent";

export function PublicApp() {
  const [cookieCms, setCookieCms] = useState<CookieConsentCMS | null>(null);

  useEffect(() => {
    (async () => {
      await seedCookieConsentIfMissing();
      const data = await getCookieConsent();
      setCookieCms(data);
    })();
  }, []);

  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/p/*" element={<DynamicPage />} />
        </Route>
      </Routes>

      <CookieConsent cms={cookieCms} />
    </>
  );
}
