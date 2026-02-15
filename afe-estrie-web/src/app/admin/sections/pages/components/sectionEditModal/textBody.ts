import type { AnySection } from "../../types";

export function isType(section: AnySection, type: string) {
  return section?.type === type;
}

// Support NEW (body) and LEGACY (content)
export function getTextBody(section: AnySection) {
  return String((section as any)?.body ?? (section as any)?.content ?? "");
}

// Write both for compatibility
export function setTextBody(section: AnySection, value: string) {
  return { ...(section as any), body: value, content: value };
}
