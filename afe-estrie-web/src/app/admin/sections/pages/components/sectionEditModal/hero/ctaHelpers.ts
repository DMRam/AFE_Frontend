import { uid } from "../../../utils/ids"; // adjust if your uid helper path differs
import type { HeroCta, CtaVariant } from "./heroTypes";

export function normalizeVariant(v: any): CtaVariant {
  if (v === "secondary") return "secondary";
  if (v === "outline") return "outline";
  return "primary";
}

export function normalizeCtas(ctas: any): HeroCta[] {
  if (!Array.isArray(ctas)) return [];
  return ctas
    .filter(Boolean)
    .map((c) => ({
      id: String(c?.id ?? uid("cta")),
      label: String(c?.label ?? ""),
      href: String(c?.href ?? "#"),
      variant: normalizeVariant(c?.variant),
      enabled: c?.enabled !== false,
      newTab: !!c?.newTab,
      size: (c?.size === "sm" || c?.size === "lg") ? c.size : "md",
      icon: (c?.icon === "external" || c?.icon === "arrow") ? c.icon : "none",
    }));
}
