import { useState, useEffect } from "react";
import { loadData } from "../../core/firebase.js";
import { isToday, getShiftName } from "../../core/utils.js";

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
    { label: "حالات اليوم",     value: todayCases.length,  icon: "📈", color: "#22c55e" },
    { label: "بانتظار المراجعة", value: unseenCases.length, icon: "🔴", color: "#ef4444" },
    { label: "تمت المراجعة",    value: seenCases.length,   icon: "✅", color: "#3b82f6" },
    { label: "الموظفين",        value: userCount,           icon: "👥", color: "#a855f7" },
  ];

  const now = new Date().toLocaleString("ar-EG");

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="page-title">📊 نظرة عامة</div>
          <div className="page-subtitle">مرحباً، {user.name || user.username} · {getShiftName()}</div>
        </div>
        <div className="info-badges">
          <span className="info-badge" style={{ background: "#e67e22" }}>🌤 الطقس</span>
          <span className="info-badge" style={{ background: "#2563eb" }}>📅 {now}</span>
          <span className="info-badge" style={{ background: "#16a34a" }}>⏰ {getShiftName()}</span>
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
          <h2 className="font-bold" style={{ fontSize: "1rem" }}>حالات اليوم</h2>
          <span className="badge badge-blue">{todayCases.length} حالة</span>
        </div>

        {/* Table Header */}
        <div className="table-header-row" style={{ gridTemplateColumns: "1fr 2fr 1fr 1fr 2fr 1.5fr" }}>
          <span>الوقت</span>
          <span>نوع الحالة</span>
          <span>المزرعة</span>
          <span>الحظيرة</span>
          <span>الموظف</span>
          <span>الحالة</span>
        </div>

        {todayCases.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📭</span>
            <div className="empty-state-title">لا توجد حالات اليوم</div>
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
                  ? <span className="badge badge-green">✓ راجعت</span>
                  : <span className="badge badge-red">🔴 جديدة</span>
                }
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
