import { Routes, Route } from "react-router-dom";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminGate } from "../../components/AdminGate";
import { AdminDashboard } from "./pages/AdminDashboard";


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
            </Routes>
          </AdminGate>
        }
      />
    </Routes>
  );
}
