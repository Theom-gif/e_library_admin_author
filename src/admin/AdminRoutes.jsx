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
import { getRoleLandingPath } from "../auth/roleRoutes";
import AuthorLayout from "../author/components/Layout";
import AuthorDashboard from "../author/pages/Dashboard";
import AuthorBooks from "../author/pages/MyBooks";
import AuthorUpload from "../author/pages/UploadBook";
import AuthorProfile from "../author/pages/Profile";
import AuthorSettings from "../author/pages/Setting";
import AuthorFeedback from "../author/pages/Feedback";
import AuthorEditBook from "../author/pages/EditBookPage";
function ReaderDashboard() {
  return <Navigate to="/login" replace />;
}
export default function AdminRoutes() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return null;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Navigate to={homePath} replace />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="Admin">
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

      <Route
        path="/author"
        element={
          <ProtectedRoute role="Author">
            <AuthorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/author/dashboard" replace />} />
        <Route path="dashboard" element={<AuthorDashboard />} />
        <Route path="my-books" element={<AuthorBooks />} />
        <Route path="upload" element={<AuthorUpload />} />
        <Route path="profile" element={<AuthorProfile />} />
        <Route path="settings" element={<AuthorSettings />} />
        <Route path="feedback" element={<AuthorFeedback />} />
        <Route path="analytics" element={<AuthorDashboard />} />
        <Route path="edit-book" element={<AuthorEditBook />} />
      </Route>

      <Route
        path="/reader/dashboard"
        element={
          <ProtectedRoute role="Reader">
            <ReaderDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? getRoleLandingPath(user?.role) : "/login"} replace />} />
    </Routes>
  );
}
