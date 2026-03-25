/**
 * PersonalSettingsPage.jsx
 * إعدادات مظهر شخصية — تُحفظ في localStorage
 */
import { useState, useEffect } from "react";
import { showToast } from "../../components/ui/Toast.jsx";

const PREFS_KEY = "farmcase_prefs";
const FONTS     = ["Tajawal", "Cairo", "IBM Plex Arabic", "Noto Kufi Arabic", "Readex Pro"];
const ACCENTS   = ["#3b82f6","#22c55e","#f59e0b","#ef4444","#a855f7","#06b6d4","#ec4899","#f97316"];
const RADII     = [{ v:"4px",l:"حاد"},{v:"8px",l:"متوسط"},{v:"14px",l:"دائري"},{v:"20px",l:"مكدور جداً"}];

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"); } catch { return {}; }
}
function savePrefs(p) { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }

export function applyPrefs() {
  const p = loadPrefs();
  if (p.accent)    document.documentElement.style.setProperty("--accent-blue", p.accent);
  if (p.radius)    document.documentElement.style.setProperty("--radius-md", p.radius);
  if (p.fontSize)  document.documentElement.style.setProperty("--font-size-base", p.fontSize + "px");
  if (p.fontAr)    document.documentElement.style.setProperty("--font-ar", `"${p.fontAr}", Tajawal, sans-serif`);
}

export default function PersonalSettingsPage() {
  const [prefs, setPrefs] = useState({ accent:"#3b82f6", radius:"8px", fontSize:14, fontAr:"Tajawal", theme:"dark" });

  useEffect(() => {
    const saved = loadPrefs();
    setPrefs(p => ({ ...p, ...saved }));
  }, []);

  function update(key, val) {
    const next = { ...prefs, [key]: val };
    setPrefs(next); savePrefs(next); applyPrefs();
  }

  function reset() {
    const def = { accent:"#3b82f6", radius:"8px", fontSize:14, fontAr:"Tajawal", theme:"dark" };
    setPrefs(def); savePrefs(def); applyPrefs();
    showToast("🔄 تمت إعادة ضبط الإعدادات", "info");
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", gap:"14px" }}>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div>
          <div style={{ fontWeight:"900", fontSize:"1.05rem" }}>🎨 الإعدادات الشخصية</div>
          <div style={{ fontSize:".78rem", color:"var(--text-muted)" }}>تخصيص مظهر التطبيق — تُحفظ تلقائياً</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reset}>🔄 إعادة الضبط</button>
      </div>

      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"12px" }}>

        {/* Color Theme */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>🌙 المظهر</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>الوضع الليلي / النهاري</div>
          <div style={{ display:"flex", gap:"8px" }}>
            {[{id:"dark",label:"🌙 داكن"},{id:"light",label:"☀️ فاتح"}].map(({id,label}) => (
              <button key={id} type="button"
                onClick={() => { update("theme", id); document.documentElement.setAttribute("data-theme", id); }}
                style={{ flex:1, padding:"12px", borderRadius:"10px", border:`1.5px solid ${prefs.theme===id?"var(--accent-blue)":"var(--border)"}`, background:prefs.theme===id?"rgba(59,130,246,.12)":"var(--bg-tertiary)", color:prefs.theme===id?"var(--accent-blue)":"var(--text-muted)", fontFamily:"var(--font-ar)", fontWeight:"700", cursor:"pointer", transition:"all .2s", fontSize:".9rem" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>🎨 لون التأكيد</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>لون الأزرار والإطارات النشطة</div>
          <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
            {ACCENTS.map(c => (
              <button key={c} type="button" onClick={() => update("accent", c)}
                style={{ width:"36px", height:"36px", borderRadius:"50%", background:c, border:`3px solid ${prefs.accent===c?"#fff":"transparent"}`, cursor:"pointer", boxShadow: prefs.accent===c?`0 0 10px ${c}`:"none", transition:"all .2s" }} />
            ))}
            <input type="color" value={prefs.accent} onChange={e => update("accent", e.target.value)}
              style={{ width:"36px", height:"36px", borderRadius:"50%", border:"2px solid var(--border)", cursor:"pointer", padding:0, background:"transparent" }} />
          </div>
        </div>

        {/* Border Radius */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>⬜ شكل الحواف</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>حدة أو دائرية البطاقات والأزرار</div>
          <div style={{ display:"flex", gap:"8px" }}>
            {RADII.map(({v,l}) => (
              <button key={v} type="button" onClick={() => update("radius", v)}
                style={{ flex:1, padding:"10px 6px", borderRadius:v, border:`1.5px solid ${prefs.radius===v?"var(--accent-blue)":"var(--border)"}`, background:prefs.radius===v?"rgba(59,130,246,.12)":"var(--bg-tertiary)", color:prefs.radius===v?"var(--accent-blue)":"var(--text-muted)", fontFamily:"var(--font-ar)", fontWeight:"700", cursor:"pointer", transition:"all .2s", fontSize:".78rem" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>📏 حجم الخط</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>الحجم الأساسي لنصوص التطبيق — الحالي: {prefs.fontSize}px</div>
          <input type="range" min="11" max="18" step="1" value={prefs.fontSize}
            onChange={e => update("fontSize", parseInt(e.target.value))}
            style={{ width:"100%", accentColor:"var(--accent-blue)" }} />
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:".68rem", color:"var(--text-muted)", marginTop:"4px" }}>
            <span>صغير (11)</span><span>متوسط (14)</span><span>كبير (18)</span>
          </div>
        </div>

        {/* Arabic Font */}
        <div style={{ background:"var(--bg-secondary)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"4px" }}>حرف نوع الخط العربي</div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginBottom:"12px" }}>اختر الخط المناسب لك</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
            {FONTS.map(f => (
              <button key={f} type="button" onClick={() => update("fontAr", f)}
                style={{ padding:"12px 10px", borderRadius:"8px", border:`1.5px solid ${prefs.fontAr===f?"var(--accent-blue)":"var(--border)"}`, background:prefs.fontAr===f?"rgba(59,130,246,.12)":"var(--bg-tertiary)", color:prefs.fontAr===f?"var(--accent-blue)":"var(--text-muted)", fontFamily:`"${f}", Tajawal, sans-serif`, fontWeight:"700", cursor:"pointer", transition:"all .2s", fontSize:".88rem" }}>
                نظام تشخيص حالات الحظائر — {f}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ background:"var(--bg-secondary)", border:"2px dashed var(--border)", borderRadius:"var(--radius-md)", padding:"16px" }}>
          <div style={{ fontWeight:"800", fontSize:".9rem", marginBottom:"10px" }}>👁️ معاينة مباشرة</div>
          <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
            <button className="btn btn-sm btn-primary">زر أساسي</button>
            <button className="btn btn-sm btn-ghost">زر ثانوي</button>
            <span className="badge badge-green">نشط</span>
            <span className="badge badge-red">خطأ</span>
          </div>
          <div style={{ fontFamily:`"${prefs.fontAr}", Tajawal, sans-serif`, fontSize:`${prefs.fontSize}px`, lineHeight:1.7 }}>
            تسجيل حالة جديدة — مزرعة رقم 15 — حظيرة 3 — العمر 25 يوم
          </div>
          <div style={{ fontSize:".75rem", color:"var(--text-muted)", marginTop:"4px" }}>المظهر: {prefs.theme} | الخط: {prefs.fontAr} | الحجم: {prefs.fontSize}px | الحواف: {prefs.radius}</div>
        </div>
      </div>
    </div>
  );
}
