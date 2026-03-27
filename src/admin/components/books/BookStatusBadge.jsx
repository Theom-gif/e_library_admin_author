import React from "react";
import { Activity, Check, X } from "lucide-react";
import { cn } from "../../../lib/utils";

const BookStatusBadge = ({ status, t, size = 14 }) => (
  <span
    className={cn(
      "text-xs font-bold px-2 py-1 rounded-lg inline-flex items-center gap-1.5",
      status === "Approved"
        ? "text-green-400 bg-green-400/10"
        : status === "Pending"
          ? "text-orange-400 bg-orange-400/10"
          : "text-red-400 bg-red-400/10",
    )}
  >
    {status === "Approved" ? (
      <Check size={size} />
    ) : status === "Pending" ? (
      <Activity size={size} />
    ) : (
      <X size={size} />
    )}
    {t(status)}
  </span>
);

export default BookStatusBadge;
