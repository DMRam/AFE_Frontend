import type { Toast as ToastType } from "../types";

export function Toast({ toast }: { toast: ToastType }) {
  if (!toast) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
      <div
        className={`rounded-lg border px-4 py-3 shadow-sm ${
          toast.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        <div className="flex items-center gap-2">
          {toast.type === "success" ? "✓" : "✗"}
          <span className="font-medium">{toast.msg}</span>
        </div>
      </div>
    </div>
  );
}
