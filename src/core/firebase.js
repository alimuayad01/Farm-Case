// ─── Firebase REST API ──────────────────────────────────────────────────────
// نستخدم REST API مباشرة كما في Python، لا نحتاج Firebase SDK
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

// ─── تحميل مع كاش محلي (localStorage) ────────────────────────────────────
export async function loadData(key, defaultVal = []) {
  // أولاً من localStorage (سريع)
  const local = localStorage.getItem(key);
  let localData = null;
  try { localData = local ? JSON.parse(local) : null; } catch { localData = null; }

  // إذا موجود محلياً، أرجعه وحدّث من السحابة في الخلفية
  if (localData !== null && localData !== "" &&
      !(Array.isArray(localData) && localData.length === 0) &&
      !(typeof localData === "object" && !Array.isArray(localData) && Object.keys(localData).length === 0)) {
    getCloud(key).then(cloud => {
      if (cloud !== null) localStorage.setItem(key, JSON.stringify(cloud));
    });
    return localData;
  }

  // تحميل من السحابة
  const cloud = await getCloud(key, null);

  if (cloud !== null) {
    localStorage.setItem(key, JSON.stringify(cloud));
    return cloud;
  }

  // Firebase غير متاح — استخدم القيمة الافتراضية
  return defaultVal;
}


export async function saveData(key, data) {
  // حفظ محلي فوري
  localStorage.setItem(key, JSON.stringify(data));
  // رفع للسحابة في الخلفية
  putCloud(key, data);
}
