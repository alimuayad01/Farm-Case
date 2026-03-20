// â”€â”€â”€ Ø¯ÙˆØ§Ù„ Ù…Ø³Ø§Ø¹Ø¯Ø© Ø¹Ø§Ù…Ø© â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function getShiftName() {
  const h = new Date().getHours();
  if (h >= 7 && h < 15) return "ØµØ¨Ø§Ø­ÙŠ";
  if (h >= 15 && h < 23) return "Ù…Ø³Ø§Ø¦ÙŠ";
  return "Ù„ÙŠÙ„ÙŠ";
}

export function safeFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export const sf = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
export const fv = v => { const n = sf(v); if (n === null) return ""; return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, ""); };
export const avg = arr => { const n = arr.map(v => sf(typeof v === "object" ? v.val : v)).filter(x => x !== null); return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null; };

export function isNumeric(val) {
  return val !== "" && val !== null && !isNaN(parseFloat(val));
}

export function formatTime(date = new Date()) {
  return date.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(date = new Date()) {
  return date.toLocaleDateString("ar-EG");
}

export function nowTimestamp() {
  return Date.now() / 1000; // Unix timestamp
}

export function isToday(ts) {
  const d = new Date(ts * 1000);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

export const CONDITIONS_AR = ["Ø§Ù†Ø®ÙØ§Ø¶", "Ø§Ø±ØªÙØ§Ø¹", "Ù…Ø´ÙƒÙ„Ø© Ù‡ÙŠØªØ±", "ØªÙˆÙ‚Ù Ù…Ø±Ø§ÙˆØ­", "Ù…Ø²Ø±Ø¹Ø© ÙƒØ§Ù…Ù„Ø© (Ù…ØªØ¹Ø¯Ø¯)"];
export const CONDITIONS_EN = ["Low", "High", "Heater Problem", "Fan's Stop", "Whole Farm (Multi)"];
export const TYPES_AR      = ["Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)", "Ø¥Ù†ØªØ§Ø¬", "ØªØ±Ø¨ÙŠØ©", "Ø¬Ø¯ÙˆØ¯", "Ø§Ù…Ù‡Ø§Øª Ø§Ù„Ø¨ÙŠØ§Ø¶"];
export const TYPES_EN      = ["Broiler", "Production", "Rearing", "Grand Parents", "Layer Breeders"];
