import React from "react";

const SystemMonitorFooter = ({ items, sessionId = "LB-TR-7482-9901" }) => (
  <footer className="bg-background-dark border-t border-white/5 px-6 py-3 text-[11px] text-slate-500 flex justify-between items-center z-20">
    <div className="flex items-center gap-6">
      {items.map((item) => (
        <div key={item.text} className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${item.dotClass}`}></span>
          <span>{item.text}</span>
        </div>
      ))}
    </div>
    <div className="font-mono opacity-60">Session ID: {sessionId}</div>
  </footer>
);

export default SystemMonitorFooter;
