// ─── Database configuration (Local vs Cloud) ─────────────────────────

// If you want to use a LOCAL server (e.g. Node.js on this PC), 
// change this to your local IP: "http://192.168.1.50:3000"
// Default uses Firebase Cloud.
const getBaseUrl = () => {
    return localStorage.getItem("database_url") || "https://farm-case-default-rtdb.asia-southeast1.firebasedatabase.app";
};

export async function getCloud(node, defaultVal = null) {
  try {
    const url = getBaseUrl();
    const res = await fetch(`${url}/${node}.json`);
    if (res.ok) {
      const data = await res.json();
      if (data !== null) return data;
    }
  } catch (e) {
    console.warn(`Database load error [${node}]:`, e.message);
  }
  return defaultVal;
}

export async function putCloud(node, data) {
  try {
    const url = getBaseUrl();
    await fetch(`${url}/${node}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn(`Database save error [${node}]:`, e.message);
  }
}

// ─── Data Management with Local Caching ────────────────────────────────────
export async function loadData(key, defaultVal = []) {
  // 1. Try Local cache (Fast)
  const local = localStorage.getItem(key);
  let localData = null;
  try { localData = local ? JSON.parse(local) : null; } catch { localData = null; }

  // 2. If healthy local data exists, return it and sync cloud in bg
  if (localData !== null && 
      !(Array.isArray(localData) && localData.length === 0) &&
      !(typeof localData === "object" && !Array.isArray(localData) && Object.keys(localData).length === 0)) {
    
    getCloud(key).then(cloud => {
      if (cloud !== null) localStorage.setItem(key, JSON.stringify(cloud));
    });
    return localData;
  }

  // 3. Fallback to Cloud
  const cloud = await getCloud(key, null);
  if (cloud !== null) {
    localStorage.setItem(key, JSON.stringify(cloud));
    return cloud;
  }

  return defaultVal;
}

export async function saveData(key, data) {
  // Sync local
  localStorage.setItem(key, JSON.stringify(data));
  // Sync cloud/local server
  await putCloud(key, data);
}

// ─── Maintenance Utils ────────────────────────────────────────────────────
export function setDatabaseUrl(url) {
    localStorage.setItem("database_url", url);
}

export function resetDatabaseUrl() {
    localStorage.removeItem("database_url");
}
