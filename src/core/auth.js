// ─── تشفير كلمة المرور (SHA-256 + Salt) ────────────────────────────────────
const SALT = "FarmCase_S3cur3_2025";

export async function hashPassword(plain) {
  const salted = `${SALT}${plain}${SALT}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salted));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * التحقق من كلمة المرور مع دعم كلا الصيغتين:
 * - SHA-256 مشفرة (64 حرف) - الصيغة الجديدة
 * - نص عادي (legacy) - للحسابات القديمة قبل تفعيل التشفير
 * يعيد: { ok: boolean, needsUpgrade: boolean, newHash: string|null }
 */
export async function verifyPassword(plain, stored) {
  if (!stored) {
    // حساب بدون كلمة مرور — نقبل أي شيء (حتى فارغ)
    return { ok: plain === "" || plain === stored, needsUpgrade: false, newHash: null };
  }

  // ─── محاولة 1: مقارنة SHA-256 (الحسابات المحدّثة) ─────────────────
  const hashed = await hashPassword(plain);
  if (hashed === stored) return { ok: true, needsUpgrade: false, newHash: null };

  // ─── محاولة 2: مقارنة نص عادي (الحسابات القديمة) ──────────────────
  if (plain === stored) {
    // نجح! يحتاج ترقية للصيغة المشفرة
    return { ok: true, needsUpgrade: true, newHash: hashed };
  }

  return { ok: false, needsUpgrade: false, newHash: null };
}


// ─── Session (بدون JWT، نحفظ بيانات المستخدم في sessionStorage) ──────────
export function setCurrentUser(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user));
}

export function getCurrentUser() {
  try {
    return JSON.parse(sessionStorage.getItem("currentUser") || "null");
  } catch { return null; }
}

export function clearCurrentUser() {
  sessionStorage.removeItem("currentUser");
}
