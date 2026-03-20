import { useState } from "react";

/* ─── SpinBox ───────────────────────────────────────────────────────────────── */
export default function SpinBox({ children, color, onMinus, onPlus, suffix }) {
  const [hov, setHov] = useState(false);
  
  return (
    <div className="focus-ring" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "flex", alignItems: "center", background: "var(--bg-tertiary)",
        border: `1px solid ${color || "var(--border)"}`, borderRadius: "8px", height: "36px", transition: "border-color .2s" }}>
      <button type="button" onClick={onMinus}
        style={{ width: "24px", height: "100%", background: hov ? "rgba(0,0,0,.12)" : "transparent", border: "none",
          color: hov ? "var(--text-primary)" : "transparent", cursor: "pointer", flexShrink: 0,
          fontSize: ".85rem", fontWeight: "900", borderRadius: "7px 0 0 7px", transition: "all .18s" }}>−</button>
      
      {children}
      
      {suffix && <span style={{ color: "var(--text-muted)", fontSize: ".62rem", paddingLeft: "1px", flexShrink: 0 }}>{suffix}</span>}
      
      <button type="button" onClick={onPlus}
        style={{ width: "24px", height: "100%", background: hov ? "rgba(0,0,0,.12)" : "transparent", border: "none",
          color: hov ? "var(--text-primary)" : "transparent", cursor: "pointer", flexShrink: 0,
          fontSize: ".85rem", fontWeight: "900", borderRadius: "0 7px 7px 0", transition: "all .18s" }}>+</button>
    </div>
  );
}
