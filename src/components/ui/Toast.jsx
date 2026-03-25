import { useState, useEffect } from "react";

let toastId = 0;

// Global toast handler
let _addToast = null;
export function showToast(message, type = "success", duration = 3000) {
  if (_addToast) _addToast({ id: toastId++, message, type, duration });
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    _addToast = (toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration);
    };
    return () => { _addToast = null; };
  }, []);

  const icons = { success: "✅", error: "❌", info: "ℹ️" };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type] || "ℹ️"}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
