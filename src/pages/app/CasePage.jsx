import { useState, useEffect, useRef, useCallback } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { getShiftName, nowTimestamp, sf, fv, avg } from "../../utils/utils.js";
import { showToast } from "../../components/ui/Toast.jsx";
import { detectCondition, buildArabicText, buildEnglishText, getSheetRows } from "../../utils/conditions.js";
import SmartTempInput from "../../components/ui/SmartTempInput.jsx";
import IntInput from "../../components/ui/IntInput.jsx";
import SpinBox from "../../components/ui/SpinBox.jsx";
import SmartTimeInput from "../../components/ui/SmartTimeInput.jsx";

const HOUSES = Array.from({ length: 16 }, (_, i) => String(i + 1));
const AGES   = Array.from({ length: 35 }, (_, i) => String(i + 1));
const OKEY   = "farmcase_offline_queue";

const getQ   = () => JSON.parse(localStorage.getItem(OKEY) || "[]");
const addQ   = c => { const q = getQ(); q.push(c); localStorage.setItem(OKEY, JSON.stringify(q)); };
const clearQ = () => localStorage.removeItem(OKEY);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• MAIN PAGE â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function CasePage({ user }) {
  const [farm, setFarm]             = useState("");
  const [house, setHouse]           = useState("");
  const [age, setAge]               = useState("");
  const [sp, setSp]                 = useState("");
  const [rate, setRate]             = useState("");
  const [startTime, setStartTime]   = useState({ h: "", m: "", p: "AM" });
  const [endTime, setEndTime]       = useState({ h: "", m: "", p: "AM" });
  const [sMode, setSMode]           = useState("chem");
  const [sensors, setSensors]       = useState(["", "", "", "", "", ""]);
  const [nh3, setNh3]   = useState(""); const [co2, setCo2] = useState("");
  const [hum, setHum]   = useState(""); const [press, setPress] = useState("");
  const [specialCond, setSpecialCond] = useState(null);
  const [otherConds, setOtherConds]   = useState([]);
  const [history, setHistory]         = useState([]);
  const [savedFarms, setSavedFarms]   = useState([]);
  const [saving, setSaving]           = useState(false);
  const [lastCase, setLastCase]       = useState(null);
  const [farmSugg, setFarmSugg]       = useState([]);
  const [showFDrop, setShowFDrop]     = useState(false);
  const [condTable, setCondTable]     = useState(null);
  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [queueCount, setQueueCount]   = useState(getQ().length);
  const [ageSugg, setAgeSugg]         = useState(null);
  const [narrow, setNarrow]           = useState(window.innerWidth < 900);
  const [caseSaved, setCaseSaved]     = useState(false); // tracks if current form was saved

  const farmType = user?.farm_type || "Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)";

  useEffect(() => {
    const onR = () => setNarrow(window.innerWidth < 900);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    loadData("history", []).then(h => { setHistory(h); setSavedFarms([...new Set(h.map(c => c.farm).filter(Boolean))]); });
    loadData("settings/conditions", null).then(d => setCondTable(d));
    loadData("settings/other_conditions", []).then(d => setOtherConds(Array.isArray(d) ? d : []));
    const now = new Date(); let h = now.getHours(), m = now.getMinutes(), p = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12; setStartTime({ h: String(h).padStart(2, "0"), m: String(m).padStart(2, "0"), p });
  }, []);

  useEffect(() => {
    const on = () => { setIsOnline(true); flush(); }; const off = () => setIsOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, [history]);

  async function flush() {
    const q = getQ(); if (!q.length) return;
    try { const u = [...history, ...q]; await saveData("history", u); setHistory(u); clearQ(); setQueueCount(0); showToast(`âœ… Ù…Ø²Ø§Ù…Ù†Ø© ${q.length} Ø­Ø§Ù„Ø©`, "success"); }
    catch { showToast("âš ï¸ ØªØ¹Ø°Ù‘Ø±Øª Ø§Ù„Ù…Ø²Ø§Ù…Ù†Ø©", "error"); }
  }

  useEffect(() => {
    if (!farm.trim() || !history.length) { setAgeSugg(null); return; }
    const p = [...history].reverse().find(h => h.farm?.trim() === farm.trim());
    setAgeSugg(p?.raw_data?.age ? p.raw_data.age + 1 : null);
  }, [farm, history]);

  // â”€â”€â”€ Condition detection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const detected  = detectCondition({ rate, humidity: hum, co2, age, farmType, conditionsTable: condTable });
  const alerts    = detected.alerts;
  const rule      = detected.rule;

  const rateN = sf(rate);
  const spN   = sf(sp);

  // Temperature condition: rate vs setpoint (user-entered rate)
  const tempCond = rateN !== null && spN !== null
    ? (rateN > spN ? "Ø§Ø±ØªÙØ§Ø¹" : rateN < spN ? "Ø§Ù†Ø®ÙØ§Ø¶" : "Ø·Ø¨ÙŠØ¹ÙŠ")
    : null;

  const condition = specialCond || tempCond || null;
  const deviation = rateN !== null && spN !== null ? rateN - spN : null;
  const avgTemp   = sMode === "temp" ? avg(sensors) : null;

  const condColor = condition === "Ø§Ø±ØªÙØ§Ø¹" ? "#ef4444"
    : condition === "Ø§Ù†Ø®ÙØ§Ø¶" ? "#3b82f6"
    : condition === "Ø·Ø¨ÙŠØ¹ÙŠ"  ? "#22c55e"
    : specialCond === "Ù…Ø´ÙƒÙ„Ø© Ù‡ÙŠØªØ±" ? "#f97316"
    : specialCond === "ØªÙˆÙ‚Ù Ù…Ø±Ø§ÙˆØ­" ? "#a855f7"
    : "#8b949e";

  const toMins  = ({h, m, p}) => { const hv = parseInt(h)||0, mv = parseInt(m)||0; return (p==="PM"&&hv!==12?hv+12:p==="AM"&&hv===12?0:hv)*60+mv; };
  const durMins = () => { if (!startTime.h || !endTime.h) return 0; const s = toMins(startTime), e = toMins(endTime); return e < s ? e+1440-s : e-s; };
  const durText = () => { const d = durMins(); if (d <= 0) return ""; const h = Math.floor(d/60), m = d%60; return h > 0 ? `${h}Ø³${m>0?` ${m}Ø¯`:""}` : `${m} Ø¯Ù‚ÙŠÙ‚Ø©`; };
  const startStr = () => `${(startTime.h||"00").padStart(2,"0")}:${(startTime.m||"00").padStart(2,"0")} ${startTime.p}`;

  function smartFill() {
    if (!farm.trim()) { showToast("Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… Ø§Ù„Ù…Ø²Ø±Ø¹Ø©", "error"); return; }
    const p = [...history].reverse().find(h => h.farm?.trim() === farm.trim() && (!house || h.house === house));
    if (!p) { showToast("Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø³Ø§Ø¨Ù‚Ø©", "info"); return; }
    const r = p.raw_data || {};
    if (r.set_point) setSp(String(r.set_point));
    if (r.age && ageSugg) setAge(String(ageSugg));
    showToast("ØªÙ… Ø§Ù„Ù…Ù„Ø¡ Ø§Ù„Ø°ÙƒÙŠ âœ¨", "success");
  }

  function buildCase() {
    return {
      timestamp: nowTimestamp(), date: new Date().toLocaleDateString("ar-EG"),
      time: startStr(), shift: getShiftName(), farm: farm.trim(), house,
      by_user: user.username, seen: false,
      raw_data: { f_type: farmType, age: parseInt(age)||0, set_point: spN||0,
        sensors: sensors.map(s => ({ val: sf(s)??0 })), rate: sf(rate)||0,
        condition: condition||"Ø§Ù†Ø®ÙØ§Ø¶",
        start_h: startTime.h, start_m: startTime.m, start_p: startTime.p,
        end_h: endTime.h, end_m: endTime.m, end_p: endTime.p, duration: durText(),
        nh3: nh3.trim(), co2: co2.trim(), hum: hum.trim(), press: press.trim(),
        sensor_mode: sMode, special: specialCond||null }
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!farm.trim()) { showToast("âš ï¸ Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… Ø§Ù„Ù…Ø²Ø±Ø¹Ø©", "error"); return; }
    if (!house)       { showToast("âš ï¸ Ø§Ø®ØªØ± Ø§Ù„Ø­Ø¸ÙŠØ±Ø©", "error"); return; }
    if (!sp)          { showToast("âš ï¸ Ø£Ø¯Ø®Ù„ Ø§Ù„Ø³ÙŠØª Ø¨ÙˆÙŠÙ†Øª", "error"); return; }
    setSaving(true);
    const c = buildCase();
    if (isOnline) {
      try { const u = [...history, c]; await saveData("history", u); setHistory(u); if (!savedFarms.includes(c.farm)) setSavedFarms(p => [...p, c.farm]); setLastCase(c); showToast("âœ… ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø­Ø§Ù„Ø©", "success"); reset(); }
      catch { showToast("âŒ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø­ÙØ¸", "error"); }
    } else { addQ(c); setQueueCount(getQ().length); setLastCase(c); showToast("ðŸ“´ Ø­ÙÙØ¸ Ù…Ø­Ù„ÙŠØ§Ù‹", "info"); reset(); }
    setSaving(false);
  }

  function reset() {
    setSensors(["","","","","",""]); setRate(""); setNh3(""); setCo2(""); setHum(""); setPress(""); setSpecialCond(null);
    setCaseSaved(false); setLastCase(null);
    const now = new Date(); let h = now.getHours(), m = now.getMinutes(), p = h >= 12 ? "PM" : "AM"; h = h%12||12;
    setStartTime({ h: String(h).padStart(2,"00"), m: String(m).padStart(2,"0"), p }); setEndTime({ h:"", m:"", p:"AM" });
  }

  // Save case once, then copy. Subsequent copies reuse lastCase without re-saving.
  async function saveAndCopy(copyFn) {
    if (!farm.trim()) { showToast("âš ï¸ Ø£Ø¯Ø®Ù„ Ø±Ù‚Ù… Ø§Ù„Ù…Ø²Ø±Ø¹Ø©", "error"); return; }
    if (!house)       { showToast("âš ï¸ Ø£Ø¯Ø®Ù„ Ø§Ù„Ø­Ø¸ÙŠØ±Ø©", "error"); return; }
    if (!sp)          { showToast("âš ï¸ Ø£Ø¯Ø®Ù„ Ø§Ù„Ø³ÙŠØª Ø¨ÙˆÙŠÙ†Øª", "error"); return; }
    setSaving(true);
    let caseObj = caseSaved && lastCase ? lastCase : null;
    if (!caseObj) {
      caseObj = buildCase();
      if (isOnline) {
        try {
          const upd = [...history, caseObj];
          await saveData("history", upd);
          setHistory(upd);
          if (!savedFarms.includes(caseObj.farm)) setSavedFarms(p => [...p, caseObj.farm]);
        } catch { showToast("âŒ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø­ÙØ¸", "error"); setSaving(false); return; }
      } else {
        addQ(caseObj);
        setQueueCount(getQ().length);
        showToast("ðŸ“´ Ø­ÙÙØ¸ Ù…Ø­Ù„ÙŠØ§Ù‹ â€” Ø³ÙŠÙØ±Ø³Ù„ Ø¹Ù†Ø¯ Ø¹ÙˆØ¯Ø© Ø§Ù„Ø§ØªØµØ§Ù„", "info");
      }
      setLastCase(caseObj);
      setCaseSaved(true);
    }
    copyFn(caseObj);
    setSaving(false);
    reset();
  }

  function copyAr()    { saveAndCopy(c => { navigator.clipboard.writeText(buildArabicText(c)); showToast("ðŸ“± ØªÙ… Ø§Ù„Ø­ÙØ¸ + Ù†Ø³Ø® Ø¹Ø±Ø¨ÙŠ", "success"); }); }
  function copyEn()    { saveAndCopy(c => { navigator.clipboard.writeText(buildEnglishText(c)); showToast("ðŸ“± Saved + Copied EN", "success"); }); }
  function copySheet() { saveAndCopy(c => { const r = getSheetRows(c); if (!r.length){showToast("Ù„Ø§ Ø¨ÙŠØ§Ù†Ø§Øª","error");return;} navigator.clipboard.writeText(r.map(x=>x.join("\t")).join("\n")); showToast("ðŸ“‹ ØªÙ… Ø§Ù„Ø­ÙØ¸ + Ù†Ø³Ø® Excel", "success"); }); }

  const dur = durText(), durM = durMins(), live = buildCase();
  const ALL_SPL = ["Ù…Ø´ÙƒÙ„Ø© Ù‡ÙŠØªØ±", "ØªÙˆÙ‚Ù Ù…Ø±Ø§ÙˆØ­", ...otherConds];

  const card = { background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "16px" };
  const lbl  = { fontSize: ".68rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "8px", overflow: "hidden" }}>

      {/* â”€â”€ STATUS BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ fontWeight: "900", fontSize: ".95rem" }}>âž• ØªØ³Ø¬ÙŠÙ„ Ø­Ø§Ù„Ø©</span>
        <span style={{ fontSize: ".74rem", color: "var(--text-muted)" }}>Ø´ÙØª {getShiftName()}</span>

        {/* Condition badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", background: condColor+"18", border: `1px solid ${condColor}44`, borderRadius: "100px", padding: "3px 10px", transition: "all .3s" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: condColor, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ color: condColor, fontWeight: "800", fontSize: ".78rem" }}>{condition||"Ø¬Ø§Ø±Ù Ø§Ù„ÙƒØ´Ù..."}</span>
          {deviation !== null && <span style={{ fontFamily: "Arial", fontWeight: "900", fontSize: ".72rem", opacity: .8 }}>({deviation>0?"+":""}{fv(deviation)}Â°)</span>}
        </div>

        {/* Other conditions â€” compact inline selector */}
        <select value={specialCond||""} onChange={e => setSpecialCond(e.target.value||null)}
          style={{ padding: "3px 8px", borderRadius: "100px", border: `1px solid ${specialCond?"#f97316":"var(--border)"}`,
            background: specialCond ? "rgba(249,115,22,.12)" : "var(--bg-tertiary)",
            color: specialCond ? "#f97316" : "var(--text-muted)", fontFamily: "var(--font-ar)",
            fontSize: ".74rem", fontWeight: "700", outline: "none", cursor: "pointer", maxWidth: "150px" }}>
          <option value="">âš ï¸ Ø­Ø§Ù„Ø© Ø®Ø§ØµØ©</option>
          {ALL_SPL.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Online */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: ".7rem", color: isOnline?"#22c55e":"#f97316", fontWeight: "700" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isOnline?"#22c55e":"#f97316" }} />
          {isOnline?"Ù…ØªØµÙ„":`ØºÙŠØ± Ù…ØªØµÙ„${queueCount>0?` (${queueCount})`:""}`}
        </div>

        {alerts.map((a, i) => <div key={i} style={{ fontSize: ".68rem", padding: "2px 7px", borderRadius: "100px", background: "rgba(249,115,22,.12)", border: "1px solid #f97316", color: "#f97316", fontWeight: "700" }}>{a.text}</div>)}
      </div>

      {/* â”€â”€ FORM  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <form onSubmit={e => e.preventDefault()} dir="rtl"
        className={`grid grid-cols-1 lg:grid-cols-3 gap-4 h-full text-right ${narrow ? 'overflow-y-auto' : ''}`}
        style={{ minHeight: 0 }}>

        {/* â•â• LEFT: DATA ENTRY â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="flex flex-col gap-4 lg:col-span-2 h-full overflow-y-auto" style={{ minHeight: 0, paddingRight: "4px" }}>

          {/* Farm / House / Age */}
          <div style={card}>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-base">ðŸ¡ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø²Ø±Ø¹Ø©</span>
              <div className="flex gap-2">
                {ageSugg && !age && (
                  <button type="button" onClick={() => setAge(String(ageSugg))}
                    style={{ padding: "1px 7px", borderRadius: "100px", border: "1px solid #f59e0b", background: "rgba(245,158,11,.1)", color: "#f59e0b", fontSize: ".68rem", fontWeight: "700", cursor: "pointer" }}>
                    ðŸ’¡ {ageSugg}ÙŠ
                  </button>
                )}
                <button type="button" className="btn btn-ghost" style={{ padding: "3px 10px", fontSize: ".72rem" }} onClick={smartFill}>âœ¨ ØªØ¹Ø¨Ø¦Ø© Ø°ÙƒÙŠØ©</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full" style={{ minWidth: 0 }}>
              <div style={{ position: "relative" }}>
                <div style={lbl}>Ø±Ù‚Ù… Ø§Ù„Ù…Ø²Ø±Ø¹Ø© *</div>
                <input className="form-input" type="number" inputMode="numeric" placeholder="Ø±Ù‚Ù…" value={farm}
                  onChange={e => { setFarm(e.target.value); setFarmSugg(savedFarms.filter(f => f.includes(e.target.value)).slice(0,5)); setShowFDrop(e.target.value.length>0); }}
                  onBlur={() => setTimeout(() => setShowFDrop(false), 150)}
                  style={{ padding: "4px 6px", fontSize: ".85rem", height: "32px", fontWeight: "700" }} />
                {showFDrop && farmSugg.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", right: 0, left: 0, zIndex: 30, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", boxShadow: "var(--shadow-md)", marginTop: "2px" }}>
                    {farmSugg.map(f => (
                      <div key={f} onMouseDown={() => { setFarm(f); setShowFDrop(false); }}
                        style={{ padding: "5px 10px", cursor: "pointer", fontSize: ".82rem", fontWeight: "700" }}
                        onMouseEnter={e => e.target.style.background = "var(--bg-tertiary)"}
                        onMouseLeave={e => e.target.style.background = "transparent"}>
                        ðŸ¡ {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div style={lbl}>Ø§Ù„Ø­Ø¸ÙŠØ±Ø© *</div>
                <input className="form-input" list="house-opts" placeholder="1-16" value={house}
                  onChange={e => setHouse(e.target.value)}
                  style={{ padding: "4px 6px", fontSize: ".85rem", height: "32px", fontWeight: "700" }} />
                <datalist id="house-opts">{HOUSES.map(h => <option key={h} value={h} />)}</datalist>
              </div>
              <div>
                <div style={lbl}>Ø§Ù„Ø¹Ù…Ø± (ÙŠÙˆÙ…)</div>
                <input className="form-input" list="age-opts" placeholder="1-35" value={age}
                  onChange={e => setAge(e.target.value)}
                  style={{ padding: "4px 6px", fontSize: ".85rem", height: "32px", fontWeight: "700" }} />
                <datalist id="age-opts">{AGES.map(a => <option key={a} value={a} />)}</datalist>
              </div>
            </div>
            {rule && <div style={{ marginTop: "4px", fontSize: ".6rem", color: "var(--text-muted)" }}>ðŸ“Š {farmType} Â· ÙŠ{rule.ageFrom}â€“{rule.ageTo} | L{rule.lowTemp??'â€”'} H+{rule.highTemp??'â€”'} | RH {rule.lowRH||'â€”'}%</div>}
          </div>

          {/* SP + Rate */}
          <div style={card} className="flex flex-col flex-shrink-0">
            <div className="font-bold text-sm md:text-base mb-3">ðŸŒ¡ï¸ Ø§Ù„Ø³ÙŠØª Ø¨ÙˆÙŠÙ†Øª ÙˆØ§Ù„Ù…Ø¹Ø¯Ù„</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full" style={{ minWidth: 0 }}>
              <div>
                <div style={lbl}>Ø³ÙŠØª Ø¨ÙˆÙŠÙ†Øª *</div>
                <SpinBox color={sp?"var(--accent-green)":"var(--border)"} suffix="Â°"
                  onMinus={() => setSp(fv((sf(sp)??32)-.5))} onPlus={() => setSp(fv((sf(sp)??32)+.5))}>
                  <SmartTempInput value={sp} onChange={setSp} step={.5} placeholder="32.0" />
                </SpinBox>
              </div>
              <div>
                <div style={{ ...lbl, color: rateN !== null ? condColor : "var(--text-muted)" }}>
                  Ø§Ù„Ù…Ø¹Ø¯Ù„ * {deviation !== null ? (deviation > 0 ? "â¬†ï¸ Ø§Ø±ØªÙØ§Ø¹" : deviation < 0 ? "â¬‡ï¸ Ø§Ù†Ø®ÙØ§Ø¶" : "âœ… Ø·Ø¨ÙŠØ¹ÙŠ") : ""}
                </div>
                <SpinBox color={rateN !== null ? condColor : "var(--border)"} suffix="Â°"
                  onMinus={() => setRate(fv((sf(rate)??spN??32) - .1))} onPlus={() => setRate(fv((sf(rate)??spN??32) + .1))}>
                  <SmartTempInput value={rate} onChange={setRate} step={.1} placeholder="32.0" color={rateN !== null ? condColor : undefined} />
                </SpinBox>
              </div>
            </div>
            {deviation !== null && sp && (
              <div style={{ marginTop: "5px", height: "4px", background: "var(--bg-tertiary)", borderRadius: "100px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "var(--border)" }} />
                <div style={{ position: "absolute", height: "100%", borderRadius: "100px", background: condColor, transition: "width .4s, left .4s",
                  width: `${Math.min(Math.abs(deviation/(spN||1))*50,50)}%`, left: deviation>0?"50%":`${50-Math.min(Math.abs(deviation/(spN||1))*50,50)}%` }} />
              </div>
            )}
          </div>

          {/* â° TIME â€” between SP and Sensors */}
          <div style={card} className="flex flex-col flex-shrink-0">
            <div className="font-bold text-sm md:text-base mb-3">â° Ø§Ù„ÙˆÙ‚Øª</div>
            <div className="flex gap-4 items-end flex-wrap w-full" style={{ minWidth: 0 }}>
              <SmartTimeInput label="Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©" {...startTime} onChange={v => setStartTime(p => ({...p,...v}))} />
              <SmartTimeInput label="Ø§Ù„Ù†Ù‡Ø§ÙŠØ©" {...endTime}   onChange={v => setEndTime(p => ({...p,...v}))} />
              {dur && (
                <div style={{ padding: "3px 8px", background: durM>=40?"rgba(249,115,22,.12)":"rgba(34,197,94,.08)",
                  border: `1px solid ${durM>=40?"#f97316":"#22c55e"}`, borderRadius: "6px",
                  fontSize: ".7rem", fontWeight: "800", color: durM>=40?"#f97316":"#22c55e", flexShrink: 0, alignSelf: "flex-end", marginBottom: "1px" }}>
                  {dur}{durM>=40?" âš ï¸":""}
                </div>
              )}
            </div>
          </div>

          {/* SENSORS â€” animated tabs */}
          <div style={card} className="flex flex-col flex-1 overflow-hidden h-full">
            {/* Tab bar */}
            <div className="flex flex-shrink-0 mb-4 p-1 rounded-lg gap-1" style={{ background: "var(--bg-tertiary)" }}>
              {[{k:"temp",l:"ðŸŒ¡ï¸ Ø­Ø±Ø§Ø±ÙŠØ©"},{k:"chem",l:"ðŸ§ª ÙƒÙŠÙ…ÙŠØ§Ø¦ÙŠØ©"}].map(({k,l}) => (
                <button key={k} type="button"
                  onClick={() => { setSMode(k); if(k==="temp"){setNh3("");setCo2("");setHum("");setPress("");}else{setSensors(["","","","","",""]);setRate("");} }}
                  style={{ flex: 1, padding: "5px", border: "none", cursor: "pointer", borderRadius: "4px", fontFamily: "var(--font-ar)", fontSize: ".76rem", fontWeight: "700", transition: "all .25s", background: sMode===k?"var(--accent-blue)":"transparent", color: sMode===k?"#fff":"var(--text-muted)" }}>
                  {l}
                </button>
              ))}
            </div>

            {/* Sliding panel */}
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", width: "200%", height: "100%", transition: "transform .35s cubic-bezier(.4,0,.2,1)", transform: sMode==="temp"?"translateX(0)":"translateX(50%)" }}>

                {/* â”€â”€ Temperature â”€â”€ */}
                <div className="flex flex-col gap-2 overflow-y-auto w-full flex-shrink-0" style={{ width: "50%", paddingLeft: "12px", paddingRight: "4px" }}>
                  <div className="grid grid-cols-3 gap-2 w-full flex-1 mb-2">
                    {sensors.slice(0, 6).map((val, i) => {
                      const vN = sf(val), diff = vN!==null&&spN!==null ? vN-spN : null;
                      const sc = diff===null?"var(--border)":diff>0?"#ef4444":diff<0?"#3b82f6":"#22c55e";
                      const textColor = diff===null?undefined:sc;
                      const bg = diff===null?"var(--bg-tertiary)":diff>0?"rgba(239,68,68,.07)":diff<0?"rgba(59,130,246,.07)":"rgba(34,197,94,.05)";
                      return (
                        <div key={i} style={{ background: bg, border: `1px solid ${vN!==null?sc:"var(--border)"}`, borderRadius: "8px", padding: "6px 4px", display: "flex", flexDirection: "column", justifyContent: "center", transition: "all .2s", minHeight: "60px" }}>
                          <div style={{ fontSize: ".65rem", color: "var(--text-muted)", fontWeight: "800", marginBottom: "4px", textAlign: "center" }}>Ø­Ø³Ø§Ø³ {i+1}</div>
                          <SpinBox color={sc} suffix="Â°"
                            onMinus={() => { const n=[...sensors]; n[i]=fv((sf(n[i])??spN??32)-.1); setSensors(n); }}
                            onPlus={() => { const n=[...sensors]; n[i]=fv((sf(n[i])??spN??32)+.1); setSensors(n); }}>
                            <SmartTempInput value={val} step={.1} color={textColor} onChange={v => { const n=[...sensors]; n[i]=v; setSensors(n); }} />
                          </SpinBox>
                          {diff!==null && <div style={{ marginTop:"6px",height:"3px",background:"var(--bg-primary)",borderRadius:"2px",overflow:"hidden" }}><div style={{ height:"100%",background:sc,width:`${Math.min(Math.abs(diff/(spN||1))*100,100)}%`,transition:"width .3s" }}/></div>}
                        </div>
                      );
                    })}
                  </div>
                  {avgTemp!==null && (
                    <div style={{ padding:"10px 14px",background:"var(--bg-primary)",borderRadius:"10px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0, marginTop: "auto" }}>
                      <span style={{ fontSize:".75rem",color:"var(--text-muted)", fontWeight: "700" }}>ðŸ“Š Ù…ØªÙˆØ³Ø· Ø§Ù„Ø­Ø±Ø§Ø±Ø©</span>
                      <span style={{ fontWeight:"900",color:condColor,fontFamily:"monospace, Arial",fontSize:".95rem" }}>{avgTemp.toFixed(2)}Â°C</span>
                    </div>
                  )}
                </div>

                {/* â”€â”€ Chemical â”€â”€ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto flex-shrink-0" style={{ width: "50%", paddingLeft: "12px", paddingRight: "4px" }}>
                  {[
                    { label:"Ø£Ù…ÙˆÙ†ÙŠØ§", id:"nh3",   val:nh3,   set:setNh3,   unit:"ppm", color:"#a855f7", isFloat:true },
                    { label:"COâ‚‚",   id:"co2",   val:co2,   set:setCo2,   unit:"ppm", color:"#6366f1", isFloat:false },
                    { label:"Ø±Ø·ÙˆØ¨Ø©", id:"hum",   val:hum,   set:setHum,   unit:"%",   color:"#3b82f6", isFloat:false },
                    { label:"Ø¶ØºØ·",   id:"press", val:press, set:setPress, unit:"Pa",  color:"#22c55e", isFloat:true  },
                  ].map(({ label, id, val, set, unit, color, isFloat }) => (
                    <div key={id} style={{ background: val?`${color}10`:"var(--bg-tertiary)", border:`1px solid ${val?color:"var(--border)"}`, borderRadius:"8px", padding:"6px 4px", display: "flex", flexDirection: "column", justifyContent: "center", transition:"all .2s", minHeight: "60px" }}>
                      <div style={{ fontSize:".65rem", color:val?color:"var(--text-muted)", fontWeight:"800", marginBottom:"4px", textAlign: "center" }}>{label} <span style={{ opacity:.6 }}>({unit})</span></div>
                      <SpinBox color={color}
                        onMinus={() => set(v => isFloat?fv((sf(v)??0)-.1):String(Math.max(0,(parseInt(v)||0)-1)))}
                        onPlus={() => set(v => isFloat?fv((sf(v)??0)+.1):String((parseInt(v)||0)+1))}>
                        {isFloat
                          ? <SmartTempInput value={val} onChange={set} color={val?color:undefined} />
                          : <IntInput       value={val} onChange={set} color={val?color:undefined} />}
                      </SpinBox>
                      {id==="hum" && age && rule?.lowRH && (
                        <div style={{ marginTop:"5px",fontSize:".65rem",color:"var(--text-muted)", textAlign: "center" }}>Ù…Ø«Ø§Ù„ÙŠ: {rule.lowRH}%{rule.highRH?`â€“${rule.highRH}%`:""}</div>
                      )}
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* â•â• RIGHT: COPY + PREVIEW + SUBMIT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <div className="flex flex-col gap-4 lg:col-span-1 h-full overflow-hidden" style={{ minHeight: 0 }}>

          {/* Compact 3-button copy row */}
          <div style={card} className="flex flex-col">
            <div className="font-bold text-sm text-muted mb-2">ðŸ“¤ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª (Ø­ÙØ¸ ÙˆÙ†Ø³Ø®)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { icon:"ðŸ“±", line1:"ÙˆØ§ØªØ³Ø§Ø¨", line2:"Ø¹Ø±Ø¨ÙŠ",   fn:copyAr,    c:"#25D366", bg:"rgba(37,211,102," },
                { icon:"ðŸ“±", line1:"WhatsApp",line2:"EN",    fn:copyEn,    c:"#22c55e", bg:"rgba(34,197,94,"  },
                { icon:"ðŸ“‹", line1:"Excel",  line2:"Row",    fn:copySheet, c:"#6366f1", bg:"rgba(99,102,241," },
              ].map(({ icon, line1, line2, fn, c, bg }) => (
                <button key={line2} type="button" onClick={fn}
                  style={{ padding: "8px 4px", borderRadius: "8px", border: `1px solid ${c}50`, background: `${bg}.07)`,
                    color: c, cursor: "pointer", transition: "all .18s", textAlign: "center", lineHeight: 1.3, fontFamily: "var(--font-ar)" }}
                  onMouseEnter={e => { e.currentTarget.style.background=`${bg}.18)`; e.currentTarget.style.borderColor=c; }}
                  onMouseLeave={e => { e.currentTarget.style.background=`${bg}.07)`; e.currentTarget.style.borderColor=`${c}50`; }}>
                  <div style={{ fontSize: "1.1rem" }}>{icon}</div>
                  <div style={{ fontSize: ".68rem", fontWeight: "800" }}>{line1}</div>
                  <div style={{ fontSize: ".62rem", fontWeight: "700", opacity: .8 }}>{line2}</div>
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp Preview */}
          <div style={{ ...card, flex: 1, minHeight: 0, overflow: "hidden", background: "rgba(37,211,102,.04)", borderColor: "#25D36630" }}>
            <div style={{ fontSize: ".68rem", color: "#25D366", fontWeight: "800", marginBottom: "5px" }}>ðŸ“± Ù…Ø¹Ø§ÙŠÙ†Ø© ÙˆØ§ØªØ³Ø§Ø¨</div>
            <pre style={{ fontFamily: "var(--font-ar)", fontSize: ".72rem", lineHeight: "1.7", color: "var(--text-secondary)", whiteSpace: "pre-wrap", margin: 0, overflow: "auto", height: "calc(100% - 22px)" }}>
              {(farm||house) ? buildArabicText(live) : "Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ù„Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„Ø±Ø³Ø§Ù„Ø©..."}
            </pre>
          </div>

        </div>
      </form>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.55} }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        /* â”€ Responsive â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
        @media (max-width: 900px) {
          .sensor-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 500px) {
          .sensor-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
