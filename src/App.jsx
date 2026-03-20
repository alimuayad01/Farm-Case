import { useState, useEffect } from "react";
import "./index.css";

import { getCurrentUser } from "./services/auth.js";
import LoginPage   from "./pages/auth/LoginPage.jsx";
import Sidebar     from "./components/layout/Sidebar.jsx";
import ToastContainer from "./components/ui/Toast.jsx";

// â”€â”€â”€ Pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import CasePage       from "./pages/app/CasePage.jsx";
import HistoryPage    from "./pages/app/HistoryPage.jsx";
import UsersPage      from "./pages/admin/UsersPage.jsx";
import MessagesPage      from "./pages/admin/MessagesPage.jsx";
import SettingsPage      from "./pages/admin/SettingsPage.jsx";
import PersonalSettingsPage from "./pages/app/PersonalSettingsPage.jsx";
import ProfilePage           from "./pages/app/ProfilePage.jsx";

export default function App() {
  const [user,       setUser]       = useState(getCurrentUser);
  const [activePage, setActivePage] = useState(null);

  // ØªØ­Ø¯ÙŠØ¯ Ø§Ù„ØµÙØ­Ø© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„Ù‰ Ø§Ù„Ø¯ÙˆØ±
  useEffect(() => {
    if (!user) return;
    setActivePage(user.role === "admin" ? "dashboard" : "case");
  }, [user]);

  function handleLogin(u) { setUser(u); }
  function handleLogout()  { setUser(null); setActivePage(null); }

  // â”€â”€â”€ ØºÙŠØ± Ù…Ø³Ø¬Ù‘Ù„ Ø¯Ø®ÙˆÙ„ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!user) return (
    <>
      <LoginPage onLogin={handleLogin} />
      <ToastContainer />
    </>
  );

  // â”€â”€â”€ Page Renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
