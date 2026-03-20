import { useState, useEffect } from "react";
import { loadData, saveData } from "../../core/firebase.js";
import { hashPassword }       from "../../core/auth.js";
import { TYPES_AR }           from "../../core/utils.js";
import { showToast }          from "../shared/Toast.jsx";
const ROLES = [
  { value: "employee", label: "موظف" },
  { value: "admin",    label: "مدير" },
];

function UserModal({ initial, onSave, onClose }) {
  const isEdit = !!initial;
  const [name,     setName]     = useState(initial?.name     || "");
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState(initial?.role     || "employee");
  const [farmType, setFarmType] = useState(initial?.farm_type || TYPES_AR[0]);
  const [canDelete,setCanDelete]= useState(!!initial?.canDelete);
  const [saving,   setSaving]   = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (!name.trim())     { showToast("أدخل الاسم الكامل",        "error"); return; }
    if (!username.trim()) { showToast("أدخل اسم المستخدم",        "error"); return; }
    if (!isEdit && !password) { showToast("أدخل كلمة المرور", "error"); return; }

    setSaving(true);
    try {
      const hashed = password ? await hashPassword(password) : (initial?.password || "");
      await onSave({
        username: username.trim(),
        name:     name.trim(),
        password: hashed,
        role,
        farm_type: farmType,
        canDelete: role === "admin" ? true : canDelete,
      });
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
              <input className="form-input" placeholder="محمد أحمد"
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                اسم المستخدم * {isEdit && <span className="text-muted text-xs">(لا يمكن تغييره)</span>}
              </label>
              <input className="form-input" placeholder="m.ahmed"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={isEdit}
                style={isEdit ? { opacity: .5, cursor: "not-allowed" } : {}}
              />
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
              <label className="form-label">نوع المزرعة (الصلاحية الافتراضية)</label>
              <select className="form-select" value={farmType} onChange={e => setFarmType(e.target.value)}>
                <option value="all">كل الأنواع</option>
                {TYPES_AR.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* canDelete */}
            {role !== "admin" && (
              <div className="form-group" style={{ margin: 0, gridColumn: "1/-1" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px", background:canDelete?"rgba(239,68,68,.08)":"var(--bg-tertiary)", borderRadius:"8px", border:`1px solid ${canDelete?"rgba(239,68,68,.3)":"var(--border)"}` }}>
                  <input type="checkbox" id="canDelete" checked={canDelete} onChange={e=>setCanDelete(e.target.checked)}
                    style={{ width:"18px", height:"18px", cursor:"pointer" }} />
                  <label htmlFor="canDelete" style={{ cursor:"pointer", fontWeight:"700" }}>
                    🗑️ صلاحية حذف الحالات (مع إرسال إشعار للمدير)
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
  const [modal,   setModal]   = useState(null); // null | "add" | { edit: userData } | { delete: username }
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    loadData("users", {}).then(data => { setUsers(data); setLoading(false); });
  }, []);

  // ─── Load all users ────────────────────────────────────────────────
  const userList = Object.entries(users)
    .map(([uname, data]) => ({ username: uname, ...data }))
    .filter(u => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return u.username?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q);
    });

  // ─── Save user (add or edit) ───────────────────────────────────────
  async function handleSave(userData) {
    const { username, ...rest } = userData;

    // تحقق من تكرار اسم المستخدم عند الإضافة
    if (modal === "add" && users[username]) {
      showToast("اسم المستخدم موجود مسبقاً ❌", "error"); return;
    }

    const updated = { ...users, [username]: rest };
    await saveData("users", updated);
    setUsers(updated);
    setModal(null);
    showToast(modal === "add" ? "✅ تم إضافة الموظف" : "✅ تم تحديث بيانات الموظف", "success");
  }

  // ─── Delete user ───────────────────────────────────────────────────
  async function handleDelete(username) {
    if (username === currentUser.username) {
      showToast("لا يمكنك حذف حسابك الخاص ❌", "error"); return;
    }
    const updated = { ...users };
    delete updated[username];
    await saveData("users", updated);
    setUsers(updated);
    setModal(null);
    showToast("🗑️ تم حذف الموظف", "success");
  }

  const ROLE_BADGE = { admin: "badge-red", employee: "badge-blue" };
  const ROLE_NAME  = { admin: "مدير",     employee: "موظف"       };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">👥 إدارة الموظفين</div>
          <div className="page-subtitle">{Object.keys(users).length} حساب مسجل</div>
        </div>
        <button className="btn btn-success" onClick={() => setModal("add")}>
          ➕ إضافة موظف
        </button>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: "16px", padding: "14px 18px" }}>
        <input
          className="form-input"
          placeholder="🔍 بحث بالاسم أو اسم المستخدم..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ border: "none", background: "transparent", padding: "0", fontSize: "1rem" }}
        />
      </div>

      {/* Users table */}
      <div className="card table-card">
        <div className="table-header-row"
          style={{ gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.5fr" }}>
          <span>الاسم الكامل</span>
          <span>اسم المستخدم</span>
          <span>الصلاحية</span>
          <span>نوع المزرعة</span>
          <span>الإجراءات</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="empty-state-icon">⏳</span>
            <div>جاري التحميل...</div>
          </div>
        ) : userList.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">👤</span>
            <div className="empty-state-title">لا يوجد موظفون{search && " في نتائج البحث"}</div>
          </div>
        ) : (
          userList.map(u => (
            <div key={u.username} className="table-row"
              style={{ gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1.5fr" }}>

              <div className="flex items-center gap-2">
                <span style={{
                  width: "34px", height: "34px", borderRadius: "50%",
                  background: u.role === "admin" ? "rgba(239,68,68,.2)" : "rgba(59,130,246,.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1rem", flexShrink: 0
                }}>
                  {u.role === "admin" ? "👑" : "👤"}
                </span>
                <span className="font-bold">{u.name || "—"}</span>
                {u.username === currentUser.username && (
                  <span className="badge badge-green text-xs">أنت</span>
                )}
              </div>

              <span className="text-muted">{u.username}</span>

              <span>
                <span className={`badge ${ROLE_BADGE[u.role] || "badge-blue"}`}>
                  {ROLE_NAME[u.role] || u.role}
                </span>
              </span>

              <span className="text-sm text-muted">{u.farm_type === "all" ? "كل الأنواع" : (u.farm_type || "—")}</span>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setModal({ edit: u })}
                  title="تعديل"
                >✏️</button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: u.username === currentUser.username ? "var(--text-muted)" : "var(--accent-red)" }}
                  onClick={() => {
                    if (u.username === currentUser.username) {
                      showToast("لا يمكنك حذف حسابك الخاص", "error"); return;
                    }
                    setModal({ delete: u.username, name: u.name });
                  }}
                  title="حذف"
                >🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────── */}
      {(modal === "add" || modal?.edit) && (
        <UserModal
          initial={modal?.edit || null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.delete && (
        <ConfirmModal
          message={`هل أنت متأكد من حذف موظف "${modal.name || modal.delete}"؟ لا يمكن التراجع.`}
          onConfirm={() => handleDelete(modal.delete)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
