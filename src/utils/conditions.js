/**
 * conditions.js
 * جدول الشروط الافتراضي + دوال بناء نصوص التقارير (الكلائش)
 */

export const DEFAULT_BROILER_TABLE = [
  { ageFrom: 0,  ageTo: 1,  lowTemp: null, highTemp: 1,  lowRH: 45, highRH: null, co2: null },
  { ageFrom: 2,  ageTo: 3,  lowTemp: null, highTemp: 1,  lowRH: 50, highRH: null, co2: null },
  { ageFrom: 4,  ageTo: 5,  lowTemp: null, highTemp: 1,  lowRH: 55, highRH: null, co2: null },
  { ageFrom: 6,  ageTo: 14, lowTemp: -1,   highTemp: 1,  lowRH: 60, highRH: null, co2: null },
  { ageFrom: 15, ageTo: 19, lowTemp: -1,   highTemp: 1,  lowRH: 60, highRH: 85,   co2: 3000 },
  { ageFrom: 20, ageTo: 99, lowTemp: -2,   highTemp: 2,  lowRH: 55, highRH: 85,   co2: 3000 },
];

export const DEFAULT_TABLES = {
  "مزرعة (تسمين)": DEFAULT_BROILER_TABLE,
  "إنتاج":          DEFAULT_BROILER_TABLE,
  "تربية":          DEFAULT_BROILER_TABLE,
  "جدود":           DEFAULT_BROILER_TABLE,
  "امهات البياض":   DEFAULT_BROILER_TABLE,
};

export function getRuleForAge(age, table) {
  const ageNum = parseInt(age) || 0;
  return table?.find(r => ageNum >= r.ageFrom && ageNum <= r.ageTo) || null;
}

export function detectCondition({ rate, humidity, co2, age, farmType, conditionsTable }) {
  const table = conditionsTable?.[farmType] || DEFAULT_BROILER_TABLE;
  const rule  = getRuleForAge(age, table);
  const rateN = parseFloat(rate);
  const humN  = parseFloat(humidity);
  const co2N  = parseFloat(co2);

  const alerts   = [];
  let tempCond   = null;

  if (!isNaN(rateN) && rule) {
    if (rule.highTemp !== null && rateN >= rule.highTemp)      tempCond = "ارتفاع";
    else if (rule.lowTemp !== null && rateN <= rule.lowTemp)  tempCond = "انخفاض";
    else if (rateN > 0)   tempCond = "ارتفاع";
    else if (rateN < 0)   tempCond = "انخفاض";
  } else if (!isNaN(rateN)) {
    tempCond = rateN > 0 ? "ارتفاع" : rateN < 0 ? "انخفاض" : null;
  }

  if (!isNaN(humN) && rule) {
    if (rule.highRH !== null && humN > rule.highRH)
      alerts.push({ type: "hum_high", text: `🔴 رطوبة عالية: ${humN}%` });
    if (rule.lowRH !== null && humN < rule.lowRH)
      alerts.push({ type: "hum_low",  text: `🔵 رطوبة منخفضة: ${humN}%` });
  }

  if (!isNaN(co2N) && rule?.co2 !== null && co2N > rule.co2)
    alerts.push({ type: "co2_high", text: `🟠 CO₂ مرتفع: ${co2N} ppm` });

  return { tempCond, alerts, rule };
}

const FALLBACK_TEMPS = {
  ar: {
    farmLabel: "مزرعــة", rearingLabel: "تـربــيــة", productionLabel: "انــتـــاج",
    houseLabel: "حظيرة", ageLabel: "العمــر", dayLabel: "يوم", weekLabel: "اسبوع",
    highLabel: "ارتفاع في", lowLabel: "انخفاض في",
    avgTempLabel: "معدل درجة الحرارة", setPointLabel: "الســـــــــيـت بويـنـت",
    startTimeLabel: "بــدايــــــــة الحــــالــــة", procTimeLabel: "مــــــــدة المعـالجــــة",
    footer: "-- يرجى ذكر السبب --\n@"
  },
  en: {
    farmLabel: "Farm", rearingLabel: "Rearing", productionLabel: "Production",
    houseLabel: "House", ageLabel: "Age", dayLabel: "Day", weekLabel: "Week",
    highLabel: "Gradual High", lowLabel: "Gradual Low",
    sensorPrefix: "Sensor", nh3Label: "Sensor (NH³)", co2Label: "Sensor (CO²)",
    humLabel: "Humidity Sensor", pressLabel: "Pressure Sensor",
    avgTempLabel: "Average  Temp", setPointLabel: "Set Point  --",
    startTimeLabel: "Start Time  --", procTimeLabel: "Process Time  --",
    footer: "-- Please state the reason --\n@"
  }
};

