export type PageDoc = {
  id: string;            // "a-propos/en-bref"
  title: string;         // Admin label
  slug: string;          // "/a-propos/en-bref"
  sections: PageSection[];
  seo?: { title?: string; description?: string; image?: string };
};

export type PageSection =
  | HeroSection
  | RichTextSection
  | SplitTextImageSection;

export type HeroSection = {
  type: "hero";
  id: string;
  enabled?: boolean;
  title: string;
  subtitle?: string;
  backgroundImage?: string;  
  align?: "left" | "center";
};

export type RichTextSection = {
  type: "richText";
  id: string;
  enabled?: boolean;
  content: string;  
};

export type SplitTextImageSection = {
  type: "split";
  id: string;
  enabled?: boolean;
  title?: string;
  content: string;        
  imageUrl?: string;
  imageAlt?: string;
  imageSide?: "left" | "right";
};
