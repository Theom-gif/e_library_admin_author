import { SLabel, TableWrap, Td, Th } from "./primitives";

const SORTS = ["cpu", "memory", "threads", "name", "pid"];

export default function ProcessesPage({ processes, sortBy, onSort, onRefresh }) {
  return (
    <div className="flex flex-col gap-3">
      <SLabel>process list</SLabel>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 9,
            color: "var(--sm-text-3)",
            lineHeight: "28px",
          }}
        >
          sort by:
        </span>
        {SORTS.map((key) => (
          <SortBtn key={key} active={sortBy === key} onClick={() => onSort(key)}>
            {key.toUpperCase()}
          </SortBtn>
        ))}
        <button
          onClick={onRefresh}
          style={{
            marginLeft: "auto",
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 10,
            background: "transparent",
            border: "1px solid var(--sm-border)",
            borderRadius: 4,
            color: "var(--sm-text-3)",
            padding: "4px 9px",
            cursor: "pointer",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.borderColor = "var(--sm-border-md)";
            event.currentTarget.style.color = "var(--sm-text-2)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.borderColor = "var(--sm-border)";
            event.currentTarget.style.color = "var(--sm-text-3)";
          }}
        >
          refresh
        </button>
      </div>

      <div
        style={{
          background: "var(--sm-bg-surface)",
          border: "1px solid var(--sm-border)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
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
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: "var(--sm-text-3)",
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 11,
                  }}
                >
                  loading processes...
                </td>
              </tr>
            ) : (
              processes.map((process) => (
                <tr
                  key={process.pid}
                  style={{
                    borderBottom: "1px solid var(--sm-border)",
                    transition: "background .1s",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "var(--sm-bg-hover)";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                >
                  <Td style={{ color: "var(--sm-text-3)" }}>{process.pid}</Td>
                  <Td style={{ color: "var(--sm-text-1)", fontWeight: 500 }}>{process.name}</Td>
                  <Td>{process.user}</Td>
                  <Td style={{ color: cpuColor(process.cpu), fontWeight: 500 }}>
                    {process.cpu.toFixed(1)}%
                  </Td>
                  <Td style={{ color: "var(--sm-cyan)" }}>{process.memoryMb.toFixed(1)}</Td>
                  <Td>{process.memoryPercent.toFixed(2)}%</Td>
                  <Td style={{ color: "var(--sm-purple)" }}>{process.threads}</Td>
                  <Td>
                    <span style={{ fontSize: 10, color: statusColor(process.status) }}>
                      {process.status}
                    </span>
                  </Td>
                </tr>
              ))
            )}
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
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: 10,
        padding: "4px 10px",
        borderRadius: 4,
        cursor: "pointer",
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

const cpuColor = (value) =>
  value >= 85 ? "var(--sm-red)" : value >= 65 ? "var(--sm-amber)" : "var(--sm-green)";

const statusColor = (status) =>
  status === "running"
    ? "var(--sm-green)"
    : status === "zombie"
      ? "var(--sm-red)"
      : status === "sleeping"
        ? "var(--sm-text-3)"
        : "var(--sm-amber)";
