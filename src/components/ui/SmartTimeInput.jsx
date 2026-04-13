import { useRef, useEffect, useState } from "react";
import { showToast } from "./Toast.jsx";

export default function SmartTimeInput({ label, h, m, p, onChange }) {
  const [localH, setLocalH] = useState(h || "");
  const [localM, setLocalM] = useState(m || "");
  const pickerRef = useRef();

  // Sync from props if they change externally
  useEffect(() => { setLocalH(h || ""); }, [h]);
  useEffect(() => { setLocalM(m || ""); }, [m]);

  function commitTime(newH, newM, newP) {
    onChange({ h: newH, m: newM, p: newP });
  }

  function handleHourChange(val) {
    const v = parseInt(val);
    if (v > 12) {
      showToast("⚠️ أنت تستخدم نظام 12 ساعة، للتبديل يرجى التوجه للإعدادات", "error");
      setLocalH("");
      commitTime("", localM, p);
      return;
    }
    setLocalH(val);
  }

  function handleBlurH() {
    let v = parseInt(localH);
    if (isNaN(v)) {
      setLocalH(h || "");
      return;
    }
    if (v > 12) {
      showToast("⚠️ أنت تستخدم نظام 12 ساعة، للتبديل يرجى التوجه للإعدادات", "error");
      setLocalH("");
      commitTime("", localM, p);
      return;
    }
    if (v < 1) v = 1;

    const formatted = String(v).padStart(2, "0");
    setLocalH(formatted);
    commitTime(formatted, localM, p);
  }

  function handleBlurM() {
    let v = parseInt(localM);
    if (isNaN(v)) {
      setLocalM(m || "");
      return;
    }
    v = Math.max(0, Math.min(59, v));
    const formatted = String(v).padStart(2, "0");
    setLocalM(formatted);
    commitTime(localH, formatted, p);
  }

  function toggleAMPM() {
    commitTime(localH, localM, p === "AM" ? "PM" : "AM");
  }

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: "800", marginBottom: "4px", textAlign: "right" }}>{label}</div>
      <div className="flex items-center gap-2" dir="ltr">
        
        {/* Main time field */}
        <div className="focus-ring" style={{ 
            flex: 1, 
            position: "relative", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            background: "var(--bg-tertiary)", 
            border: "1px solid var(--border)", 
            borderRadius: "8px", 
            height: "36px", 
            paddingLeft: "34px",
            paddingRight: "10px", 
            gap: "4px" 
          }}>
          
          <input 
            type="number" 
            min="1" max="12" 
            placeholder="--" 
            value={localH}
            onChange={(e) => handleHourChange(e.target.value)} 
            onBlur={handleBlurH}
            style={{ 
              width: "48px", 
              background: "transparent", 
              border: "none", 
              color: "var(--text-primary)", 
              fontFamily: "var(--font-en)", 
              fontSize: "1rem", 
              fontWeight: "700", 
              textAlign: "center", 
              outline: "none", 
              caretColor: "var(--accent-blue)" 
            }} 
          />

          {/* Colon */}
          <span style={{ 
            color: "var(--text-muted)", 
            fontWeight: "900", 
            fontSize: "1rem", 
            marginBottom: "2px", 
            userSelect: "none" 
          }}>:</span>

          <input 
            type="number" 
            min="0" max="59" 
            placeholder="--" 
            value={localM}
            onChange={(e) => setLocalM(e.target.value)} 
            onBlur={handleBlurM}
            style={{ 
              width: "48px", 
              background: "transparent", 
              border: "none", 
              color: "var(--text-primary)", 
              fontFamily: "var(--font-en)", 
              fontSize: "1rem", 
              fontWeight: "700", 
              textAlign: "center", 
              outline: "none", 
              caretColor: "var(--accent-blue)" 
            }} 
          />

          {/* Clock icon - Positioned absolutely so it doesn't break centering */}
          <button 
            type="button" 
            title="اختر الوقت" 
            onClick={() => { try { pickerRef.current?.showPicker(); } catch {} }}
            style={{ 
              position: "absolute",
              left: "4px", /* moved to left since container is LTR */
              top: "50%",
              transform: "translateY(-50%)",
              width: "26px", 
              height: "26px", 
              background: "transparent", 
              border: "none", 
              cursor: "pointer", 
              color: "var(--text-muted)", 
              fontSize: ".9rem", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              borderRadius: "5px", 
              transition: "all .15s" 
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-secondary)"; e.currentTarget.style.color = "var(--accent-blue)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            🕒
          </button>

          {/* Hidden native time input */}
          <input 
            ref={pickerRef} 
            type="time" 
            tabIndex={-1}
            style={{ position: "absolute", top: "100%", left: "0", width: "1px", height: "1px", opacity: 0, pointerEvents: "none", border: "none", padding: 0 }}
            onChange={(e) => {
              if (!e.target.value) return;
              const [hh, mm] = e.target.value.split(":");
              let vH = parseInt(hh); 
              const nP = vH >= 12 ? "PM" : "AM";
              vH = vH % 12 || 12;
              const finalH = String(vH).padStart(2, "0");
              setLocalH(finalH);
              setLocalM(mm);
              commitTime(finalH, mm, nP);
            }} 
          />
        </div>

        {/* AM/PM toggle */}
        <button 
          type="button" 
          onClick={toggleAMPM}
          style={{ 
            width: "44px", 
            height: "36px", 
            borderRadius: "8px", 
            border: "1px solid",
            borderColor: p === "PM" ? "rgba(239,68,68,.3)" : "rgba(37,99,235,.3)",
            background: p === "PM" ? "rgba(239,68,68,.1)": "rgba(37,99,235,.1)", 
            color: p === "PM" ? "#ef4444" : "#3b82f6", 
            fontWeight: "900", 
            fontSize: ".8rem", 
            cursor: "pointer", 
            transition: "all .2s", 
            flexShrink: 0 
          }}
        >
          {p}
        </button>
      </div>
    </div>
  );
}
