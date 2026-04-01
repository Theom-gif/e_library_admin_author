import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  FileText,
  LoaderCircle,
  PenTool,
} from "lucide-react";
import {
  getUserAuthorRequestNotifications,
  markUserAuthorRequestNotificationRead,
} from "../../lib/authorRequestNotifications";
import { useAuth } from "../useAuth";
import { requestAuthorRegistration } from "../services/authService";

const MAX_BIO_LENGTH = 500;
const MAX_REASON_LENGTH = 600;

function splitDisplayName(name = "") {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const displayName = useMemo(() => user?.name || "User", [user?.name]);
  const initialName = useMemo(() => splitDisplayName(user?.name || ""), [user?.name]);
  const [form, setForm] = useState({
    firstName: initialName.firstName,
    lastName: initialName.lastName,
    email: user?.email || "",
    bio: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusNotifications, setStatusNotifications] = useState([]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      firstName: current.firstName || initialName.firstName,
      lastName: current.lastName || initialName.lastName,
      email: current.email || user?.email || "",
    }));
  }, [initialName.firstName, initialName.lastName, user?.email]);

  useEffect(() => {
    setStatusNotifications(
      getUserAuthorRequestNotifications({
        userId: user?.id,
        email: user?.email,
      }),
    );
  }, [user?.email, user?.id, success]);

  const onChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError("");
    if (success) {
      setSuccess("");
    }
  };

  const validateForm = () => {
    if (!form.firstName.trim()) return "First name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }
    if (!form.bio.trim()) return "Please add a short bio.";
    if (!form.reason.trim()) return "Please tell admin why you want to become an author.";
    if (form.bio.trim().length > MAX_BIO_LENGTH) return `Bio must be ${MAX_BIO_LENGTH} characters or less.`;
    if (form.reason.trim().length > MAX_REASON_LENGTH) return `Reason must be ${MAX_REASON_LENGTH} characters or less.`;
    return "";
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        firstname: form.firstName.trim(),
        lastname: form.lastName.trim(),
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        name: [form.firstName.trim(), form.lastName.trim()].filter(Boolean).join(" "),
        email: form.email.trim().toLowerCase(),
        bio: form.bio.trim(),
        reason: form.reason.trim(),
        motivation: form.reason.trim(),
        message: form.reason.trim(),
        role_id: 2,
        user_id: user?.id || undefined,
        userId: user?.id || undefined,
        request_source: "reader_dashboard",
      };

      const response = await requestAuthorRegistration(payload);
      const responseMessage =
        response?.data?.message ||
        "Your request has been sent to admin. You will receive an email after approval or rejection.";

      setSuccess(responseMessage);
      setForm((prev) => ({
        ...prev,
        bio: "",
        reason: "",
      }));
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ||
        requestError?.response?.data?.error ||
        requestError?.message ||
        "Unable to send your author request. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNotificationRead = (notificationId) => {
    markUserAuthorRequestNotificationRead(notificationId);
    setStatusNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification,
      ),
    );
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#132b59_0%,#081b42_40%,#03122f_100%)] px-4 py-12 text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[30px] border border-[#294267] bg-[linear-gradient(180deg,#18294a_0%,#162344_100%)] p-8 shadow-[0_22px_70px_rgba(8,10,35,0.5)]">
          <div className="inline-flex rounded-2xl bg-[#21365f] p-3 text-[#98d4ff]">
            <PenTool size={22} />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Welcome, {displayName}</h1>
          <p className="mt-3 text-slate-300">
            Your account is currently a <span className="font-semibold text-white">Reader</span>.
          </p>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            If you want to publish books in the library, send an author request to admin. After review,
            admin can approve or reject your request and the backend can notify you by email.
          </p>

          <div className="mt-8 rounded-2xl border border-[#2a4267] bg-[#122241]/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9fd8ff]">
              What happens next
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>1. Submit your author request form.</p>
              <p>2. Admin reviews your profile and reason.</p>
              <p>3. You receive an email when the request is approved or rejected.</p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-[#2a4267] bg-[#122241]/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#173458] p-2.5 text-[#9fd8ff]">
                  <Bell size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Request Notifications</p>
                  <p className="text-xs text-slate-400">Approval and rejection updates will appear here.</p>
                </div>
              </div>
              <span className="rounded-full bg-[#1a365f] px-2.5 py-1 text-xs font-semibold text-[#9fd8ff]">
                {statusNotifications.filter((notification) => !notification.read).length} new
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {statusNotifications.length === 0 ? (
                <p className="rounded-xl border border-[#294267] bg-[#10203d] px-4 py-3 text-sm text-slate-400">
                  No request updates yet.
                </p>
              ) : (
                statusNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl border px-4 py-3 ${
                      notification.read
                        ? "border-[#294267] bg-[#10203d]"
                        : notification.type === "author_request_approved"
                          ? "border-emerald-400/25 bg-emerald-500/10"
                          : "border-rose-400/25 bg-rose-500/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{notification.message}</p>
                        <p className="mt-1 text-xs text-slate-300">{notification.description}</p>
                      </div>
                      {!notification.read && (
                        <button
                          type="button"
                          onClick={() => handleMarkNotificationRead(notification.id)}
                          className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-8 rounded-xl bg-[#263758] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-[#2d4168]"
          >
            Logout
          </button>
        </section>

        <section className="rounded-[30px] border border-[#2a4267] bg-[linear-gradient(180deg,rgba(18,34,65,0.92)_0%,rgba(12,23,48,0.96)_100%)] p-8 shadow-[0_22px_70px_rgba(8,10,35,0.45)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#173458] p-3 text-[#9fd8ff]">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Request Author Access</h2>
              <p className="mt-1 text-sm text-slate-400">
                Submit your details so admin can review your request.
              </p>
            </div>
          </div>

          <form className="mt-8 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  First Name
                </span>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(event) => onChange("firstName", event.target.value)}
                  className="w-full rounded-xl border border-[#28425f] bg-[#10203d] px-4 py-3 text-white outline-none transition focus:border-[#69bfd7]"
                  placeholder="First name"
                  disabled={loading}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Last Name
                </span>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(event) => onChange("lastName", event.target.value)}
                  className="w-full rounded-xl border border-[#28425f] bg-[#10203d] px-4 py-3 text-white outline-none transition focus:border-[#69bfd7]"
                  placeholder="Last name"
                  disabled={loading}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => onChange("email", event.target.value)}
                className="w-full rounded-xl border border-[#28425f] bg-[#10203d] px-4 py-3 text-white outline-none transition focus:border-[#69bfd7]"
                placeholder="you@example.com"
                disabled={loading}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Short Bio
              </span>
              <textarea
                rows={4}
                value={form.bio}
                onChange={(event) => onChange("bio", event.target.value)}
                className="w-full resize-none rounded-xl border border-[#28425f] bg-[#10203d] px-4 py-3 text-white outline-none transition focus:border-[#69bfd7]"
                placeholder="Tell admin about your background and writing focus."
                disabled={loading}
              />
              <span className="mt-2 block text-right text-xs text-slate-500">
                {form.bio.length}/{MAX_BIO_LENGTH}
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Why do you want to become an author?
              </span>
              <textarea
                rows={5}
                value={form.reason}
                onChange={(event) => onChange("reason", event.target.value)}
                className="w-full resize-none rounded-xl border border-[#28425f] bg-[#10203d] px-4 py-3 text-white outline-none transition focus:border-[#69bfd7]"
                placeholder="Share your goal, experience, and what you plan to publish."
                disabled={loading}
              />
              <span className="mt-2 block text-right text-xs text-slate-500">
                {form.reason.length}/{MAX_REASON_LENGTH}
              </span>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#56aeb9] px-5 py-3.5 text-base font-semibold text-white shadow-[0_12px_24px_rgba(86,174,185,0.24)] transition hover:bg-[#4aa3ae] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              <span>{loading ? "Sending request..." : "Send Request to Admin"}</span>
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
