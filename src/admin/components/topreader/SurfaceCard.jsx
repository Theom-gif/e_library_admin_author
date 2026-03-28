import React from "react";
import { cn } from "../../../lib/utils";

const SurfaceCard = ({ className, children }) => (
  <div
    className={cn(
      "rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300",
      className,
    )}
  >
    {children}
  </div>
);

export default SurfaceCard;
