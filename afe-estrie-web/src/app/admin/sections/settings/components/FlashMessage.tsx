type Props = {
  kind: "error" | "success";
  message: string;
};

export function FlashMessage({ kind, message }: Props) {
  const cls =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className={`rounded-2xl border p-4 text-sm ${cls}`}>
      {message}
    </div>
  );
}
