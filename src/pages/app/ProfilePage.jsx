import { useState, useRef } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { hashPassword, setCurrentUser } from "../../services/auth.js";
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
  
  // Custom states for Name, Username, Password
  const [displayName, setDisplayName] = useState(user.name || "");
  const [username, setUsername] = useState(user.username || "");
  const [password, setPassword] = useState("");

  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState("info"); // info | notifications
  const fileRef = useRef();

  const isAdmin = user?.role === "admin";

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("الصورة أكبر من 2MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target.result;
      setAvatar(dataUrl);
      saveAvatar(user.username, dataUrl);
      showToast("✅ تم تحديث الصورة", "success");
      window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { username: user.username, avatar: dataUrl } }));
    };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    setAvatar(null);
    localStorage.removeItem(AVATAR_KEY(user.username));
    showToast("تم حذف الصورة", "info");
    window.dispatchEvent(new CustomEvent("avatar-updated", { detail: { username: user.username, avatar: null } }));
  }

  async function handleSave() {
    if (!username.trim()) { showToast("أدخل اسم المستخدم", "error"); return; }
    if (!displayName.trim()) { showToast("أدخل الاسم الكامل", "error"); return; }
    
    // Validate English username
    if (!/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
      showToast("اسم المستخدم يجب أن يكون باللغة الإنجليزية وبدون مسافات", "error"); return;
    }

    setSaving(true);
    try {
      const usersObj = await loadData("users", {});
      const userKey = user.username;
      
      let newPassHash = undefined;
      if (password) {
        newPassHash = await hashPassword(password);
      }
      
      const newUsername = username.trim();

      if (usersObj[userKey]) {
        // Prevent username collision
        if (newUsername !== userKey && usersObj[newUsername]) {
          throw new Error("اسم المستخدم الجديد محجوز مسبقاً ❌");
        }

        usersObj[userKey] = { 
          ...usersObj[userKey], 
          name: displayName.trim()
        };
        if (newPassHash) usersObj[userKey].password = newPassHash;
        
        // Handle username change:
        if (newUsername !== userKey) {
          usersObj[newUsername] = usersObj[userKey];
          delete usersObj[userKey];
          
          // update history
          let hist = await loadData("history", []);
          let histChanged = false;
          hist = hist.map(h => {
             if (h.by_user === userKey) { histChanged = true; return { ...h, by_user: newUsername }; }
             return h;
          });
          if (histChanged) await saveData("history", hist);
          
          // notifications
          let notifs = await loadData(`notifications_${userKey}`, []);
          if (notifs.length > 0) {
            await saveData(`notifications_${newUsername}`, notifs);
            await saveData(`notifications_${userKey}`, []);
          }

          // Migrate avatar/profile in local storage
          const oldAvatar = localStorage.getItem(AVATAR_KEY(userKey));
          if (oldAvatar) {
            localStorage.setItem(AVATAR_KEY(newUsername), oldAvatar);
            localStorage.removeItem(AVATAR_KEY(userKey));
          }
          const oldProfile = localStorage.getItem(PROFILE_KEY(userKey));
          if (oldProfile) {
            localStorage.setItem(PROFILE_KEY(newUsername), oldProfile);
            localStorage.removeItem(PROFILE_KEY(userKey));
          }
        }

        await saveData("users", usersObj);
        
        // Save local preferences
        saveProfile(newUsername, profile);
        
        const finalUsername = newUsername || userKey;
        const updatedUser = { ...usersObj[finalUsername], username: finalUsername };
        
        setCurrentUser(updatedUser);
        onUserUpdate(updatedUser);

        showToast("✅ تم حفظ التغييرات بنجاح", "success");
        setPassword(""); // Clear password field after successful save
      } else {
        throw new Error("لم يتم العثور على حسابك في قاعدة البيانات");
      }
    } catch (err) { 
      showToast(err.message || "❌ خطأ في الحفظ", "error"); 
    }
    setSaving(false);
  }

  const card  = { background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "20px" };
  const lbl   = { fontSize: ".72rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "4px", display: "block" };
  const input = { width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg-tertiary)", color: "var(--text-primary)", fontFamily: "var(--font-ar)", fontSize: ".9rem", outline: "none", boxSizing: "border-box", transition: "border-color .2s" };

  const initials = (displayName || user?.name || user?.username || "U").slice(0, 2).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "16px" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <span style={{ fontWeight: "900", fontSize: "1rem" }}>👤 الملف الشخصي والتعديلات</span>
        <span style={{ fontSize: ".76rem", color: "var(--text-muted)" }}>{isAdmin ? "مدير النظام" : "موظف"}</span>
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
              ✏️
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
          </div>

          <div style={{ flex: 1, minWidth: "160px" }}>
            <div style={{ fontWeight: "900", fontSize: "1.1rem" }}>{displayName || user?.name || user?.username}</div>
            <div style={{ fontSize: ".78rem", color: "var(--text-muted)", marginTop: "2px" }} dir="ltr">@{user?.username}</div>
            <div style={{ fontSize: ".72rem", color: isAdmin ? "#f59e0b" : "#22c55e", marginTop: "4px", fontWeight: "700" }}>{isAdmin ? "🛡️ مدير النظام" : "👷 موظف"}</div>
            <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
              <button type="button" onClick={() => fileRef.current?.click()}
                style={{ padding: "5px 14px", borderRadius: "7px", border: "1px solid var(--accent-blue)", background: "rgba(37,99,235,.1)", color: "var(--accent-blue)", fontSize: ".76rem", fontWeight: "700", cursor: "pointer" }}>
                📷 تغيير الصورة
              </button>
              {avatar && (
                <button type="button" onClick={removeAvatar}
                  style={{ padding: "5px 12px", borderRadius: "7px", border: "1px solid rgba(239,68,68,.4)", background: "rgba(239,68,68,.08)", color: "#ef4444", fontSize: ".76rem", fontWeight: "700", cursor: "pointer" }}>
                  🗑️ حذف
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", background: "var(--bg-secondary)", borderRadius: "10px", padding: "3px", gap: "3px", border: "1px solid var(--border)" }}>
          {[{ k: "info", l: "👤 إعدادات الحساب" }, { k: "notifications", l: "🔔 الإشعارات والأمان" }].map(({ k, l }) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              style={{ flex: 1, padding: "9px", border: "none", cursor: "pointer", borderRadius: "8px", fontFamily: "var(--font-ar)", fontSize: ".82rem", fontWeight: "700", transition: "all .2s", background: tab === k ? "var(--accent-blue)" : "transparent", color: tab === k ? "#fff" : "var(--text-muted)" }}>
              {l}
            </button>
          ))}
        </div>

        {/* ── Tab: Info ──────────────────────────────────────────────────────── */}
        {tab === "info" && (
          <div style={card}>
            <div style={{ fontWeight: "800", fontSize: ".88rem", marginBottom: "16px" }}>📝 المعلومات الشخصية وحساب الدخول</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              
              <div style={{ gridColumn: "1/-1" }}>
                <label style={lbl}>الاسم الكامل للصلاحية *</label>
                <input style={input} value={displayName} placeholder="محمد أحمد"
                  onChange={e => setDisplayName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                  onBlur={e =>  e.target.style.borderColor = "var(--border)"} />
              </div>
              
              <div>
                <label style={lbl}>اسم المستخدم للدخول *</label>
                <input style={input} value={username} dir="ltr"
                  onChange={e => setUsername(e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                  onBlur={e =>  e.target.style.borderColor = "var(--border)"} />
              </div>
              
              <div>
                <label style={lbl}>تعيين كلمة مرور جديدة</label>
                <input style={input} type="password" value={password} placeholder="••••••• (اختياري للإبقاء على الحالية)"
                  onChange={e => setPassword(e.target.value)}
                  onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                  onBlur={e =>  e.target.style.borderColor = "var(--border)"} />
              </div>
              
            </div>
          </div>
        )}

        {/* ── Tab: Notifications ─────────────────────────────────────────────── */}
        {tab === "notifications" && (
          <div style={card}>
            <div style={{ fontWeight: "800", fontSize: ".88rem", marginBottom: "16px" }}>🔔 إعدادات التنبيهات والأمان</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
              <div>
                <label style={lbl}>📞 رقم العميل (واتساب)</label>
                <input style={input} type="tel" value={profile.phone || ""} placeholder="+966XXXXXXXXX" dir="ltr"
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                  onBlur={e =>  e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={lbl}>📧 بريد العميل</label>
                <input style={input} type="email" value={profile.email || ""} placeholder="example@mail.com" dir="ltr"
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  onFocus={e => e.target.style.borderColor = "var(--accent-blue)"}
                  onBlur={e =>  e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>

            {(!profile.phone && !profile.email) && (
              <div style={{ padding: "10px 14px", background: "rgba(245,158,11,.1)", border: "1px solid #f59e0b", borderRadius: "8px", fontSize: ".78rem", color: "#f59e0b", fontWeight: "700", marginBottom: "14px" }}>
                ⚠️ أضف رقم هاتفك أو بريدك الإلكتروني أولاً لتفعيل الإشعارات الخارجية
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { key: "notif_whatsapp", label: "📱 إشعارات واتساب",   desc: "يصلك إشعار على الواتساب عند كل حالة جديدة",  require: "phone" },
                { key: "notif_email",    label: "📧 إشعارات البريد",   desc: "يصلك بريد إلكتروني عند تسجيل حالة",          require: "email" },
                { key: "notif_alert",    label: "⚠️ تنبيهات الطوارئ",  desc: "إشعار فوري عند ارتفاع/انخفاض شديد",          require: null },
                { key: "notif_summary",  label: "📊 تقرير يومي",       desc: "ملخص يومي بعدد الحالات والإحصائيات",          require: null },
              ].map(({ key, label, desc, require: req }) => {
                const disabled = req && !profile[req];
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: "10px", border: "1px solid var(--border)", opacity: disabled ? .5 : 1 }}>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: ".85rem" }}>{label}</div>
                      <div style={{ fontSize: ".72rem", color: "var(--text-muted)", marginTop: "2px" }}>{desc}</div>
                      {disabled && <div style={{ fontSize: ".68rem", color: "#f59e0b", marginTop: "2px" }}>⚠️ يتطلب {req === "phone" ? "رقم هاتف" : "بريد إلكتروني"}</div>}
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
          {saving ? "⏳ جاري الحفظ..." : "💾 حفظ التغييرات"}
        </button>
      </div>
    </div>
  );
}
