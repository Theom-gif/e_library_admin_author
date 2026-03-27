import React from "react";
import { cn } from "../../../lib/utils";

const SkeletonBlock = ({ className }) => (
  <div className={cn("animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/70", className)} />
);

export default SkeletonBlock;
