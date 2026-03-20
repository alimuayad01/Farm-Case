/**
 * conditions.js
 * Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø´Ø±ÙˆØ· Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ + Ø¯ÙˆØ§Ù„ Ø§Ù„ÙƒØ´Ù Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø¹Ù† Ù†ÙˆØ¹ Ø§Ù„Ø­Ø§Ù„Ø©
 * Ù…Ø³ØªØ®Ø±Ø¬ Ù…Ù† ØµÙˆØ±Ø© Ø¬Ø¯ÙˆÙ„ Sama Karbala Poultry - Broiler Farming
 */

// â”€â”€â”€ Ø§Ù„Ø¬Ø¯ÙˆÙ„ Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// lowTemp  : Ø­Ø¯ Rate Ø§Ù„Ø£Ø¯Ù†Ù‰  â†’ Ø§Ù†Ø®ÙØ§Ø¶ Ø¥Ø°Ø§ rate <= lowTemp
// highTemp : Ø­Ø¯ Rate Ø§Ù„Ø£Ø¹Ù„Ù‰ â†’ Ø§Ø±ØªÙØ§Ø¹ Ø¥Ø°Ø§ rate >= highTemp
// lowRH    : Ø­Ø¯ Ø±Ø·ÙˆØ¨Ø© Ù…Ù†Ø®ÙØ¶ (%)
// highRH   : Ø­Ø¯ Ø±Ø·ÙˆØ¨Ø© Ù…Ø±ØªÙØ¹ (%)
// co2      : Ø­Ø¯ Ø«Ø§Ù†ÙŠ Ø£ÙƒØ³ÙŠØ¯ Ø§Ù„ÙƒØ±Ø¨ÙˆÙ† (ppm)
export const DEFAULT_BROILER_TABLE = [
  { ageFrom: 0,  ageTo: 1,  lowTemp: null, highTemp: 1,  lowRH: 45, highRH: null, co2: null },
  { ageFrom: 2,  ageTo: 3,  lowTemp: null, highTemp: 1,  lowRH: 50, highRH: null, co2: null },
  { ageFrom: 4,  ageTo: 5,  lowTemp: null, highTemp: 1,  lowRH: 55, highRH: null, co2: null },
  { ageFrom: 6,  ageTo: 14, lowTemp: -1,   highTemp: 1,  lowRH: 60, highRH: null, co2: null },
  { ageFrom: 15, ageTo: 19, lowTemp: -1,   highTemp: 1,  lowRH: 60, highRH: 85,   co2: 3000 },
  { ageFrom: 20, ageTo: 99, lowTemp: -2,   highTemp: 2,  lowRH: 55, highRH: 85,   co2: 3000 },
];

// Ù†ÙØ³ Ø§Ù„Ù‚ÙˆØ§Ø¹Ø¯ Ù„Ù„Ø£Ù†ÙˆØ§Ø¹ Ø§Ù„Ø£Ø®Ø±Ù‰ (ÙŠÙ…ÙƒÙ† ØªØ¹Ø¯ÙŠÙ„Ù‡Ø§ Ù„Ø§Ø­Ù‚Ø§Ù‹ Ù…Ù† Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª)
export const DEFAULT_TABLES = {
  "Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)": DEFAULT_BROILER_TABLE,
  "Ø¥Ù†ØªØ§Ø¬":          DEFAULT_BROILER_TABLE,
  "ØªØ±Ø¨ÙŠØ©":          DEFAULT_BROILER_TABLE,
  "Ø¬Ø¯ÙˆØ¯":           DEFAULT_BROILER_TABLE,
  "Ø§Ù…Ù‡Ø§Øª Ø§Ù„Ø¨ÙŠØ§Ø¶":   DEFAULT_BROILER_TABLE,
};

// â”€â”€â”€ Ø¬Ù„Ø¨ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„ÙŠÙˆÙ… â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getRuleForAge(age, table) {
  const ageNum = parseInt(age) || 0;
  return table?.find(r => ageNum >= r.ageFrom && ageNum <= r.ageTo) || null;
}

