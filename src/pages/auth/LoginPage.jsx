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
    if (!username.trim()) { setError("Ø§Ù„Ø±Ø¬Ø§Ø¡ ÙƒØªØ§Ø¨Ø© Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…"); return; }
    setLoading(true);
    setError("");

    try {
      let freshUsers = await loadData("users", {});

      // Fallback: Ø¥Ø°Ø§ Ù„Ù… ØªÙØ­Ù…ÙŽÙ‘Ù„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ù…Ù† Firebase (Ø³Ø¨Ø¨: Ù‚ÙˆØ§Ø¹Ø¯ Ø§Ù„Ø£Ù…Ø§Ù† Ù…ØºÙ„Ù‚Ø©)
      // Ù†Ø¶ÙŠÙ Ø­Ø³Ø§Ø¨ admin Ø§ÙØªØ±Ø§Ø¶ÙŠ Ù…Ø¤Ù‚ØªØ§Ù‹ Ø­ØªÙ‰ ÙŠÙØ­Ø¯ÙŽÙ‘Ø« Firebase
      if (!freshUsers || Object.keys(freshUsers).length === 0) {
        freshUsers = {
          admin: { password: "admin", role: "admin", farm_type: "all", name: "Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ø¹Ø§Ù…" }
        };
      }

      setUsers(freshUsers);

      if (!freshUsers[username]) {
        setError("Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ âŒ"); setLoading(false); return;
      }

      const storedPwd = freshUsers[username].password ?? "";
      const result    = await verifyPassword(password, storedPwd);

      if (!result.ok) {
        setError("ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø®Ø§Ø·Ø¦Ø© âŒ"); setLoading(false); return;
      }

      // ØªØ±Ù‚ÙŠØ© ØªÙ„Ù‚Ø§Ø¦ÙŠØ© Ù„ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ù† Ù†Øµ Ø¹Ø§Ø¯ÙŠ Ø¥Ù„Ù‰ SHA-256
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
      setError("Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø§ØªØµØ§Ù„ ðŸŒ");
    }

    setLoading(false);
  }


  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">ðŸ¡</div>
        <h1 className="login-title">Farm Case</h1>
        <p className="login-subtitle">Ù†Ø¸Ø§Ù… Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù…Ø²Ø§Ø±Ø¹ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ</p>

        {error && <div className="login-error">âš ï¸ {error}</div>}

        <form onSubmit={handleLogin} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…</label>
          <input
              id="login-username"
              className="form-input"
              type="text"
              placeholder="Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…"
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
            <label className="form-label">ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Ø£Ø¯Ø®Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±"
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
            {loading ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù‚Ù‚..." : "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„ â†’"}
          </button>
        </form>

        <p className="text-xs text-muted" style={{ marginTop: "24px" }}>
          Ù†Ø¸Ø§Ù… Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© â€” Ù‚Ø³Ù… Ø§Ù„Ø¨ÙŠØ¦Ø©
        </p>
      </div>
    </div>
  );
}
