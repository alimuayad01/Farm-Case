import { useState, useEffect } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { verifyPassword, setCurrentUser } from "../../services/auth.js";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [users,    setUsers]    = useState({});

  useEffect(() => {
    loadData("users", {}).then(setUsers);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!username.trim()) { setError("الرجاء كتابة اسم المستخدم"); return; }
    setLoading(true);
    setError("");

    try {
      let freshUsers = await loadData("users", {});

      // Fallback: إذا لم تُحمَّل بيانات المستخدمين من Firebase (سبب: قواعد الأمان مغلقة)
      // نضيف حساب admin افتراضي مؤقتاً حتى يُحدَّث Firebase
      if (!freshUsers || Object.keys(freshUsers).length === 0) {
        freshUsers = {
          admin: { password: "admin", role: "admin", farm_type: "all", name: "المدير العام" }
        };
      }

      setUsers(freshUsers);

      if (!freshUsers[username]) {
        setError("اسم المستخدم غير موجود ❌"); setLoading(false); return;
      }

      const storedPwd = freshUsers[username].password ?? "";
      const result    = await verifyPassword(password, storedPwd);

      if (!result.ok) {
        setError("كلمة المرور خاطئة ❌"); setLoading(false); return;
      }

      // ترقية تلقائية لكلمة المرور من نص عادي إلى SHA-256
      if (result.needsUpgrade && result.newHash) {
        const updated = { ...freshUsers };
        updated[username] = { ...updated[username], password: result.newHash };
        saveData("users", updated);
      }

      const user = { ...freshUsers[username], username };
      setCurrentUser(user);
      onLogin(user);
    } catch (err) {
      console.error(err);
      setError("خطأ في الاتصال 🌐");
    }

    setLoading(false);
  }


  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">🏡</div>
        <h1 className="login-title">Farm Case</h1>
        <p className="login-subtitle">نظام تشخيص حالات الحظائر</p>

        {error && <div className="login-error">⚠️ {error}</div>}

        <form onSubmit={handleLogin} autoComplete="off">
          <div className="form-group">
            <label className="form-label">اسم المستخدم</label>
          <input
              id="login-username"
              className="form-input"
              type="text"
              placeholder="أدخل اسم المستخدم"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(""); }}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              autoComplete="new-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full"
            style={{ justifyContent: "center", padding: "14px", fontSize: "1rem", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "جاري التحقق..." : "تسجيل الدخول →"}
          </button>
        </form>

        <p className="text-xs text-muted" style={{ marginTop: "24px" }}>
          شركة سما كربلاء - قسم المتابعة الالكترونية
        </p>
      </div>
    </div>
  );
}