// â”€â”€â”€ Ø§Ù„ÙƒØ´Ù Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø¹Ù† Ù†ÙˆØ¹ Ø§Ù„Ø­Ø§Ù„Ø© Ù…Ù† Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function detectCondition({ rate, humidity, co2, age, farmType, conditionsTable }) {
  const table = conditionsTable?.[farmType] || DEFAULT_BROILER_TABLE;
  const rule  = getRuleForAge(age, table);
  const rateN = parseFloat(rate);
  const humN  = parseFloat(humidity);
  const co2N  = parseFloat(co2);

  const alerts   = [];
  let tempCond   = null;   // "Ø§Ø±ØªÙØ§Ø¹" | "Ø§Ù†Ø®ÙØ§Ø¶" | null

  // â”€ Ø­Ø§Ù„Ø© Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!isNaN(rateN) && rule) {
    if (rule.highTemp !== null && rateN >= rule.highTemp)      tempCond = "Ø§Ø±ØªÙØ§Ø¹";
    else if (rule.lowTemp !== null && rateN <= rule.lowTemp)  tempCond = "Ø§Ù†Ø®ÙØ§Ø¶";
    else if (rateN > 0)   tempCond = "Ø§Ø±ØªÙØ§Ø¹";  // fallback Ø¥Ø°Ø§ Ù„Ù… ØªÙˆØ¬Ø¯ Ù‚Ø§Ø¹Ø¯Ø©
    else if (rateN < 0)   tempCond = "Ø§Ù†Ø®ÙØ§Ø¶";
  } else if (!isNaN(rateN)) {
    tempCond = rateN > 0 ? "Ø§Ø±ØªÙØ§Ø¹" : rateN < 0 ? "Ø§Ù†Ø®ÙØ§Ø¶" : null;
  }

  // â”€ ØªØ­Ø°ÙŠØ±Ø§Øª Ø§Ù„Ø±Ø·ÙˆØ¨Ø© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!isNaN(humN) && rule) {
    if (rule.highRH !== null && humN > rule.highRH)
      alerts.push({ type: "hum_high", text: `ðŸ”´ Ø±Ø·ÙˆØ¨Ø© Ø¹Ø§Ù„ÙŠØ©: ${humN}%  (Ø§Ù„Ø­Ø¯: ${rule.highRH}%)` });
    if (rule.lowRH !== null && humN < rule.lowRH)
      alerts.push({ type: "hum_low",  text: `ðŸ”µ Ø±Ø·ÙˆØ¨Ø© Ù…Ù†Ø®ÙØ¶Ø©: ${humN}%  (Ø§Ù„Ø­Ø¯: ${rule.lowRH}%)` });
  }

  // â”€ ØªØ­Ø°ÙŠØ± CO2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!isNaN(co2N) && rule?.co2 !== null && co2N > rule.co2)
    alerts.push({ type: "co2_high", text: `ðŸŸ  COâ‚‚ Ù…Ø±ØªÙØ¹: ${co2N} ppm  (Ø§Ù„Ø­Ø¯: ${rule.co2} ppm)` });

  return { tempCond, alerts, rule };
}

