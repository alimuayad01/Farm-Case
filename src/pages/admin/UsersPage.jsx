import { useState, useEffect } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { hashPassword }       from "../../services/auth.js";
import { TYPES_AR }           from "../../utils/utils.js";
import { showToast }          from "../../components/ui/Toast.jsx";

const ROLES = [
  { value: "employee", label: "موظف" },
  { value: "admin",    label: "مدير" },
];

function MessageModal({ user, onSend, onClose }) {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    setSending(true);
    await onSend(user.username, msg);
    setSending(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: "450px" }}>
        <h2 className="font-bold mb-4">✉️ إرسال رسالة إلى @{user.username}</h2>
        <form onSubmit={handleSend}>
          <textarea 
            className="form-input" 
            placeholder="اكتب رسالتك هنا..." 
            rows="4" 
            value={msg} 
            onChange={e => setMsg(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 btn btn-primary" disabled={sending}>
              {sending ? "⏳ جاري الإرسال..." : "🚀 إرسال الآن"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserModal({ initial, onSave, onClose }) {
  const isEdit = !!initial;
  const [name,     setName]     = useState(initial?.name     || "");
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState(initial?.role     || "employee");
  const [farmType, setFarmType] = useState(initial?.farm_type || "all");
  const [canDelete,setCanDelete]= useState(!!initial?.canDelete);
  const [saving,   setSaving]   = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim())     { showToast("أدخل الاسم الكامل",        "error"); return; }
    if (!username.trim()) { showToast("أدخل اسم المستخدم",        "error"); return; }
    if (!isEdit && !password) { showToast("أدخل كلمة المرور", "error"); return; }
    
    if (!/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
      showToast("اسم المستخدم يجب أن يكون باللغة الإنجليزية وبدون مسافات", "error"); return;
    }

    setSaving(true);
    try {
      const hashed = password ? await hashPassword(password) : (initial?.password || "");
      await onSave({
        oldUsername: initial?.username,
        username: username.trim(),
        name:     name.trim(),
        password: hashed,
        role,
        farm_type: farmType,
        canDelete: role === "admin" ? true : canDelete,
      });
    } catch (err) {
      if(err.message) showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ fontSize: "1.15rem" }}>
            {isEdit ? "✏️ تعديل موظف" : "➕ إضافة موظف جديد"}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✖</button>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">الاسم الكامل *</label>
              <input className="form-input" placeholder="مثال: محمد أحمد"
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">اسم المستخدم *</label>
              <input className="form-input" placeholder="m.ahmed" dir="ltr"
                value={username} onChange={e => setUsername(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                كلمة المرور {isEdit && <span className="text-muted text-xs">(اتركه فارغاً للإبقاء)</span>}
              </label>
              <input className="form-input" type="password"
                placeholder={isEdit ? "••••••• (اختياري)" : "أدخل كلمة مرور"}
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">الصلاحية</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0, gridColumn: "1/-1" }}>
              <label className="form-label">نوع المزرعة (الافتراضي)</label>
              <select className="form-select" value={farmType} onChange={e => setFarmType(e.target.value)}>
                <option value="all">كل الأنواع والمزارع</option>
                {TYPES_AR.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {role !== "admin" && (
              <div className="form-group" style={{ margin: 0, gridColumn: "1/-1" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px", background:canDelete?"rgba(239,68,68,.08)":"var(--bg-tertiary)", borderRadius:"8px", border:`1px solid ${canDelete?"rgba(239,68,68,.3)":"var(--border)"}` }}>
                  <input type="checkbox" id="canDelete" checked={canDelete} onChange={e=>setCanDelete(e.target.checked)}
                    style={{ width:"18px", height:"18px", cursor:"pointer" }} />
                  <label htmlFor="canDelete" style={{ cursor:"pointer", fontWeight:"700" }}>
                    🗑️ صلاحية حذف الحالات من السجل
                  </label>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={saving}>
              {saving ? "⏳ جاري الحفظ..." : isEdit ? "💾 حفظ التعديلات" : "➕ إضافة الموظف"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: "400px", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>⚠️</div>
        <h3 className="font-bold" style={{ fontSize: "1.1rem", marginBottom: "8px" }}>تأكيد الحذف</h3>
        <p className="text-muted" style={{ marginBottom: "24px" }}>{message}</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>🗑️ حذف</button>
          <button className="btn btn-ghost"  style={{ flex: 1 }} onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage({ user: currentUser }) {
  const [users,   setUsers]   = useState({});
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null| "add" | { edit: u } | { delete: u } | { msg: u }
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    loadData("users", {}).then(data => { setUsers(data); setLoading(false); });
  }, []);

  const userList = Object.entries(users)
    .map(([uname, data]) => ({ username: uname, ...data }))
    .filter(u => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return u.username?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
    });

  async function handleSave(userData) {
    const { username, oldUsername, ...rest } = userData;
    if (modal === "add" && users[username]) throw new Error("اسم المستخدم موجود مسبقاً ❌");
    if (modal?.edit && oldUsername !== username && users[username]) throw new Error("اسم المستخدم الجديد محجوز مسبقاً ❌");

    const updated = { ...users };
    if (modal?.edit && oldUsername && oldUsername !== username) {
      delete updated[oldUsername];
      let hist = await loadData("history", []);
      hist = hist.map(h => h.by_user === oldUsername ? { ...h, by_user: username } : h);
      await saveData("history", hist);
      let notifs = await loadData(`notifications_${oldUsername}`, []);
      if (notifs.length > 0) {
        await saveData(`notifications_${username}`, notifs);
        await saveData(`notifications_${oldUsername}`, []);
      }
    }
    updated[username] = rest;
    await saveData("users", updated);
    setUsers(updated);
    setModal(null);
    showToast("✅ تم الحفظ بنجاح", "success");
    if (oldUsername === currentUser.username || username === currentUser.username) window.location.reload();
  }

  async function handleDelete(username) {
    const updated = { ...users };
    delete updated[username];
    await saveData("users", updated);
    setUsers(updated);
    setModal(null);
    showToast("🗑️ تم حذف الموظف", "success");
  }

  async function sendDirectMessage(username, message) {
    const key = `notifications_${username}`;
    const old = await loadData(key, []);
    await saveData(key, [...old, {
      id: Date.now(),
      type: "info",
      message: message,
      title: "رسالة من المدير",
      timestamp: Date.now() / 1000,
      read: false
    }]);
    showToast("🚀 تم إرسال الرسالة", "success");
  }

  const ROLE_BADGE = { admin: "badge-red", employee: "badge-blue" };
  const ROLE_NAME  = { admin: "مدير",     employee: "موظف"       };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">👥 إدارة الموظفين</div>
          <div className="page-subtitle">{Object.keys(users).length} حساب مسجل</div>
        </div>
        <button className="btn btn-success" onClick={() => setModal("add")}>
          ➕ إضافة موظف
        </button>
      </div>

      <div className="card" style={{ marginBottom: "16px", padding: "14px 18px" }}>
        <input className="form-input" placeholder="🔍 بحث بالاسم أو اسم المستخدم..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: "none", background: "transparent", padding: "0" }} />
      </div>

      <div className="card table-card">
        <div className="table-header-row" style={{ gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.5fr" }}>
          <span>الاسم الكامل</span><span>اسم المستخدم</span><span>الصلاحية</span><span>المزرعة</span><span>الإجراءات</span>
        </div>

        {loading ? (
          <div className="empty-state">⏳ جاري التحميل...</div>
        ) : (
          userList.map(u => (
            <div key={u.username} className="table-row" style={{ gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.5fr" }}>
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full" style={{ background: u.role === "admin" ? "rgba(239,68,68,.2)" : "rgba(59,130,246,.2)" }}>
                  {u.role === "admin" ? "👑" : "👤"}
                </span>
                <span className="font-bold">{u.name || "—"}</span>
              </div>
              <span className="text-muted text-sm font-mono">{u.username}</span>
              <span><span className={`badge ${ROLE_BADGE[u.role]}`}>{ROLE_NAME[u.role]}</span></span>
              <span className="text-sm text-muted">{u.farm_type === "all" ? "كل الأنواع" : u.farm_type}</span>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setModal({ msg: u })} title="إرسال رسالة">✉️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setModal({ edit: u })} title="تعديل">✏️</button>
                <button className="btn btn-ghost btn-sm text-red" onClick={() => setModal({ delete: u.username, name: u.name })} title="حذف">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {(modal === "add" || modal?.edit) && <UserModal initial={modal?.edit} onSave={handleSave} onClose={() => setModal(null)} />}
      {modal?.delete && <ConfirmModal message={`هل أنت متأكد من حذف ${modal.name}?`} onConfirm={() => handleDelete(modal.delete)} onClose={() => setModal(null)} />}
      {modal?.msg && <MessageModal user={modal.msg} onSend={sendDirectMessage} onClose={() => setModal(null)} />}
    </div>
  );
}
