import { useState, useMemo } from "react";
import { SLabel, StatusBadge, TableWrap, Td, Th, fmtTime } from "./primitives";

const FILTERS = [
  { key: "all",     label: "all",     cls: "fa" },
  { key: "success", label: "success", cls: "fs" },
  { key: "warning", label: "warn",    cls: "fw" },
  { key: "error",   label: "error",   cls: "fe" },
];

const COLS = ["at", "user", "action", "sourceIp", "service", "region", "status"];

export default function LogsPage({ logs }) {
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [sortKey, setSortKey] = useState("at");
  const [sortDir, setSortDir] = useState(-1);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d * -1);
    else { setSortKey(key); setSortDir(-1); }
  };

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return [...logs]
      .filter((l) => filter === "all" || l.status === filter)
      .filter((l) => !q || [l.user, l.sourceIp, l.action, l.service, l.region].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => {
        const av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
        return av < bv ? sortDir : av > bv ? -sortDir : 0;
      })
      .slice(0, 80);
  }, [logs, filter, search, sortKey, sortDir]);

  const exportData = (fmt) => {
    const data = rows;
    let content, mime, ext;
    if (fmt === "json") {
      content = JSON.stringify(data, null, 2); mime = "application/json"; ext = "json";
    } else {
      content = COLS.join(",") + "\n" + data.map((r) => COLS.map((c) => `"${(r[c] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      mime = "text/csv"; ext = "csv";
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = `sysmon-logs-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
  };

  const pillStyle = (key) => ({
    fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, padding: "3px 9px",
    borderRadius: 4, cursor: "pointer", border: "1px solid",
    transition: "all .12s",
    ...(filter === key
      ? key === "all"     ? { borderColor: "var(--sm-accent)", color: "var(--sm-accent)", background: "var(--sm-accent-dim)" }
      : key === "success" ? { borderColor: "var(--sm-green)",  color: "var(--sm-green)",  background: "var(--sm-green-dim)" }
      : key === "warning" ? { borderColor: "var(--sm-amber)",  color: "var(--sm-amber)",  background: "var(--sm-amber-dim)" }
                          : { borderColor: "var(--sm-red)",    color: "var(--sm-red)",    background: "var(--sm-red-dim)" }
      : { borderColor: "var(--sm-border)", color: "var(--sm-text-3)", background: "transparent" }),
  });

  return (
    <div>
      <SLabel>access events</SLabel>
      <div style={{ background: "var(--sm-bg-surface)", border: "1px solid var(--sm-border)", borderRadius: 8, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "11px 14px", borderBottom: "1px solid var(--sm-border)", background: "var(--sm-bg-raised)" }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, fontWeight: 600, color: "var(--sm-text-2)", marginRight: 4 }}>access events</span>
          {FILTERS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)} style={pillStyle(key)}>{label}</button>
          ))}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="search user / ip / action…"
            style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, background: "var(--sm-bg-surface)", border: "1px solid var(--sm-border)", borderRadius: 4, color: "var(--sm-text-1)", padding: "4px 9px", outline: "none", marginLeft: "auto", width: 200 }}
          />
          {["csv", "json"].map((fmt) => (
            <button key={fmt} onClick={() => exportData(fmt)} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, background: "transparent", border: "1px solid var(--sm-border)", borderRadius: 4, color: "var(--sm-text-3)", padding: "4px 9px", cursor: "pointer" }}>
              ↓ {fmt.toUpperCase()}
            </button>
          ))}
        </div>

        <TableWrap maxHeight={400}>
          <thead>
            <tr>
              {COLS.map((c) => (
                <Th key={c} onClick={() => handleSort(c)} sortDir={sortKey === c ? sortDir : 0}>
                  {c === "at" ? "Time" : c === "sourceIp" ? "Source IP" : c.charAt(0).toUpperCase() + c.slice(1)}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "var(--sm-text-3)", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11 }}>no matching events</td></tr>
            ) : rows.map((l) => (
              <tr key={l.id} style={{ borderBottom: "1px solid var(--sm-border)", transition: "background .1s" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--sm-bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <Td style={{ color: "var(--sm-text-3)" }}>{fmtTime(l.at)}</Td>
                <Td style={{ color: "var(--sm-text-1)", fontWeight: 500 }}>{l.user}</Td>
                <Td style={{ color: "var(--sm-accent)" }}>{l.action}</Td>
                <Td style={{ color: "var(--sm-text-2)" }}>{l.sourceIp}</Td>
                <Td style={{ color: "var(--sm-cyan)" }}>{l.service}</Td>
                <Td><span style={{ fontSize: 9, color: "var(--sm-text-3)", background: "var(--sm-bg-raised)", padding: "2px 6px", borderRadius: 3 }}>{l.region}</span></Td>
                <Td><StatusBadge status={l.status} /></Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </div>
    </div>
  );
}
