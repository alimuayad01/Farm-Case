import { useState, useEffect } from "react";
import "./index.css";

import { getCurrentUser } from "./core/auth.js";
import LoginPage   from "./components/LoginPage.jsx";
import Sidebar     from "./components/shared/Sidebar.jsx";
import ToastContainer from "./components/shared/Toast.jsx";

// ─── Pages ─────────────────────────────────────────────────────────────────
import AdminDashboard from "./components/admin/AdminDashboard.jsx";
import CasePage       from "./components/app/CasePage.jsx";
import HistoryPage    from "./components/app/HistoryPage.jsx";
import UsersPage      from "./components/admin/UsersPage.jsx";
import MessagesPage      from "./components/admin/MessagesPage.jsx";
import SettingsPage      from "./components/admin/SettingsPage.jsx";
import PersonalSettingsPage from "./components/app/PersonalSettingsPage.jsx";
import ProfilePage           from "./components/app/ProfilePage.jsx";

export default function App() {
  const [user,       setUser]       = useState(getCurrentUser);
  const [activePage, setActivePage] = useState(null);

  // تحديد الصفحة الافتراضية بناءً على الدور
  useEffect(() => {
    if (!user) return;
    setActivePage(user.role === "admin" ? "dashboard" : "case");
  }, [user]);

  function handleLogin(u) { setUser(u); }
  function handleLogout()  { setUser(null); setActivePage(null); }

  // ─── غير مسجّل دخول ─────────────────────────────────────────────────────
  if (!user) return (
    <>
      <LoginPage onLogin={handleLogin} />
      <ToastContainer />
    </>
  );

  // ─── Page Renderer ───────────────────────────────────────────────────────
  function renderPage() {
    switch (activePage) {
      case "dashboard": return <AdminDashboard user={user} />;
      case "case":      return <CasePage       user={user} />;
      case "history":   return <HistoryPage    user={user} />;
      case "users":     return <UsersPage      user={user} />;
      case "messages":  return <MessagesPage   user={user} />;
      case "settings":  return <SettingsPage    user={user} />;
      case "appearance":return <PersonalSettingsPage user={user} />;
      case "profile":   return <ProfilePage           user={user} onUserUpdate={setUser} />;
      default:          return null;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
      />
      <div className="main-content">
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
