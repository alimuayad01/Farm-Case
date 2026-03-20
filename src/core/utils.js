// ─── دوال مساعدة عامة ────────────────────────────────────────────────────

export function getShiftName() {
  const h = new Date().getHours();
  if (h >= 7 && h < 15) return "صباحي";
  if (h >= 15 && h < 23) return "مسائي";
  return "ليلي";
}

export function safeFloat(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

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

export const CONDITIONS_AR = ["انخفاض", "ارتفاع", "مشكلة هيتر", "توقف مراوح", "مزرعة كاملة (متعدد)"];
export const CONDITIONS_EN = ["Low", "High", "Heater Problem", "Fan's Stop", "Whole Farm (Multi)"];
export const TYPES_AR      = ["مزرعة (تسمين)", "إنتاج", "تربية", "جدود", "امهات البياض"];
export const TYPES_EN      = ["Broiler", "Production", "Rearing", "Grand Parents", "Layer Breeders"];
