import { SLabel, StatusBadge, TableWrap, Td, Th } from "./primitives";

const SORTS = ["cpu", "memory", "threads", "name", "pid"];

export default function ProcessesPage({ processes, sortBy, onSort, onRefresh }) {
  return (
    <div className="flex flex-col gap-3">
      <SLabel>process list</SLabel>

      {/* Sort bar */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)", lineHeight: "28px" }}>sort by:</span>
        {SORTS.map((k) => (
          <SortBtn key={k} active={sortBy === k} onClick={() => onSort(k)}>{k.toUpperCase()}</SortBtn>
        ))}
        <button
          onClick={onRefresh}
          style={{ marginLeft: "auto", fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, background: "transparent", border: "1px solid var(--sm-border)", borderRadius: 4, color: "var(--sm-text-3)", padding: "4px 9px", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--sm-border-md)"; e.currentTarget.style.color = "var(--sm-text-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--sm-border)"; e.currentTarget.style.color = "var(--sm-text-3)"; }}
        >
          ↻ refresh
        </button>
      </div>

      <div style={{ background: "var(--sm-bg-surface)", border: "1px solid var(--sm-border)", borderRadius: 8, overflow: "hidden" }}>
        <TableWrap maxHeight={420}>
          <thead>
            <tr>
              <Th>PID</Th>
              <Th>Name</Th>
              <Th>User</Th>
              <Th>CPU %</Th>
              <Th>Memory MB</Th>
              <Th>Mem %</Th>
              <Th>Threads</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {!processes.length ? (
              <tr><td colSpan={8} style={{ textAlign: "center", padding: 24, color: "var(--sm-text-3)", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>loading processes…</td></tr>
            ) : processes.map((p) => (
              <tr key={p.pid} style={{ borderBottom: "1px solid var(--sm-border)", transition: "background .1s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--sm-bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Td style={{ color: "var(--sm-text-3)" }}>{p.pid}</Td>
                <Td style={{ color: "var(--sm-text-1)", fontWeight: 500 }}>{p.name}</Td>
                <Td>{p.user}</Td>
                <Td style={{ color: cpuColor(p.cpu), fontWeight: 500 }}>{p.cpu.toFixed(1)}%</Td>
                <Td style={{ color: "var(--sm-cyan)" }}>{p.memoryMb.toFixed(1)}</Td>
                <Td>{p.memoryPercent.toFixed(2)}%</Td>
                <Td style={{ color: "var(--sm-purple)" }}>{p.threads}</Td>
                <Td><span style={{ fontSize: 10, color: statusColor(p.status) }}>{p.status}</span></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}

function SortBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, padding: "4px 10px",
        borderRadius: 4, cursor: "pointer",
        border: `1px solid ${active ? "var(--sm-accent)" : "var(--sm-border)"}`,
        background: active ? "var(--sm-accent-dim)" : "transparent",
        color: active ? "var(--sm-accent)" : "var(--sm-text-3)",
        transition: "all .12s",
      }}
    >
      {children}
    </button>
  );
}

const cpuColor = (v) => v >= 85 ? "var(--sm-red)" : v >= 65 ? "var(--sm-amber)" : "var(--sm-green)";
const statusColor = (s) => s === "running" ? "var(--sm-green)" : s === "zombie" ? "var(--sm-red)" : s === "sleeping" ? "var(--sm-text-3)" : "var(--sm-amber)";
