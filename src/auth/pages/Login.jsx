import { Eye, EyeOff, BookOpen, ArrowRight, Mail, Lock, User as UserIcon, PenTool, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import {
  getInternalUserPortalPath,
  getHomePathByRole,
  getRoleName,
  isExternalUserPortal,
  USER_PORTAL_URL,
} from "../roleUtils";
import { consumeLogoutReason } from "../../lib/authEvents";

const ROLE_OPTIONS = [
  { label: "User", icon: UserIcon },
  { label: "Author", icon: PenTool },
  { label: "Admin", icon: Shield },
];

export default function Login() {
  const { isAuthenticated, isReady, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({ email: "", password: "", role: "User", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const reason = consumeLogoutReason();
    if (reason) {
      setError(reason);
    }
  }, []);

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
    <main className="min-h-screen bg-[#122024] flex flex-col items-center justify-center p-4 font-sans text-[#f8fafc]">
      {/* Top Header */}
      <header className="absolute top-0 flex w-full items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4a868f]">
            <BookOpen size={18} className="text-[#f8fafc]" />
          </div>
          <span className="text-xl font-bold tracking-tight">គម្ពី - ELibrary</span>
        </div>
        <button className="text-sm font-medium text-[#94a3b8] hover:text-[#f8fafc]">Help Center</button>
      </header>

      <div className="flex w-full max-w-[900px] overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#16282b] shadow-2xl">
        {/* Left Side: Marketing/Visual */}
        <div className="relative hidden w-1/2 flex-col justify-end p-10 lg:flex">
          <div className="absolute inset-0 z-0 opacity-40">
             {/* Background Image placeholder - similar to the library interior in your screenshot */}
            <div className="h-full w-full bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80')] bg-cover bg-center mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#16282b] via-transparent to-transparent"></div>
          </div>
          
          <div className="relative z-10 space-y-4">
            <BookOpen className="text-[#4a868f]" size={32} />
            <h1 className="text-4xl font-bold leading-tight">Your gateway to infinite knowledge.</h1>
            <p className="text-[#94a3b8]">
              Access over 2 million digital volumes, research papers, and archival manuscripts from anywhere in the world.
            </p>
            <div className="flex items-center gap-2 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-[#16282b] bg-[#1d3438]" />
                ))}
              </div>
              <span className="text-xs font-medium text-[#94a3b8]">Join thousands of researchers today.</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full bg-[#16282b] p-8 lg:w-1/2 lg:p-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Welcome Back</h2>
            <p className="mt-1 text-[#94a3b8]">Sign in to access your digital collection</p>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#94a3b8]">Library Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  placeholder="e.g. academic@university.edu"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1d3438] py-3 pl-12 pr-4 text-[#f8fafc] placeholder:text-[#94a3b8]/50 focus:border-[#4a868f] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-[#94a3b8]">Password</label>
                <button type="button" className="text-xs font-semibold text-[#4a868f] hover:underline">Forgot Password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1d3438] py-3 pl-12 pr-12 text-[#f8fafc] focus:border-[#4a868f] focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f8fafc]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-[#94a3b8]">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((roleOption) => {
                  const Icon = roleOption.icon;
                  const isActive = form.role === roleOption.label;
                  return (
                    <button
                      key={roleOption.label}
                      type="button"
                      onClick={() => onChange("role", roleOption.label)}
                      className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? "border-[#4a868f] bg-[#1d3438] text-[#4a868f]"
                          : "border-[rgba(255,255,255,0.08)] bg-[#1d3438]/60 text-[#94a3b8] hover:border-[#4a868f]/40"
                      }`}
                    >
                      <Icon size={14} />
                      {roleOption.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="remember"
                checked={form.remember}
                onChange={(e) => onChange("remember", e.target.checked)}
                className="h-4 w-4 rounded border-[#1d3438] bg-[#1d3438] accent-[#4a868f]"
              />
              <label htmlFor="remember" className="text-sm text-[#94a3b8]">Remember me on this device</label>
            </div>

            {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{error}</div>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4a868f] py-3 font-bold text-[#f8fafc] transition-all hover:bg-[#5ba1ab] disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign In to Library"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-[#94a3b8]">
            Not a member yet?{" "}
            <Link to="/register" className="font-semibold text-[#4a868f] hover:underline">
              Apply for Library Card
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-[10px] text-[#94a3b8]/60 uppercase tracking-widest space-y-2">
        <p>© 2024 Scholarly Library Systems. Licensed to Institutional Partners.</p>
        <div className="flex justify-center gap-4">
          <button className="hover:text-[#94a3b8]">Privacy Policy</button>
          <button className="hover:text-[#94a3b8]">Terms of Service</button>
          <button className="hover:text-[#94a3b8]">Accessibility Statement</button>
        </div>
      </footer>
    </main>
  );
}
