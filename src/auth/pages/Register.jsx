import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getRoleLandingPath } from "../roleRoutes";

const ROLES = ["Reader", "Author", "Admin"];

export default function Register() {
  const { isAuthenticated, isInitializing, register, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "Reader",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (isInitializing) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={getRoleLandingPath(user?.role)} replace />;
  }

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    setSuccess("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = form.name.trim();
    if (trimmedName.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (form.password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    const result = await register({ ...form, name: trimmedName });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Account created successfully. Please sign in.");
    setTimeout(() => navigate("/login", { replace: true }), 700);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#132b59_0%,#081b42_40%,#03122f_100%)] px-4 py-12 text-white">
      <div className="mx-auto w-full max-w-[450px]">
        <div className="rounded-[30px] border border-[#294267] bg-[linear-gradient(180deg,#18294a_0%,#162344_100%)] p-8 shadow-[0_22px_70px_rgba(8,10,35,0.5)]">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-md font-semibold text-slate-400">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(event) => onChange("name", event.target.value)}
                placeholder="Your name"
                required
                className="w-full rounded-2xl border border-slate-300/30 bg-slate-200 px-4 py-3 text-l text-slate-900 outline-none transition-all placeholder:text-slate-500 focus:border-slate-50/80"
              />
            </div>

            <div>
              <label className="mb-2 block text-lg font-semibold text-slate-400">Email</label>
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
              <label className="mb-2 block text-md font-semibold text-slate-400">I am a...</label>
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
              <label className="mb-2 block text-md font-semibold text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(event) => onChange("password", event.target.value)}
                  placeholder="Create password"
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
            {success && <p className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-300">{success}</p>}

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9f53f4] via-[#df4ca5] to-[#3b82f6] px-5 py-3 text-2l font-bold transition-all hover:-translate-y-0.5 hover:brightness-110"
            >
              Register
            </button>
          </form>

          <p className="mt-7 text-center text-2l text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
