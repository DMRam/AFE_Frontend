import type { ReactNode } from "react";

export function AdminShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base font-semibold text-gray-900">{title}</h1>
            {subtitle ? (
              <p className="text-sm text-gray-500">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              ← Public site
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
