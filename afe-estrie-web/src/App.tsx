import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PublicApp } from "./app/public/PublicApp";
import { AdminApp } from "./app/admin/AdminApp";


export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<PublicApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
