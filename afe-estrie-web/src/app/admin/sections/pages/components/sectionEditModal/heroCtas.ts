import type { AnySection } from "../../types";
import { isType } from "./textBody";

export type CtaVariant = "primary" | "secondary" | "outline";
export type HeroCta = {
  id: string;
  label: string;
  href: string;
  variant: CtaVariant;
  enabled: boolean;
  newTab?: boolean;
  icon?: "none" | "external" | "arrow";
  size?: "sm" | "md" | "lg";
};

function uid(prefix = "cta") {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
      enabled: c?.enabled === false ? false : true,
      newTab: !!c?.newTab,
      icon: c?.icon === "external" || c?.icon === "arrow" ? c.icon : "none",
      size: c?.size === "sm" || c?.size === "lg" ? c.size : "md",
    }))
    .slice(0, 3);
}

export function setCtasOnSection(section: AnySection, next: HeroCta[]) {
  if (!isType(section, "hero")) return section;
  return { ...(section as any), ctas: next.slice(0, 3) };
}

export function addDefaultCta(section: AnySection) {
  const list = normalizeCtas((section as any).ctas);
  if (list.length >= 3) return section;

  list.push({
    id: uid("cta"),
    label: "Faire un don",
    href: "#donner",
    variant: "primary",
    enabled: true,
    newTab: false,
    icon: "none",
    size: "md",
  });

  return setCtasOnSection(section, list);
}

export function updateCtaAt(section: AnySection, idx: number, patch: Partial<HeroCta>) {
  const list = normalizeCtas((section as any).ctas);
  if (!list[idx]) return section;
  list[idx] = { ...list[idx], ...patch };
  return setCtasOnSection(section, list);
}

export function removeCtaAt(section: AnySection, idx: number) {
  const list = normalizeCtas((section as any).ctas).filter((_, i) => i !== idx);
  return setCtasOnSection(section, list);
}

export function moveCta(section: AnySection, idx: number, dir: -1 | 1) {
  const list = normalizeCtas((section as any).ctas);
  const j = idx + dir;
  if (j < 0 || j >= list.length) return section;
  const tmp = list[idx];
  list[idx] = list[j];
  list[j] = tmp;
  return setCtasOnSection(section, list);
}
