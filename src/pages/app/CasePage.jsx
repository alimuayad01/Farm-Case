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
export default function CasePage({ user, isPopup }) {
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
  const [shift, setShift]             = useState("");
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
  const [multiHouseMode, setMultiHouseMode] = useState(null); // null | 'select' | 'all'
  const [multiHouses, setMultiHouses]   = useState([]);

  useEffect(() => {
    const onR = () => setNarrow(window.innerWidth < 900);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  useEffect(() => {
    loadData("history", []).then(h => { setHistory(h); setSavedFarms([...new Set(h.map(c => c.farm).filter(Boolean))]); });
    loadData("settings/conditions", null).then(d => setCondTable(d));
    loadData("settings/other_conditions", []).then(d => setOtherConds(Array.isArray(d) ? d : []));
    loadData("settings/general", { allow_emp_farm_type: false }).then(d => {
      setGenSettings(d);
      const h = new Date().getHours();
      const m = d?.shifts?.morningStart ?? 7;
      const e = d?.shifts?.eveningStart ?? 15;
      const n = d?.shifts?.nightStart ?? 23;
      let current = "ليلي";
      if (m < e && e < n) {
        if (h >= m && h < e) current = "صباحي";
        else if (h >= e && h < n) current = "مسائي";
      } else {
        if (h >= 7 && h < 15) current = "صباحي";
        else if (h >= 15 && h < 23) current = "مسائي";
      }
      setShift(current);
    });
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
    const p = [...history].reverse().find(h => h.farm?.trim() === farm.trim() && h.raw_data?.f_type === farmType);
    if (p && p.raw_data?.age && p.timestamp) {
       const ts = p.timestamp > 10000000000 ? p.timestamp : p.timestamp * 1000;
       const lastDate = new Date(ts);
       const now = new Date();
       const diffDays = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime()) / 86400000);
       let calculatedAge = parseInt(p.raw_data.age) + (diffDays > 0 ? diffDays : 0);
       let maxLimit = farmType === "مزرعة (تسمين)" ? 35 : 500;
       setAgeSugg(calculatedAge > maxLimit ? maxLimit : calculatedAge);
    } else {
       setAgeSugg(null);
    }
  }, [farm, history, farmType]);

  // ─── Condition detection ──────────────────────────────────────────────────
  const rateN = sf(rate);
  const spN   = sf(sp);
  const avgTemp = sMode === "temp" ? avg(sensors) : null;
  const filledSensors = sensors.map(sf).filter(v => v !== null);

  // Use manual rate if provided, otherwise evaluate the filled sensors average to determine High/Low correctly
  const effectiveRate = rateN !== null ? rateN : (filledSensors.length > 0 ? avgTemp : null);

  const detected  = detectCondition({ rate: effectiveRate, humidity: hum, co2, age, farmType, conditionsTable: condTable });
  const alerts    = detected.alerts;

  const tempCond = rateN !== null && spN !== null
    ? (rateN > spN ? "ارتفاع" : rateN < spN ? "انخفاض" : "طبيعي")
    : null;

  const condition = specialCond || tempCond || null;
  const deviation = effectiveRate !== null && spN !== null ? effectiveRate - spN : null;

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
    const key = `${farm.trim()}-${house}-${farmType}`;
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
      time: startStr(), shift: shift || getShiftName(), farm: farm.trim(), house,
      by_user: user.username, seen: false,
      sent_to_sheet: false,
      raw_data: { f_type: farmType, age: parseInt(age)||0, set_point: spN||0,
        sensors: sensors.map(s => sf(s) !== null ? { val: sf(s) } : { val: "" }), 
        rate: rateN !== null ? rateN : (filledSensors.length >= 3 && avgTemp !== null ? avgTemp : ""),
        condition: condition||"انخفاض",
        start_h: startTime.h, start_m: startTime.m, start_p: startTime.p,
        end_h: endTime.h, end_m: endTime.m, end_p: endTime.p, 
        duration: durText(),
        nh3: nh3.trim(), co2: co2.trim(), hum: hum.trim(), press: press.trim(),
        sensor_mode: sMode, special: specialCond||null, dur_mins: durMins(),
        multi_houses: multiHouses.length > 0 ? multiHouses : undefined }
    };
  }

  async function saveAndCopy(copyFn) {
    if (!farm.trim() || !house || !sp) { showToast("⚠️ بيانات ناقصة", "error"); return; }
    
    // Validation: Only one parameter type allowed (Temp vs NH3 vs CO2 vs Hum vs Press)
    let filledParams = 0;
    if (rate !== "" || sensors.some(s => s !== "")) filledParams++;
    if (nh3 !== "") filledParams++;
    if (co2 !== "") filledParams++;
    if (hum !== "") filledParams++;
    if (press !== "") filledParams++;

    if (filledParams > 1) {
      showToast("⚠️ لا يمكن الكشف عن حالة حرارية وكيميائية معاً، أو حالات كيميائية متعددة", "error");
      return;
    }

    setSaving(true);
    let caseObj = buildCase();

    if (caseSaved && lastCase && lastCase.farm === caseObj.farm && lastCase.house === caseObj.house) {
      caseObj.timestamp = lastCase.timestamp;
      caseObj.date = lastCase.date;
      if (isOnline) {
        const upd = history.map(h => h.timestamp === lastCase.timestamp ? caseObj : h);
        await saveData("history", upd);
        setHistory(upd);
      } else {
        const q = getQ();
        const updQ = q.map(h => h.timestamp === lastCase.timestamp ? caseObj : h);
        localStorage.setItem(OKEY, JSON.stringify(updQ));
      }
      setLastCase(caseObj);
    } else {
      if (isOnline) {
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
  }

  function copyAr()    { saveAndCopy(async c => { try { await navigator.clipboard.writeText(customTextAr !== null ? customTextAr : buildArabicText(c, templates)); showToast("📱 تم الحفظ + نسخ عربي", "success"); } catch { showToast("⚠️ تعذّر النسخ، حاول من جديد", "error"); } }); }
  function copyEn()    { saveAndCopy(async c => { try { await navigator.clipboard.writeText(customTextEn !== null ? customTextEn : buildEnglishText(c, templates)); showToast("📱 Saved + Copied EN", "success"); } catch { showToast("⚠️ Copy failed, try again", "error"); } }); }

  const copyArRef = useRef(copyAr);
  useEffect(() => { copyArRef.current = copyAr; }, [copyAr]);

  // Keyboard shortcuts Ctrl+C and ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        reset();
      }
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        const selectedText = window.getSelection().toString();
        // If not actively selecting text, copy case to clipboard
        if (!selectedText) {
          e.preventDefault();
          copyArRef.current();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  async function copySheet() { 
    await saveAndCopy(async (c) => { 
      const rows = getSheetRows(c, excelMapping?.typeMapping || excelMapping, excelMapping?.columnOrder); 
      if (!rows.length){ showToast("⚠️ لا توجد بيانات للتصدير", "error"); return; } 

      // Wrap cells containing \n in quotes for Excel
      const tsv = rows.map(r => r.map(v => {
        const str = String(v);
        return str.includes("\n") || str.includes("\r") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
      }).join("\t")).join("\n");

      try {
        await navigator.clipboard.writeText(tsv); 
      } catch {
        showToast("⚠️ تعذّر نسخ بيانات الشيت", "error"); return;
      }
      
      const upd = history.map(h => (h.timestamp === c.timestamp ? { ...h, sent_to_sheet: true } : h));
      setHistory(upd);
      saveData("history", upd).catch(() => showToast("❌ خطأ بمزامنة الشيت", "error"));
      showToast("📊 تم الحفظ + الإضافة لقائمة الشيت اليومية", "success"); 
    }); 
  }

  function reset() {
    setFarm(""); setHouse(""); setAge(""); setSp(""); setAgeSugg(null);
    setSensors(["","","","","",""]); setRate(""); setNh3(""); setCo2(""); setHum(""); setPress(""); setSpecialCond(null);
    setMultiHouseMode(null); setMultiHouses([]);
    setCaseSaved(false); setLastCase(null);
    const now = new Date(); let h = now.getHours(), m = now.getMinutes(), p = h >= 12 ? "PM" : "AM"; h = h%12||12;
    setStartTime({ h: String(h).padStart(2, "0"), m: String(m).padStart(2, "0"), p }); setEndTime({ h:"", m:"", p:"AM" });
  }

  const dur = durText(), durM = durMins(), live = buildCase();
  const autoTextAr = (farm || house) ? buildArabicText(live, templates) : "...";
  const autoTextEn = (farm || house) ? buildEnglishText(live, templates) : "...";

  // Reset custom text if form changes significantly (we use a simple stringified dependency)
  useEffect(() => {
    setCustomTextAr(null);
    setCustomTextEn(null);
  }, [farm, house, age, sp, rate, startTime, endTime, nh3, co2, hum, press, specialCond, JSON.stringify(sensors), sMode, farmType]);

  const ALL_SPL = ["مشكلة هيتر", "توقف مراوح", "عدة حظائر", "مزرعة كاملة", ...otherConds];

  const card = { background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "16px" };
  const lbl  = { fontSize: ".68rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: isPopup ? "auto" : "100%", gap: "8px", overflow: isPopup ? "visible" : "hidden" }}>
      {/* ── STATUS BAR ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexShrink: 0, flexWrap: "wrap", position: "relative", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
          {isPopup && (
            <button type="button" onClick={() => alert("📌 طريقة التثبيت فوق جميع النوافذ:\nلتثبيت هذه النافذة بشكل دائم، نوصي بتطبيق (DeskPins) الخفيف أو استخدام ميزة Always On Top في ويندوز عبر أداة PowerToys واختصار (Win + Ctrl + T).\n\n💡 ملاحظة: اضغط Ctrl+C لنسخ الحالة الحالية وتحديثها سريعاً.")}
              style={{ background: "rgba(34,197,94,.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,.3)", borderRadius: "100px", padding: "2px 8px", fontSize: ".65rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
              <span>📌 تثبيت فوق النوافذ</span>
            </button>
          )}
          <span style={{ fontWeight: "900", fontSize: ".95rem" }}>➕ تسجيل حالة</span>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", background: condColor+"18", border: `1px solid ${condColor}44`, borderRadius: "100px", padding: "3px 10px", transition: "all .3s" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: condColor, display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ color: condColor, fontWeight: "800", fontSize: ".78rem" }}>{condition||"جارٍ الكشف..."}</span>
            {deviation !== null && <span style={{ fontFamily: "Arial", fontWeight: "900", fontSize: ".72rem", opacity: .8 }}>({deviation>0?"+":""}{fv(deviation)}°)</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "3px", fontSize: ".7rem", color: isOnline?"#22c55e":"#f97316", fontWeight: "700" }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: isOnline?"#22c55e":"#f97316" }} />
            {isOnline?"متصل":`غير متصل${queueCount>0?` (${queueCount})`:""}`}
          </div>
          {alerts.map((a, i) => <div key={i} style={{ fontSize: ".68rem", padding: "2px 7px", borderRadius: "100px", background: "rgba(249,115,22,.12)", border: "1px solid #f97316", color: "#f97316", fontWeight: "700" }}>{a.text}</div>)}
        </div>
        {/* Shift display (Auto) — far right */}
        <div style={{ padding: "0 12px", borderRadius: "100px", border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: ".74rem", fontWeight: "800", height: "26px", display: "flex", alignItems: "center", gap: "4px", fontFamily: "var(--font-ar)" }}>
          {shift === "صباحي" ? "🌞" : shift === "مسائي" ? "🌆" : "🌙"} {shift || "الحالي"}
        </div>
      </div>

      {/* ── FORM  ──────────────────────────────────────────────────────────── */}
      <form onSubmit={e => e.preventDefault()} dir="rtl"
        className={`grid grid-cols-1 lg:grid-cols-3 gap-4 text-right ${!isPopup && narrow ? 'overflow-y-auto' : ''}`}
        style={{ height: isPopup ? "auto" : "100%", minHeight: 0 }}>

        {/* ══ LEFT: DATA ENTRY ════════════════════════════════════════════════ */}
        <div className={`flex flex-col gap-4 lg:col-span-2 ${isPopup ? '' : 'h-full overflow-y-auto'}`} style={{ minHeight: 0, paddingRight: "4px" }}>
          {/* Removing wrapping card and letting inputs be direct children/smaller cards */}
          <div className="flex justify-between items-center px-1 mb-2 mt-2">
            <span className="font-bold text-base">🏡 بيانات المزرعة</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
               {/* Clear All */}
               <button type="button" onClick={reset} title="تفريغ الحقول (ESC)"
                 style={{ padding: "3px 10px", borderRadius: "8px", border: "1px solid #ef4444", background: "rgba(239,68,68,.08)", color: "#ef4444", fontSize: ".75rem", fontWeight: "800", cursor: "pointer", whiteSpace: "nowrap" }}>
                 🗑️ مسح الكل
               </button>
               {/* Farm Type - styled pill */}
               {(user?.role === "admin" || generalSettings.allow_emp_farm_type) && (
                 <select value={farmType} onChange={e => setFarmType(e.target.value)}
                   style={{ padding: "3px 10px", borderRadius: "8px", border: "1px solid var(--accent-blue)",
                     background: "rgba(59,130,246,.08)", color: "var(--accent-blue)",
                     fontSize: ".75rem", fontWeight: "800", cursor: "pointer", outline: "none" }}>
                   <option value="مزرعة (تسمين)">🐤 تسمين</option>
                   <option value="إنتاج">🥚 إنتاج</option>
                   <option value="تربية">🐣 تربية</option>
                   <option value="جدود">🐔 جدود</option>
                   <option value="امهات البياض">🐙 امهات بياض</option>
                 </select>
               )}
               {/* Special Condition inline */}
               <select value={specialCond||""} onChange={e => {
                   const v = e.target.value || null;
                   setSpecialCond(v);
                   if (v === 'عدة حظائر') { setMultiHouseMode('select'); setMultiHouses([]); }
                   else if (v === 'مزرعة كاملة') { setMultiHouseMode('all'); setMultiHouses(Array.from({length:16},(_,i)=>String(i+1))); }
                   else { setMultiHouseMode(null); setMultiHouses([]); }
                 }}
                 style={{ padding: "3px 10px", borderRadius: "8px",
                   border: `1px solid ${specialCond ? '#f97316' : 'var(--border)'}`,
                   background: specialCond ? "rgba(249,115,22,.08)" : "var(--bg-tertiary)",
                   color: specialCond ? "#f97316" : "var(--text-muted)",
                   fontSize: ".75rem", fontWeight: "800", cursor: "pointer", outline: "none" }}>
                 <option value="">⚠️ حالة خاصة</option>
                 {ALL_SPL.map(s => <option key={s} value={s}>{s}</option>)}
               </select>
               {ageSugg && !age && (
                 <button type="button" onClick={() => setAge(String(ageSugg))}
                   style={{ padding: "3px 10px", borderRadius: "8px", border: "1px solid #f59e0b", background: "rgba(245,158,11,.08)", color: "#f59e0b", fontSize: ".75rem", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
                   <span>💡</span><span>{ageSugg} اسبوع/يوم</span>
                 </button>
               )}
            </div>
          </div>
          {/* Multi-house banner */}
          {multiHouseMode && (
            <div style={{ background: "rgba(249,115,22,.1)", border: "1px solid #f97316", borderRadius: "10px", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: ".8rem", fontWeight: "800", color: "#f97316" }}>
                  {multiHouseMode === 'all' ? '🏠 مزرعة كاملة (16 حظيرة)' : '🏛️ عدة حظائر محددة'}
                </span>
                {multiHouseMode === 'select' && (
                  <button type="button" onClick={() => setMultiHouses(Array.from({length:16},(_,i)=>String(i+1)))}
                    style={{ padding: "2px 8px", borderRadius: "6px", border: "1px solid #f97316", background: "rgba(249,115,22,.15)", color: "#f97316", fontSize: ".7rem", fontWeight: "800", cursor: "pointer" }}>
                    ➕ إضافة كل 16 حظيرة
                  </button>
                )}
                <button type="button" onClick={() => { setMultiHouseMode(null); setMultiHouses([]); setSpecialCond(null); }}
                  style={{ padding: "2px 8px", borderRadius: "6px", border: "1px solid #8b949e", background: "transparent", color: "var(--text-muted)", fontSize: ".7rem", fontWeight: "800", cursor: "pointer" }}>
                  × إلغاء
                </button>
              </div>
              {multiHouseMode === 'select' && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {Array.from({length:16},(_,i)=>String(i+1)).map(h => {
                    const sel = multiHouses.includes(h);
                    return (
                      <button key={h} type="button"
                        onClick={() => setMultiHouses(p => sel ? p.filter(x=>x!==h) : [...p,h])}
                        style={{ width: "34px", height: "34px", borderRadius: "8px", border: `1px solid ${sel?"#f97316":"var(--border)"}`,
                          background: sel ? "rgba(249,115,22,.2)" : "var(--bg-tertiary)",
                          color: sel ? "#f97316" : "var(--text-muted)", fontWeight: "800", fontSize: ".82rem", cursor: "pointer" }}>
                        {h}
                      </button>
                    );
                  })}
                </div>
              )}
              {multiHouses.length > 0 && (
                <div style={{ fontSize: ".72rem", color: "#f97316", fontWeight: "700" }}>
                  الحظائر المحددة: {multiHouses.sort((a,b)=>parseInt(a)-parseInt(b)).join(', ')}
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 w-full">
              <div style={card} className="relative">
                <div style={lbl}>رقم المزرعة *</div>
                <input className="form-input" type="number" inputMode="numeric" placeholder="--" value={farm}
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
                <input className="form-input" list="house-opts" placeholder="--" value={house} onChange={e => setHouse(e.target.value)} style={{ padding: "4px 6px", fontSize: ".85rem", height: "32px", fontWeight: "700" }} />
                <datalist id="house-opts">{HOUSES.map(h => <option key={h} value={h} />)}</datalist>
              </div>
              <div style={card}>
                <div style={lbl}>العمر (يوم)</div>
                <input className="form-input" list="age-opts" placeholder="--" value={age} onChange={e => setAge(e.target.value)} style={{ padding: "4px 6px", fontSize: ".85rem", height: "32px", fontWeight: "700" }} />
                <datalist id="age-opts">{AGES.map(a => <option key={a} value={a} />)}</datalist>
              </div>
          </div>

          <div style={card} className="flex flex-col flex-shrink-0">
            <div className="font-bold text-sm md:text-base mb-3">🌡️ السيت بوينت والمعدل</div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div>
                <div style={lbl}>سيت بوينت *</div>
                <SpinBox color={sp?"var(--accent-green)":"var(--border)"} suffix="°" onMinus={() => setSp(fv((sf(sp)??32)-.5))} onPlus={() => setSp(fv((sf(sp)??32)+.5))}>
                  <SmartTempInput value={sp} onChange={setSp} step={.5} placeholder="--" />
                </SpinBox>
              </div>
              <div>
                <div style={{ ...lbl, color: rateN !== null ? condColor : "var(--text-muted)" }}>
                  المعدل * {deviation !== null ? (deviation > 0 ? "⬆️ ارتفاع" : deviation < 0 ? "⬇️ انخفاض" : "✅ طبيعي") : ""}
                </div>
                <SpinBox color={rateN !== null ? condColor : "var(--border)"} suffix="°" onMinus={() => setRate(fv((sf(rate)??spN??32) - .1))} onPlus={() => setRate(fv((sf(rate)??spN??32) + .1))}>
                  <SmartTempInput value={rate} onChange={setRate} step={.1} placeholder="--" color={rateN !== null ? condColor : undefined} />
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
                <div className={`grid grid-cols-2 gap-2 w-full flex-shrink-0 ${isPopup ? '' : 'overflow-y-auto'}`} style={{ width: "50%", paddingLeft: "12px" }}>
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

        <div className={`flex flex-col gap-4 lg:col-span-1 ${isPopup ? '' : 'h-full overflow-hidden'}`}>
          <div style={card} className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <div className="font-bold text-sm text-muted">📤 النسخ والحفظ</div>
              <button type="button" onClick={reset} title="تفريغ جميع الحقول (ESC)"
                style={{ padding: "3px 12px", borderRadius: "8px", border: "1px solid #ef4444", background: "rgba(239,68,68,.1)", color: "#ef4444", fontSize: ".72rem", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                🗑️ مسح الكل
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
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
                placeholder="--"
                dir="rtl"
                style={{ flex: 1, width: "100%", fontFamily: "var(--font-ar)", fontSize: ".74rem", lineHeight: "1.7", color: "var(--text-secondary)", background: "transparent", border: "none", resize: "none", outline: "none", margin: 0, padding: 0 }}
              />
            ) : (
              <textarea
                value={customTextEn !== null ? customTextEn : autoTextEn}
                onChange={e => setCustomTextEn(e.target.value)}
                placeholder="--"
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
