import React from "react";

export function SectionCard({
  title,
  description,
  children,
  isExpanded,
  onToggle,
  status,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  status?: string;
}) {
  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-6 text-left hover:bg-gray-50"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <span className="text-xl">{isExpanded ? "−" : "+"}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-600">{description}</p>

            {status && (
              <span
                className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                  status === "enabled"
                    ? "bg-green-100 text-green-800"
                    : status === "disabled"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {status}
              </span>
            )}
          </div>
        </div>

        <svg
          className={`h-5 w-5 transform text-gray-400 transition ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && <div className="border-t border-gray-100 p-6">{children}</div>}
    </div>
  );
}
