// â”€â”€â”€ ØªØ´ÙÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± (SHA-256 + Salt) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SALT = "FarmCase_S3cur3_2025";

export async function hashPassword(plain) {
  const salted = `${SALT}${plain}${SALT}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salted));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ø¹ Ø¯Ø¹Ù… ÙƒÙ„Ø§ Ø§Ù„ØµÙŠØºØªÙŠÙ†:
 * - SHA-256 Ù…Ø´ÙØ±Ø© (64 Ø­Ø±Ù) - Ø§Ù„ØµÙŠØºØ© Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©
 * - Ù†Øµ Ø¹Ø§Ø¯ÙŠ (legacy) - Ù„Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø© Ù‚Ø¨Ù„ ØªÙØ¹ÙŠÙ„ Ø§Ù„ØªØ´ÙÙŠØ±
 * ÙŠØ¹ÙŠØ¯: { ok: boolean, needsUpgrade: boolean, newHash: string|null }
 */
export async function verifyPassword(plain, stored) {
  if (!stored) {
    // Ø­Ø³Ø§Ø¨ Ø¨Ø¯ÙˆÙ† ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ± â€” Ù†Ù‚Ø¨Ù„ Ø£ÙŠ Ø´ÙŠØ¡ (Ø­ØªÙ‰ ÙØ§Ø±Øº)
    return { ok: plain === "" || plain === stored, needsUpgrade: false, newHash: null };
  }

  // â”€â”€â”€ Ù…Ø­Ø§ÙˆÙ„Ø© 1: Ù…Ù‚Ø§Ø±Ù†Ø© SHA-256 (Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ø­Ø¯Ù‘Ø«Ø©) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const hashed = await hashPassword(plain);
  if (hashed === stored) return { ok: true, needsUpgrade: false, newHash: null };

  // â”€â”€â”€ Ù…Ø­Ø§ÙˆÙ„Ø© 2: Ù…Ù‚Ø§Ø±Ù†Ø© Ù†Øµ Ø¹Ø§Ø¯ÙŠ (Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù‚Ø¯ÙŠÙ…Ø©) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (plain === stored) {
    // Ù†Ø¬Ø­! ÙŠØ­ØªØ§Ø¬ ØªØ±Ù‚ÙŠØ© Ù„Ù„ØµÙŠØºØ© Ø§Ù„Ù…Ø´ÙØ±Ø©
    return { ok: true, needsUpgrade: true, newHash: hashed };
  }

  return { ok: false, needsUpgrade: false, newHash: null };
}


// â”€â”€â”€ Session (Ø¨Ø¯ÙˆÙ† JWTØŒ Ù†Ø­ÙØ¸ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙÙŠ sessionStorage) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
