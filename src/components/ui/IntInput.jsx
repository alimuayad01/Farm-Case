import { useRef, useEffect } from "react";

/* ─── IntInput ──────────────────────────────────────────────────────────────── */
export default function IntInput({ value, onChange, placeholder = "--", step = 1, color }) {
  const ref = useRef();
  const str = String(value ?? "");
  useEffect(() => {
    const el = ref.current;
    if (!el || el !== document.activeElement) return;
    requestAnimationFrame(() => { try { el.setSelectionRange(str.length, str.length); } catch {} });
  }, [str]);
  
  function handleKeyDown(e) {
    if (["Tab", "Enter", "Shift"].includes(e.key)) return;
    if (e.key === "ArrowUp")   { e.preventDefault(); onChange(String((parseInt(value) || 0) + step)); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); onChange(String(Math.max(0, (parseInt(value) || 0) - step))); return; }
    if (e.key === "Escape" || e.key === "Delete") { e.preventDefault(); onChange(""); return; }
    if (e.key === "Backspace") { e.preventDefault(); onChange(str.slice(0, -1)); return; }
    if (!/^[0-9]$/.test(e.key)) { e.preventDefault(); return; }
    e.preventDefault(); if (str.length < 5) onChange(str + e.key);
  }

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const wh = e => { e.preventDefault(); onChange(String(Math.max(0, (parseInt(value) || 0) + (e.deltaY < 0 ? step : -step)))); };
    el.addEventListener("wheel", wh, { passive: false });
    return () => el.removeEventListener("wheel", wh);
  }, [value, step]);

  return (
    <input ref={ref} type="text" inputMode="numeric"
      value={str} onKeyDown={handleKeyDown} onChange={() => {}}
      placeholder={placeholder}
      style={{ flex: 1, height: "100%", border: "none", background: "transparent",
        color: color || "var(--text-primary)", fontFamily: "monospace, Arial",
        fontSize: "1rem", fontWeight: "800", textAlign: "center",
        outline: "none", cursor: "text", caretColor: "var(--accent-blue)", minWidth: 0 }} />
  );
}
