'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error';
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="confirm-modal-overlay" className="fixed inset-0 z-60 flex items-center justify-center p-4 pointer-events-none">
          <motion.div
            key="confirm-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white/90 backdrop-blur-md w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center border-2 border-green-400 pointer-events-auto"
          >
            <div className={`w-20 h-20 rounded-xl flex items-center justify-center mb-6 shadow-sm ${
              type === 'success' ? 'bg-emerald-50 text-emerald-500 border-2 border-emerald-100' : 'bg-red-50 text-red-500 border-2 border-red-100'
            }`}>
              {type === 'success' ? <CheckCircle2 size={56} strokeWidth={2.5} /> : <XCircle size={56} strokeWidth={2.5} />}
            </div>

            <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase mb-2">
              {type === 'success' ? 'Berhasil' : 'Gagal'}
            </h3>
            <p className="text-[11px] font-black text-slate-500 leading-relaxed uppercase tracking-widest">
              {message}
            </p>
            
            {/* Progress bar auto close */}
            <div className="absolute bottom-0 left-0 h-1 bg-slate-900/10 w-full">
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 1, ease: "linear" }}
                className={`h-full ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
