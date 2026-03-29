import { useState } from "react";
import { CheckCircle, Loader2, Send, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { sendAdminNotification } from "../../services/adminService";
import { SEND_TARGETS, SEND_TYPES } from "./constants";

const SendPanel = ({ t, onSent }) => {
  const [form, setForm] = useState({ title: "", message: "", target: "all", type: "info" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      await sendAdminNotification({
        title:   form.title.trim(),
        message: form.message.trim(),
        target:  form.target,
        type:    form.type,
      });
      setResult({ ok: true, text: "Notification sent successfully." });
      setForm({ title: "", message: "", target: "all", type: "info" });
      onSent?.();
    } catch (err) {
      setResult({ ok: false, text: err?.response?.data?.message || err?.message || "Failed to send." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
          <Send size={15} />
        </div>
        <h3 className="font-bold text-[var(--text)]">{t("Send Notification")}</h3>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        {/* Target */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            {t("Send To")}
          </label>
          <div className="flex flex-wrap gap-2">
            {SEND_TARGETS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("target", opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                  form.target === opt.value
                    ? "border-indigo-500 bg-indigo-600 text-white"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-indigo-400 hover:text-indigo-400",
                )}
              >
                {t(opt.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            {t("Type")}
          </label>
          <div className="flex flex-wrap gap-2">
            {SEND_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set("type", opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                  form.type === opt.value
                    ? "border-[var(--border)] bg-[var(--surface-overlay-20)] text-[var(--text)]"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-overlay-5)]",
                )}
              >
                <span className={opt.color}>{t(opt.label)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            {t("Title")}
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder={t("Notification title...")}
            required
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Message */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            {t("Message")}
          </label>
          <textarea
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder={t("Write your message...")}
            required
            rows={4}
            className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {result && (
          <div className={cn(
            "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium",
            result.ok
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/20 bg-rose-500/10 text-rose-400",
          )}>
            {result.ok ? <CheckCircle size={14} /> : <X size={14} />}
            {result.text}
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !form.title.trim() || !form.message.trim()}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? t("Sending...") : t("Send Notification")}
        </button>
      </form>
    </div>
  );
};

export default SendPanel;
