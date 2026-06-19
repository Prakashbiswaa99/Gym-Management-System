import React, { useState, useEffect, useRef } from 'react';

const toastStack = [];
let setToastsGlobal = null;

export const toast = (message, type = 'default', duration = 3500) => {
  const id = Date.now();
  const newToast = { id, message, type };
  toastStack.push(newToast);
  if (setToastsGlobal) setToastsGlobal([...toastStack]);
  setTimeout(() => {
    const idx = toastStack.findIndex(t => t.id === id);
    if (idx !== -1) toastStack.splice(idx, 1);
    if (setToastsGlobal) setToastsGlobal([...toastStack]);
  }, duration);
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);
  setToastsGlobal = setToasts;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}
