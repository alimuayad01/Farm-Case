import { useState, useEffect, useRef } from "react";
import { clearCurrentUser } from "../../services/auth.js";

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
    { id: "messages",   icon: "🔔", label: "التنبيهات" },
    { id: "appearance", icon: "🎨", label: "المظهر" },
    ...(isAdmin ? [
      { id: "users",    icon: "👥", label: "إدارة الموظفين" },
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
