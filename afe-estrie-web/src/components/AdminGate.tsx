import { Navigate, useLocation } from "react-router-dom";
import { useAdminUser } from "../app/admin/hooks/useAdminUser";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAdminUser();
  const loc = useLocation();

  if (loading) return null; // or spinner

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: loc.pathname }} />;
  }

  // 🔥 force password change
  if (user.mustChangePassword && loc.pathname !== "/admin/change-password") {
    return <Navigate to="/admin/change-password" replace />;
  }

  return <>{children}</>;
}
