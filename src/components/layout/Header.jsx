import { useState, useEffect, useRef } from "react";
import { clearCurrentUser } from "../../services/auth.js";
import { loadData, saveData } from "../../services/firebase.js";
import { showToast } from "../ui/Toast.jsx";

const AVATAR_KEY  = u => `avatar_${u}`;
const loadAvatar  = u => localStorage.getItem(AVATAR_KEY(u)) || null;

export default function Header({ user, onNavigate, onLogout }) {
  const isAdmin = user?.role === "admin";
  const [avatar, setAvatar] = useState(() => loadAvatar(user?.username));
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const menuRef = useRef();
  const notifRef = useRef();

  useEffect(() => {
    const handler = e => { if (e.detail?.username === user?.username) setAvatar(e.detail.avatar); };
    window.addEventListener("avatar-updated", handler);
    return () => window.removeEventListener("avatar-updated", handler);
  }, [user]);

  useEffect(() => {
    const handler = e => { 
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); 
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll for notifications
  useEffect(() => {
    if (!user?.username) return;
    const fetchNotifs = async () => {
      let notifs = [];
      if (isAdmin) {
        // Admins get system notifications (e.g. deletion requests)
        notifs = await loadData("admin_notifications", []);
      } else {
        // Users get their own notifications
        notifs = await loadData(`notifications_${user.username}`, []);
      }
      
      setNotifications(prev => {
        // Show toast for new unread notifs
        const newNotifs = notifs.filter(n => !n.read && !prev.some(p => p.id === n.id));
        newNotifs.forEach(n => showToast(`🔔 ${n.message}`, "info"));
        return notifs;
      });
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 3000); // Check every 3 seconds (local storage is fast)
    return () => clearInterval(interval);
  }, [user, isAdmin]);

  async function markNotifsRead() {
    if (!notifications.some(n => !n.read)) return;
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    if (isAdmin) {
      await saveData("admin_notifications", updated);
    } else {
      await saveData(`notifications_${user.username}`, updated);
    }
  }

  function handleLogout() { clearCurrentUser(); onLogout(); }

  const initials = (user?.name || user?.username || "U").slice(0, 2).toUpperCase();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="app-header">
      <div className="header-spacer"></div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        
        {/* ── Notifications ─────────────────────────────────────────────────── */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button type="button" 
            onClick={() => { setNotifOpen(!notifOpen); if(!notifOpen) markNotifsRead(); }}
            style={{ position: "relative", background: "var(--bg-tertiary)", border: "1px solid var(--border)", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.1rem", transition: "all .2s" }}>
            🔔
            {unreadCount > 0 && (
              <span style={{ position: "absolute", top: "-2px", right: "-2px", background: "#ef4444", color: "#fff", fontSize: ".6rem", fontWeight: "900", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px var(--bg-secondary)" }}>
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="header-dropdown" style={{ minWidth: "280px", maxWidth: "320px", left: "0" }}>
              <div className="header-dropdown-header">
                <div className="header-dropdown-name">🔔 الإشعارات</div>
              </div>
              <div className="header-dropdown-body" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                   <div style={{ padding: "16px", textAlign: "center", fontSize: ".8rem", color: "var(--text-muted)" }}>لا توجد إشعارات</div>
                ) : (
                   [...notifications].reverse().map((n, i) => (
                     <div key={i} style={{ padding: "10px", borderBottom: i < notifications.length - 1 ? "1px solid var(--bg-tertiary)" : "none", fontSize: ".8rem" }}>
                       <div style={{ fontWeight: "700", color: n.type === "rejection" ? "#ef4444" : "var(--accent-blue)", marginBottom: "4px" }}>
                         {n.message}
                       </div>
                       {n.farm && <div style={{ fontSize: ".7rem", color: "var(--text-muted)" }}>مزرعة: {n.farm} - حظيرة: {n.house}</div>}
                       {n.date && <div style={{ fontSize: ".65rem", color: "var(--text-muted)", marginTop: "2px" }}>{n.date} {n.time}</div>}
                     </div>
                   ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Profile Avatar Button ─────────────────────────────────────────── */}
        <div ref={menuRef} className="header-profile-menu">
          <button type="button" className="header-profile-btn" onClick={() => setMenuOpen(v => !v)}>
            <div className="header-avatar">
              {avatar
                ? <img src={avatar} alt="avatar" />
                : <div className="header-avatar-fallback">{initials}</div>}
            </div>
            <div className="header-user-info">
              <div className="header-user-name">{user?.name || user?.username}</div>
              <div className="header-user-role">{isAdmin ? "🛡️ مدير" : "👷 موظف"}</div>
            </div>
            <span className="header-chevron" style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
          </button>

          {/* ── Dropdown Menu ─────────────────────────────────────────────────── */}
          {menuOpen && (
            <div className="header-dropdown">
              <div className="header-dropdown-header">
                <div className="header-dropdown-name">{user?.name || user?.username}</div>
                <div className="header-dropdown-username">@{user?.username}</div>
              </div>

              <div className="header-dropdown-body">
                {[
                  { icon: "👤", label: "الملف الشخصي",   id: "profile" },
                  { icon: "🎨", label: "المظهر",         id: "appearance" },
                  ...(isAdmin ? [{ icon: "⚙️", label: "الإعدادات", id: "settings" }] : []),
                ].map(item => (
                  <button key={item.id} type="button" className="header-dropdown-item" onClick={() => { onNavigate(item.id); setMenuOpen(false); }}>
                    <span>{item.icon}</span><span>{item.label}</span>
                  </button>
                ))}
                
                <button type="button" className="header-dropdown-item logout" onClick={() => { setMenuOpen(false); handleLogout(); }}>
                  <span>🚪</span><span>تسجيل الخروج</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
