import { AlertTriangle, Bell, BookOpen, Shield, User, Users } from "lucide-react";

export const CATEGORIES = [
  { key: "all",    label: "All",             icon: Bell },
  { key: "user",   label: "User Activity",   icon: User },
  { key: "book",   label: "Book Management", icon: BookOpen },
  { key: "system", label: "System Alerts",   icon: Shield },
];

export const TYPE_META = {
  info:            { icon: Bell,          color: "bg-[color:var(--surface-overlay-15)] text-accent",           label: "Info",             category: "system" },
  success:         { icon: Bell,          color: "bg-emerald-500/12 text-emerald-500",                         label: "Success",          category: "system" },
  warning:         { icon: AlertTriangle, color: "bg-amber-500/12 text-amber-500",                             label: "Warning",          category: "system" },
  error:           { icon: AlertTriangle, color: "bg-rose-500/12 text-rose-500",                               label: "Error",            category: "system" },
  user_registered: { icon: User,          color: "bg-[color:var(--surface-overlay-15)] text-accent",           label: "New User",         category: "user" },
  user_login:      { icon: User,          color: "bg-[color:var(--surface-overlay-10)] text-accent",           label: "User Login",       category: "user" },
  user_milestone:  { icon: Users,         color: "bg-[color:var(--surface-overlay-20)] text-accent",           label: "Milestone",        category: "user" },
  book_added:      { icon: BookOpen,      color: "bg-emerald-500/12 text-emerald-500",                         label: "Book Added",       category: "book" },
  book_approved:   { icon: BookOpen,      color: "bg-emerald-500/12 text-emerald-500",                         label: "Book Approved",    category: "book" },
  book_rejected:   { icon: AlertTriangle, color: "bg-rose-500/12 text-rose-500",                               label: "Book Rejected",    category: "book" },
  book_updated:    { icon: BookOpen,      color: "bg-[color:var(--surface-overlay-15)] text-accent",           label: "Book Updated",     category: "book" },
  book_deleted:    { icon: BookOpen,      color: "bg-rose-500/12 text-rose-500",                               label: "Book Deleted",     category: "book" },
  book_reported:   { icon: AlertTriangle, color: "bg-amber-500/12 text-amber-500",                             label: "Book Reported",    category: "book" },
  book_pending:    { icon: BookOpen,      color: "bg-amber-500/12 text-amber-500",                             label: "Pending Approval", category: "book" },
  reader_feedback: { icon: Users,         color: "bg-[color:var(--surface-overlay-15)] text-accent",           label: "Reader Feedback",  category: "user" },
  server_error:    { icon: AlertTriangle, color: "bg-rose-500/12 text-rose-500",                               label: "Server Error",     category: "system" },
  failed_login:    { icon: Shield,        color: "bg-rose-500/12 text-rose-500",                               label: "Failed Login",     category: "system" },
  auth_issue:      { icon: Shield,        color: "bg-amber-500/12 text-amber-500",                             label: "Auth Issue",       category: "system" },
  system_alert:    { icon: AlertTriangle, color: "bg-rose-500/12 text-rose-500",                               label: "System Alert",     category: "system" },
};

export const SEND_TARGETS = [
  { value: "all",     label: "All Users" },
  { value: "authors", label: "Authors Only" },
  { value: "readers", label: "Readers Only" },
];

export const SEND_TYPES = [
  { value: "info",    label: "Info",    color: "text-blue-600" },
  { value: "success", label: "Success", color: "text-emerald-600" },
  { value: "warning", label: "Warning", color: "text-amber-600" },
  { value: "error",   label: "Error",   color: "text-rose-600" },
];

export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function getMeta(type) {
  const normalizedType = String(type || "").trim().toLowerCase();
  return TYPE_META[normalizedType] || TYPE_META[type] || {
    icon: Bell,
    color: "bg-[color:var(--surface-overlay-10)] text-[color:var(--text)]",
    label: type,
    category: "system",
  };
}
