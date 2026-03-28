import { useMemo } from "react";
import { useAuth } from "../useAuth";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const displayName = useMemo(() => user?.name || "User", [user?.name]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#132b59_0%,#081b42_40%,#03122f_100%)] px-4 py-12 text-white">
      <div className="mx-auto w-full max-w-3xl rounded-[30px] border border-[#294267] bg-[linear-gradient(180deg,#18294a_0%,#162344_100%)] p-8 shadow-[0_22px_70px_rgba(8,10,35,0.5)]">
        <h1 className="text-3xl font-bold">User Dashboard</h1>
        <p className="mt-3 text-slate-300">Welcome, {displayName}.</p>
        <p className="mt-2 text-slate-400">
          Your account is set to role <span className="font-semibold text-white">User</span>.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-8 rounded-xl bg-[#263758] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-[#2d4168]"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
