// ─── Database configuration & Sync Queue ─────────────────────────

// getBaseUrl: Returns the API URL (Cloud or Local IP)
const getBaseUrl = () => {
    return localStorage.getItem("database_url") || "https://farm-case-default-rtdb.asia-southeast1.firebasedatabase.app";
};

// Internal: Perform the actual network call
async function performNetworkPut(node, data) {
  const url = getBaseUrl();
  const res = await fetch(`${url}/${node}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  return true;
}

// ─── Sync Queue (Offline Support) ──────────────────────────────────────────
// Keeps track of data that failed to upload to the server.
const SYNC_QUEUE_KEY = "pending_sync_queue";

function addToSyncQueue(node, data) {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "{}");
  // We use object keys to ensure we only have the "latest" version per node.
  queue[node] = { data, timestamp: Date.now() };
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
}

export async function processSyncQueue() {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "{}");
  const nodes = Object.keys(queue);
  if (nodes.length === 0) return;

  console.log(`🔄 Attempting to sync ${nodes.length} pending items...`);
  
  for (const node of nodes) {
    try {
      await performNetworkPut(node, queue[node].data);
      // Success -> Remove from queue
      const updatedQueue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || "{}");
      delete updatedQueue[node];
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log(`✅ Synced: ${node}`);
    } catch (e) {
      console.warn(`⏳ Sync failed for ${node}, will retry later.`);
      break; // Stop and wait for next interval
    }
  }
}

// Start auto-sync interval (every 30 seconds)
setInterval(processSyncQueue, 30000);

// ─── Data Access API ───────────────────────────────────────────────────────

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
    await performNetworkPut(node, data);
  } catch (e) {
    console.warn(`⚠️ Network unreachable. Adding [${node}] to sync queue.`);
    addToSyncQueue(node, data);
  }
}

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
      // Only update local if cloud is actually reachable and newer
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
  // Sync local immediately
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
