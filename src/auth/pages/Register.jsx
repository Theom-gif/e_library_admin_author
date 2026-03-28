import { Eye, EyeOff, BookOpen, Mail, User as UserIcon, Shield, PenTool } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";
import {
  getInternalUserPortalPath,
  getHomePathByRole,
  getRoleName,
  isExternalUserPortal,
  USER_PORTAL_URL,
} from "../roleUtils";

const ROLE_OPTIONS = [
  { label: "USER", role: "User", icon: UserIcon },
  { label: "AUTHOR", role: "Author", icon: PenTool },
  { label: "ADMIN", role: "Admin", icon: Shield },
];

export default function Register() {
  const { isAuthenticated, isReady, user, register, login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    password_confirmation: "",
    role: "User",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    setSuccess("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const trimmedFirstName = form.firstname.trim();
    const trimmedLastName = form.lastname.trim();
    const fullName = [trimmedFirstName, trimmedLastName].filter(Boolean).join(" ");
    
    if (trimmedFirstName.length < 2 || trimmedLastName.length < 2) {
      setError("First name and last name must be at least 2 characters.");
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError("Password confirmation does not match.");
      return;
    }

    const result = await register({
      ...form,
      firstname: trimmedFirstName,
      lastname: trimmedLastName,
    });
    
    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (getRoleName(form.role) === "Author") {
      try {
        const profile = {
          name: fullName,
          email: form.email.trim().toLowerCase(),
          username: form.email ? form.email.split("@")[0] : "",
          tier: "Pro Author",
        };
        window.localStorage.setItem("author_studio_profile", JSON.stringify(profile));
        window.dispatchEvent(new Event("author-profile-updated"));
      } catch {
        // ignore localStorage errors
      }
    }

    const loginResult = await login({
      email: form.email,
      password: form.password,
      role: form.role,
    });

    if (loginResult.ok) {
      if (getRoleName(loginResult.user?.role || form.role) === "User") {
        if (isExternalUserPortal()) {
          window.location.replace(USER_PORTAL_URL);
          return;
        }
        navigate(getInternalUserPortalPath() || "/user/dashboard", { replace: true });
        return;
      }
      navigate(getHomePathByRole(loginResult.user?.role || form.role), { replace: true });
      return;
    }

    setSuccess("Account created successfully. Please sign in.");
    setTimeout(() => navigate("/login", { replace: true }), 700);
  };

  return (
    <main className="min-h-screen bg-[#122024] flex flex-col items-center justify-center p-4 text-[#f8fafc]">
      {/* Header */}
      <header className="absolute top-0 flex w-full items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4a868f]">
            <BookOpen size={18} className="text-[#f8fafc]" />
          </div>
          <span className="text-xl font-bold tracking-tight">គម្ពី - ELibrary</span>
        </div>
        <button className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1d3438] px-4 py-1.5 text-xs font-semibold text-[#94a3b8] hover:text-[#f8fafc]">
          Support
        </button>
      </header>

      <div className="mx-auto w-full max-w-[550px] rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[#16282b] p-8 shadow-2xl lg:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-[#94a3b8]">Join our global community of researchers and scholars.</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit}>
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94a3b8]">First Name</label>
              <input
                type="text"
                value={form.firstname}
                onChange={(e) => onChange("firstname", e.target.value)}
                placeholder="Jane"
                required
                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1d3438] px-4 py-3 text-[#f8fafc] outline-none focus:border-[#4a868f] placeholder:text-[#94a3b8]/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Last Name</label>
              <input
                type="text"
                value={form.lastname}
                onChange={(e) => onChange("lastname", e.target.value)}
                placeholder="Doe"
                required
                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1d3438] px-4 py-3 text-[#f8fafc] outline-none focus:border-[#4a868f] placeholder:text-[#94a3b8]/30"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]" size={18} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="jane.doe@university.edu"
                required
                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1d3438] py-3 pl-12 pr-4 text-[#f8fafc] outline-none focus:border-[#4a868f] placeholder:text-[#94a3b8]/30"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-[#94a3b8]">I am registering as:</label>
            <div className="grid grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((role) => {
                const Icon = role.icon;
                const isActive = form.role === role.role;
                return (
                  <button
                    key={role.role}
                    type="button"
                    onClick={() => onChange("role", role.role)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border py-3 transition-all ${
                      isActive 
                        ? "border-[#4a868f] bg-[#1d3438] text-[#4a868f] shadow-[inset_0_0_10px_rgba(74,134,143,0.2)]" 
                        : "border-[rgba(255,255,255,0.05)] bg-[#1d3438]/50 text-[#94a3b8] hover:border-[#4a868f]/30"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-[10px] font-bold tracking-widest">{role.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1d3438] px-4 py-3 pr-12 text-[#f8fafc] outline-none focus:border-[#4a868f]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f8fafc]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94a3b8]">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.password_confirmation}
                  onChange={(e) => onChange("password_confirmation", e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#1d3438] px-4 py-3 pr-12 text-[#f8fafc] outline-none focus:border-[#4a868f]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f8fafc]"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#94a3b8]">
            <input type="checkbox" required className="h-4 w-4 rounded border-[#1d3438] bg-[#1d3438] accent-[#4a868f]" />
            <span>I agree to the <button className="text-[#4a868f] hover:underline">Terms of Service</button> and <button className="text-[#4a868f] hover:underline">Privacy Policy</button>.</span>
          </div>

          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          {success && <p className="text-center text-sm text-[#4a868f]">{success}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-[#214046] py-3.5 font-bold text-[#f8fafc] shadow-lg transition-all hover:bg-[#2a525a] hover:shadow-[#4a868f]/10"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-[#94a3b8]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[#4a868f] hover:underline">
            Sign In
          </Link>
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-10 flex w-full max-w-[900px] items-center justify-between border-t border-[rgba(255,255,255,0.05)] pt-8">
        <div className="max-w-md">
           <h3 className="text-sm font-bold text-[#4a868f]">Access Millions of Resources</h3>
           <p className="mt-1 text-xs leading-relaxed text-[#94a3b8]">
             From historical archives to the latest scientific journals, our digital catalog is curated for excellence and accessibility.
           </p>
        </div>
        <div className="flex gap-4">
           <div className="h-12 w-20 rounded-lg bg-[#1d3438] opacity-50"></div>
           <div className="h-12 w-20 rounded-lg bg-[#1d3438] opacity-50"></div>
        </div>
      </div>
    </main>
  );
}
