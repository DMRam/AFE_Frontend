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

export type HomePageCMS = {
  updatedAt?: number;

  hero: HomeHeroCMS;
  quickCards: HomeQuickCardsCMS;
  features?: FeaturesBlockCMS;
  partners: PartnersStripCMS;
  activities: HomeActivitiesPreviewCMS;
  events: HomeEventsPreviewCMS;
  resources: HomeResourcesPreviewCMS;
};
