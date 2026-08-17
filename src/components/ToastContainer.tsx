import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      id="toast-notifications-container"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          let icon = <CheckCircle className="text-emerald-400 shrink-0" size={16} />;
          let bgColor = 'bg-slate-900/95';
          let borderStyle = 'border-emerald-500/30';
          let textColor = 'text-emerald-100';
          let pulseTag = 'bg-emerald-500';

          if (toast.type === 'error') {
            icon = <AlertCircle className="text-rose-400 shrink-0" size={16} />;
            borderStyle = 'border-rose-500/30';
            textColor = 'text-rose-100';
            pulseTag = 'bg-rose-500';
          } else if (toast.type === 'info') {
            icon = <Info className="text-cyan-400 shrink-0" size={16} />;
            borderStyle = 'border-cyan-500/30';
            textColor = 'text-cyan-100';
            pulseTag = 'bg-cyan-500';
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${bgColor} ${borderStyle} shadow-[0_8px_32px_rgba(0,0,0,0.50)] relative overflow-hidden`}
              id={`toast-item-${toast.id}`}
            >
              {/* Decorative vertical colored stripe */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${pulseTag}`} />
              
              <div className="mt-0.5">{icon}</div>

              <div className="flex-1 text-left">
                <p className={`text-xs ${textColor} font-sans leading-relaxed break-words font-medium`}>
                  {toast.message}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                  <span className={`inline-block h-1 w-1 rounded-full ${pulseTag} animate-ping`} />
                  RETROALIMENTACIÓN LOGÍSTICA
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="text-zinc-500 hover:text-zinc-200 transition p-0.5 rounded hover:bg-slate-800 cursor-pointer shrink-0 mt-0.5"
                title="Cerrar notificación"
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
