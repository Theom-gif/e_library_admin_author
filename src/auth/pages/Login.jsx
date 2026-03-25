import { Eye, EyeOff, ArrowRight, Mail, Lock, BookOpen } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  getInternalUserPortalPath,
  getHomePathByRole,
  getRoleName,
  isExternalUserPortal,
  USER_PORTAL_URL,
} from "../roleUtils";

export default function Login() {
  const { isAuthenticated, isReady, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReady) {
    return null;
  }

  if (isAuthenticated && getRoleName(user?.role) === "User") {
    if (isExternalUserPortal()) {
      window.location.replace(USER_PORTAL_URL);
      return null;
    }
    return <Navigate to={getInternalUserPortalPath() || "/user/dashboard"} replace />;
  }

  if (isAuthenticated) {
    return <Navigate to={getHomePathByRole(user?.role)} replace />;
  }

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await login(form);
    setIsSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (getRoleName(result.user?.role) === "User") {
      if (isExternalUserPortal()) {
        window.location.replace(USER_PORTAL_URL);
        return;
      }
      navigate(getInternalUserPortalPath() || "/user/dashboard", { replace: true });
      return;
    }

    const resolvedRole = getRoleName(result.user?.role);
    const homePath = getHomePathByRole(resolvedRole);
    const safeFrom =
      typeof from === "string" &&
        ((resolvedRole === "Admin" && from.startsWith("/admin")) ||
          (resolvedRole === "Author" && from.startsWith("/author")) ||
          (resolvedRole === "User" && from.startsWith("/user")))
        ? from
        : null;

    navigate(safeFrom || homePath, { replace: true });
  };

  return (
    <main className="min-h-screen bg-[#eef4f6] text-[#1f2933]">
      <div className="mx-auto w-full max-w-[1220px] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#5caeba] text-white font-bold text-sm flex items-center justify-center shadow-sm">
            <BookOpen
              size={16}
              className="text-white"
            />
          </div>
          <span className="text-[28px] font-semibold tracking-[-0.02em] text-[#1f2933]">E-Library</span>
        </div>

        <div>
          <div className="grid gap-0 overflow-hidden rounded-2xl border border-[#e4ebee] lg:grid-cols-[1.05fr_1fr]">
            <section className="relative hidden min-h-[560px] lg:block">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80')] bg-cover bg-center" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.24)_0%,rgba(2,6,23,0.65)_100%)]" />
              <div className="relative z-10 flex h-full items-center justify-center p-8 text-center">
                <div className="max-w-[520px]">
                  <h1 className="text-[46px] font-bold leading-[1.02] tracking-[-0.03em] text-white/85">
                    Your gateway to infinite knowledge.
                  </h1>
                  <p className="mt-4 text-base leading-7 text-white/85">
                    Access over 2 million digital volumes, research papers, and archival manuscripts from anywhere in the world.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-[#fdfefe] p-6 sm:p-8 lg:p-9">
              <div className="mb-8">
                <h2 className="text-[42px] font-bold leading-none tracking-[-0.035em] text-[#111827]">
                  Welcome Back
                </h2>
                <p className="mt-2 text-[16px] text-[#6b7280]">
                  Sign in to access your digital collection
                </p>
              </div>

              <form className="space-y-6" onSubmit={onSubmit}>
                <div className="space-y-3">
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.2em] text-[#4b5563]">
                    Library Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a4a8ae]" size={18} />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => onChange("email", e.target.value)}
                      placeholder="e.g. academic@university.edu"
                      className="auth-input h-14 w-full rounded-[14px] border border-[#d8e0e6] bg-white py-4 pl-14 pr-4 text-[16px] text-[#1f2933] placeholder:text-[#aeb5bd] focus:border-[#56aeb9] focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.2em] text-[#4b5563]">
                      Password
                    </label>
                    <button type="button" className="text-[14px] font-medium text-[#0b6a86] transition hover:text-[#084d63]">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a4a8ae]" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => onChange("password", e.target.value)}
                      placeholder="........"
                      className="auth-input h-14 w-full rounded-[14px] border border-[#d8e0e6] bg-white py-4 pl-14 pr-14 text-[16px] text-[#1f2933] placeholder:text-[#aeb5bd] focus:border-[#56aeb9] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[#9aa1a9] transition hover:text-[#20262e]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={form.remember}
                    onChange={(e) => onChange("remember", e.target.checked)}
                    className="h-4 w-4 rounded-[6px] border-[#c2c7ce] bg-white accent-[#56aeb9]"
                  />
                  <label htmlFor="remember" className="text-[15px] sm:text-[16px] text-[#374151]">
                    Remember me for 30 days
                  </label>
                </div>
                {error && (
                  <div className="rounded-[14px] border border-[#efc9c9] bg-[#fff5f5] px-4 py-3 text-sm text-[#b42318]">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-[14px] bg-[#56aeb9] px-5 text-[16px] font-semibold text-white shadow-[0_12px_24px_rgba(86,174,185,0.32)] transition hover:bg-[#4aa3ae] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Signing in..." : "Sign In to Library"}
                  <ArrowRight size={16} />
                </button>
                <p className="text-center text-[15px] text-[#7d8793]">
                  Not a member yet? <button type="button" className="font-semibold text-[#0b6a86] hover:text-[#084d63]">Apply for Library Card</button>
                </p>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
