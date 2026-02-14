import type { PageDoc } from "../../../../content/types/pageBlocks";

export type AnySection = any;

export type PageDocExt = PageDoc & {
  categoryId?: string;
};

export type CategoryOption = {
  id: string;
  label: string; // fr-CA
};

export type UploadTarget = "hero" | "split";
