export function clampIndex(i: number, max: number) {
  return Math.max(0, Math.min(i, max));
}

export function moveItem<T>(arr: T[], from: number, to: number) {
  const a = [...arr];
  const item = a[from];
  a.splice(from, 1);
  a.splice(to, 0, item);
  return a;
}

export function uid(prefix = "sec") {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}