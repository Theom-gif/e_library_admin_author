import { SLabel } from "./primitives";

export default function DisksPage({ disks }) {
  return (
    <div>
      <SLabel>disk partitions</SLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
        {!disks.length ? (
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "var(--sm-text-3)" }}>loading…</span>
        ) : disks.map((d) => {
          const c = d.percent >= 90 ? "var(--sm-red)" : d.percent >= 70 ? "var(--sm-amber)" : "var(--sm-green)";
          return (
            <div key={d.device} style={{ background: "var(--sm-bg-surface)", border: "1px solid var(--sm-border)", borderRadius: 8, padding: "14px 16px" }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, color: "var(--sm-text-1)", marginBottom: 3 }}>{d.device}</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: "var(--sm-text-3)", marginBottom: 10 }}>{d.mountpoint} · {d.fstype}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                {[["Used", d.usedGb], ["Free", d.freeGb], ["Total", d.totalGb]].map(([label, val]) => (
                  <div key={label} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10 }}>
                    <div style={{ color: "var(--sm-text-3)", fontSize: 9 }}>{label}</div>
                    {val}GB
                  </div>
                ))}
              </div>
              <div style={{ height: 5, background: "var(--sm-bg-raised)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", borderRadius: 3, width: `${d.percent}%`, background: c, transition: "width .5s" }} />
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, fontWeight: 600, color: c }}>{d.percent}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
