/**
 * conditions.js
 * جدول الشروط الافتراضي + دوال الكشف التلقائي عن نوع الحالة
 * مستخرج من صورة جدول Sama Karbala Poultry - Broiler Farming
 */

// ─── الجدول الافتراضي ────────────────────────────────────────────────────────
// lowTemp  : حد Rate الأدنى  → انخفاض إذا rate <= lowTemp
// highTemp : حد Rate الأعلى → ارتفاع إذا rate >= highTemp
// lowRH    : حد رطوبة منخفض (%)
// highRH   : حد رطوبة مرتفع (%)
// co2      : حد ثاني أكسيد الكربون (ppm)
export const DEFAULT_BROILER_TABLE = [
  { ageFrom: 0,  ageTo: 1,  lowTemp: null, highTemp: 1,  lowRH: 45, highRH: null, co2: null },
  { ageFrom: 2,  ageTo: 3,  lowTemp: null, highTemp: 1,  lowRH: 50, highRH: null, co2: null },
  { ageFrom: 4,  ageTo: 5,  lowTemp: null, highTemp: 1,  lowRH: 55, highRH: null, co2: null },
  { ageFrom: 6,  ageTo: 14, lowTemp: -1,   highTemp: 1,  lowRH: 60, highRH: null, co2: null },
  { ageFrom: 15, ageTo: 19, lowTemp: -1,   highTemp: 1,  lowRH: 60, highRH: 85,   co2: 3000 },
  { ageFrom: 20, ageTo: 99, lowTemp: -2,   highTemp: 2,  lowRH: 55, highRH: 85,   co2: 3000 },
];

// نفس القواعد للأنواع الأخرى (يمكن تعديلها لاحقاً من الإعدادات)
export const DEFAULT_TABLES = {
  "مزرعة (تسمين)": DEFAULT_BROILER_TABLE,
  "إنتاج":          DEFAULT_BROILER_TABLE,
  "تربية":          DEFAULT_BROILER_TABLE,
  "جدود":           DEFAULT_BROILER_TABLE,
  "امهات البياض":   DEFAULT_BROILER_TABLE,
};

// ─── جلب قاعدة اليوم ─────────────────────────────────────────────────────────
export function getRuleForAge(age, table) {
  const ageNum = parseInt(age) || 0;
  return table?.find(r => ageNum >= r.ageFrom && ageNum <= r.ageTo) || null;
}

// ─── الكشف التلقائي عن نوع الحالة من البيانات ──────────────────────────────
export function detectCondition({ rate, humidity, co2, age, farmType, conditionsTable }) {
  const table = conditionsTable?.[farmType] || DEFAULT_BROILER_TABLE;
  const rule  = getRuleForAge(age, table);
  const rateN = parseFloat(rate);
  const humN  = parseFloat(humidity);
  const co2N  = parseFloat(co2);

  const alerts   = [];
  let tempCond   = null;   // "ارتفاع" | "انخفاض" | null

  // ─ حالة درجة الحرارة ───────────────────────────────────────────────────────
  if (!isNaN(rateN) && rule) {
    if (rule.highTemp !== null && rateN >= rule.highTemp)      tempCond = "ارتفاع";
    else if (rule.lowTemp !== null && rateN <= rule.lowTemp)  tempCond = "انخفاض";
    else if (rateN > 0)   tempCond = "ارتفاع";  // fallback إذا لم توجد قاعدة
    else if (rateN < 0)   tempCond = "انخفاض";
  } else if (!isNaN(rateN)) {
    tempCond = rateN > 0 ? "ارتفاع" : rateN < 0 ? "انخفاض" : null;
  }

  // ─ تحذيرات الرطوبة ────────────────────────────────────────────────────────
  if (!isNaN(humN) && rule) {
    if (rule.highRH !== null && humN > rule.highRH)
      alerts.push({ type: "hum_high", text: `🔴 رطوبة عالية: ${humN}%  (الحد: ${rule.highRH}%)` });
    if (rule.lowRH !== null && humN < rule.lowRH)
      alerts.push({ type: "hum_low",  text: `🔵 رطوبة منخفضة: ${humN}%  (الحد: ${rule.lowRH}%)` });
  }

  // ─ تحذير CO2 ──────────────────────────────────────────────────────────────
  if (!isNaN(co2N) && rule?.co2 !== null && co2N > rule.co2)
    alerts.push({ type: "co2_high", text: `🟠 CO₂ مرتفع: ${co2N} ppm  (الحد: ${rule.co2} ppm)` });

  return { tempCond, alerts, rule };
}

