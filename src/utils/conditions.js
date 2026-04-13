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
// mode: 'whatsapp' (weeks only, no remainder) | 'excel' (rounded weeks) | default (weeks+days)
function getFormattedAge(age, farmType, lang, t, mode = 'whatsapp') {
  if (!age) return "";
  const numAge = parseInt(age, 10);
  if (isNaN(numAge)) return "";

  const typesToConvert = ["تربية", "إنتاج", "جدود", "امهات البياض", "Rearing", "Production", "Grandparents", "Layers Parents"];
  const fTypeTrim = (farmType || "").trim();
  
  if (typesToConvert.includes(fTypeTrim)) {
    const wLabel = lang === 'ar' ? (t.weekLabel || "اسبوع") : (t.weekLabel || "Week");

    if (mode === 'excel') {
      // Excel: round to nearest whole week
      const weeks = Math.round(numAge / 7);
      return `${weeks}`;
    }

    // WhatsApp: weeks only (floor), ignore remaining days
    const w = Math.floor(numAge / 7);
    if (w > 0) return `" ${w} " ${wLabel}`;
    return `" 0 " ${wLabel}`;
  }
  
  const label = lang === 'ar' ? (t.dayLabel || "يوم") : (t.dayLabel || "Day");
  return `" ${numAge} " ${label}`;
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
  if (ageStr) text += `${t.ageLabel}  -  ${ageStr}\n`; // Age outside quotes
  
  text += `${condHeader} :-\n`;

  if (filledSensors.length > 0) {
    const sensorNamesAr = [
      "الحــــــســـــاس الاول",
      "الحـــســـاس الثـانــي",
      "الحـــســــاس الثـالـث",
      "الحــســــاس الـــرابــع",
      "الحــســاس الخامس",
      "الحــسـاس السادس"
    ];
    filledSensors.forEach(s => {
      text += `${sensorNamesAr[s.id-1] || "الحساس " + s.id} ${arrow} °${s.val}\n`;
    });
  }

  if (avgTemp && (!isChem && filledSensors.length !== 1 && filledSensors.length !== 2)) {
    text += `${t.avgTempLabel} ${arrow} °${avgTemp}\n`;
  }

  if (r.nh3)   text += `حساس الـ(NH³) ${arrow} ${r.nh3} ppm\n`;
  if (r.co2)   text += `حساس الـ(CO²) ${arrow} ${r.co2} ppm\n`;
  if (r.hum)   text += `حساس الرطوبة ${arrow} %${r.hum}\n`;
  if (r.press) text += `حساس الضغط ${arrow} ${r.press} Pa\n`;

  if (sp && !isChem) text += `${t.setPointLabel} ${arrow} °${sp}\n`;
  if (caseData.time) text += `${t.startTimeLabel} ${arrow} ${caseData.time}\n`;
  if (r.duration)    text += `${t.procTimeLabel} ${arrow} ${r.duration}\n`;

  if (r.dur_mins >= 40) {
    text += `\n${t.footer}`;
  }
  return text;
}

// ─── بناء النص الإنجليزي ─────────────────────────────────────────────────────
export function buildEnglishText(caseData, customTemps = null) {
  const r = caseData.raw_data || {};
  const t = customTemps?.en || FALLBACK_TEMPS.en;
  const arrow = "➡";

  const fTypeTrimmed = (r.f_type || "").trim();
  let fTitle = t.farmLabel || "Farm";
  if (fTypeTrimmed === "تربية" || fTypeTrimmed === "Rearing") fTitle = t.rearingLabel || "Rearing";
  else if (fTypeTrimmed === "إنتاج" || fTypeTrimmed === "Production") fTitle = t.productionLabel || "Production";

  const condition = r.condition || "ارتفاع";
  const condHeader = condition === "انخفاض" ? t.lowLabel : (condition === "ارتفاع" ? t.highLabel : condition);

  const filledSensors = (r.sensors || [])
    .map((s, i) => ({ id: i + 1, val: fmtV(s?.val ?? s) }))
    .filter(s => s.val !== "");

  const sensNamesEn = ["One", "Two", "Three", "Four", "Five", "Six"];
  const isChem = !!(r.nh3 || r.co2 || r.hum || r.press);

  let text = `${fTitle}   -  " ${caseData.farm || ""} "\n`;
  if (caseData.house) text += `${t.houseLabel} -  " ${caseData.house} "\n`;
  
  const ageStr = getFormattedAge(r.age, r.f_type, 'en', t);
  if (ageStr) text += `${t.ageLabel}      -  ${ageStr}\n`;
  
  text += `${condHeader} :-\n`;

  if (filledSensors.length > 0) {
    filledSensors.forEach(s => {
      text += `${t.sensorPrefix} ${sensNamesEn[s.id-1] || s.id}   ${arrow} ${s.val}°\n`;
    });
  }

  const avgTemp = fmtV(r.rate);
  const sp = fmtV(r.set_point);

  if (avgTemp && (!isChem && filledSensors.length !== 1 && filledSensors.length !== 2)) {
    text += `${t.avgTempLabel}    ${arrow} ${avgTemp}°\n`;
  }

  if (r.nh3)   text += `${t.nh3Label} ${arrow} ${r.nh3} ppm\n`;
  if (r.co2)   text += `${t.co2Label} ${arrow} ${r.co2} ppm\n`;
  if (r.hum)   text += `${t.humLabel} ${arrow} ${r.hum} %\n`;
  if (r.press) text += `${t.pressLabel} ${arrow} ${r.press} Pa\n`;

  if (sp && !isChem) text += `${t.setPointLabel}         ${arrow} ${sp}°\n`;
  if (caseData.time) text += `${t.startTimeLabel}       ${arrow} ${caseData.time}\n`;
  
  let durationText = "";
  const rawDur = r.duration_en || r.duration || "";
  if (rawDur) {
    durationText = rawDur.replace("ساعة", "Hrs.").replace("دقيقة", "Min.").trim();
  }

  if (durationText) text += `${t.procTimeLabel}   ${arrow} ${durationText}\n`;

  if (r.dur_mins >= 40) {
    text += `\n${t.footer}`;
  }
  return text;
}

