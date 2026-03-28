import React from "react";
import SkeletonBlock from "./SkeletonBlock";

const TopReadersLoading = () => (
  <div className="space-y-8">
    {/* Stats row */}
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {[1, 2, 3].map((k) => (
        <div key={k} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-4 h-8 w-20" />
          <SkeletonBlock className="mt-3 h-2 w-full" />
        </div>
      ))}
    </div>

    {/* Podium row */}
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {[1, 2, 3].map((k) => (
        <div key={k} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <SkeletonBlock className="h-20 w-20 rounded-full" />
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-3 w-20" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-14 w-full" />
            <SkeletonBlock className="h-14 w-full" />
          </div>
        </div>
      ))}
    </div>

    {/* Table */}
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="space-y-3 p-6">
        <SkeletonBlock className="h-5 w-40" />
        {[1, 2, 3, 4, 5].map((k) => (
          <SkeletonBlock key={k} className="h-14 w-full" />
        ))}
      </div>
    </div>
  </div>
);

export default TopReadersLoading;
