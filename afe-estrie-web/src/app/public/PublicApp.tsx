import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import EnBref from "./pages/about/EnBref";
import { PublicLayout } from "./PublicLayout";

export function PublicApp() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/a-propos/en-bref" element={<EnBref />} />
        {/* add more pages here */}
      </Route>
    </Routes>
  );
}
