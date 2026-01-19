export type ConsentMode = "opt_in" | "opt_out"; // opt_in = blocks analytics/marketing until accept

export type CookieConsentCMS = {
  enabled: boolean;
  version: number; // bump to force re-consent when text changes
  mode: ConsentMode;

  // text
  title: string;
  message: string;

  // buttons
  acceptLabel: string;
  rejectLabel: string;
  prefsLabel: string;

  // links (optional)
  cookiesPolicyUrl?: string;
  privacyPolicyUrl?: string;
  cookiesPolicyLabel?: string;
  privacyPolicyLabel?: string;

  // categories (toggleable)
  categories: {
    necessary: { enabled: boolean; locked: boolean; label: string; desc: string };
    analytics:  { enabled: boolean; label: string; desc: string };
    marketing:  { enabled: boolean; label: string; desc: string };
  };

  // UI placement
  position: "bottom-right" | "bottom-left" | "bottom";
};
