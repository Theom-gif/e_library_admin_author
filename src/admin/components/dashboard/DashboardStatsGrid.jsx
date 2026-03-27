import React from "react";
import StatCard from "../StatCard";

const DashboardStatsGrid = ({ statCards, isLoading }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {statCards.map((card) => (
      <StatCard
        key={card.label}
        label={card.label}
        value={card.value}
        trend={card.trend >= 0 ? `+${card.trend}` : `${card.trend}`}
        icon={card.icon}
        color={card.color}
        isLoading={isLoading}
      />
    ))}
  </div>
);

export default DashboardStatsGrid;
