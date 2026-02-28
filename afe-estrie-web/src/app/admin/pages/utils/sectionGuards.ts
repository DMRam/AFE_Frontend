export type AnySection = any;

export function isHero(s: AnySection) {
  return s?.type === "hero";
}
export function isRichText(s: AnySection) {
  return s?.type === "richText";
}
export function isSplit(s: AnySection) {
  return s?.type === "split";
}
export function isTeam(s: AnySection) {
  return s?.type === "team";
}