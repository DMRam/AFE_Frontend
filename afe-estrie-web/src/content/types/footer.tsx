// content/types/footer.ts
export type FooterLink = { id: string; label: string; href: string; enabled?: boolean; order?: number };
export type FooterNewsItem = { id: string; title: string; href: string; date?: string; enabled?: boolean; order?: number };
export type FooterPartner = { id: string; name: string; imageSrc: string; href?: string; enabled?: boolean; order?: number };

export type FooterCMS = {
  brand: { logoSrc?: string; alt?: string };
  contact: {
    title?: string;
    phones?: string[];
    email?: string;
    addressLines?: string[];
  };
  links: { title?: string; items: FooterLink[] };
  news: { title?: string; items: FooterNewsItem[] };
  partner: { title?: string; items: FooterPartner[] };

  social?: { facebook?: string; linkedin?: string };
  bottom?: {
    policyLabel?: string;
    policyHref?: string;
    cookiesLabel?: string;
    cookiesHref?: string;
    creditText?: string; // "Une réalisation de ..."
  };
};
