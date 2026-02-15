export type CtaVariant = "primary" | "secondary" | "outline";
export type TextPreset = "auto" | "white" | "black" | "gray" | "red" | "blue";

export type HeroCta = {
  id: string;
  label: string;
  href: string;
  variant: CtaVariant;
  enabled: boolean;
  newTab?: boolean;
  size?: "sm" | "md" | "lg";
  icon?: "none" | "external" | "arrow";
};
