import { useState, useEffect } from "react";
import { loadData, saveData } from "../../services/firebase.js";
import { showToast } from "../../components/ui/Toast.jsx";

const DEFAULT_TEMPLATES = {
  ar: {
    farmLabel: "مزرعــة",
    rearingLabel: "تـربــيــة",
    productionLabel: "انــتـــاج",
    houseLabel: "حظيرة",
    ageLabel: "العمــر",
    dayLabel: "يوم",
    highLabel: "ارتفاع في",
    lowLabel: "انخفاض في",
    avgTempLabel: "معدل درجة الحرارة",
    setPointLabel: "الســـــــــيـت بويـنـت",
    startTimeLabel: "بــدايــــــــة الحــــالــــة",
    procTimeLabel: "مــــــــدة المعـالجــــة",
    footer: "-- يرجى ذكر السبب --\n@"
  },
  en: {
    farmLabel: "Farm",
    rearingLabel: "Rearing",
    productionLabel: "Production",
    houseLabel: "House",
    ageLabel: "Age",
    dayLabel: "Day",
    highLabel: "Gradual High",
    lowLabel: "Gradual Low",
    sensorPrefix: "Sensor",
    nh3Label: "Sensor (NH³)",
    co2Label: "Sensor (CO²)",
    humLabel: "Humidity Sensor",
    pressLabel: "Pressure Sensor",
    avgTempLabel: "Average Temp",
    setPointLabel: "Set Point",
    startTimeLabel: "Start Time",
    procTimeLabel: "Process Time",
    footer: "-- Please state the reason --\n@"
  }
};

export default function TemplatesPage() {
  const [temps, setTemps] = useState(null);
  const [activeLang, setActiveLang] = useState("ar");

  useEffect(() => {
    loadData("templates_config", DEFAULT_TEMPLATES).then(setTemps);
  }, []);

  const save = async () => {
    await saveData("templates_config", temps);
    showToast("✅ تم حفظ القوالب بنجاح", "success");
  };

  if (!temps) return <div className="empty-state">⏳ جاري التحميل...</div>;

  const current = temps[activeLang];

  const updateField = (key, val) => {
    setTemps(prev => ({
      ...prev,
      [activeLang]: { ...prev[activeLang], [key]: val }
    }));
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="page-header">
        <div>
          <div className="page-title">📝 إدارة الكلائش والقوالب</div>
          <div className="page-subtitle">تخصيص نصوص النسخ (WhatsApp) لكل لغة</div>
        </div>
        <div className="flex gap-2">
            <button className="btn btn-primary" onClick={save}>💾 حفظ التعديلات</button>
        </div>
      </div>

      <div className="stat-cards">
          <div className={`stat-card cursor-pointer ${activeLang==='ar'?'border-blue':''}`} 
               style={{ background: activeLang==='ar'?'var(--accent-blue)':'var(--bg-secondary)', border: activeLang==='ar'?'none':'1px solid var(--border)' }}
               onClick={()=>setActiveLang('ar')}>
             <div className="stat-card-label">اللغة العربية</div>
             <div className="stat-card-value">AR</div>
          </div>
          <div className={`stat-card cursor-pointer ${activeLang==='en'?'border-blue':''}`} 
               style={{ background: activeLang==='en'?'var(--accent-blue)':'var(--bg-secondary)', border: activeLang==='en'?'none':'1px solid var(--border)' }}
               onClick={()=>setActiveLang('en')}>
             <div className="stat-card-label">اللغة الإنجليزية</div>
             <div className="stat-card-value">EN</div>
          </div>
      </div>

      <div className="card max-w-4xl">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
               <h3 className="font-bold border-bottom pb-2 mb-2">🏷️ التسميات الأساسية</h3>
               
               <div className="form-group">
                  <label className="form-label">تسمية المنشأة (مزرعة)</label>
                  <input className="form-input" value={current.farmLabel} onChange={e=>updateField('farmLabel', e.target.value)} />
               </div>
               <div className="form-group">
                  <label className="form-label">تسمية (تربية)</label>
                  <input className="form-input" value={current.rearingLabel} onChange={e=>updateField('rearingLabel', e.target.value)} />
               </div>
               <div className="form-group">
                  <label className="form-label">تسمية (إنتاج)</label>
                  <input className="form-input" value={current.productionLabel} onChange={e=>updateField('productionLabel', e.target.value)} />
               </div>
               <div className="form-group">
                  <label className="form-label">تسمية (حظيرة)</label>
                  <input className="form-input" value={current.houseLabel} onChange={e=>updateField('houseLabel', e.target.value)} />
               </div>
            </div>

            <div className="flex flex-col gap-4">
               <h3 className="font-bold border-bottom pb-2 mb-2">📊 البيانات والظروف</h3>
               <div className="grid grid-cols-2 gap-2">
                  <div className="form-group">
                     <label className="form-label">العمر</label>
                     <input className="form-input" value={current.ageLabel} onChange={e=>updateField('ageLabel', e.target.value)} />
                  </div>
                  <div className="form-group">
                     <label className="form-label">الوحدة (يوم)</label>
                     <input className="form-input" value={current.dayLabel} onChange={e=>updateField('dayLabel', e.target.value)} />
                  </div>
               </div>
               <div className="form-group">
                  <label className="form-label">عنوان الارتفاع</label>
                  <input className="form-input" value={current.highLabel} onChange={e=>updateField('highLabel', e.target.value)} />
               </div>
               <div className="form-group">
                  <label className="form-label">معدل الحرارة</label>
                  <input className="form-input" value={current.avgTempLabel} onChange={e=>updateField('avgTempLabel', e.target.value)} />
               </div>
               <div className="form-group">
                  <label className="form-label">السيت بوينت</label>
                  <input className="form-input" value={current.setPointLabel} onChange={e=>updateField('setPointLabel', e.target.value)} />
               </div>
            </div>

            <div className="flex flex-col gap-4">
               <h3 className="font-bold border-bottom pb-2 mb-2">🕒 التوقيتات</h3>
               <div className="form-group">
                  <label className="form-label">بداية الحالة</label>
                  <input className="form-input" value={current.startTimeLabel} onChange={e=>updateField('startTimeLabel', e.target.value)} />
               </div>
               <div className="form-group">
                  <label className="form-label">مدة المعالجة</label>
                  <input className="form-input" value={current.procTimeLabel} onChange={e=>updateField('procTimeLabel', e.target.value)} />
               </div>
            </div>

            <div className="flex flex-col gap-4">
               <h3 className="font-bold border-bottom pb-2 mb-2">📝 الخاتمة (Footer)</h3>
               <div className="form-group">
                  <label className="form-label">نص التذييل والمنشن</label>
                  <textarea className="form-input" rows="4" value={current.footer} onChange={e=>updateField('footer', e.target.value)} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
