import { SLabel } from "./primitives";

export default function NetworkPage({ interfaces }) {
  return (
    <div>
      <SLabel>network interfaces</SLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {!interfaces.length ? (
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--sm-text-3)" }}>loading…</span>
        ) : interfaces.map((n) => (
          <div key={n.name} style={{ background: "var(--sm-bg-surface)", border: "1px solid var(--sm-border)", borderRadius: 8, padding: "13px 15px" }}>
            {/* Head */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 600, color: "var(--sm-text-1)" }}>{n.name}</span>
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 3, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 600,
                background: n.isUp ? "var(--sm-green-dim)" : "var(--sm-red-dim)",
                color: n.isUp ? "var(--sm-green)" : "var(--sm-red)",
                border: `1px solid ${n.isUp ? "rgba(39,201,143,.2)" : "rgba(232,65,74,.2)"}`,
              }}>
                {n.isUp ? "UP" : "DOWN"}
              </span>
              {n.speedMbps > 0 && <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)" }}>{n.speedMbps}Mbps</span>}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
              {[
                ["Recv",     `${n.bytesRecvMb.toFixed(1)} MB`],
                ["Sent",     `${n.bytesSentMb.toFixed(1)} MB`],
                ["Pkts In",  n.packetsRecv.toLocaleString()],
                ["Pkts Out", n.packetsSent.toLocaleString()],
                ["Err In",   n.errIn,  n.errIn  > 0],
                ["Err Out",  n.errOut, n.errOut > 0],
              ].map(([label, val, isErr]) => (
                <div key={label} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>
                  <span style={{ color: "var(--sm-text-3)", fontSize: 9, display: "block" }}>{label}</span>
                  <span style={{ color: isErr ? "var(--sm-red)" : "var(--sm-text-2)" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Addresses */}
            {n.addresses.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
                {n.addresses.map((a) => (
                  <span key={a} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)", background: "var(--sm-bg-raised)", border: "1px solid var(--sm-border)", borderRadius: 3, padding: "1px 7px" }}>{a}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