// â”€â”€â”€ Ø¨Ù†Ø§Ø¡ Ù†Øµ Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ø§Ù„Ø¹Ø±Ø¨ÙŠ (Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù€ export_manager.py) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function buildArabicText(caseData) {
  const r = caseData.raw_data || {};
  const condition = r.condition || "Ø§Ù†Ø®ÙØ§Ø¶";
  const condHeaderMap = {
    "Ø§Ù†Ø®ÙØ§Ø¶":              "Ø§Ù†Ø®ÙØ§Ø¶ ÙÙŠ",
    "Ø§Ø±ØªÙØ§Ø¹":              "Ø§Ø±ØªÙØ§Ø¹ ÙÙŠ",
    "Ù…Ø´ÙƒÙ„Ø© Ù‡ÙŠØªØ±":         "Ù…Ø´ÙƒÙ„Ø© Ù‡ÙŠØªØ± (Ø·Ù„Ø¨ Ù‡ÙŠØªØ± Ø¹Ø§Ù„ÙŠ)",
    "ØªÙˆÙ‚Ù Ù…Ø±Ø§ÙˆØ­":         "ØªÙˆÙ‚Ù Ù…Ø±Ø§ÙˆØ­",
    "Ù…Ø²Ø±Ø¹Ø© ÙƒØ§Ù…Ù„Ø© (Ù…ØªØ¹Ø¯Ø¯)": "Ø§Ù†Ø®ÙØ§Ø¶ ÙÙŠ",
  };
  const condHeader = condHeaderMap[condition] || condition;
  const arrow = "â¬…";

  const isBroiler = ["Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)", "Ø¬Ø¯ÙˆØ¯", "Ø§Ù…Ù‡Ø§Øª Ø§Ù„Ø¨ÙŠØ§Ø¶"].includes(r.f_type);
  const fTypeAr   = isBroiler ? "Ù…Ø²Ø±Ø¹Ø©" : r.f_type === "Ø¥Ù†ØªØ§Ø¬" ? "Ø¥Ù†ØªØ§Ø¬" : "ØªØ±Ø¨ÙŠØ©";
  const sensNamesAr = [
    "Ø§Ù„Ø­Ø³Ù€Ø§Ø³ Ø§Ù„Ø§ÙˆÙ„ ", "Ø§Ù„Ø­Ø³Ù€Ø§Ø³ Ø§Ù„Ø«Ø§Ù†ÙŠ", "Ø§Ù„Ø­Ø³Ù€Ø§Ø³ Ø§Ù„Ø«Ø§Ù„Ø«",
    "Ø§Ù„Ø­Ø³Ù€Ø§Ø³ Ø§Ù„Ø±Ø§Ø¨Ø¹", "Ø§Ù„Ø­Ø³Ù€Ø§Ø³ Ø§Ù„Ø®Ø§Ù…Ø³", "Ø§Ù„Ø­Ø³Ù€Ø§Ø³ Ø§Ù„Ø³Ø§Ø¯Ø³"
  ];

  // ÙÙ‚Ø· Ø§Ù„Ø­Ø³Ø§Ø³Ø§Øª Ø§Ù„Ù…Ù…Ù„ÙˆØ¡Ø©
  const filled = (r.sensors || [])
    .map((s, i) => [i + 1, fmtV(s?.val ?? s)])
    .filter(([, v]) => v !== "");

  const isChem     = !!(r.nh3 || r.co2 || r.hum || r.press);
  const rateStr    = isChem ? "" : fmtV(r.rate);
  const spStr      = fmtV(r.set_point);
  const ageStr     = r.age ? `${r.age} ÙŠÙˆÙ…` : "â€”";

  let text = `${fTypeAr} - ${caseData.farm}\n`;
  text += `Ø­Ø¸ÙŠØ±Ø© - ${caseData.house} - Ø§Ù„Ø¹Ù…Ø± - ${ageStr}\n`;
  text += `${condHeader} :-\n`;

  if (filled.length > 0) {
    filled.forEach(([idx, val]) => { text += `${sensNamesAr[idx-1]} ${arrow} Â°${val}\n`; });
    if (filled.length >= 3 && rateStr) text += `Ù…Ø¹Ø¯Ù„ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø© ${arrow} Â°${rateStr}\n`;
  } else if (r.nh3)   { text += `Ø­Ø³Ø§Ø³ Ø§Ù„Ù€(NHÂ³) ${arrow} ppm ${r.nh3}\n`; }
  else if (r.co2)     { text += `Ø­Ø³Ø§Ø³ Ø§Ù„Ù€(COÂ²) ${arrow} ppm ${r.co2}\n`; }
  else if (r.hum)     { text += `Ø­Ø³Ø§Ø³ Ø§Ù„Ø±Ø·ÙˆØ¨Ø© ${arrow} ${r.hum} %\n`; }
  else if (r.press)   { text += `Ø­Ø³Ø§Ø³ Ø§Ù„Ø¶ØºØ· ${arrow} ${r.press} Pa\n`; }
  else if (rateStr)   { text += `Ù…Ø¹Ø¯Ù„ Ø¯Ø±Ø¬Ø© Ø§Ù„Ø­Ø±Ø§Ø±Ø© ${arrow} Â°${rateStr}\n`; }

  if (spStr && !isChem) text += `Ø§Ù„Ù€Ø³Ù€ÙŠÙ€Øª Ø¨Ù€ÙˆÙŠÙ€Ù†Ù€Øª ${arrow} Â°${spStr}\n`;
  text += `Ø¨Ø¯Ø§ÙŠØ© Ø§Ù„Ø­Ø§Ù„Ø© ${arrow} ${caseData.time}\n`;
  if (r.duration)     text += `Ù…Ø¯Ø© Ø§Ù„Ù…Ø¹Ø§Ù„Ø¬Ø© ${arrow} ${r.duration}\n\n`;

  return text;
}