// ─── بناء نص الواتساب العربي (مطابق لـ export_manager.py) ───────────────────
export function buildArabicText(caseData) {
  const r = caseData.raw_data || {};
  const condition = r.condition || "انخفاض";
  const condHeaderMap = {
    "انخفاض":              "انخفاض في",
    "ارتفاع":              "ارتفاع في",
    "مشكلة هيتر":         "مشكلة هيتر (طلب هيتر عالي)",
    "توقف مراوح":         "توقف مراوح",
    "مزرعة كاملة (متعدد)": "انخفاض في",
  };
  const condHeader = condHeaderMap[condition] || condition;
  const arrow = "⬅";

  const isBroiler = ["مزرعة (تسمين)", "جدود", "امهات البياض"].includes(r.f_type);
  const fTypeAr   = isBroiler ? "مزرعة" : r.f_type === "إنتاج" ? "إنتاج" : "تربية";
  const sensNamesAr = [
    "الحسـاس الاول ", "الحسـاس الثاني", "الحسـاس الثالث",
    "الحسـاس الرابع", "الحسـاس الخامس", "الحسـاس السادس"
  ];

  // فقط الحساسات المملوءة
  const filled = (r.sensors || [])
    .map((s, i) => [i + 1, fmtV(s?.val ?? s)])
    .filter(([, v]) => v !== "");

  const isChem     = !!(r.nh3 || r.co2 || r.hum || r.press);
  const rateStr    = isChem ? "" : fmtV(r.rate);
  const spStr      = fmtV(r.set_point);
  const ageStr     = r.age ? `${r.age} يوم` : "—";

  let text = `${fTypeAr} - ${caseData.farm}\n`;
  text += `حظيرة - ${caseData.house} - العمر - ${ageStr}\n`;
  text += `${condHeader} :-\n`;

  if (filled.length > 0) {
    filled.forEach(([idx, val]) => { text += `${sensNamesAr[idx-1]} ${arrow} °${val}\n`; });
    if (filled.length >= 3 && rateStr) text += `معدل درجة الحرارة ${arrow} °${rateStr}\n`;
  } else if (r.nh3)   { text += `حساس الـ(NH³) ${arrow} ppm ${r.nh3}\n`; }
  else if (r.co2)     { text += `حساس الـ(CO²) ${arrow} ppm ${r.co2}\n`; }
  else if (r.hum)     { text += `حساس الرطوبة ${arrow} ${r.hum} %\n`; }
  else if (r.press)   { text += `حساس الضغط ${arrow} ${r.press} Pa\n`; }
  else if (rateStr)   { text += `معدل درجة الحرارة ${arrow} °${rateStr}\n`; }

  if (spStr && !isChem) text += `الـسـيـت بـويـنـت ${arrow} °${spStr}\n`;
  text += `بداية الحالة ${arrow} ${caseData.time}\n`;
  if (r.duration)     text += `مدة المعالجة ${arrow} ${r.duration}\n\n`;

  return text;
}

// ─── نص إنجليزي ──────────────────────────────────────────────────────────────
export function buildEnglishText(caseData) {
  const r = caseData.raw_data || {};
  const condition = r.condition || "انخفاض";
  const condHeaderMap = {
    "انخفاض": "Gradual Low", "ارتفاع": "Gradual High",
    "مشكلة هيتر": "Heater Problem", "توقف مراوح": "Fan's Stop",
    "مزرعة كاملة (متعدد)": "Low Temperature",
  };
  const condHeader = condHeaderMap[condition] || condition;
  const arrow  = "➡";
  const typeEN = { "مزرعة (تسمين)":"Broiler","إنتاج":"Production","تربية":"Rearing","جدود":"Grand Parents (G.P)","امهات البياض":"Layer Breeder" };
  const fEn    = typeEN[r.f_type] || "Farm";
  const sensNamesEn = ["Sensor One ","Sensor Two ","Sensor Three","Sensor Four ","Sensor Five ","Sensor Six  "];
  const filled = (r.sensors||[]).map((s,i)=>[i+1,fmtV(s?.val??s)]).filter(([,v])=>v!=="");
  const isChem = !!(r.nh3||r.co2||r.hum||r.press);

  let text = `${fEn} - ${caseData.farm}\n`;
  text += `House - ${caseData.house} - Age - ${r.age||"—"} Day\n`;
  text += `${condHeader} :-\n`;
  filled.forEach(([i,v])=>{ text+=`${sensNamesEn[i-1]} ${arrow} ${v}°\n`; });
  if (r.nh3)   text+=`Sensor (NH³)      ${arrow} ${r.nh3} ppm\n`;
  if (r.co2)   text+=`Sensor (CO²)      ${arrow} ${r.co2} ppm\n`;
  if (r.hum)   text+=`Humidity Sensor ${arrow} ${r.hum} %\n`;
  if (r.press) text+=`Pressure Sensor ${arrow} ${r.press} Pa\n`;
  if ((filled.length>=3||(!filled.length&&fmtV(r.rate)))&&!isChem) text+=`Average  Temp  ${arrow} ${fmtV(r.rate)}°\n`;
  if (fmtV(r.set_point)) text+=`Set Point          ${arrow} ${fmtV(r.set_point)}°\n`;
  text+=`Start Time       ${arrow} ${caseData.time}\n`;
  if (r.duration) text+=`Process Time  ${arrow} ${r.duration}\n\n`;
  return text;
}

