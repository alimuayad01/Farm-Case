import { useRef, useEffect } from "react";
import { sf, fv } from "../../utils/utils.js";

/* ─── SmartTempInput ───────────────────────────────────────────────────────────
   Keyboard-controlled. After 2 integer digits, auto-inserts "." and waits for
   one decimal digit. Format: [-]XX.X  (max). Arrow keys & scroll wheel work. */
export default function SmartTempInput({ value, onChange, step = 0.1, placeholder = "——.—", color, disabled }) {
  const ref = useRef();
  const str = String(value ?? "");
  const isNeg  = str.startsWith("-");
  const body   = isNeg ? str.slice(1) : str;
  const hasDot = body.includes(".");
  const intPt  = body.split(".")[0];
  const decPt  = hasDot ? body.split(".")[1] : "";

  // Keep caret at end while focused
  useEffect(() => {
    const el = ref.current;
    if (!el || el !== document.activeElement) return;
    requestAnimationFrame(() => { try { el.setSelectionRange(str.length, str.length); } catch {} });
  }, [str]);

  function handleKeyDown(e) {
    if (["Tab", "Enter", "Shift"].includes(e.key)) return;
    if (e.key === "ArrowUp")   { e.preventDefault(); onChange(fv((sf(value) ?? 0) + step)); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); onChange(fv((sf(value) ?? 0) - step)); return; }
    if (e.key === "Escape" || e.key === "Delete") { e.preventDefault(); onChange(""); return; }
    if (e.key === "-" && !str) { e.preventDefault(); onChange("-"); return; }
    if (e.key === "Backspace") {
      e.preventDefault();
      if (hasDot && decPt === "")     onChange((isNeg ? "-" : "") + intPt);
      else if (hasDot)                onChange((isNeg ? "-" : "") + intPt + "." + decPt.slice(0, -1));
      else if (intPt.length > 0)      onChange((isNeg ? "-" : "") + intPt.slice(0, -1));
      else if (isNeg)                 onChange("");
      return;
    }
    if (e.key === "." && !hasDot && intPt.length > 0) {
      e.preventDefault(); onChange((isNeg ? "-" : "") + intPt + "."); return;
    }
    if (!/^[0-9]$/.test(e.key)) { e.preventDefault(); return; }
    e.preventDefault();
    if (!hasDot) {
      if (intPt.length >= 2) onChange((isNeg ? "-" : "") + intPt + "." + e.key); // auto-decimal
      else                   onChange((isNeg ? "-" : "") + intPt + e.key);
    } else {
      if (decPt.length < 1)  onChange((isNeg ? "-" : "") + intPt + "." + decPt + e.key);
    }
  }

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const wh = e => { e.preventDefault(); onChange(fv((sf(value) ?? 0) + (e.deltaY < 0 ? step : -step))); };
    el.addEventListener("wheel", wh, { passive: false });
    return () => el.removeEventListener("wheel", wh);
  }, [value, step]);

  return (
    <input ref={ref} type="text" inputMode="numeric"
      value={str} onKeyDown={handleKeyDown} onChange={() => {}}
      placeholder={placeholder} disabled={disabled}
      style={{ flex: 1, height: "100%", border: "none", background: "transparent",
        color: disabled ? "var(--text-muted)" : (color || "var(--text-primary)"),
        fontFamily: "monospace, Arial", fontSize: "1rem", fontWeight: "800",
        textAlign: "center", outline: "none", cursor: "text", caretColor: "var(--accent-blue)", minWidth: 0 }} />
  );
}
