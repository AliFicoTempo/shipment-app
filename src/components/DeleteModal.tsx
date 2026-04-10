'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  date: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, date }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div key="delete-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key="delete-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            key="delete-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative bg-red-50 w-full max-w-sm rounded-2xl shadow-premium-lg overflow-hidden p-10 flex flex-col items-center text-center border border-red-100"
          >
            <div className="w-20 h-20 bg-red-200 text-red-500 rounded-2xl flex items-center justify-center mb-8 shadow-md">
              <AlertTriangle size={56} strokeWidth={2.5} />
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-normal uppercase mb-3">Konfirmasi Hapus</h3>
            <p className="text-xs font-bold text-slate-400 leading-relaxed mb-10 uppercase tracking-widest">
              Apakah Anda yakin ingin menghapus data pada tanggal <span className="text-red-500 font-black">{date}</span>?
            </p>

            <div className="flex flex-col w-full gap-4">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onConfirm}
                className="w-full h-14 bg-red-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3"
              >
                <Trash2 size={18} strokeWidth={3} /> HAPUS
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-full h-14 bg-gray-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-200 transition-all flex items-center justify-center gap-3">
                <X size={18} strokeWidth={3} /> Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteModal;
