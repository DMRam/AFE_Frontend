import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";

export function PublicApp() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
    </Routes>
  );
}
