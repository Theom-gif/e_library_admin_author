import { Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import ThemeToggle from "../../theme/ThemeToggle";
import {
  getInternalUserPortalPath,
  getHomePathByRole,
  getRoleName,
  isExternalUserPortal,
  USER_PORTAL_URL,
} from "../roleUtils";

export default function Login() {
  const { isAuthenticated, isReady, user, login } = useAuth();
  const { isDark } = useTheme();
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

  const rightPanelClass = isDark ? "bg-[#0d171c]" : "bg-[#faf9f7]";
  const rightTextClass = isDark ? "text-[#b9c4cb]" : "text-[#4b5563]";
  const cardClass = isDark
    ? "border border-[rgba(255,255,255,0.08)] bg-[#111d22] shadow-[0_18px_36px_rgba(0,0,0,0.28)]"
    : "border border-[#e8e4dc] bg-white shadow-[0_14px_32px_rgba(15,23,42,0.06)]";
  const headingClass = isDark ? "text-white" : "text-[#20262e]";
  const bodyTextClass = isDark ? "text-[#96a5b0]" : "text-[#5e6773]";
  const labelClass = isDark ? "text-[#aeb7bf]" : "text-[#4b5563]";
  const iconClass = isDark ? "text-[#6f7f8a]" : "text-[#a4a8ae]";
  const inputClass = isDark
    ? "border border-[rgba(255,255,255,0.08)] bg-[#0c1519] text-[#f2f7f8] placeholder:text-[#6a7984] focus:bg-[#0f1a1f]"
    : "border border-[#efeae3] bg-[#f5f3f0] text-[#1f2933] placeholder:text-[#c3c7cc] focus:bg-white";
  const helperTextClass = isDark ? "text-[#8e9aa3]" : "text-[#7b8390]";
  const dividerClass = isDark ? "bg-[rgba(255,255,255,0.08)]" : "bg-[#ece7e1]";
  const mutedFooterClass = isDark ? "text-[#70808a]" : "text-[#c2beb7]";

  return (
    <main className={`min-h-screen ${isDark ? "bg-[#081116] text-[#ecf4f6]" : "bg-[#f7f5f2] text-[#1f2933]"}`}>
      <div className="grid min-h-screen lg:grid-cols-[1.16fr_0.92fr]">
        <section className="relative hidden min-h-screen overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80')] bg-cover bg-center" />
          <div
            className={`absolute inset-0 ${isDark
              ? "bg-[linear-gradient(180deg,rgba(3,8,10,0.36)_0%,rgba(6,18,23,0.48)_38%,rgba(1,6,9,0.82)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(17,24,39,0.12)_0%,rgba(17,24,39,0.18)_38%,rgba(11,13,17,0.62)_100%)]"
              }`}
          />
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center text-center p-8 xl:p-10">
            <div className="mt-6 max-w-[600px]">
              <h1 className="text-[42px] font-semibold leading-tight tracking-[-0.03em] text-white xl:text-[56px]">
                Your gateway to infinite knowledge
              </h1>
              <p className="mt-4 text-[16px] leading-7 text-white/80 xl:text-[17px]">
                Access over 2 million digital volumes with administrative precision.
              </p>
            </div>

          </div>
        </section>
        <section className={`relative flex min-h-screen flex-col px-5 py-5 sm:px-7 lg:px-8 xl:px-10 ${rightPanelClass}`}>
          <div className="flex flex-1 items-center justify-center py-4 lg:py-10">
            <div className={`w-full max-w-[520px] rounded-[22px] p-7 sm:p-9 ${cardClass}`}>
              <div className="mb-9">
                <h2 className={`text-[34px] font-semibold tracking-[-0.04em] sm:text-[38px] ${headingClass}`}>
                  Welcome Back
                </h2>
                <p className={`mt-3 text-[15px] sm:text-[16px] ${bodyTextClass}`}>
                  Sign in to access your admin workspace
                </p>
              </div>
              <form className="space-y-7" onSubmit={onSubmit}>
                <div className="space-y-3">
                  <label className={`block text-[12px] font-semibold uppercase tracking-[0.24em] ${labelClass}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 ${iconClass}`} size={20} />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => onChange("email", e.target.value)}
                      placeholder="name@digitalcurator.com"
                      className={`h-14 w-full rounded-[14px] py-4 pl-14 pr-4 text-[16px] focus:border-[#0d718d] focus:outline-none ${inputClass}`}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className={`block text-[12px] font-semibold uppercase tracking-[0.24em] ${labelClass}`}>
                      Password
                    </label>
                    <button type="button" className="text-[14px] font-medium text-[#0b6a86] transition hover:text-[#084d63]">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 ${iconClass}`} size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => onChange("password", e.target.value)}
                      placeholder="........"
                      className={`h-14 w-full rounded-[14px] py-4 pl-14 pr-14 text-[16px] focus:border-[#0d718d] focus:outline-none ${inputClass}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-5 top-1/2 -translate-y-1/2 transition ${isDark ? "text-[#6f7f8a] hover:text-white" : "text-[#9aa1a9] hover:text-[#20262e]"}`}
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
                    className={`h-4 w-4 rounded-[6px] accent-[#0d718d] ${isDark ? "border-[#53626c] bg-[#0c1519]" : "border-[#c2c7ce] bg-white"}`}
                  />
                  <label htmlFor="remember" className={`text-[15px] sm:text-[16px] ${isDark ? "text-[#d4dde2]" : "text-[#374151]"}`}>
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
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