// ─── سطر Excel (مطابق لـ get_sheet_line) ─────────────────────────────────────
export function getSheetRows(caseData) {
  const r = caseData.raw_data || {};
  const now = caseData.date || new Date().toLocaleDateString("en-GB");
  const typeEN = { "مزرعة (تسمين)":"Broiler","إنتاج":"Production","تربية":"Rearing","جدود":"Grand Parents (G.P)","امهات البياض":"Layer Breeder" };
  const enType = typeEN[r.f_type] || "Farm";
  const sp = parseFloat(r.set_point) || 0;
  const condition = r.condition || "";
  const isSpecial = ["مشكلة هيتر","توقف مراوح"].includes(condition);
  const isLow     = condition === "انخفاض";
  const condPfx   = isLow ? "Low " : "High ";
  const filled    = (r.sensors||[]).map((s,i)=>[i+1,fmtV(s?.val??s)]).filter(([,v])=>v!=="");
  const rateStr   = fmtV(r.rate);
  const hasSp     = sp > 0;
  const rows = [];

  if (isSpecial) {
    const status = condition==="مشكلة هيتر"?"Heater Problem":"Stop Fans";
    rows.push([now,enType,caseData.farm,caseData.house,r.age||"",status,caseData.time,"",rateStr,"","%",r.duration||""]);
  } else {
    // حرارة
    if (filled.length===1) {
      const [idx,val]= filled[0]; const diff=hasSp?fmtV(parseFloat(val)-sp):"";
      rows.push([now,enType,caseData.farm,caseData.house,r.age||"",`${condPfx}Sensor ${idx}`,caseData.time,diff,val,hasSp?String(sp):"","°C",r.duration||""]);
    } else if (filled.length===2) {
      const [s1,s2]=filled; const d1=hasSp?fmtV(parseFloat(s1[1])-sp):""; const d2=hasSp?fmtV(parseFloat(s2[1])-sp):"";
      rows.push([now,enType,caseData.farm,caseData.house,r.age||"",condPfx.trim(),caseData.time,`S${s1[0]}=${d1}\nS${s2[0]}=${d2}`,`S${s1[0]}=${s1[1]}\nS${s2[0]}=${s2[1]}`,hasSp?String(sp):"","°C",r.duration||""]);
    } else if (filled.length>=3||rateStr) {
      const diff=hasSp&&rateStr?fmtV(parseFloat(rateStr)-sp):"";
      rows.push([now,enType,caseData.farm,caseData.house,r.age||"",condPfx.trim(),caseData.time,diff,rateStr,hasSp?String(sp):"","°C",r.duration||""]);
    }
    // كيميائية
    const chem = {nh3:["NH3","PPM"],co2:["CO2","PPM"],hum:["Humidity","%"],press:["Pressure","PA"]};
    Object.entries(chem).forEach(([k,[name,unit]])=>{ if(r[k]) rows.push([now,enType,caseData.farm,caseData.house,r.age||"",`${condPfx}${name}`,caseData.time,"",r[k],hasSp?String(sp):"",unit,r.duration||""]); });
  }
  return rows;
}

// ─── helper ──────────────────────────────────────────────────────────────────
function fmtV(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return "";
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}
