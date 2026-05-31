import { Routes, Route } from "react-router-dom";
import HomePage      from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import OwnerPage     from "./pages/OwnerPage";
import NotFoundPage  from "./pages/NotFoundPage";

export default function App() {
  return (
    <Routes>
      <Route path="/"          element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/gx322"     element={<OwnerPage />} />
      <Route path="*"          element={<NotFoundPage />} />
    </Routes>
  );
}
