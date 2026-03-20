import { useState, useEffect } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { hashPassword }       from "../../services/auth.js";
import { TYPES_AR }           from "../../utils/utils.js";
import { showToast }          from "../../components/ui/Toast.jsx";
const ROLES = [
  { value: "employee", label: "Ù…ÙˆØ¸Ù" },
  { value: "admin",    label: "Ù…Ø¯ÙŠØ±" },
];

function UserModal({ initial, onSave, onClose }) {
  const isEdit = !!initial;
  const [name,     setName]     = useState(initial?.name     || "");
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState(initial?.role     || "employee");
  const [farmType, setFarmType] = useState(initial?.farm_type || TYPES_AR[0]);
  const [canDelete,setCanDelete]= useState(!!initial?.canDelete);
  const [saving,   setSaving]   = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim())     { showToast("Ø£Ø¯Ø®Ù„ Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„",        "error"); return; }
    if (!username.trim()) { showToast("Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…",        "error"); return; }
    if (!isEdit && !password) { showToast("Ø£Ø¯Ø®Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±", "error"); return; }

    setSaving(true);
    try {
      const hashed = password ? await hashPassword(password) : (initial?.password || "");
      await onSave({
        username: username.trim(),
        name:     name.trim(),
        password: hashed,
        role,
        farm_type: farmType,
        canDelete: role === "admin" ? true : canDelete,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ fontSize: "1.15rem" }}>
            {isEdit ? "âœï¸ ØªØ¹Ø¯ÙŠÙ„ Ù…ÙˆØ¸Ù" : "âž• Ø¥Ø¶Ø§ÙØ© Ù…ÙˆØ¸Ù Ø¬Ø¯ÙŠØ¯"}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>âœ–</button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„ *</label>
              <input className="form-input" placeholder="Ù…Ø­Ù…Ø¯ Ø£Ø­Ù…Ø¯"
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… * {isEdit && <span className="text-muted text-xs">(Ù„Ø§ ÙŠÙ…ÙƒÙ† ØªØºÙŠÙŠØ±Ù‡)</span>}
              </label>
              <input className="form-input" placeholder="m.ahmed"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isEdit}
                style={isEdit ? { opacity: .5, cursor: "not-allowed" } : {}}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± {isEdit && <span className="text-muted text-xs">(Ø§ØªØ±ÙƒÙ‡ ÙØ§Ø±ØºØ§Ù‹ Ù„Ù„Ø¥Ø¨Ù‚Ø§Ø¡)</span>}
              </label>
              <input className="form-input" type="password"
                placeholder={isEdit ? "â€¢â€¢â€¢â€¢â€¢â€¢â€¢ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)" : "Ø£Ø¯Ø®Ù„ ÙƒÙ„Ù…Ø© Ù…Ø±ÙˆØ±"}
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0, gridColumn: "1/-1" }}>
              <label className="form-label">Ù†ÙˆØ¹ Ø§Ù„Ù…Ø²Ø±Ø¹Ø© (Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ©)</label>
              <select className="form-select" value={farmType} onChange={e => setFarmType(e.target.value)}>
                <option value="all">ÙƒÙ„ Ø§Ù„Ø£Ù†ÙˆØ§Ø¹</option>
                {TYPES_AR.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* canDelete */}
            {role !== "admin" && (
              <div className="form-group" style={{ margin: 0, gridColumn: "1/-1" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px", background:canDelete?"rgba(239,68,68,.08)":"var(--bg-tertiary)", borderRadius:"8px", border:`1px solid ${canDelete?"rgba(239,68,68,.3)":"var(--border)"}` }}>
                  <input type="checkbox" id="canDelete" checked={canDelete} onChange={e=>setCanDelete(e.target.checked)}
                    style={{ width:"18px", height:"18px", cursor:"pointer" }} />
                  <label htmlFor="canDelete" style={{ cursor:"pointer", fontWeight:"700" }}>
                    ðŸ—‘ï¸ ØµÙ„Ø§Ø­ÙŠØ© Ø­Ø°Ù Ø§Ù„Ø­Ø§Ù„Ø§Øª (Ù…Ø¹ Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø± Ù„Ù„Ù…Ø¯ÙŠØ±)
                  </label>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={saving}>
              {saving ? "â³ Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : isEdit ? "ðŸ’¾ Ø­ÙØ¸ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„Ø§Øª" : "âž• Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…ÙˆØ¸Ù"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Ø¥Ù„ØºØ§Ø¡</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: "400px", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>âš ï¸</div>
        <h3 className="font-bold" style={{ fontSize: "1.1rem", marginBottom: "8px" }}>ØªØ£ÙƒÙŠØ¯ Ø§Ù„Ø­Ø°Ù</h3>
        <p className="text-muted" style={{ marginBottom: "24px" }}>{message}</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>ðŸ—‘ï¸ Ø­Ø°Ù</button>
          <button className="btn btn-ghost"  style={{ flex: 1 }} onClick={onClose}>Ø¥Ù„ØºØ§Ø¡</button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage({ user: currentUser }) {
  const [users,   setUsers]   = useState({});
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | "add" | { edit: userData } | { delete: username }
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    loadData("users", {}).then(data => { setUsers(data); setLoading(false); });
  }, []);

  // â”€â”€â”€ Load all users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const userList = Object.entries(users)
    .map(([uname, data]) => ({ username: uname, ...data }))
    .filter(u => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return u.username?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
    });

  // â”€â”€â”€ Save user (add or edit) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleSave(userData) {
    const { username, ...rest } = userData;

    // ØªØ­Ù‚Ù‚ Ù…Ù† ØªÙƒØ±Ø§Ø± Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¹Ù†Ø¯ Ø§Ù„Ø¥Ø¶Ø§ÙØ©
    if (modal === "add" && users[username]) {
      showToast("Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…ÙˆØ¬ÙˆØ¯ Ù…Ø³Ø¨Ù‚Ø§Ù‹ âŒ", "error"); return;
    }

    const updated = { ...users, [username]: rest };
    await saveData("users", updated);
    setUsers(updated);
    setModal(null);
    showToast(modal === "add" ? "âœ… ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…ÙˆØ¸Ù" : "âœ… ØªÙ… ØªØ­Ø¯ÙŠØ« Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…ÙˆØ¸Ù", "success");
  }

  // â”€â”€â”€ Delete user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleDelete(username) {
    if (username === currentUser.username) {
      showToast("Ù„Ø§ ÙŠÙ…ÙƒÙ†Ùƒ Ø­Ø°Ù Ø­Ø³Ø§Ø¨Ùƒ Ø§Ù„Ø®Ø§Øµ âŒ", "error"); return;
    }
    const updated = { ...users };
    delete updated[username];
    await saveData("users", updated);
    setUsers(updated);
    setModal(null);
    showToast("ðŸ—‘ï¸ ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…ÙˆØ¸Ù", "success");
  }

  const ROLE_BADGE = { admin: "badge-red", employee: "badge-blue" };
  const ROLE_NAME  = { admin: "Ù…Ø¯ÙŠØ±",     employee: "Ù…ÙˆØ¸Ù"       };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">ðŸ‘¥ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†</div>
          <div className="page-subtitle">{Object.keys(users).length} Ø­Ø³Ø§Ø¨ Ù…Ø³Ø¬Ù„</div>
        </div>
        <button className="btn btn-success" onClick={() => setModal("add")}>
          âž• Ø¥Ø¶Ø§ÙØ© Ù…ÙˆØ¸Ù
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: "16px", padding: "14px 18px" }}>
        <input
          className="form-input"
          placeholder="ðŸ” Ø¨Ø­Ø« Ø¨Ø§Ù„Ø§Ø³Ù… Ø£Ùˆ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: "none", background: "transparent", padding: "0", fontSize: "1rem" }}
        />
      </div>

      {/* Users table */}
      <div className="card table-card">
        <div className="table-header-row"
          style={{ gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.5fr" }}>
          <span>Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„</span>
          <span>Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…</span>
          <span>Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©</span>
          <span>Ù†ÙˆØ¹ Ø§Ù„Ù…Ø²Ø±Ø¹Ø©</span>
          <span>Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="empty-state-icon">â³</span>
            <div>Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</div>
          </div>
        ) : userList.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">ðŸ‘¤</span>
            <div className="empty-state-title">Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…ÙˆØ¸ÙÙˆÙ†{search && " ÙÙŠ Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø«"}</div>
          </div>
        ) : (
          userList.map(u => (
            <div key={u.username} className="table-row"
              style={{ gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.5fr" }}>

              <div className="flex items-center gap-2">
                <span style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: u.role === "admin" ? "rgba(239,68,68,.2)" : "rgba(59,130,246,.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", flexShrink: 0
                }}>
                  {u.role === "admin" ? "ðŸ‘‘" : "ðŸ‘¤"}
                </span>
                <span className="font-bold">{u.name || "â€”"}</span>
                {u.username === currentUser.username && (
                  <span className="badge badge-green text-xs">Ø£Ù†Øª</span>
                )}
              </div>

              <span className="text-muted">{u.username}</span>

              <span>
                <span className={`badge ${ROLE_BADGE[u.role] || "badge-blue"}`}>
                  {ROLE_NAME[u.role] || u.role}
                </span>
              </span>

              <span className="text-sm text-muted">{u.farm_type === "all" ? "ÙƒÙ„ Ø§Ù„Ø£Ù†ÙˆØ§Ø¹" : (u.farm_type || "â€”")}</span>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setModal({ edit: u })}
                  title="ØªØ¹Ø¯ÙŠÙ„"
                >âœï¸</button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: u.username === currentUser.username ? "var(--text-muted)" : "var(--accent-red)" }}
                  onClick={() => {
                    if (u.username === currentUser.username) {
                      showToast("Ù„Ø§ ÙŠÙ…ÙƒÙ†Ùƒ Ø­Ø°Ù Ø­Ø³Ø§Ø¨Ùƒ Ø§Ù„Ø®Ø§Øµ", "error"); return;
                    }
                    setModal({ delete: u.username, name: u.name });
                  }}
                  title="Ø­Ø°Ù"
                >ðŸ—‘ï¸</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* â”€â”€â”€ Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {(modal === "add" || modal?.edit) && (
        <UserModal
          initial={modal?.edit || null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.delete && (
        <ConfirmModal
          message={`Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù…ÙˆØ¸Ù "${modal.name || modal.delete}"ØŸ Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ±Ø§Ø¬Ø¹.`}
          onConfirm={() => handleDelete(modal.delete)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
