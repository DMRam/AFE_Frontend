import { useEffect, useMemo, useState } from "react";
import type { CookieConsentCMS } from "../content/types/cookieConsent";

type StoredConsent = {
  version: number;
  decidedAt: string;
  categories: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
};

const KEY = "afe_cookie_consent";

export function readStoredConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredConsent;
  } catch {
    return null;
  }
}

export function writeStoredConsent(v: StoredConsent) {
  localStorage.setItem(KEY, JSON.stringify(v));
}

export function useCookieConsentState(cms: CookieConsentCMS | null) {
  const [stored, setStored] = useState<StoredConsent | null>(null);

  useEffect(() => {
    setStored(readStoredConsent());
  }, []);

  const needsConsent = useMemo(() => {
    if (!cms?.enabled) return false;
    if (!stored) return true;
    return stored.version !== cms.version;
  }, [cms, stored]);

  return { stored, setStored, needsConsent };
}
