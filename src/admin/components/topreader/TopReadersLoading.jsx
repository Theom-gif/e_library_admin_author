import React from "react";
import SkeletonBlock from "./SkeletonBlock";
import SurfaceCard from "./SurfaceCard";

const TopReadersLoading = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {[1, 2, 3].map((key) => (
        <SurfaceCard key={key} className="p-6">
          <SkeletonBlock className="h-5 w-24" />
          <SkeletonBlock className="mt-4 h-10 w-20" />
          <SkeletonBlock className="mt-4 h-4 w-36" />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-14 w-full" />
            <SkeletonBlock className="h-14 w-full" />
          </div>
        </SurfaceCard>
      ))}
    </div>
    <SurfaceCard className="overflow-hidden p-0">
      <div className="space-y-4 p-6">
        <SkeletonBlock className="h-6 w-44" />
        {[1, 2, 3, 4].map((key) => (
          <SkeletonBlock key={key} className="h-12 w-full" />
        ))}
      </div>
    </SurfaceCard>
  </div>
);

export default TopReadersLoading;
