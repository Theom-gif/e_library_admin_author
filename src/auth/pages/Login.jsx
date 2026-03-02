import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getRoleLandingPath } from "../roleRoutes";

const ROLES = ["Reader", "Author", "Admin"];

function getHomePathByRole(role) {
  if (role === "Admin") {
    return "/admin/dashboard";
  }
  if (role === "Author") {
    return "/author";
  }
  return "/author";
}

export default function Login() {
  const { isAuthenticated, isInitializing, login, loginDemo, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "Reader",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleLandingPath(user?.role)} replace />;
  }

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const result = await login(form);
    if (!result.ok) {
      setError(result.error || "Login failed");
      return;
    }
    navigate(from || getRoleLandingPath(result.user?.role), { replace: true });
  };

  const loginAsDemo = (role) => {
    const result = loginDemo(role);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(getRoleLandingPath(result.user?.role), { replace: true });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#132b59_0%,#081b42_40%,#03122f_100%)] px-4 py-12 text-white">
      <div className="mx-auto w-full max-w-[450px]">
        <div className="rounded-[30px] border border-[#294267] bg-[linear-gradient(180deg,#18294a_0%,#162344_100%)] p-8 shadow-[0_22px_70px_rgba(8,10,35,0.5)]">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <p className="mb-3 text-xl font-semibold text-slate-400">I am a...</p>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => onChange("role", role)}
                    className={`rounded-xl px-4 py-2.5 text-md font-semibold transition-all ${form.role === role
                      ? "bg-gradient-to-r from-[#9f53f4] to-[#ec4899] text-white shadow-[0_8px_24px_rgba(180,69,228,0.4)]"
                      : "bg-[#263758] text-slate-400 hover:text-white"
                      }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-md font-semibold text-slate-400">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-2xl border border-slate-300/30 bg-slate-200 px-4 py-3 text-l text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-slate-50/80"
              />
            </div>

            <div>
              <label className="mb-2 block text-md font-semibold text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => onChange("password", event.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full rounded-2xl border border-slate-300/30 bg-slate-200 px-4 py-3 pr-12 text-l text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-slate-50/80"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9f53f4] via-[#df4ca5] to-[#3b82f6] px-5 py-3 text-2l font-bold transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              Sign In
              <span aria-hidden>{"->"}</span>
            </button>
          </form>

          <div className="my-6 h-px bg-white/10" />

          <p className="mb-3 flex items-center justify-center gap-2 text-base text-slate-400">
            <Sparkles size={14} />
            Quick demo access
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => loginAsDemo("Admin")}
              className="rounded-xl bg-[#263758] px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-[#2d4168]"
            >
              Demo Admin
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo("Author")}
              className="rounded-xl bg-[#263758] px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-[#2d4168]"
            >
              Demo Author
            </button>
            <button
              type="button"
              onClick={() => loginAsDemo("Reader")}
              className="rounded-xl bg-[#263758] px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-[#2d4168]"
            >
              Demo Reader
            </button>
          </div>

          <p className="mt-7 text-center text-2l text-slate-400">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-violet-300 hover:text-violet-200">
              Register
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

