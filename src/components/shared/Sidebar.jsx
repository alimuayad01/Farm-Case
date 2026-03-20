import { useState, useEffect, useRef } from "react";
import { clearCurrentUser } from "../../core/auth.js";

const AVATAR_KEY  = u => `avatar_${u}`;
const loadAvatar  = u => localStorage.getItem(AVATAR_KEY(u)) || null;

export default function Sidebar({ user, activePage, onNavigate, onLogout }) {
  const isAdmin = user?.role === "admin";
  const [avatar,      setAvatar]      = useState(() => loadAvatar(user?.username));
  const [menuOpen,    setMenuOpen]    = useState(false);
  const menuRef = useRef();

  // Listen for avatar updates from ProfilePage
  useEffect(() => {
    const handler = e => {
      if (e.detail?.username === user?.username) setAvatar(e.detail.avatar);
    };
    window.addEventListener("avatar-updated", handler);
    return () => window.removeEventListener("avatar-updated", handler);
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const navItems = [
    ...(isAdmin ? [{ id: "dashboard",  icon: "📊", label: "نظرة عامة" }] : []),
    { id: "case",       icon: "➕", label: "تسجيل حالة" },
    { id: "history",    icon: "📋", label: "السجل" },
    { id: "appearance", icon: "🎨", label: "المظهر" },
    ...(isAdmin ? [
      { id: "users",    icon: "👥", label: "إدارة الموظفين" },
      { id: "messages", icon: "📨", label: "التحذيرات والرسائل" },
      { id: "settings", icon: "⚙️", label: "الإعدادات" },
    ] : []),
  ];

  function handleLogout() { clearCurrentUser(); onLogout(); }

  const initials = (user?.name || user?.username || "U").slice(0, 2).toUpperCase();

  return (
    <nav className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🏡</span>
        <div>
          <div className="sidebar-brand-title">Farm Case</div>
          <div className="sidebar-brand-sub">{isAdmin ? "لوحة تحكم المدير" : "نظام المتابعة"}</div>
        </div>
      </div>

      {/* ── Profile Avatar Button ─────────────────────────────────────────── */}
      <div ref={menuRef} style={{ position: "relative", margin: "0 12px 8px", flexShrink: 0 }}>
        <button type="button" onClick={() => setMenuOpen(v => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border)", background: menuOpen ? "var(--bg-tertiary)" : "var(--bg-secondary)", cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
          onMouseLeave={e => e.currentTarget.style.background = menuOpen ? "var(--bg-tertiary)" : "var(--bg-secondary)"}>

          {/* Avatar */}
          <div style={{ width: "38px", height: "38px", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--accent-blue)", flexShrink: 0 }}>
            {avatar
              ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: ".85rem", fontWeight: "900" }}>{initials}</div>}
          </div>

          {/* Name & Role */}
          <div style={{ flex: 1, textAlign: "right", minWidth: 0 }}>
            <div style={{ fontWeight: "800", fontSize: ".82rem", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.name || user?.username}
            </div>
            <div style={{ fontSize: ".68rem", color: isAdmin ? "#f59e0b" : "#22c55e", fontWeight: "700" }}>
              {isAdmin ? "🛡️ مدير" : "👷 موظف"}
            </div>
          </div>

          {/* Chevron */}
          <span style={{ color: "var(--text-muted)", fontSize: ".7rem", transition: "transform .2s", transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▲</span>
        </button>

        {/* ── Dropdown Menu ─────────────────────────────────────────────────── */}
        {menuOpen && (
          <div style={{ position: "absolute", bottom: "calc(100% + 6px)", left: 0, right: 0, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "12px", boxShadow: "var(--shadow-lg)", overflow: "hidden", zIndex: 50 }}>
            {/* Profile header */}
            <div style={{ padding: "12px 14px", background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontWeight: "800", fontSize: ".8rem" }}>{user?.name || user?.username}</div>
              <div style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: "2px" }}>@{user?.username}</div>
            </div>

            {/* Menu items */}
            {[
              { icon: "👤", label: "الملف الشخصي",   id: "profile" },
              { icon: "🎨", label: "المظهر",         id: "appearance" },
              ...(isAdmin ? [{ icon: "⚙️", label: "الإعدادات", id: "settings" }] : []),
            ].map(item => (
              <button key={item.id} type="button" onClick={() => { onNavigate(item.id); setMenuOpen(false); }}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", border: "none", background: "transparent", color: "var(--text-primary)", fontFamily: "var(--font-ar)", fontSize: ".82rem", fontWeight: "700", cursor: "pointer", textAlign: "right", borderBottom: "1px solid var(--border)", transition: "background .15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span>{item.icon}</span><span>{item.label}</span>
              </button>
            ))}

            {/* Logout */}
            <button type="button" onClick={() => { setMenuOpen(false); handleLogout(); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", border: "none", background: "transparent", color: "#ef4444", fontFamily: "var(--font-ar)", fontSize: ".82rem", fontWeight: "700", cursor: "pointer", textAlign: "right", transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span>🚪</span><span>تسجيل الخروج</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="sidebar-nav">
        {navItems.map(item => (
          <button key={item.id} id={`nav-${item.id}`}
            className={`sidebar-nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => onNavigate(item.id)}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
