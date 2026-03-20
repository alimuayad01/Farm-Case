import { useState, useRef } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { showToast } from "../../components/ui/Toast.jsx";

const AVATAR_KEY = u => `avatar_${u}`;
const PROFILE_KEY = u => `profile_${u}`;

function loadProfile(username) {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY(username)) || "{}"); } catch { return {}; }
}
function saveProfile(username, data) {
  localStorage.setItem(PROFILE_KEY(username), JSON.stringify(data));
}
function loadAvatar(username) {
  return localStorage.getItem(AVATAR_KEY(username)) || null;
}
function saveAvatar(username, dataUrl) {
  localStorage.setItem(AVATAR_KEY(username), dataUrl);
}

export default function ProfilePage({ user, onUserUpdate }) {
  const [profile, setProfile] = useState(() => loadProfile(user.username));
  const [avatar,  setAvatar]  = useState(() => loadAvatar(user.username));
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState("info"); // info | notifications
  const fileRef = useRef();

  const isAdmin = user?.role === "admin";

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Ø§Ù„ØµÙˆØ±Ø© Ø£ÙƒØ¨Ø± Ù…Ù† 2MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      setAvatar(dataUrl);
      saveAvatar(user.username, dataUrl);
      showToast("âœ… ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„ØµÙˆØ±Ø©", "success");
      // Notify parent
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { username: user.username, avatar: dataUrl } }));
    };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    setAvatar(null);
    localStorage.removeItem(AVATAR_KEY(user.username));
    showToast("ØªÙ… Ø­Ø°Ù Ø§Ù„ØµÙˆØ±Ø©", "info");
    window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { username: user.username, avatar: null } }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Save to localStorage
      saveProfile(user.username, profile);
      // Also update in Firebase users list (if admin we update there too)
      const users = await loadData("users", []);
      const idx = users.findIndex(u => u.username === user.username);
      if (idx >= 0) {
        users[idx] = { ...users[idx], phone: profile.phone || "", email: profile.email || "", displayName: profile.displayName || "" };
        await saveData("users", users);
      }
      showToast("âœ… ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª", "success");
    } catch { showToast("âŒ Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø­ÙØ¸", "error"); }
    setSaving(false);
  }

  const card  = { background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "20px" };
  const lbl   = { fontSize: ".72rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px", display: "block" };
  const input = { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontFamily: "var(--font-ar)", fontSize: ".9rem", outline: "none", boxSizing: "border-box", transition: "border-color .2s" };

  const initials = (profile.displayName || user?.name || user?.username || "U").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px" }}>

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <span style={{ fontWeight: "900", fontSize: "1rem" }}>ðŸ‘¤ Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ</span>
        <span style={{ fontSize: ".76rem", color: "var(--text-muted)" }}>{isAdmin ? "Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…" : "Ù…ÙˆØ¸Ù"}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px", overflow: "auto" }}>

        {/* Avatar card */}
        <div style={{ ...card, display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          {/* Avatar display */}
          <div style={{ position: "relative" }}>
            <div style={{ width: "88px", height: "88px", borderRadius: "50%", overflow: "hidden", border: "3px solid var(--accent-blue)", boxShadow: "0 0 20px rgba(37,99,235,.3)", flexShrink: 0 }}>
              {avatar
                ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "1.8rem", fontWeight: "900" }}>{initials}</div>}
            </div>
            {/* Edit overlay */}
            <button type="button" onClick={() => fileRef.current?.click()}
              style={{ position: "absolute", bottom: "0", right: "0", width: "26px", height: "26px", borderRadius: "50%", border: "2px solid var(--bg-secondary)", background: "var(--accent-blue)", color: "#fff", fontSize: ".75rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              âœï¸
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
          </div>

          <div style={{ flex: 1, minWidth: "160px" }}>
            <div style={{ fontWeight: "900", fontSize: "1.1rem" }}>{profile.displayName || user?.name || user?.username}</div>
            <div style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: "2px" }}>@{user?.username}</div>
            <div style={{ fontSize: ".72rem", color: isAdmin ? "#f59e0b" : "#22c55e", marginTop: "4px", fontWeight: "700" }}>{isAdmin ? "ðŸ›¡ï¸ Ù…Ø¯ÙŠØ± Ø§Ù„Ù†Ø¸Ø§Ù…" : "ðŸ‘· Ù…ÙˆØ¸Ù"}</div>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ padding: "5px 14px", borderRadius: "7px", border: "1px solid var(--accent-blue)", background: "rgba(37,99,235,.1)", color: "var(--accent-blue)", fontSize: ".76rem", fontWeight: "700", cursor: "pointer" }}>
                ðŸ“· ØªØºÙŠÙŠØ± Ø§Ù„ØµÙˆØ±Ø©
              </button>
              {avatar && (
                <button type="button" onClick={removeAvatar}
                  style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid rgba(239,68,68,.4)", background: "rgba(239,68,68,.08)", color: "#ef4444", fontSize: ".76rem", fontWeight: "700", cursor: "pointer" }}>
                  ðŸ—‘ï¸ Ø­Ø°Ù
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: "10px", padding: "3px", gap: "3px", border: "1px solid var(--border)" }}>
          {[{ k: "info", l: "ðŸ‘¤ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ©" }, { k: "notifications", l: "ðŸ”” Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª" }].map(({ k, l }) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              style={{ flex: 1, padding: "9px", border: "none", cursor: "pointer", borderRadius: "8px", fontFamily: "var(--font-ar)", fontSize: ".82rem", fontWeight: "700", transition: "all .2s", background: tab === k ? "var(--accent-blue)" : "transparent", color: tab === k ? "#fff" : "var(--text-muted)" }}>
              {l}
            </button>
          ))}
        </div>

        {/* â”€â”€ Tab: Info â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {tab === "info" && (
          <div style={card}>
            <div style={{ fontWeight: "800", fontSize: ".88rem", marginBottom: "16px" }}>ðŸ“ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ©</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={lbl}>Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„</label>
                <input style={input} value={profile.displayName || ""} placeholder="Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„"
                  onChange={e => setProfile(p => ({ ...p, displayName: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                  onBlur={e =>  e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={lbl}>Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…</label>
                <input style={{ ...input, opacity: .6 }} value={user?.username || ""} disabled />
              </div>
              <div>
                <label style={lbl}>ðŸ“ž Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ</label>
                <input style={input} type="tel" value={profile.phone || ""} placeholder="+966XXXXXXXXX" dir="ltr"
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                  onBlur={e =>  e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={lbl}>ðŸ“§ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</label>
                <input style={input} type="email" value={profile.email || ""} placeholder="example@mail.com" dir="ltr"
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                  onBlur={e =>  e.target.style.borderColor = "var(--border)"} />
              </div>
              {isAdmin && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={lbl}>ðŸ­ Ù†ÙˆØ¹ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠ</label>
                  <select style={{ ...input, cursor: "pointer" }} value={profile.farmType || ""}
                    onChange={e => setProfile(p => ({ ...p, farmType: e.target.value }))}>
                    <option value="">â€” Ø§Ø®ØªØ± â€”</option>
                    <option value="Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)">Ù…Ø²Ø±Ø¹Ø© (ØªØ³Ù…ÙŠÙ†)</option>
                    <option value="Ù…Ø²Ø±Ø¹Ø© (Ø¨ÙŠØ§Ø¶)">Ù…Ø²Ø±Ø¹Ø© (Ø¨ÙŠØ§Ø¶)</option>
                    <option value="Ø¨ÙŠØª Ø£Ø¨Ù‚Ø§Ø±">Ø¨ÙŠØª Ø£Ø¨Ù‚Ø§Ø±</option>
                    <option value="Ø­Ø¸ÙŠØ±Ø© Ø£ØºÙ†Ø§Ù…">Ø­Ø¸ÙŠØ±Ø© Ø£ØºÙ†Ø§Ù…</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* â”€â”€ Tab: Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {tab === "notifications" && (
          <div style={card}>
            <div style={{ fontWeight: "800", fontSize: ".88rem", marginBottom: "16px" }}>ðŸ”” Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª</div>

            {(!profile.phone && !profile.email) && (
              <div style={{ padding: "10px 14px", background: "rgba(245,158,11,.1)", border: "1px solid #f59e0b", borderRadius: "8px", fontSize: ".78rem", color: "#f59e0b", fontWeight: "700", marginBottom: "14px" }}>
                âš ï¸ Ø£Ø¶Ù Ø±Ù‚Ù… Ù‡Ø§ØªÙÙƒ Ø£Ùˆ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø£ÙˆÙ„Ø§Ù‹ Ù…Ù† ØªØ¨ÙˆÙŠØ¨ Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø´Ø®ØµÙŠØ© Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "notif_whatsapp", label: "ðŸ“± Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙˆØ§ØªØ³Ø§Ø¨",   desc: "ÙŠØµÙ„Ùƒ Ø¥Ø´Ø¹Ø§Ø± Ø¹Ù„Ù‰ Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ø¹Ù†Ø¯ ÙƒÙ„ Ø­Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©",  require: "phone" },
                { key: "notif_email",    label: "ðŸ“§ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ø¨Ø±ÙŠØ¯",   desc: "ÙŠØµÙ„Ùƒ Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ø¹Ù†Ø¯ ØªØ³Ø¬ÙŠÙ„ Ø­Ø§Ù„Ø©",          require: "email" },
                { key: "notif_alert",    label: "âš ï¸ ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ø·ÙˆØ§Ø±Ø¦",  desc: "Ø¥Ø´Ø¹Ø§Ø± ÙÙˆØ±ÙŠ Ø¹Ù†Ø¯ Ø§Ø±ØªÙØ§Ø¹/Ø§Ù†Ø®ÙØ§Ø¶ Ø´Ø¯ÙŠØ¯",          require: null },
                { key: "notif_summary",  label: "ðŸ“Š ØªÙ‚Ø±ÙŠØ± ÙŠÙˆÙ…ÙŠ",       desc: "Ù…Ù„Ø®Øµ ÙŠÙˆÙ…ÙŠ Ø¨Ø¹Ø¯Ø¯ Ø§Ù„Ø­Ø§Ù„Ø§Øª ÙˆØ§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª",          require: null },
              ].map(({ key, label, desc, require: req }) => {
                const disabled = req && !profile[req];
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: "10px", border: "1px solid var(--border)", opacity: disabled ? .5 : 1 }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: ".85rem" }}>{label}</div>
                      <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</div>
                      {disabled && <div style={{ fontSize: ".68rem", color: "#f59e0b", marginTop: "2px" }}>âš ï¸ ÙŠØªØ·Ù„Ø¨ {req === "phone" ? "Ø±Ù‚Ù… Ù‡Ø§ØªÙ" : "Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ"}</div>}
                    </div>
                    {/* Toggle switch */}
                    <div onClick={() => !disabled && setProfile(p => ({ ...p, [key]: !p[key] }))}
                      style={{ width: "44px", height: "24px", borderRadius: "100px", background: !disabled && profile[key] ? "var(--accent-blue)" : "var(--bg-secondary)", border: "1px solid var(--border)", position: "relative", cursor: disabled ? "not-allowed" : "pointer", transition: "background .25s", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: "3px", left: !disabled && profile[key] ? "22px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left .25s", boxShadow: "0 1px 4px rgba(0,0,0,.3)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button type="button" disabled={saving} onClick={handleSave}
          style={{ padding: "12px", borderRadius: "var(--radius-md)", border: "none", background: saving ? "var(--bg-tertiary)" : "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", fontFamily: "var(--font-ar)", fontSize: ".92rem", fontWeight: "800", cursor: saving ? "not-allowed" : "pointer", flexShrink: 0, boxShadow: saving ? "none" : "0 4px 16px rgba(37,99,235,.3)", transition: "all .2s" }}>
          {saving ? "â³ Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..." : "ðŸ’¾ Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª"}
        </button>
      </div>
    </div>
  );
}
