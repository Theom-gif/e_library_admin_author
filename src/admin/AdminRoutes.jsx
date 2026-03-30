import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import ProtectedRoute from "../auth/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import Approvals from "./pages/Approvals";
import Books from "./pages/Books";
import Categories from "./pages/Categories";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import SystemMonitor from "./pages/SystemMonitor";
import TopReaders from "./pages/TopReaders";
import Users from "./pages/Users";

import Login from "../auth/pages/Login";
import UserDashboard from "../auth/pages/UserDashboard";

// Author imports
import AuthorLayout from "../author/components/Layout";
import AuthorDashboard from "../author/pages/Dashboard";
import MyBooks from "../author/pages/MyBooks";
import UploadBook from "../author/pages/UploadBook";
import Profile from "../author/pages/Profile";
import AuthorSettings from "../author/pages/Setting";
import Feedback from "../author/pages/Feedback";
import Research from "../author/pages/Research";
import EditBookPage from "../author/pages/EditBookPage";
import BookDetailPage from "../author/pages/BookDetailPage";
import Analytics from "../author/pages/Analytics";

import {
  getInternalUserPortalPath,
  getHomePathByRole,
  getRoleName,
  isExternalUserPortal,
  USER_PORTAL_URL,
} from "../auth/roleUtils";

function ExternalRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

export default function AdminRoutes() {
  const { isAuthenticated, isReady, user } = useAuth();

  const roleName = getRoleName(user?.role);
  const homePath = isAuthenticated ? getHomePathByRole(user?.role) : "/login";
  const userPortalPath = getInternalUserPortalPath() || "/user/dashboard";
  const useExternalUserPortal = isExternalUserPortal();

  if (!isReady) {
    return (
      <main className="min-h-screen bg-bg-dark text-[color:var(--text)] flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md p-6 text-center">
          <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[color:var(--accent)]" />
          <p className="text-sm text-slate-500">Preparing your workspace...</p>
        </div>
      </main>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={homePath} replace /> : <Login />}
      />

      <Route
        path="/register"
        element={<Navigate to={isAuthenticated ? homePath : "/login"} replace />}
      />

      {/* Root Route */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            roleName === "User" && useExternalUserPortal ? (
              <ExternalRedirect to={USER_PORTAL_URL} />
            ) : (
              <Navigate to={homePath} replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* User Dashboard */}
      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute allowedRoles={["User"]}>
            {roleName === "User" && useExternalUserPortal ? (
              <ExternalRedirect to={USER_PORTAL_URL} />
            ) : (
              <UserDashboard />
            )}
          </ProtectedRoute>
        }
      />

      {userPortalPath !== "/user/dashboard" && (
        <Route
          path={userPortalPath}
          element={
            <ProtectedRoute allowedRoles={["User"]}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
      )}

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
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
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* System Monitor — full-viewport, outside AdminLayout */}
      <Route
        path="/admin/monitor"
        element={
          <ProtectedRoute allowedRoles={["Admin"]}>
            <SystemMonitor />
          </ProtectedRoute>
        }
      />

      {/* Author Routes */}
      <Route
        path="/author"
        element={
          <ProtectedRoute allowedRoles={["Author"]}>
            <AuthorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AuthorDashboard />} />
        <Route path="my-books" element={<MyBooks />} />
        <Route path="upload" element={<UploadBook />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<AuthorSettings />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="research" element={<Research />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="edit-book" element={<EditBookPage />} />
        <Route path="book-detail" element={<BookDetailPage />} />
      </Route>

      {/* Catch-all route - redirect to home */}
      <Route path="*" element={<Navigate to={isAuthenticated ? homePath : "/login"} replace />} />
    </Routes>
  );
}
