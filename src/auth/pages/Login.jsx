import { Eye, EyeOff, ArrowRight, Mail, Lock, KeyRound } from "lucide-react";
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
    <main className="min-h-screen bg-[#f7f5f2] text-[#1f2933]">
      <div className="grid min-h-screen lg:grid-cols-[1.16fr_0.92fr]">
        <section className="relative hidden min-h-screen overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.12)_0%,rgba(17,24,39,0.18)_38%,rgba(11,13,17,0.62)_100%)]" />

          <div className="relative z-10 flex w-full flex-col justify-between p-8 xl:p-10">
            <div className="text-[18px] font-semibold tracking-[-0.03em] text-[#0a6d87] xl:text-[30px]">
              Digital Curator Admin
            </div>

            <div className="max-w-[480px]">
              <h1 className="text-[56px] font-semibold leading-[0.94] tracking-[-0.045em] text-white xl:text-[56px]">
                Your gateway to infinite knowledge
              </h1>
              <p className="mt-5 max-w-[360px] text-[16px] leading-7 text-white/86 xl:text-[20px]">
                Access over 2 million digital volumes with administrative precision.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-3 text-[10px] uppercase tracking-[0.28em] text-white/58">
              <span>(c) 2026 Digital Curator</span>
              <button type="button" className="transition hover:text-white/85">Privacy Policy</button>
              <button type="button" className="transition hover:text-white/85">Terms of Service</button>
              <button type="button" className="transition hover:text-white/85">Security</button>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen flex-col bg-[#faf9f7] px-5 py-5 sm:px-7 lg:px-8 xl:px-10">
          <header className="flex items-center justify-end gap-8 pb-6 text-[15px] text-[#4b5563] sm:pb-10">
            <button type="button" className="transition hover:text-[#0b6a86]">Support</button>
            <button type="button" className="transition hover:text-[#0b6a86]">Documentation</button>
          </header>

          <div className="flex flex-1 items-center justify-center py-4 lg:py-10">
            <div className="w-full max-w-[520px] rounded-[22px] border border-[#e8e4dc] bg-white p-7 shadow-[0_14px_32px_rgba(15,23,42,0.06)] sm:p-9">
              <div className="mb-9">
                <h2 className="text-[34px] font-semibold tracking-[-0.04em] text-[#20262e] sm:text-[38px]">
                  Welcome Back
                </h2>
                <p className="mt-3 text-[15px] text-[#5e6773] sm:text-[16px]">
                  Sign in to access your admin workspace
                </p>
              </div>

              <form className="space-y-7" onSubmit={onSubmit}>
                <div className="space-y-3">
                  <label className="block text-[12px] font-semibold uppercase tracking-[0.24em] text-[#4b5563]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a4a8ae]" size={20} />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => onChange("email", e.target.value)}
                      placeholder="name@digitalcurator.com"
                      className="h-14 w-full rounded-[14px] border border-[#efeae3] bg-[#f5f3f0] py-4 pl-14 pr-4 text-[16px] text-[#1f2933] placeholder:text-[#c3c7cc] focus:border-[#0d718d] focus:bg-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-[12px] font-semibold uppercase tracking-[0.24em] text-[#4b5563]">
                      Password
                    </label>
                    <button type="button" className="text-[14px] font-medium text-[#0b6a86] transition hover:text-[#084d63]">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#a4a8ae]" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => onChange("password", e.target.value)}
                      placeholder="••••••••"
                      className="h-14 w-full rounded-[14px] border border-[#efeae3] bg-[#f5f3f0] py-4 pl-14 pr-14 text-[16px] text-[#1f2933] placeholder:text-[#c3c7cc] focus:border-[#0d718d] focus:bg-white focus:outline-none"
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
                    className="h-4 w-4 rounded-[6px] border-[#c2c7ce] bg-white accent-[#0d718d]"
                  />
                  <label htmlFor="remember" className="text-[15px] text-[#374151] sm:text-[16px]">
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
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-[14px] bg-[#0d718d] px-5 text-[16px] font-semibold text-white shadow-[0_12px_24px_rgba(13,113,141,0.22)] transition hover:bg-[#0b647d] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Signing in..." : "Sign In to Library"}
                  <ArrowRight size={16} />
                </button>

                <div className="space-y-5 pt-1">
                  <div className="flex items-center gap-4 text-[10px] font-medium uppercase tracking-[0.24em] text-[#b5b1ab]">
                    <div className="h-px flex-1 bg-[#ece7e1]" />
                    <span>Help & Access</span>
                    <div className="h-px flex-1 bg-[#ece7e1]" />
                  </div>

                  <button
                    type="button"
                    disabled
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-[14px] border border-[#ece7e1] bg-[#f5f3f0] px-5 text-[15px] font-semibold text-[#20262e]"
                  >
                    <KeyRound size={16} />
                    Single Sign-On (SSO)
                  </button>

                  <p className="text-center text-[13px] leading-6 text-[#7b8390]">
                    Roles are assigned automatically from the database. Accounts are created manually by an administrator.
                  </p>
                </div>
              </form>
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-4 text-[10px] uppercase tracking-[0.24em] text-[#c2beb7] lg:hidden">
            <span>(c) 2024 Digital Curator</span>
            <button type="button">Privacy Policy</button>
            <button type="button">Terms of Service</button>
            <button type="button">Security</button>
          </footer>
        </section>
      </div>
    </main>
  );
}
