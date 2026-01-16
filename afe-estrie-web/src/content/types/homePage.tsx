export type HeroCTA = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export type HeroSlideCMS = {
  id?: string;
  enabled?: boolean;
  order?: number;

  // legacy preset
  videoKey?: "v1" | "v2" | "v3";

  // new CMS media
  mediaType?: "video" | "image";
  mediaSrc?: string;
  poster?: string;

  eyebrow: string;
  title: string;
  description?: string;

  ctas?: HeroCTA[];
  ctaLabel?: string;
  ctaHref?: string;
};


export type HomeHeroCMS = {
  enabled: boolean;
  intervalSeconds?: number;
  fadeMs?: number;
  slides: HeroSlideCMS[];
};

export type QuickCardCMS = {
  id: string;
  enabled: boolean;
  order: number;
  title: string;
  description?: string;
  href?: string;
  icon?: string;
};

export type HomeQuickCardsCMS = {
  enabled: boolean;
  heading?: string;
  cards: QuickCardCMS[];
};

export type PartnersStripCMS = {
  enabled: boolean;
  heading?: string;
  logos?: {
    id: string;
    enabled: boolean;
    order: number;
    alt: string;
    src: string;
  }[];
};

export type HomeSectionHeaderCMS = {
  heading: string;
  subheading?: string;
};

export type HomeActivitiesPreviewCMS = {
  enabled: boolean;
  header?: HomeSectionHeaderCMS;
  ctaLabel?: string;
  ctaHref?: string;
};

export type HomeEventsPreviewCMS = {
  enabled: boolean;
  header?: HomeSectionHeaderCMS;
  ctaLabel?: string;
  ctaHref?: string;
};

export type HomeResourcesPreviewCMS = {
  enabled: boolean;
  header?: HomeSectionHeaderCMS;
  ctaLabel?: string;
  ctaHref?: string;
};

export type FeatureIconKey = "brain" | "sleep" | "balance" | "stairs";

export type FeatureItemCMS = {
  id: string;
  enabled?: boolean;
  order?: number;
  icon?: FeatureIconKey; // keep, but you can lock it in UI
  title?: string;
  description?: string;
};

export type FeaturesBlockCMS = {
  enabled: boolean;
  eyebrow?: string;      // small label (optional)
  heading?: string;      // big title
  subheading?: string;   // paragraph
  items: FeatureItemCMS[];
};
export type HomeNewsItemCMS = {
  id: string;
  enabled?: boolean;
  order?: number;

  title?: string;
  excerpt?: string;
  href?: string;
  date?: string;
  readingTime?: string;
  coverSrc?: string;
  coverAlt?: string;

  pageDocId?: string;
};

export type HomeNewsPreviewCMS = {
  enabled: boolean;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items: HomeNewsItemCMS[];
};

export type HomeContactCMS = {
  enabled: boolean;
  mapUrl?: string;
  hours?: { label: string; value: string }[];
  orgName?: string;
  phones?: { label?: string; value: string }[];
  email?: string;
  address?: string;
  directionsUrl?: string;
};

export type FooterLinkCMS = {
  id: string;
  enabled?: boolean;
  order?: number;
  label: string;
  href: string;
};

export type FooterColumnCMS = {
  id: string;
  enabled?: boolean;
  order?: number;
  heading: string;
  links?: FooterLinkCMS[];
  // optional “custom” content
  text?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export type HomeFooterCMS = {
  enabled: boolean;
  columns: FooterColumnCMS[];
  social?: { facebook?: string; linkedin?: string };
  copyright?: string;
};


export type HomePageCMS = {
  updatedAt?: number;

  hero: HomeHeroCMS;
  quickCards: HomeQuickCardsCMS;
  features?: FeaturesBlockCMS;
  partners: PartnersStripCMS;
  activities: HomeActivitiesPreviewCMS;
  events: HomeEventsPreviewCMS;
  resources: HomeResourcesPreviewCMS;
  news?: HomeNewsPreviewCMS;
  contact?: HomeContactCMS;
  footer?: HomeFooterCMS;
};
