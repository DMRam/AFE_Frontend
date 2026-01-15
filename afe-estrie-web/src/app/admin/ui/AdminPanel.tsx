import type { ReactNode } from "react";
import { Info } from "lucide-react";

interface AdminPanelProps {
  title: string;
  description?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  loading?: boolean;
}

export function AdminPanel({
  title,
  description,
  children,
  right,
  className = "",
  loading = false,
}: AdminPanelProps) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h3>
            {loading && (
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
            )}
          </div>
          {description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {right && (
          <div className="shrink-0 flex items-center gap-2">
            {right}
          </div>
        )}
      </div>

      <div className="p-5 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

interface AdminStatProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  loading?: boolean;
}

export function AdminStat({
  label,
  value,
  hint,
  icon,
  trend,
  trendValue,
  loading = false,
}: AdminStatProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "down":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return "↗";
      case "down":
        return "↘";
      default:
        return "→";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 truncate">
              {label}
            </span>
            {hint && (
              <span
                className="text-gray-400 cursor-help"
                title={hint}
              >
                <Info className="h-3 w-3" />
              </span>
            )}
          </div>

          {loading ? (
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-gray-200"></div>
          ) : (
            <div className="mt-1 text-2xl font-bold text-gray-900 truncat">
              {value}
            </div>
          )}

          {trend && trendValue && !loading && (
            <div className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${getTrendColor()}`}>
              <span>{getTrendIcon()}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {icon && (
          <div className="shrink-0 text-gray-300">
            {icon}
          </div>
        )}
      </div>

      {hint && !icon && (
        <p className="mt-3 text-xs text-gray-500 line-clamp-2">
          {hint}
        </p>
      )}
    </div>
  );
}