// â”€â”€â”€ Ù†Øµ Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function buildEnglishText(caseData) {
  const r = caseData.raw_data || {};
  const condition = r.condition || "Ø§Ù†Ø®ÙØ§Ø¶";
  const condHeaderMap = {
    "Ø§Ù†Ø®ÙØ§Ø¶": "Gradual Low", "Ø§Ø±ØªÙØ§Ø¹": "Gradual High",
    "Ù…Ø´ÙƒÙ„Ø© Ù‡ÙŠØªØ±": "Heater Problem", "ØªÙˆÙ‚Ù Ù…Ø±Ø§ÙˆØ­": "Fan's Stop",
    "Ù…Ø²Ø±Ø¹Ø© ÙƒØ§Ù…Ù„Ø© (Ù…ØªØ¹Ø¯Ø¯)": "Low Temperature",
  };
  const condHeader = condHeaderMap[condition] || condition;
  const arrow  = "âž¡";
  const typeEN = { "Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)":"Broiler","Ø¥Ù†ØªØ§Ø¬":"Production","ØªØ±Ø¨ÙŠØ©":"Rearing","Ø¬Ø¯ÙˆØ¯":"Grand Parents (G.P)","Ø§Ù…Ù‡Ø§Øª Ø§Ù„Ø¨ÙŠØ§Ø¶":"Layer Breeder" };
  const fEn    = typeEN[r.f_type] || "Farm";
  const sensNamesEn = ["Sensor One ","Sensor Two ","Sensor Three","Sensor Four ","Sensor Five ","Sensor Six  "];
  const filled = (r.sensors||[]).map((s,i)=>[i+1,fmtV(s?.val??s)]).filter(([,v])=>v!=="");
  const isChem = !!(r.nh3||r.co2||r.hum||r.press);

  let text = `${fEn} - ${caseData.farm}\n`;
  text += `House - ${caseData.house} - Age - ${r.age||"â€”"} Day\n`;
  text += `${condHeader} :-\n`;
  filled.forEach(([i,v])=>{ text+=`${sensNamesEn[i-1]} ${arrow} ${v}Â°\n`; });
  if (r.nh3)   text+=`Sensor (NHÂ³)      ${arrow} ${r.nh3} ppm\n`;
  if (r.co2)   text+=`Sensor (COÂ²)      ${arrow} ${r.co2} ppm\n`;
  if (r.hum)   text+=`Humidity Sensor ${arrow} ${r.hum} %\n`;
  if (r.press) text+=`Pressure Sensor ${arrow} ${r.press} Pa\n`;
  if ((filled.length>=3||(!filled.length&&fmtV(r.rate)))&&!isChem) text+=`Average  Temp  ${arrow} ${fmtV(r.rate)}Â°\n`;
  if (fmtV(r.set_point)) text+=`Set Point          ${arrow} ${fmtV(r.set_point)}Â°\n`;
  text+=`Start Time       ${arrow} ${caseData.time}\n`;
  if (r.duration) text+=`Process Time  ${arrow} ${r.duration}\n\n`;
  return text;
}

