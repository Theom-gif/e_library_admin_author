import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ProtectedRoute from "../auth/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import Approvals from "./pages/Approvals";
import Books from "./pages/Books";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import SystemMonitor from "./pages/SystemMonitor";
import TopReaders from "./pages/TopReaders";
import Users from "./pages/Users";
import Login from "../auth/pages/Login";
import Register from "../auth/pages/Register";

export default function AdminRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="categories" element={<Categories />} />
        <Route path="books" element={<Books />} />
        <Route path="readers" element={<TopReaders />} />
        <Route path="monitor" element={<SystemMonitor />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/" element={<Navigate to={isAuthenticated ? "/admin/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/admin/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
