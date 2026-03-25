import { useState, useEffect, useRef } from "react";
import { clearCurrentUser } from "../../services/auth.js";

const AVATAR_KEY  = u => `avatar_${u}`;
const loadAvatar  = u => localStorage.getItem(AVATAR_KEY(u)) || null;

export default function Sidebar({ user, activePage, onNavigate, onLogout, isOpen }) {
  const isAdmin = user?.role === "admin";
  const [avatar, setAvatar] = useState(() => loadAvatar(user?.username));

  // Listen for avatar updates
  useEffect(() => {
    const handler = e => {
      if (e.detail?.username === user?.username) setAvatar(e.detail.avatar);
    };
    window.addEventListener("avatar-updated", handler);
    return () => window.removeEventListener("avatar-updated", handler);
  }, [user]);

  const navItems = [
    ...(isAdmin ? [{ id: "dashboard",  icon: "📊", label: "نظرة عامة" }] : []),
    { id: "case",       icon: "➕", label: "تسجيل حالة" },
    { id: "history",    icon: "📋", label: "السجل" },
    { id: "sheet",      icon: "📊", label: "تاريخ الحالات" },
    { id: "messages",   icon: "🔔", label: "التنبيهات" },
    { id: "appearance", icon: "🎨", label: "المظهر" },
    ...(isAdmin ? [
      { id: "users",    icon: "👥", label: "إدارة الموظفين" },
      { id: "templates", icon: "📝", label: "إدارة الكلائش" },
      { id: "settings", icon: "⚙️", label: "الإعدادات" },
    ] : []),
  ];

  return (
    <nav className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🏡</span>
        <div>
          <div className="sidebar-brand-title">نظام تشخيص حالات الحظائر</div>
          <div className="sidebar-brand-sub">شركة سما كربلاء - قسم المتابعة الالكترونية</div>
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
      
      {/* Sidebar Footer (Optional Info) */}
      <div className="sidebar-footer" style={{ padding: "20px", borderTop: "1px solid var(--border)", fontSize: "0.7rem", color: "var(--text-muted)" }}>
         v1.2.0 - Local Edition
      </div>
    </nav>
  );
}
