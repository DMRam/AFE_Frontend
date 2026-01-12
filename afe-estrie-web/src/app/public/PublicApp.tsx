import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "./PublicLayout";
import Landing from "./pages/Landing";
import DynamicPage from "./pages/DynamicPage";

export function PublicApp() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/p/*" element={<DynamicPage />} />
      </Route>
    </Routes>
  );
}
