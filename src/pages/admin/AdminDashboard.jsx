import { useState, useEffect } from "react";
import { loadData } from "../../services/firebase.js";
import { isToday, getShiftName } from "../../utils/utils.js";

export default function AdminDashboard({ user }) {
  const [history, setHistory] = useState([]);
  const [users,   setUsers]   = useState({});

  useEffect(() => {
    loadData("history", []).then(setHistory);
    loadData("users",   {}).then(setUsers);
  }, []);

  const todayCases  = history.filter(h => isToday(h.timestamp));
  const seenCases   = todayCases.filter(h => h.seen);
  const unseenCases = todayCases.filter(h => !h.seen);
  const userCount   = Object.keys(users).filter(k => users[k].role !== "admin").length;

  const CARDS = [
    { label: "Ø­Ø§Ù„Ø§Øª Ø§Ù„ÙŠÙˆÙ…",     value: todayCases.length,  icon: "ðŸ“ˆ", color: "#22c55e" },
    { label: "Ø¨Ø§Ù†ØªØ¸Ø§Ø± Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©", value: unseenCases.length, icon: "ðŸ”´", color: "#ef4444" },
    { label: "ØªÙ…Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",    value: seenCases.length,   icon: "âœ…", color: "#3b82f6" },
    { label: "Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†",        value: userCount,           icon: "ðŸ‘¥", color: "#a855f7" },
  ];

  const now = new Date().toLocaleString("ar-EG");

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">ðŸ“Š Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø©</div>
          <div className="page-subtitle">Ù…Ø±Ø­Ø¨Ø§Ù‹ØŒ {user.name || user.username} Â· {getShiftName()}</div>
        </div>
        <div className="info-badges">
          <span className="info-badge" style={{ background: "#e67e22" }}>ðŸŒ¤ Ø§Ù„Ø·Ù‚Ø³</span>
          <span className="info-badge" style={{ background: "#2563eb" }}>ðŸ“… {now}</span>
          <span className="info-badge" style={{ background: "#16a34a" }}>â° {getShiftName()}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards">
        {CARDS.map(c => (
          <div key={c.label} className="stat-card" style={{ background: c.color }}>
            <span className="stat-card-icon">{c.icon}</span>
            <div className="stat-card-value">{c.value}</div>
            <div className="stat-card-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Cases Table */}
      <div className="card table-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold" style={{ fontSize: "1rem" }}>Ø­Ø§Ù„Ø§Øª Ø§Ù„ÙŠÙˆÙ…</h2>
          <span className="badge badge-blue">{todayCases.length} Ø­Ø§Ù„Ø©</span>
        </div>

        {/* Table Header */}
        <div className="table-header-row" style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 2fr 1.5fr" }}>
          <span>Ø§Ù„ÙˆÙ‚Øª</span>
          <span>Ù†ÙˆØ¹ Ø§Ù„Ø­Ø§Ù„Ø©</span>
          <span>Ø§Ù„Ù…Ø²Ø±Ø¹Ø©</span>
          <span>Ø§Ù„Ø­Ø¸ÙŠØ±Ø©</span>
          <span>Ø§Ù„Ù…ÙˆØ¸Ù</span>
          <span>Ø§Ù„Ø­Ø§Ù„Ø©</span>
        </div>

        {todayCases.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">ðŸ“­</span>
            <div className="empty-state-title">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø­Ø§Ù„Ø§Øª Ø§Ù„ÙŠÙˆÙ…</div>
          </div>
        ) : (
          todayCases.slice().reverse().map((c, i) => (
            <div
              key={i}
              className={`table-row ${c.seen ? "seen" : "unseen"}`}
              style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 2fr 1.5fr" }}
            >
              <span className="text-muted text-sm">{c.time || "-"}</span>
              <span className="font-bold">{c.raw_data?.condition || "-"}</span>
              <span>{c.farm || "-"}</span>
              <span>{c.house || "-"}</span>
              <span className="text-blue">{c.by_user || "-"}</span>
              <span>
                {c.seen
                  ? <span className="badge badge-green">âœ“ Ø±Ø§Ø¬Ø¹Øª</span>
                  : <span className="badge badge-red">ðŸ”´ Ø¬Ø¯ÙŠØ¯Ø©</span>
                }
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
