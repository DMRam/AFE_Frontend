export type FooterLink = { id: string; label: string; href: string; enabled?: boolean; order?: number };
export type FooterNewsItem = {
  id: string;
  title: string;
  href: string;
  date?: string;
  category?: string;
  enabled?: boolean;
  order?: number
};
export type FooterPartner = {
  id: string;
  name: string;
  imageSrc?: string;
  href?: string;
  enabled?: boolean;
  order?: number
};

export type HoursItem = {
  day: string;
  hours: string;
  closed?: boolean;
  enabled?: boolean;
  order?: number;
};

export type SocialId = "facebook" | "linkedin" | "instagram" | "youtube";

export type SocialItem = {
  id: SocialId;
  label: string;
  href: string;
  enabled?: boolean;
  order?: number;
};

export type FooterSocialCMS = {
  enabled?: boolean;
  items: SocialItem[];
};

export type FooterCMS = {
  brand: {
    logoSrc?: string;
    alt?: string;
    name?: string;
    tagline?: string;
  };
  contact: {
    title?: string;
    phones?: string[];
    email?: string;
    addressLines?: string[];
  };
  links: {
    title?: string;
    items: FooterLink[]
  };
  news: {
    title?: string;
    items: FooterNewsItem[]
  };
  partner: {
    title?: string;
    items: FooterPartner[]
  };
  hours?: {
    title?: string;
    items: HoursItem[];
  };

  // ✅ Social links (for top bar)
  social?: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };

  // ✅ floating buttons config
  socialFloating?: FooterSocialCMS;

  // ✅ Admin panel link
  admin?: {
    label?: string;
    loginHref?: string;
  };

  bottom?: {
    policyLabel?: string;
    policyHref?: string;
    cookiesLabel?: string;
    cookiesHref?: string;
    termsLabel?: string;
    termsHref?: string;
    creditText?: string;
    adminLabel?: string;
    adminHref?: string;
  };
};