// â”€â”€â”€ Ø³Ø·Ø± Excel (Ù…Ø·Ø§Ø¨Ù‚ Ù„Ù€ get_sheet_line) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function getSheetRows(caseData) {
  const r = caseData.raw_data || {};
  const now = caseData.date || new Date().toLocaleDateString("en-GB");
  const typeEN = { "Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)":"Broiler","Ø¥Ù†ØªØ§Ø¬":"Production","ØªØ±Ø¨ÙŠØ©":"Rearing","Ø¬Ø¯ÙˆØ¯":"Grand Parents (G.P)","Ø§Ù…Ù‡Ø§Øª Ø§Ù„Ø¨ÙŠØ§Ø¶":"Layer Breeder" };
  const enType = typeEN[r.f_type] || "Farm";
  const sp = parseFloat(r.set_point) || 0;
  const condition = r.condition || "";
  const isSpecial = ["Ù…Ø´ÙƒÙ„Ø© Ù‡ÙŠØªØ±","ØªÙˆÙ‚Ù Ù…Ø±Ø§ÙˆØ­"].includes(condition);
  const isLow     = condition === "Ø§Ù†Ø®ÙØ§Ø¶";
  const condPfx   = isLow ? "Low " : "High ";
  const filled    = (r.sensors||[]).map((s,i)=>[i+1,fmtV(s?.val??s)]).filter(([,v])=>v!=="");
  const rateStr   = fmtV(r.rate);
  const hasSp     = sp > 0;
  const rows = [];

  if (isSpecial) {
    const status = condition==="Ù…Ø´ÙƒÙ„Ø© Ù‡ÙŠØªØ±"?"Heater Problem":"Stop Fans";
    rows.push([now,enType,caseData.farm,caseData.house,r.age||"",status,caseData.time,"",rateStr,"","%",r.duration||""]);
  } else {
    // Ø­Ø±Ø§Ø±Ø©
    if (filled.length===1) {
      const [idx,val]= filled[0]; const diff=hasSp?fmtV(parseFloat(val)-sp):"";
      rows.push([now,enType,caseData.farm,caseData.house,r.age||"",`${condPfx}Sensor ${idx}`,caseData.time,diff,val,hasSp?String(sp):"","Â°C",r.duration||""]);
    } else if (filled.length===2) {
      const [s1,s2]=filled; const d1=hasSp?fmtV(parseFloat(s1[1])-sp):""; const d2=hasSp?fmtV(parseFloat(s2[1])-sp):"";
      rows.push([now,enType,caseData.farm,caseData.house,r.age||"",condPfx.trim(),caseData.time,`S${s1[0]}=${d1}\nS${s2[0]}=${d2}`,`S${s1[0]}=${s1[1]}\nS${s2[0]}=${s2[1]}`,hasSp?String(sp):"","Â°C",r.duration||""]);
    } else if (filled.length>=3||rateStr) {
      const diff=hasSp&&rateStr?fmtV(parseFloat(rateStr)-sp):"";
      rows.push([now,enType,caseData.farm,caseData.house,r.age||"",condPfx.trim(),caseData.time,diff,rateStr,hasSp?String(sp):"","Â°C",r.duration||""]);
    }
    // ÙƒÙŠÙ…ÙŠØ§Ø¦ÙŠØ©
    const chem = {nh3:["NH3","PPM"],co2:["CO2","PPM"],hum:["Humidity","%"],press:["Pressure","PA"]};
    Object.entries(chem).forEach(([k,[name,unit]])=>{ if(r[k]) rows.push([now,enType,caseData.farm,caseData.house,r.age||"",`${condPfx}${name}`,caseData.time,"",r[k],hasSp?String(sp):"",unit,r.duration||""]); });
  }
  return rows;
}

// â”€â”€â”€ helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fmtV(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return "";
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
}
