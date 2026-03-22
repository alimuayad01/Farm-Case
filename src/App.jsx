import { useState, useEffect } from "react";
import "./index.css";

import { getCurrentUser } from "./services/auth.js";
import LoginPage   from "./pages/auth/LoginPage.jsx";
import Sidebar     from "./components/layout/Sidebar.jsx";
import ToastContainer from "./components/ui/Toast.jsx";

import Header from "./components/layout/Header.jsx";

// ─── Pages ─────────────────────────────────────────────────────────────────
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import CasePage       from "./pages/app/CasePage.jsx";
import HistoryPage    from "./pages/app/HistoryPage.jsx";
import SheetQueuePage  from "./pages/app/SheetQueuePage.jsx";
import UsersPage      from "./pages/admin/UsersPage.jsx";
import MessagesPage      from "./pages/admin/MessagesPage.jsx";
import SettingsPage      from "./pages/admin/SettingsPage.jsx";
import TemplatesPage      from "./pages/admin/TemplatesPage.jsx";
import PersonalSettingsPage from "./pages/app/PersonalSettingsPage.jsx";
import ProfilePage           from "./pages/app/ProfilePage.jsx";

export default function App() {
  const [user,       setUser]       = useState(getCurrentUser);
  const [activePage, setActivePage] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      case "sheet":     return <SheetQueuePage    user={user} />;
      case "users":     return <UsersPage      user={user} />;
      case "messages":  return <MessagesPage   user={user} />;
      case "templates": return <TemplatesPage   user={user} />;
      case "settings":  return <SettingsPage    user={user} />;
      case "appearance":return <PersonalSettingsPage user={user} />;
      case "profile":   return <ProfilePage           user={user} onUserUpdate={setUser} />;
      default:          return null;
    }
  }

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar
        user={user}
        activePage={activePage}
        onNavigate={(p) => { setActivePage(p); setSidebarOpen(false); }}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
      />
      <div className="main-content">
        <Header 
          user={user} 
          onNavigate={setActivePage} 
          onLogout={handleLogout} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="page-content">
          <div key={activePage} className="page-transition">
            {renderPage()}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
