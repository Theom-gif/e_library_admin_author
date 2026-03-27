import React from "react";
import { cn } from "../../../lib/utils";

const SurfaceCard = ({ className, children }) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_-20px_rgba(15,23,42,0.35)] transition-all duration-300 ease-out dark:border-slate-700/80 dark:bg-slate-900/85 dark:shadow-[0_10px_35px_-20px_rgba(2,6,23,0.9)]",
      className,
    )}
  >
    {children}
  </div>
);

export default SurfaceCard;