export const DEFAULT_COL_ORDER = ["date", "farm", "farm_type", "house", "age", "condition", "time", "diff", "rate", "sp", "unit", "duration"];

export function getSheetRows(caseData, typeMapping = null, columnOrder = null) {
  const r = caseData.raw_data || {};
  const now = caseData.date || new Date().toLocaleDateString("en-GB");
  
  const defaultTypeEN = { "مزرعة (تسمين)":"Broiler","إنتاج":"Production","تربية":"Rearing", "جدود":"Grandparents", "امهات البياض":"Layers Parents" };
  const typeEN = typeMapping || {};
  const fTypeTrim = (r.f_type || "").trim();
  const enType = typeEN[fTypeTrim] || defaultTypeEN[fTypeTrim] || fTypeTrim || "Broiler";
  
  const sp = parseFloat(r.set_point) || 0;
  const condition = r.condition || "";
  const isSpecial = ["مشكلة هيتر","توقف مراوح"].includes(condition);
  const isLow     = condition === "انخفاض";
  const condPfx   = isLow ? "Low " : "High ";
  const filled    = (r.sensors||[]).map((s,i)=>[i+1,fmtV(s?.val??s)]).filter(([,v])=>v!=="");
  const rateStr   = fmtV(r.rate);
  const hasSp     = sp > 0;
  
  // Use rounded weeks for rearing/production/grands in Excel, days otherwise
  const WEEK_TYPES = ["تربية","إنتاج","جدود","امهات البياض"];
  let finalAge = WEEK_TYPES.includes(fTypeTrim) && r.age
    ? String(Math.round(parseInt(r.age) / 7))
    : (r.age || "");

  let durationText = "";
  const rawDur = r.duration_en || r.duration || "";
  if (rawDur) {
    durationText = rawDur.replace("ساعة", "Hrs.").replace("دقيقة", "Min.").trim();
  }

  const baseRowObj = {
    date: now,
    farm: caseData.farm || "",
    farm_type: enType,
    house: caseData.house || "",
    age: finalAge,
    time: caseData.time || "",
    duration: durationText,
    reason: caseData.reason || ""
  };

  const createRow = (cond, diff, rate, spStr, unit) => {
    const obj = { ...baseRowObj, condition: cond || "", diff: diff || "", rate: rate || "", sp: spStr || "", unit: unit || "" };
    return (columnOrder || DEFAULT_COL_ORDER).map(col => obj[col] !== undefined ? obj[col] : "");
  };

  const rows = [];

  if (isSpecial) {
    const status = condition==="مشكلة هيتر"?"Problem Heater":"Fans Stop";
    rows.push(createRow(status, "", rateStr, "", "%"));
  } else if (filled.length > 0 || rateStr) {
    // Compute the effective value to determine High/Low
    const sensVals = filled.map(([,v]) => parseFloat(v)).filter(v => !isNaN(v));
    const sensAvg  = sensVals.length > 0 ? sensVals.reduce((a,b) => a+b, 0) / sensVals.length : null;
    const effectiveVal = rateStr ? parseFloat(rateStr) : sensAvg;

    // Determine High/Low prefix from actual value vs setpoint
    let resolvedPfx = condPfx; // fallback
    if (effectiveVal !== null && sp > 0) {
      resolvedPfx = effectiveVal > sp ? "High " : effectiveVal < sp ? "Low " : "High ";
    }

    if (filled.length === 1) {
      const [idx, val] = filled[0];
      const diff = hasSp ? fmtV(parseFloat(val) - sp) : "";
      rows.push(createRow(`${resolvedPfx}Temp Sensor ${idx}`, diff, val, hasSp ? String(sp) : "", "°C"));

    } else if (filled.length === 2) {
      // Two sensors: S1= S2= — ignore manual rate
      const [s1, s2] = filled;
      const d1 = hasSp ? fmtV(parseFloat(s1[1]) - sp) : "";
      const d2 = hasSp ? fmtV(parseFloat(s2[1]) - sp) : "";
      rows.push(createRow(resolvedPfx + "Temp",
        `S${s1[0]}=${d1}\nS${s2[0]}=${d2}`,
        `S${s1[0]}=${s1[1]}\nS${s2[0]}=${s2[1]}`,
        hasSp ? String(sp) : "", "°C"));

    } else {
      // 3+ sensors OR manual rate only: use avg or manual rate
      const displayRate = rateStr || (sensAvg !== null ? fmtV(sensAvg) : "");
      const diff = hasSp && displayRate ? fmtV(parseFloat(displayRate) - sp) : "";
      rows.push(createRow(resolvedPfx + "Temp", diff, displayRate, hasSp ? String(sp) : "", "°C"));
    }

    // Chemical sensors
    const chemMappings = {
      nh3:   ["High NH3",    "PPM"],
      co2:   ["High CO2",    "PPM"],
      hum:   [isLow ? "Low Humidity" : "High Humidity", "%"],
      press: ["High Pressure", "PA"]
    };
    Object.entries(chemMappings).forEach(([key, [status, unit]]) => {
      if (r[key]) rows.push(createRow(status, "", r[key], hasSp ? String(sp) : "", unit));
    });
  }
  return rows;
}

function fmtV(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return "";
  return n % 1 === 0 ? String(n) : n.toFixed(1).replace(/\.?0+$/, "");
}

