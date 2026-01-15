import v1 from "../../assets/videos/hero/v1.mp4";
import v2 from "../../assets/videos/hero/v2.mp4";
import v3 from "../../assets/videos/hero/v3.mp4";

export const HERO_VIDEOS = {
  v1,
  v2,
  v3,
} as const;

export type HeroVideoKey = keyof typeof HERO_VIDEOS;
