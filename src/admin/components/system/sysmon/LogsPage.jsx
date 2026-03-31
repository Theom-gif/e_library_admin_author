import { useMemo, useState } from "react";
import { SLabel, StatusBadge, TableWrap, Td, Th, fmtTime } from "./primitives";

const FILTERS = [
  { key: "all", label: "all" },
  { key: "success", label: "success" },
  { key: "warning", label: "warn" },
  { key: "error", label: "error" },
];

const COLS = ["at", "user", "action", "sourceIp", "service", "region", "status"];

export default function LogsPage({ logs, onRefresh }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("at");
  const [sortDir, setSortDir] = useState(-1);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((direction) => direction * -1);
      return;
    }

    setSortKey(key);
    setSortDir(-1);
  };

  const rows = useMemo(() => {
    const query = search.toLowerCase();

    return [...logs]
      .filter((entry) => filter === "all" || entry.status === filter)
      .filter(
        (entry) =>
          !query ||
          [entry.user, entry.sourceIp, entry.action, entry.service, entry.region].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          ),
      )
      .sort((a, b) => {
        const aValue = a[sortKey] ?? "";
        const bValue = b[sortKey] ?? "";
        return aValue < bValue ? sortDir : aValue > bValue ? -sortDir : 0;
      })
      .slice(0, 80);
  }, [filter, logs, search, sortDir, sortKey]);

  const exportData = (format) => {
    const data = rows;
    let content;
    let mime;
    let extension;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      mime = "application/json";
      extension = "json";
    } else {
      content = [
        COLS.join(","),
        ...data.map((row) =>
          COLS.map((column) => `"${String(row[column] ?? "").replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");
      mime = "text/csv";
      extension = "csv";
    }

    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(new Blob([content], { type: mime }));
    anchor.download = `sysmon-logs-${new Date().toISOString().slice(0, 10)}.${extension}`;
    anchor.click();
  };

  const pillStyle = (key) => ({
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 10,
    padding: "3px 9px",
    borderRadius: 4,
    cursor: "pointer",
    border: "1px solid",
    transition: "all .12s",
    ...(filter === key
      ? key === "all"
        ? {
            borderColor: "var(--sm-accent)",
            color: "var(--sm-accent)",
            background: "var(--sm-accent-dim)",
          }
        : key === "success"
          ? {
              borderColor: "var(--sm-green)",
              color: "var(--sm-green)",
              background: "var(--sm-green-dim)",
            }
          : key === "warning"
            ? {
                borderColor: "var(--sm-amber)",
                color: "var(--sm-amber)",
                background: "var(--sm-amber-dim)",
              }
            : {
                borderColor: "var(--sm-red)",
                color: "var(--sm-red)",
                background: "var(--sm-red-dim)",
              }
      : {
          borderColor: "var(--sm-border)",
          color: "var(--sm-text-3)",
          background: "transparent",
        }),
  });

  return (
    <div>
      <SLabel>access events</SLabel>

      <div
        style={{
          background: "var(--sm-bg-surface)",
          border: "1px solid var(--sm-border)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            padding: "11px 14px",
            borderBottom: "1px solid var(--sm-border)",
            background: "var(--sm-bg-raised)",
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--sm-text-2)",
              marginRight: 4,
            }}
          >
            access events
          </span>

          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={pillStyle(key)}>
              {label}
            </button>
          ))}

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="search user / ip / action..."
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              background: "var(--sm-bg-surface)",
              border: "1px solid var(--sm-border)",
              borderRadius: 4,
              color: "var(--sm-text-1)",
              padding: "4px 9px",
              outline: "none",
              marginLeft: "auto",
              width: 200,
            }}
          />

          {typeof onRefresh === "function" && (
            <button
              onClick={onRefresh}
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10,
                background: "transparent",
                border: "1px solid var(--sm-border)",
                borderRadius: 4,
                color: "var(--sm-text-3)",
                padding: "4px 9px",
                cursor: "pointer",
              }}
            >
              refresh
            </button>
          )}

          {["csv", "json"].map((format) => (
            <button
              key={format}
              onClick={() => exportData(format)}
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10,
                background: "transparent",
                border: "1px solid var(--sm-border)",
                borderRadius: 4,
                color: "var(--sm-text-3)",
                padding: "4px 9px",
                cursor: "pointer",
              }}
            >
              {`down ${format.toUpperCase()}`}
            </button>
          ))}
        </div>

        <TableWrap maxHeight={400}>
          <thead>
            <tr>
              {COLS.map((column) => (
                <Th
                  key={column}
                  onClick={() => handleSort(column)}
                  sortDir={sortKey === column ? sortDir : 0}
                >
                  {column === "at"
                    ? "Time"
                    : column === "sourceIp"
                      ? "Source IP"
                      : column.charAt(0).toUpperCase() + column.slice(1)}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: 24,
                    color: "var(--sm-text-3)",
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 11,
                  }}
                >
                  no matching events
                </td>
              </tr>
            ) : (
              rows.map((log) => (
                <tr
                  key={log.id}
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
                  <Td style={{ color: "var(--sm-text-3)" }}>{fmtTime(log.at)}</Td>
                  <Td style={{ color: "var(--sm-text-1)", fontWeight: 500 }}>{log.user}</Td>
                  <Td style={{ color: "var(--sm-accent)" }}>{log.action}</Td>
                  <Td style={{ color: "var(--sm-text-2)" }}>{log.sourceIp}</Td>
                  <Td style={{ color: "var(--sm-cyan)" }}>{log.service}</Td>
                  <Td>
                    <span
                      style={{
                        fontSize: 9,
                        color: "var(--sm-text-3)",
                        background: "var(--sm-bg-raised)",
                        padding: "2px 6px",
                        borderRadius: 3,
                      }}
                    >
                      {log.region}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={log.status} />
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
