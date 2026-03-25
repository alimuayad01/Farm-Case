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

/* ══════════════════════════ MAIN PAGE ══════════════════════════════════════════ */
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
  const [templates, setTemplates]     = useState(null);
  const [generalSettings, setGenSettings] = useState({ allow_emp_farm_type: false });
  const [farmType, setFarmType]       = useState("مزرعة (تسمين)");
  const [isOnline, setIsOnline]       = useState(navigator.onLine);
  const [queueCount, setQueueCount]   = useState(getQ().length);
  const [ageSugg, setAgeSugg]         = useState(null);
  const [narrow, setNarrow]           = useState(window.innerWidth < 900);
  const [caseSaved, setCaseSaved]     = useState(false); // tracks if current form was saved
  const [customTextAr, setCustomTextAr] = useState(null);
  const [customTextEn, setCustomTextEn] = useState(null);
  const [previewLang, setPreviewLang]   = useState("ar");
  const [excelMapping, setExcelMapping] = useState(null);

  useEffect(() => {
    const onR = () => setNarrow(window.innerWidth < 900);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    loadData("history", []).then(h => { setHistory(h); setSavedFarms([...new Set(h.map(c => c.farm).filter(Boolean))]); });
    loadData("settings/conditions", null).then(d => setCondTable(d));
    loadData("settings/other_conditions", []).then(d => setOtherConds(Array.isArray(d) ? d : []));
    loadData("settings/general", { allow_emp_farm_type: false }).then(d => setGenSettings(d));
    loadData("settings/excel_mapping", null).then(d => setExcelMapping(d));
    loadData("templates_config", null).then(d => setTemplates(d));
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
    try { const u = [...history, ...q]; await saveData("history", u); setHistory(u); clearQ(); setQueueCount(0); showToast(`✅ مزامنة ${q.length} حالة`, "success"); }
    catch { showToast("⚠️ تعذّرت المزامنة", "error"); }
  }

  useEffect(() => {
    if (!farm.trim() || !history.length) { setAgeSugg(null); return; }
    const p = [...history].reverse().find(h => h.farm?.trim() === farm.trim());
    setAgeSugg(p?.raw_data?.age ? p.raw_data.age + 1 : null);
  }, [farm, history]);

  // ─── Condition detection ──────────────────────────────────────────────────
  const detected  = detectCondition({ rate, humidity: hum, co2, age, farmType, conditionsTable: condTable });
  const alerts    = detected.alerts;
  const rateN = sf(rate);
  const spN   = sf(sp);

  const tempCond = rateN !== null && spN !== null
    ? (rateN > spN ? "ارتفاع" : rateN < spN ? "انخفاض" : "طبيعي")
    : null;

  const condition = specialCond || tempCond || null;
  const deviation = rateN !== null && spN !== null ? rateN - spN : null;
  const avgTemp   = sMode === "temp" ? avg(sensors) : null;

  const condColor = condition === "ارتفاع" ? "#ef4444"
    : condition === "انخفاض" ? "#3b82f6"
    : condition === "طبيعي"  ? "#22c55e"
    : specialCond === "مشكلة هيتر" ? "#f97316"
    : specialCond === "توقف مراوح" ? "#a855f7"
    : "#8b949e";

  const toMins  = ({h, m, p}) => { const hv = parseInt(h)||0, mv = parseInt(m)||0; return (p==="PM"&&hv!==12?hv+12:p==="AM"&&hv===12?0:hv)*60+mv; };
  const durMins = () => { if (!startTime.h || !endTime.h) return 0; const s = toMins(startTime), e = toMins(endTime); return e < s ? e+1440-s : e-s; };
  const durText = () => { const d = durMins(); if (d <= 0) return ""; const h = Math.floor(d/60), m = d%60; return h > 0 ? `${h}:${m.toString().padStart(2,"0")} ساعة` : `${m} دقيقة`; };
  const startStr = () => `${(startTime.h||"00").padStart(2,"0")}:${(startTime.m||"00").padStart(2,"0")} ${startTime.p}`;

  const lastFillKey = useRef("");
  useEffect(() => {
    const key = `${farm.trim()}-${house}`;
    if (!farm.trim() || lastFillKey.current === key) return;
    const p = [...history].reverse().find(h => h.farm?.trim() === farm.trim() && h.raw_data?.f_type === farmType && (!house || h.house === house));
    if (p) {
      const r = p.raw_data || {};
      let filled = false;
      // Removed set_point deduction as requested
      if (r.age && ageSugg && !age) { setAge(String(ageSugg)); filled = true; }
      if (filled) showToast("✨ تم الاستنتاج التلقائي للبيانات", "info");
      lastFillKey.current = key;
    }
  }, [farm, house, history, sp, age, ageSugg, farmType]);

  function buildCase() {
    return {
      timestamp: nowTimestamp(), date: new Date().toLocaleDateString("en-GB"),
      time: startStr(), shift: getShiftName(), farm: farm.trim(), house,
      by_user: user.username, seen: false,
      sent_to_sheet: false,
      raw_data: { f_type: farmType, age: parseInt(age)||0, set_point: spN||0,
        sensors: sensors.map(s => ({ val: sf(s)??0 })), rate: sf(rate)||0,
        condition: condition||"انخفاض",
        start_h: startTime.h, start_m: startTime.m, start_p: startTime.p,
        end_h: endTime.h, end_m: endTime.m, end_p: endTime.p, 
        duration: durText(),
        nh3: nh3.trim(), co2: co2.trim(), hum: hum.trim(), press: press.trim(),
        sensor_mode: sMode, special: specialCond||null }
    };
  }

  async function saveAndCopy(copyFn) {
    if (!farm.trim() || !house || !sp) { showToast("⚠️ بيانات ناقصة", "error"); return; }
    setSaving(true);
    let caseObj = caseSaved && lastCase ? lastCase : null;
    if (!caseObj) {
      caseObj = buildCase();
      if (isOnline) {
        // Run save in background to avoid copy delay
        saveData("history", [...history, caseObj])
          .then(() => {
            if (!savedFarms.includes(caseObj.farm)) setSavedFarms(p => [...p, caseObj.farm]);
            setHistory(prev => [...prev, caseObj]);
          })
          .catch(() => showToast("❌ خطأ بمزامنة السحاب", "error"));
      } else { 
        addQ(caseObj); 
        setQueueCount(getQ().length); 
      }
      setLastCase(caseObj); setCaseSaved(true);
    }
    await copyFn(caseObj);
    setSaving(false);
    // reset(); // Removed reset as requested
  }

  function copyAr()    { saveAndCopy(c => { navigator.clipboard.writeText(customTextAr !== null ? customTextAr : buildArabicText(c, templates)); showToast("📱 تم الحفظ + نسخ عربي", "success"); }); }
  function copyEn()    { saveAndCopy(c => { navigator.clipboard.writeText(customTextEn !== null ? customTextEn : buildEnglishText(c, templates)); showToast("📱 Saved + Copied EN", "success"); }); }
  async function copySheet() { 
    await saveAndCopy(async (c) => { 
      const rows = getSheetRows(c, excelMapping?.typeMapping || excelMapping, excelMapping?.columnOrder); 
      if (!rows.length){ showToast("⚠️ لا توجد بيانات للتصدير", "error"); return; } 
      navigator.clipboard.writeText(rows.map(x=>x.join("\t")).join("\n")); 
      
      const upd = history.map(h => (h.timestamp === c.timestamp ? { ...h, sent_to_sheet: true } : h));
      setHistory(upd);
      saveData("history", upd).catch(() => showToast("❌ خطأ بمزامنة الشيت", "error"));
      showToast("📊 تم الحفظ + الإضافة لقائمة الشيت اليومية", "success"); 
    }); 
  }

  function reset() {
    setSensors(["","","","","",""]); setRate(""); setNh3(""); setCo2(""); setHum(""); setPress(""); setSpecialCond(null);
    setCaseSaved(false); setLastCase(null);
    const now = new Date(); let h = now.getHours(), m = now.getMinutes(), p = h >= 12 ? "PM" : "AM"; h = h%12||12;
    setStartTime({ h: String(h).padStart(2,"00"), m: String(m).padStart(2,"0"), p }); setEndTime({ h:"", m:"", p:"AM" });
  }

  const dur = durText(), durM = durMins(), live = buildCase();
  const autoTextAr = (farm || house) ? buildArabicText(live, templates) : "...";
  const autoTextEn = (farm || house) ? buildEnglishText(live, templates) : "...";

  // Reset custom text if form changes significantly (we use a simple stringified dependency)
  useEffect(() => {
    setCustomTextAr(null);
    setCustomTextEn(null);
  }, [farm, house, age, sp, rate, startTime, endTime, nh3, co2, hum, press, specialCond, JSON.stringify(sensors), sMode, farmType]);

  const ALL_SPL = ["مشكلة هيتر", "توقف مراوح", ...otherConds];

  const card = { background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "16px" };
  const lbl  = { fontSize: ".68rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "8px", overflow: "hidden" }}>
      {/* ── STATUS BAR ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ fontWeight: "900", fontSize: ".95rem" }}>➕ تسجيل حالة</span>
        <span style={{ fontSize: ".74rem", color: "var(--text-muted)" }}>شفت {getShiftName()}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "5px", background: condColor+"18", border: `1px solid ${condColor}44`, borderRadius: "100px", padding: "3px 10px", transition: "all .3s" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: condColor, display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ color: condColor, fontWeight: "800", fontSize: ".78rem" }}>{condition||"جارٍ الكشف..."}</span>
          {deviation !== null && <span style={{ fontFamily: "Arial", fontWeight: "900", fontSize: ".72rem", opacity: .8 }}>({deviation>0?"+":""}{fv(deviation)}°)</span>}
        </div>
        <select value={specialCond||""} onChange={e => setSpecialCond(e.target.value||null)}
          style={{ padding: "3px 8px", borderRadius: "100px", border: `1px solid ${specialCond?"#f97316":"var(--border)"}`,
            background: specialCond ? "rgba(249,115,22,.12)" : "var(--bg-tertiary)",
            color: specialCond ? "#f97316" : "var(--text-muted)", fontFamily: "var(--font-ar)",
            fontSize: ".74rem", fontWeight: "700", outline: "none", cursor: "pointer", maxWidth: "150px" }}>
          <option value="">⚠️ حالة خاصة</option>
          {ALL_SPL.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: ".7rem", color: isOnline?"#22c55e":"#f97316", fontWeight: "700" }}>
          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isOnline?"#22c55e":"#f97316" }} />
          {isOnline?"متصل":`غير متصل${queueCount>0?` (${queueCount})`:""}`}
        </div>
        {alerts.map((a, i) => <div key={i} style={{ fontSize: ".68rem", padding: "2px 7px", borderRadius: "100px", background: "rgba(249,115,22,.12)", border: "1px solid #f97316", color: "#f97316", fontWeight: "700" }}>{a.text}</div>)}
      </div>

      {/* ── FORM  ──────────────────────────────────────────────────────────── */}
      <form onSubmit={e => e.preventDefault()} dir="rtl"
        className={`grid grid-cols-1 lg:grid-cols-3 gap-4 h-full text-right ${narrow ? 'overflow-y-auto' : ''}`}
        style={{ minHeight: 0 }}>

        {/* ══ LEFT: DATA ENTRY ════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4 lg:col-span-2 h-full overflow-y-auto" style={{ minHeight: 0, paddingRight: "4px" }}>
          {/* Removing wrapping card and letting inputs be direct children/smaller cards */}
          <div className="flex justify-between items-center px-1 mb-2 mt-2">
            <span className="font-bold text-base">🏡 بيانات المزرعة</span>
            <div className="flex items-center gap-2">
               {(user?.role === "admin" || generalSettings.allow_emp_farm_type) && (
                 <select value={farmType} onChange={e => setFarmType(e.target.value)}
                    style={{ padding: "1px 7px", borderRadius: "100px", border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontSize: ".76rem", fontWeight: "700", cursor: "pointer", outline: "none" }}>
                    <option value="مزرعة (تسمين)">مزرعة (تسمين)</option>
                    <option value="إنتاج">إنتاج</option>
                    <option value="تربية">تربية</option>
                    <option value="جدود">جدود</option>
                    <option value="امهات البياض">أمهات البياض</option>
                 </select>
               )}
              {ageSugg && !age && (
                <button type="button" onClick={() => setAge(String(ageSugg))}
                  style={{ padding: "1px 7px", borderRadius: "100px", border: "1px solid #f59e0b", background: "rgba(245,158,11,.1)", color: "#f59e0b", fontSize: ".72rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                  <span>💡</span><span>{ageSugg} اسبوع/يوم</span>
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
              <div style={card} className="relative">
                <div style={lbl}>رقم المزرعة *</div>
                <input className="form-input" type="number" inputMode="numeric" placeholder="رقم" value={farm}
                  onChange={e => { setFarm(e.target.value); setFarmSugg(savedFarms.filter(f => f.includes(e.target.value)).slice(0,5)); setShowFDrop(e.target.value.length>0); }}
                  onBlur={() => setTimeout(() => setShowFDrop(false), 150)}
                  style={{ padding: "4px 6px", fontSize: ".85rem", height: "32px", fontWeight: "700" }} />
                {showFDrop && farmSugg.length > 0 && (
                  <div style={{ position: "absolute", top: "100%", right: 0, left: 0, zIndex: 30, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "6px", boxShadow: "var(--shadow-md)", marginTop: "2px" }}>
                    {farmSugg.map(f => (
                      <div key={f} onMouseDown={() => { setFarm(f); setShowFDrop(false); }}
                        style={{ padding: "5px 10px", cursor: "pointer", fontSize: ".82rem", fontWeight: "700" }}>
                        🏡 {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={card}>
                <div style={lbl}>الحظيرة *</div>
                <input className="form-input" list="house-opts" placeholder="1-16" value={house} onChange={e => setHouse(e.target.value)} style={{ padding: "4px 6px", fontSize: ".85rem", height: "32px", fontWeight: "700" }} />
                <datalist id="house-opts">{HOUSES.map(h => <option key={h} value={h} />)}</datalist>
              </div>
              <div style={card}>
                <div style={lbl}>العمر (يوم)</div>
                <input className="form-input" list="age-opts" placeholder="1-35" value={age} onChange={e => setAge(e.target.value)} style={{ padding: "4px 6px", fontSize: ".85rem", height: "32px", fontWeight: "700" }} />
                <datalist id="age-opts">{AGES.map(a => <option key={a} value={a} />)}</datalist>
              </div>
          </div>

          <div style={card} className="flex flex-col flex-shrink-0">
            <div className="font-bold text-sm md:text-base mb-3">🌡️ السيت بوينت والمعدل</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div>
                <div style={lbl}>سيت بوينت *</div>
                <SpinBox color={sp?"var(--accent-green)":"var(--border)"} suffix="°" onMinus={() => setSp(fv((sf(sp)??32)-.5))} onPlus={() => setSp(fv((sf(sp)??32)+.5))}>
                  <SmartTempInput value={sp} onChange={setSp} step={.5} placeholder="32.0" />
                </SpinBox>
              </div>
              <div>
                <div style={{ ...lbl, color: rateN !== null ? condColor : "var(--text-muted)" }}>
                  المعدل * {deviation !== null ? (deviation > 0 ? "⬆️ ارتفاع" : deviation < 0 ? "⬇️ انخفاض" : "✅ طبيعي") : ""}
                </div>
                <SpinBox color={rateN !== null ? condColor : "var(--border)"} suffix="°" onMinus={() => setRate(fv((sf(rate)??spN??32) - .1))} onPlus={() => setRate(fv((sf(rate)??spN??32) + .1))}>
                  <SmartTempInput value={rate} onChange={setRate} step={.1} placeholder="32.0" color={rateN !== null ? condColor : undefined} />
                </SpinBox>
              </div>
            </div>
          </div>

          <div style={card} className="flex flex-col flex-shrink-0">
            <div className="flex justify-between items-center mb-3 w-full">
              <div className="font-bold text-sm md:text-base">⏰ الوقت</div>
              {dur && (
                <div style={{ padding: "3px 8px", background: durM>=40?"rgba(249,115,22,.12)":"rgba(34,197,94,.08)", border: `1px solid ${durM>=40?"#f97316":"#22c55e"}`, borderRadius: "100px", fontSize: ".7rem", fontWeight: "800", color: durM>=40?"#f97316":"#22c55e", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>⏳ المدة:</span> <span>{dur}{durM>=40?" ⚠️":""}</span>
                </div>
              )}
            </div>
            <div className="flex gap-4 items-end flex-wrap w-full">
              <SmartTimeInput label="النهاية" {...endTime}   onChange={v => setEndTime(p => ({...p,...v}))} />
              <SmartTimeInput label="البداية" {...startTime} onChange={v => setStartTime(p => ({...p,...v}))} />
            </div>
          </div>

          <div style={card} className="flex flex-col flex-1 overflow-hidden h-full">
            <div className="flex flex-shrink-0 mb-4 p-1 rounded-lg gap-1" style={{ background: "var(--bg-tertiary)" }}>
              {[{k:"temp",l:"🌡️ حرارية"},{k:"chem",l:"🧪 كيميائية"}].map(({k,l}) => (
                <button key={k} type="button" onClick={() => setSMode(k)} style={{ flex: 1, padding: "5px", border: "none", cursor: "pointer", borderRadius: "4px", background: sMode===k?"var(--accent-blue)":"transparent", color: sMode===k?"#fff":"var(--text-muted)", fontSize: ".76rem", fontWeight: "700" }}>{l}</button>
              ))}
            </div>
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", width: "200%", height: "100%", transition: "transform .35s", transform: sMode==="temp"?"translateX(0)":"translateX(50%)" }}>
                <div className="flex flex-col gap-2 overflow-y-auto w-full flex-shrink-0" style={{ width: "50%", paddingLeft: "12px" }}>
                  <div className="grid grid-cols-3 gap-2 w-full flex-1 mb-2">
                    {sensors.map((val, i) => {
                      const vN = sf(val), diff = vN!==null&&spN!==null ? vN-spN : null, sc = diff===null?"var(--border)":diff>0?"#ef4444":diff<0?"#3b82f6":"#22c55e";
                      return (
                        <div key={i} style={{ background: vN!==null?`${sc}07`:"var(--bg-tertiary)", border: `1px solid ${vN!==null?sc:"var(--border)"}`, borderRadius: "8px", padding: "6px 4px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <div style={{ fontSize: ".65rem", color: "var(--text-muted)", fontWeight: "800", marginBottom: "4px", textAlign: "center" }}>حساس {i+1}</div>
                          <SpinBox color={sc} suffix="°" onMinus={() => { const n=[...sensors]; n[i]=fv((sf(n[i])??spN??32)-.1); setSensors(n); }} onPlus={() => { const n=[...sensors]; n[i]=fv((sf(n[i])??spN??32)+.1); setSensors(n); }}>
                            <SmartTempInput value={val} step={.1} color={vN!==null?sc:undefined} onChange={v => { const n=[...sensors]; n[i]=v; setSensors(n); }} />
                          </SpinBox>
                        </div>
                      );
                    })}
                  </div>
                  {avgTemp!==null && <div style={{ padding:"10px 14px",background:"var(--bg-primary)",borderRadius:"10px",display:"flex",justifyContent:"space-between" }}><span style={{ fontSize:".75rem",color:"var(--text-muted)", fontWeight: "700" }}>📊 متوسط الحرارة</span><span style={{ fontWeight:"900",color:condColor }}>{avgTemp.toFixed(2)}°C</span></div>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto w-full flex-shrink-0" style={{ width: "50%", paddingLeft: "12px" }}>
                  {[ { label:"أمونيا", id:"nh3", val:nh3, set:setNh3, unit:"ppm", color:"#a855f7" }, { label:"CO₂", id:"co2", val:co2, set:setCo2, unit:"ppm", color:"#6366f1" }, { label:"رطوبة", id:"hum", val:hum, set:setHum, unit:"%", color:"#3b82f6" }, { label:"ضغط", id:"press", val:press, set:setPress, unit:"Pa", color:"#22c55e" }].map(({ label, id, val, set, unit, color }) => (
                    <div key={id} style={{ background: val?`${color}10`:"var(--bg-tertiary)", border:`1px solid ${val?color:"var(--border)"}`, borderRadius:"8px", padding:"6px 4px", minHeight: "60px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ fontSize:".65rem", color:val?color:"var(--text-muted)", fontWeight:"800", marginBottom:"4px", textAlign: "center" }}>{label} <span style={{ opacity:.6 }}>({unit})</span></div>
                      <SpinBox color={color} onMinus={() => set(v => fv((sf(v)??0)-.1))} onPlus={() => set(v => fv((sf(v)??0)+.1))}>
                        <SmartTempInput value={val} onChange={set} color={val?color:undefined} />
                      </SpinBox>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1 h-full overflow-hidden">
          <div style={card} className="flex flex-col">
            <div className="font-bold text-sm text-muted mb-2">📤 النسخ والحفظ</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
               {[ { icon:"📱", l1:"واتساب", l2:"عربي", fn:copyAr,  c:"#25D366" }, { icon:"📱", l1:"WhatsApp", l2:"EN", fn:copyEn, c:"#22c55e" }, { icon:"📋", l1:"Excel", l2:"Row", fn:copySheet, c:"#6366f1" }].map(({ icon, l1, l2, fn, c }) => (
                <button key={l2} type="button" onClick={fn} style={{ padding: "8px 4px", borderRadius: "8px", border: `1px solid ${c}50`, background: `${c}07`, color: c, cursor: "pointer", textAlign: "center", lineHeight: 1.3 }}>
                  <div style={{ fontSize: "1.1rem" }}>{icon}</div>
                  <div style={{ fontSize: ".68rem", fontWeight: "800" }}>{l1}</div>
                  <div style={{ fontSize: ".62rem", fontWeight: "700", opacity: .8 }}>{l2}</div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ ...card, flex: 1, minHeight: 0, overflow: "hidden", background: previewLang==='ar'?"#25D36605":"#3b82f605", borderColor: previewLang==='ar'?"#25D36630":"#3b82f630", display: "flex", flexDirection: "column" }}>
            <div className="flex justify-between items-center mb-3">
               <div style={{ fontSize: ".68rem", color: previewLang==='ar'?"#25D366":"#3b82f6", fontWeight: "800" }}>
                 📱 معاينة واتساب (قابلة للتعديل)
               </div>
               <div className="flex gap-1">
                 <button type="button" onClick={() => setPreviewLang("ar")} style={{ padding: "2px 8px", fontSize: ".65rem", fontWeight: "700", borderRadius: "4px", background: previewLang==="ar"?"#25D36620":"transparent", color: previewLang==="ar"?"#25D366":"var(--text-muted)", border: "none", cursor: "pointer" }}>AR</button>
                 <button type="button" onClick={() => setPreviewLang("en")} style={{ padding: "2px 8px", fontSize: ".65rem", fontWeight: "700", borderRadius: "4px", background: previewLang==="en"?"#3b82f620":"transparent", color: previewLang==="en"?"#3b82f6":"var(--text-muted)", border: "none", cursor: "pointer" }}>EN</button>
               </div>
            </div>
            
            {previewLang === 'ar' ? (
              <textarea
                value={customTextAr !== null ? customTextAr : autoTextAr}
                onChange={e => setCustomTextAr(e.target.value)}
                placeholder="تفاصيل التقرير..."
                dir="rtl"
                style={{ flex: 1, width: "100%", fontFamily: "var(--font-ar)", fontSize: ".74rem", lineHeight: "1.7", color: "var(--text-secondary)", background: "transparent", border: "none", resize: "none", outline: "none", margin: 0, padding: 0 }}
              />
            ) : (
              <textarea
                value={customTextEn !== null ? customTextEn : autoTextEn}
                onChange={e => setCustomTextEn(e.target.value)}
                placeholder="Report details..."
                dir="ltr"
                style={{ flex: 1, width: "100%", fontFamily: "var(--font-en), var(--font-ar)", fontSize: ".74rem", lineHeight: "1.7", color: "var(--text-secondary)", background: "transparent", border: "none", resize: "none", outline: "none", margin: 0, padding: 0, textAlign: "left" }}
              />
            )}
            <div style={{ fontSize: ".6rem", color: "var(--text-muted)", textAlign: "center", marginTop: "4px", opacity: .7 }}>
              يمكنك التعديل اليدوي على النص أعلاه قبل النسخ
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
