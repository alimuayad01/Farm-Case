import { useRef, useEffect, useCallback } from "react";
import { showToast } from "./Toast.jsx";

/* ─── SmartTimeInput ─────────────────────────────────────────────────────────── */
export default function SmartTimeInput({ label, h, m, p, onChange }) {
  const hRef = useRef(); const mRef = useRef(); const pickerRef = useRef();
  
  useEffect(() => { if (hRef.current) hRef.current.value = h || ""; }, [h]);
  useEffect(() => { if (mRef.current) mRef.current.value = m || ""; }, [m]);
  
  const fire = useCallback(() => {
    onChange({ h: hRef.current?.value || "", m: mRef.current?.value || "", p });
  }, [onChange, p]);

  function validateHour() {
    const v = parseInt(hRef.current?.value);
    if (isNaN(v) || hRef.current?.value === "") { fire(); return; }
    if (v > 12) {
      showToast("⚠️ نظام 12 ساعة | الساعة لا تتجاوز 12", "error");
      hRef.current.value = "12"; fire(); return;
    }
    if (v < 1) { hRef.current.value = "01"; fire(); return; }
    hRef.current.value = String(v).padStart(2, "0"); fire();
  }

  function validateMin() {
    const v = parseInt(mRef.current?.value);
    if (isNaN(v) || mRef.current?.value === "") { fire(); return; }
    const clamped = Math.max(0, Math.min(59, v));
    mRef.current.value = String(clamped).padStart(2, "0"); fire();
  }
  
  useEffect(() => {
    const he = hRef.current, me = mRef.current; if (!he || !me) return;
    const wH = e => { e.preventDefault(); const v = parseInt(he.value) || 0; he.value = String(((v - 1 + 12) % 12) + 1).padStart(2, "0"); fire(); };
    const wM = e => { e.preventDefault(); const v = parseInt(me.value) || 0; me.value = String((v + (e.deltaY < 0 ? 1 : -1) + 60) % 60).padStart(2, "0"); fire(); };
    he.addEventListener("wheel", wH, { passive: false }); me.addEventListener("wheel", wM, { passive: false });
    return () => { he.removeEventListener("wheel", wH); me.removeEventListener("wheel", wM); };
  }, [fire]);

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: "800", marginBottom: "4px" }}>{label}</div>
      <div className="flex items-center gap-2">

        {/* Main time field */}
        <div className="focus-ring" style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "8px", height: "36px", padding: "0 6px", gap: "2px" }}>

          <input ref={hRef} type="number" min="1" max="12" placeholder="--" defaultValue={h}
            onChange={fire} onBlur={validateHour}
            style={{ width: "24px", background: "transparent", border: "none", color: "var(--text-primary)", fontFamily: "Arial", fontSize: ".9rem", fontWeight: "800", textAlign: "center", outline: "none", lineHeight: "36px", caretColor: "var(--accent-blue)" }} />

          {/* Colon — perfectly centered */}
          <span style={{ color: "var(--text-muted)", fontWeight: "900", fontSize: "1.1rem", lineHeight: "1", alignSelf: "center", marginBottom: "2px", userSelect: "none" }}>:</span>

          <input ref={mRef} type="number" min="0" max="59" placeholder="--" defaultValue={m}
            onChange={fire} onBlur={validateMin}
            style={{ width: "24px", background: "transparent", border: "none", color: "var(--text-primary)", fontFamily: "Arial", fontSize: ".9rem", fontWeight: "800", textAlign: "center", outline: "none", lineHeight: "36px", caretColor: "var(--accent-blue)" }} />

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Clock icon */}
          <button type="button" title="اختر الوقت" onClick={() => { try { pickerRef.current?.showPicker(); } catch {} }}
            style={{ width: "26px", height: "26px", background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: ".9rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "5px", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--accent-blue)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}>
            🕒
          </button>

          {/* Hidden native time input — positioned so picker appears just below this field */}
          <input ref={pickerRef} type="time" tabIndex={-1}
            style={{ position: "absolute", top: "100%", right: "0", width: "1px", height: "1px", opacity: 0, pointerEvents: "none", border: "none", padding: 0 }}
            onChange={(e) => {
              if (!e.target.value) return;
              const [hh, mm] = e.target.value.split(":");
              let vH = parseInt(hh); const nP = vH >= 12 ? "PM" : "AM";
              vH = vH % 12 || 12;
              onChange({ h: String(vH).padStart(2, "0"), m: mm, p: nP });
            }} />
        </div>

        {/* AM/PM toggle */}
        <button type="button" onClick={() => onChange({ h: hRef.current?.value || "", m: mRef.current?.value || "", p: p === "AM" ? "PM" : "AM" })}
          style={{ width: "40px", height: "36px", borderRadius: "8px", border: "none", background: p === "PM" ? "rgba(239,68,68,.15)" : "rgba(37,99,235,.15)", color: p === "PM" ? "#ef4444" : "#3b82f6", fontWeight: "900", fontSize: ".78rem", cursor: "pointer", transition: "all .2s", flexShrink: 0 }}>
          {p}
        </button>
      </div>
    </div>
  );
}