// ─── Helper for Age Conversion ───────────────────────────────────────────────
function getFormattedAge(age, farmType, lang, t) {
  if (!age) return "";
  const typesToConvert = ["تربية", "إنتاج", "جدود", "امهات البياض"];
  if (typesToConvert.includes(farmType)) {
    const weeks = (parseFloat(age) / 7).toFixed(1).replace(/\.0$/, "");
    const label = lang === 'ar' ? (t.weekLabel || "اسبوع") : (t.weekLabel || "Week");
    return `${weeks} ${label}`;
  }
  const label = lang === 'ar' ? (t.dayLabel || "يوم") : (t.dayLabel || "Day");
  return `${age} ${label}`;
}

// ─── بناء النص العربي ────────────────────────────────────────────────────────
export function buildArabicText(caseData, customTemps = null) {
  const r = caseData.raw_data || {};
  const t = customTemps?.ar || FALLBACK_TEMPS.ar;
  const arrow = "⬅";

  let fTitle = t.farmLabel;
  if (r.f_type === "تربية") fTitle = t.rearingLabel;
  else if (r.f_type === "إنتاج") fTitle = t.productionLabel;

  const condition = r.condition || "ارتفاع";
  const condHeader = condition === "انخفاض" ? t.lowLabel : (condition === "ارتفاع" ? t.highLabel : condition);

  const filledSensors = (r.sensors || [])
    .map((s, i) => ({ id: i + 1, val: fmtV(s?.val ?? s) }))
    .filter(s => s.val !== "");

  const sp = fmtV(r.set_point);
  const avgTemp = fmtV(r.rate);
  const isChem = !!(r.nh3 || r.co2 || r.hum || r.press);

  let text = `${fTitle}  -  " ${caseData.farm || ""} "\n`;
  text += `${t.houseLabel}  -  " ${caseData.house || ""} "\n`;
  
  const ageStr = getFormattedAge(r.age, r.f_type, 'ar', t);
  if (ageStr) text += `${t.ageLabel}  -  " ${ageStr} "\n`;
  
  text += `${condHeader} :-\n`;

  if (filledSensors.length > 0 && filledSensors.length <= 2) {
    const names = ["الاول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
    filledSensors.forEach(s => {
      text += `حساس ${names[s.id-1] || s.id} ${arrow} °${s.val}\n`;
    });
  }

  if (avgTemp && (!isChem || filledSensors.length > 2)) {
    text += `${t.avgTempLabel} ${arrow} °${avgTemp}\n`;
  }

  if (r.nh3)   text += `حساس الـ(NH³) ${arrow} ${r.nh3} ppm\n`;
  if (r.co2)   text += `حساس الـ(CO²) ${arrow} ${r.co2} ppm\n`;
  if (r.hum)   text += `حساس الرطوبة ${arrow} %${r.hum}\n`;
  if (r.press) text += `حساس الضغط ${arrow} ${r.press} Pa\n`;

  if (sp && !isChem) text += `${t.setPointLabel} ${arrow} °${sp}\n`;
  if (caseData.time) text += `${t.startTimeLabel} ${arrow} ${caseData.time}\n`;
  if (r.duration)    text += `${t.procTimeLabel} ${arrow} ${r.duration}\n`;

  text += `\n${t.footer}`;
  return text;
}

// ─── بناء النص الإنجليزي ─────────────────────────────────────────────────────
export function buildEnglishText(caseData, customTemps = null) {
  const r = caseData.raw_data || {};
  const t = customTemps?.en || FALLBACK_TEMPS.en;
  const arrow = "➡";

  let fTitle = t.farmLabel;
  if (r.f_type === "تربية") fTitle = t.rearingLabel;
  else if (r.f_type === "إنتاج") fTitle = t.productionLabel;

  const condition = r.condition || "ارتفاع";
  const condHeader = condition === "انخفاض" ? t.lowLabel : (condition === "ارتفاع" ? t.highLabel : condition);

  const filledSensors = (r.sensors || [])
    .map((s, i) => ({ id: i + 1, val: fmtV(s?.val ?? s) }))
    .filter(s => s.val !== "");

  const sensNamesEn = ["One", "Two", "Three", "Four", "Five", "Six"];
  const isChem = !!(r.nh3 || r.co2 || r.hum || r.press);

  let text = `${fTitle}   -  " ${caseData.farm || ""} "\n`;
  text += `${t.houseLabel} -  " ${caseData.house || ""} "\n`;
  
  const ageStr = getFormattedAge(r.age, r.f_type, 'en', t);
  if (ageStr) text += `${t.ageLabel}      -  " ${ageStr} "\n`;
  
  text += `${condHeader} :-\n`;

  filledSensors.forEach(s => {
    text += `${t.sensorPrefix} ${sensNamesEn[s.id-1] || s.id}   ${arrow} ${s.val}°\n`;
  });

  if (r.nh3)   text += `${t.nh3Label} ${arrow} ${r.nh3} ppm\n`;
  if (r.co2)   text += `${t.co2Label} ${arrow} ${r.co2} ppm\n`;
  if (r.hum)   text += `${t.humLabel} ${arrow} ${r.hum} %\n`;
  if (r.press) text += `${t.pressLabel} ${arrow} ${r.press} Pa\n`;

  const avgTemp = fmtV(r.rate);
  const sp = fmtV(r.set_point);

  if (avgTemp && (!isChem || filledSensors.length === 0)) {
    text += `${t.avgTempLabel}    ${arrow} ${avgTemp}°\n`;
  }

  if (sp && !isChem) text += `${t.setPointLabel}         ${arrow} ${sp}°\n`;
  if (caseData.time) text += `${t.startTimeLabel}       ${arrow} ${caseData.time}\n`;
  if (r.duration)    text += `${t.procTimeLabel}   ${arrow} ${r.duration}\n`;

  text += `\n${t.footer}`;
  return text;
}

export function getSheetRows(caseData) {
  const r = caseData.raw_data || {};
  const now = caseData.date || new Date().toLocaleDateString("en-GB");
  const typeEN = { "مزرعة (تسمين)":"Broiler","إنتاج":"Production","تربية":"Rearing" };
  const enType = typeEN[r.f_type] || "Farm";
  const sp = parseFloat(r.set_point) || 0;
  const condition = r.condition || "";
  const isSpecial = ["مشكلة هيتر","توقف مراوح"].includes(condition);
  const isLow     = condition === "انخفاض";
  const condPfx   = isLow ? "Low " : "High ";
  const filled    = (r.sensors||[]).map((s,i)=>[i+1,fmtV(s?.val??s)]).filter(([,v])=>v!=="");
  const rateStr   = fmtV(r.rate);
  const hasSp     = sp > 0;
  
  // Format age for Excel
  let finalAge = r.age || "";
  if (["تربية", "إنتاج", "جدود", "امهات البياض"].includes(r.f_type) && r.age) {
    finalAge = (parseFloat(r.age) / 7).toFixed(1).replace(/\.0$/, "");
  }

  const rows = [];

  if (isSpecial) {
    const status = condition==="مشكلة هيتر"?"Heater Problem":"Stop Fans";
    rows.push([now,enType,caseData.farm,caseData.house,finalAge,status,caseData.time,"",rateStr,"","%",r.duration||""]);
  } else {
    if (filled.length===1) {
      const [idx,val]= filled[0]; const diff=hasSp?fmtV(parseFloat(val)-sp):"";
      rows.push([now,enType,caseData.farm,caseData.house,finalAge,`${condPfx}Sensor ${idx}`,caseData.time,diff,val,hasSp?String(sp):"","°C",r.duration||""]);
    } else if (filled.length===2) {
      const [s1,s2]=filled; const d1=hasSp?fmtV(parseFloat(s1[1])-sp):""; const d2=hasSp?fmtV(parseFloat(s2[1])-sp):"";
      rows.push([now,enType,caseData.farm,caseData.house,finalAge,condPfx.trim(),caseData.time,`S${s1[0]}=${d1}\nS${s2[0]}=${d2}`,`S${s1[0]}=${s1[1]}\nS${s2[0]}=${s2[1]}`,hasSp?String(sp):"","°C",r.duration||""]);
    } else if (filled.length>=3||rateStr) {
      const diff=hasSp&&rateStr?fmtV(parseFloat(rateStr)-sp):"";
      rows.push([now,enType,caseData.farm,caseData.house,finalAge,condPfx.trim(),caseData.time,diff,rateStr,hasSp?String(sp):"","°C",r.duration||""]);
    }
    const chem = {nh3:["NH3","PPM"],co2:["CO2","PPM"],hum:["Humidity","%"],press:["Pressure","PA"]};
    Object.entries(chem).forEach(([k,[name,unit]])=>{ if(r[k]) rows.push([now,enType,caseData.farm,caseData.house,finalAge,`${condPfx}${name}`,caseData.time,"",r[k],hasSp?String(sp):"",unit,r.duration||""]); });
  }
  return rows;
}

function fmtV(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return "";
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(/\.?0+$/, "");
}
