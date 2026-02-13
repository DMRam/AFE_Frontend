import { Routes, Route } from "react-router-dom";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminGate } from "../../components/AdminGate";
import AdminDashboard from "./pages/AdminDashboard";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";


export function AdminApp() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/*"
        element={
          <AdminGate>
            <Routes>
              <Route path="/" element={<AdminDashboard />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />

            </Routes>
          </AdminGate>
        }
      />
    </Routes>
  );
}
