import { useState, useEffect, useMemo } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { showToast } from "../../components/ui/Toast.jsx";

// ─── مكون عرض التنبيهات للموظفين ───────────────────────────────────────────
function EmployeeNotifications({ user }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifs = async () => {
    const data = await loadData(`notifications_${user.username}`, []);
    setNotifs(data);
    setLoading(false);
  };

  const markRead = async (id) => {
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    await saveData(`notifications_${user.username}`, updated);
    setNotifs(updated);
  };

  const clearRead = async () => {
    const updated = notifs.filter(n => !n.read);
    await saveData(`notifications_${user.username}`, updated);
    setNotifs(updated);
    showToast("تم تنظيف التنبيهات المقروءة", "success");
  };

  if (loading) return <div className="empty-state">⏳ جاري التحميل...</div>;

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="page-header">
        <div>
          <div className="page-title">🔔 صندوق التنبيهات</div>
          <div className="page-subtitle">الرسائل والتوجيهات الواردة من الإدارة</div>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={clearRead} disabled={!notifs.some(n=>n.read)}>
           🗑️ تنظيف التنبيهات المقروءة
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifs.length === 0 ? (
          <div className="empty-state">📭 لا توجد تنبيهات حالياً</div>
        ) : (
          <div className="flex flex-col gap-3">
             {[...notifs].reverse().map(n => (
               <div key={n.id} className="card" onClick={() => !n.read && markRead(n.id)}
                 style={{ 
                   cursor: "pointer",
                   borderRight: `4px solid ${n.type === 'error' ? '#ef4444' : n.type === 'warning' ? '#f97316' : '#3b82f6'}`,
                   background: n.read ? "var(--bg-secondary)" : "rgba(59, 130, 246, 0.05)"
                 }}>
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">{n.title}</span>
                          {!n.read && <span className="badge badge-red" style={{ scale: "0.8" }}>جديد</span>}
                       </div>
                       <div className="text-sm opacity-90">{n.message}</div>
                       <div className="text-xs text-muted mt-2">🕒 {new Date(n.timestamp * 1000).toLocaleString("ar-IQ")}</div>
                    </div>
                    <div style={{ fontSize: "1.2rem" }}>
                       {n.type === 'error' ? '🚨' : n.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </div>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── مكون مركز الإدارة ──────────────────────────────────────────────────
function AdminMessagesCenter({ users, inbox, sentHistory, onRefresh }) {
  const [activeTab, setActiveTab] = useState("send");
  const [isGlobal, setIsGlobal] = useState(false);
  const [targetUser, setTargetUser] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [sending, setSending] = useState(false);

  const employeeList = Object.entries(users)
    .filter(([_, u]) => u.role !== "admin")
    .map(([uname, u]) => ({ username: uname, name: u.name }));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) { showToast("نص الرسالة مطلوب", "error"); return; }
    setSending(true);
    const newNotif = { id: Date.now(), title, message, type, timestamp: Date.now()/1000, read: false, by: "المدير" };
    try {
      if (isGlobal) {
        for (const uname of employeeList.map(u=>u.username)) {
           const key = `notifications_${uname}`;
           const cur = await loadData(key, []);
           await saveData(key, [...cur, newNotif]);
        }
      } else {
        const key = `notifications_${targetUser}`;
        const cur = await loadData(key, []);
        await saveData(key, [...cur, newNotif]);
      }
      const updatedSent = [...sentHistory, { ...newNotif, target: isGlobal ? "الجميع" : targetUser }];
      await saveData("admin_sent_history", updatedSent);
      showToast("🚀 تم الإرسال", "success");
      setMessage(""); setTitle(""); onRefresh();
    } catch (err) { showToast("خطأ!", "error"); }
    finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="page-header">
        <div>
          <div className="page-title">📨 مركز المراسلة الإداري</div>
          <div className="page-subtitle">إصدار التعليمات والتعميمات للموظفين</div>
        </div>
        <div className="flex gap-2 bg-tertiary p-1 rounded-md" style={{ background: "var(--bg-tertiary)", padding: "4px", borderRadius: "10px" }}>
            <button className={`btn btn-sm ${activeTab === 'send' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('send')} style={{ border: "none" }}>➕ إرسال</button>
            <button className={`btn btn-sm ${activeTab === 'inbox' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('inbox')} style={{ border: "none" }}>📥 الوارد</button>
            <button className={`btn btn-sm ${activeTab === 'sent' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('sent')} style={{ border: "none" }}>📜 التاريخ</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "send" && (
           <div className="card max-w-2xl mx-auto">
              <form onSubmit={handleSend} className="flex flex-col gap-4">
                 <div className="flex gap-4 p-2 bg-tertiary rounded" style={{ background: "var(--bg-tertiary)" }}>
                    <label className="flex-1 flex gap-2 cursor-pointer"><input type="radio" checked={!isGlobal} onChange={()=>setIsGlobal(false)}/><span>خاص</span></label>
                    <label className="flex-1 flex gap-2 cursor-pointer"><input type="radio" checked={isGlobal} onChange={()=>setIsGlobal(true)}/><span>عام 📢</span></label>
                 </div>
                 {!isGlobal && (
                    <select className="form-select" value={targetUser} onChange={e=>setTargetUser(e.target.value)}>
                       <option value="">— اختر الموظف —</option>
                       {employeeList.map(u => <option key={u.username} value={u.username}>{u.name}</option>)}
                    </select>
                 )}
                 <input className="form-input" placeholder="عنوان الرسالة" value={title} onChange={e=>setTitle(e.target.value)} />
                 <div className="flex gap-2">
                    {["info", "warning", "error"].map(t=>(
                       <button key={t} type="button" className={`flex-1 btn btn-sm ${type===t ? (t==='error'?'btn-danger':t==='warning'?'btn-orange':'btn-primary') : 'btn-ghost'}`} onClick={()=>setType(t)}>
                          {t==='info'?'ℹ️':'t==='warning'?'⚠️':'🚨'} {t}
                       </button>
                    ))}
                 </div>
                 <textarea className="form-input" rows="4" placeholder="نص التبليغ..." value={message} onChange={e=>setMessage(e.target.value)} />
                 <button className="btn btn-primary" style={{ padding: "12px", justifyContent: "center" }} disabled={sending}>🚀 إرسال</button>
              </form>
           </div>
        )}
        {activeTab === "inbox" && inbox.map(m => (
           <div key={m.id} className="card mb-3" style={{ borderRight: "4px solid red" }}>
              <div className="font-bold text-xs">طلب حذف من @{m.by}</div>
              <div className="text-sm">{m.message}</div>
           </div>
        ))}
        {activeTab === "sent" && sentHistory.map(m => (
           <div key={m.id} className="card mb-3" style={{ borderRight: "4px solid var(--border)" }}>
              <div className="font-bold text-xs">{m.title} (إلى: {m.target})</div>
              <div className="text-sm">{m.message}</div>
           </div>
        ))}
      </div>
    </div>
  );
}

// ─── المكون الرئيسي ───────────────────────────────────────────────────────
export default function MessagesPage({ user }) {
  const isAdmin = user?.role === "admin";
  const [data, setData] = useState({ inbox: [], sent: [], users: {} });
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    if (!isAdmin) return;
    const [inbox, sent, users] = await Promise.all([
      loadData("admin_notifications", []),
      loadData("admin_sent_history", []),
      loadData("users", {})
    ]);
    setData({ inbox, sent, users });
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchAdminData();
    else setLoading(false);
  }, [isAdmin]);

  if (loading) return <div className="empty-state">⏳ جاري التحميل...</div>;

  return isAdmin ? (
    <AdminMessagesCenter 
       users={data.users} 
       inbox={data.inbox} 
       sentHistory={data.sent} 
       onRefresh={fetchAdminData} 
    />
  ) : (
    <EmployeeNotifications user={user} />
  );
}
