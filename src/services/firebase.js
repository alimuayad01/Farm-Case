// â”€â”€â”€ Firebase REST API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Ù†Ø³ØªØ®Ø¯Ù… REST API Ù…Ø¨Ø§Ø´Ø±Ø© ÙƒÙ…Ø§ ÙÙŠ PythonØŒ Ù„Ø§ Ù†Ø­ØªØ§Ø¬ Firebase SDK
const FIREBASE_URL = "https://farm-case-default-rtdb.asia-southeast1.firebasedatabase.app";

export async function getCloud(node, defaultVal = null) {
  try {
    const res = await fetch(`${FIREBASE_URL}/${node}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data !== null) return data;
    }
  } catch (e) {
    console.warn(`Cloud load error [${node}]:`, e.message);
  }
  return defaultVal;
}

export async function putCloud(node, data) {
  try {
    await fetch(`${FIREBASE_URL}/${node}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn(`Cloud save error [${node}]:`, e.message);
  }
}

// â”€â”€â”€ ØªØ­Ù…ÙŠÙ„ Ù…Ø¹ ÙƒØ§Ø´ Ù…Ø­Ù„ÙŠ (localStorage) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function loadData(key, defaultVal = []) {
  // Ø£ÙˆÙ„Ø§Ù‹ Ù…Ù† localStorage (Ø³Ø±ÙŠØ¹)
  const local = localStorage.getItem(key);
  let localData = null;
  try { localData = local ? JSON.parse(local) : null; } catch { localData = null; }

  // Ø¥Ø°Ø§ Ù…ÙˆØ¬ÙˆØ¯ Ù…Ø­Ù„ÙŠØ§Ù‹ØŒ Ø£Ø±Ø¬Ø¹Ù‡ ÙˆØ­Ø¯Ù‘Ø« Ù…Ù† Ø§Ù„Ø³Ø­Ø§Ø¨Ø© ÙÙŠ Ø§Ù„Ø®Ù„ÙÙŠØ©
  if (localData !== null && localData !== "" &&
      !(Array.isArray(localData) && localData.length === 0) &&
      !(typeof localData === "object" && !Array.isArray(localData) && Object.keys(localData).length === 0)) {
    getCloud(key).then(cloud => {
      if (cloud !== null) localStorage.setItem(key, JSON.stringify(cloud));
    });
    return localData;
  }

  // ØªØ­Ù…ÙŠÙ„ Ù…Ù† Ø§Ù„Ø³Ø­Ø§Ø¨Ø©
  const cloud = await getCloud(key, null);

  if (cloud !== null) {
    localStorage.setItem(key, JSON.stringify(cloud));
    return cloud;
  }

  // Firebase ØºÙŠØ± Ù…ØªØ§Ø­ â€” Ø§Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ©
  return defaultVal;
}


export async function saveData(key, data) {
  // Ø­ÙØ¸ Ù…Ø­Ù„ÙŠ ÙÙˆØ±ÙŠ
  localStorage.setItem(key, JSON.stringify(data));
  // Ø±ÙØ¹ Ù„Ù„Ø³Ø­Ø§Ø¨Ø© ÙÙŠ Ø§Ù„Ø®Ù„ÙÙŠØ©
  putCloud(key, data);
}
