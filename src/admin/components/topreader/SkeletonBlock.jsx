import React from "react";
import { cn } from "../../../lib/utils";

const SkeletonBlock = ({ className }) => (
  <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />
);

export default SkeletonBlock;
