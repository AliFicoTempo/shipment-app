'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Edit2, Trash2, Plus, CheckCircle, XCircle, ChevronsUpDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


interface ShipmentCardProps {
  data: any[];
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
}

const ShipmentCardItem = ({ row, idx, onEdit, onDelete }: { row: any, idx: number, onEdit: (row: any) => void, onDelete: (row: any) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isExisting = !!row.shipment_id;
  const isHoliday = row.status.includes('Libur') || row.status === 'Libur Minggu' || (row.status !== 'Sudah Diisi' && row.status !== 'Belum Diisi' && row.status !== 'Masuk Minggu');
  const canCreate = !!row.permissions?.canCreate;
  const canEdit = !!row.permissions?.canEdit;
  const canDelete = !!row.permissions?.canDelete;
  const isHolidayEmpty = isHoliday && !isExisting;

  // Card style logic
  let cardBg = 'bg-white';
  let cardBorder = 'border-slate-200';
  let headerBg = 'bg-slate-50';
  let headerText = 'text-slate-900';
  let subText = 'text-slate-400';

  if (isExisting) {
    cardBg = 'bg-slate-900';
    cardBorder = 'border-slate-800';
    headerBg = 'bg-slate-800';
    headerText = 'text-white';
    subText = 'text-slate-400';
  } else if (isHoliday) {
    cardBg = 'bg-red-600';
    cardBorder = 'border-red-500';
    headerBg = 'bg-red-700';
    headerText = 'text-white';
    subText = 'text-red-100';
  } else {
    cardBg = 'bg-slate-100';
    cardBorder = 'border-slate-200';
    headerBg = 'bg-slate-200';
    headerText = 'text-slate-600';
    subText = 'text-slate-400';
  }

  // Sub-info for collapse state
  const getSubInfo = () => {
    if (isExisting) return row.shipment_id;
    return row.status; // status already contains "Libur Minggu", "Belum Diisi", or Holiday name
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.02 }}
      className={`border-2 rounded-2xl overflow-hidden shadow-premium relative transition-all duration-500 ${cardBg} ${cardBorder}`}
    >
      {/* Header */}
      <div 
        onClick={() => !isHolidayEmpty && setIsExpanded(!isExpanded)}
        className={`px-6 py-5 flex items-center justify-between transition-all duration-500 select-none ${isExpanded ? 'border-b-2' : ''} ${headerBg} border-black/5 ${isHolidayEmpty ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <div className="flex flex-col gap-1.5">
          <span className={`text-[14px] font-black tracking-tight ${headerText}`}>
            {format(new Date(row.dateStr), 'EEEE, dd MMM yyyy', { locale: localeID })}
          </span>
          
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.div
                key="collapsed-info"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center"
              >
                {isExisting ? (
                  <span className="bg-white/10 text-white text-[11px] font-black px-2.5 py-1 rounded-lg border border-white/20 tracking-wider shadow-sm">
                    {getSubInfo()}
                  </span>
                ) : (
                  <span className={`bg-white/30 text-gray-700 text-[11px] font-black px-2.5 py-1 rounded-lg border border-white/20 tracking-wider shadow-sm uppercase ${subText}`}>
                    {getSubInfo()}
                  </span>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="expanded-info"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border w-fit uppercase tracking-widest shadow-sm ${
                  isExisting || isHoliday ? 'bg-white/20 text-white border-white/30' : 'bg-slate-300 text-slate-600 border-slate-400'
                }`}>
                  {row.status}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Action Buttons only when expanded */}
          <AnimatePresence>
            {isExpanded && (canCreate || canEdit || canDelete) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="flex items-center gap-2"
              >
                {(canEdit || canCreate) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); onEdit(row); }}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all ${
                      isExisting 
                        ? 'bg-white text-slate-900 border-white shadow-premium' 
                        : 'bg-white text-blue-600 border-blue-200 shadow-premium'
                    }`}
                  >
                    {isExisting ? <Edit2 size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                  </motion.button>
                )}
                {canDelete && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => { e.stopPropagation(); onDelete(row); }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all bg-red-500 text-white border-red-500 shadow-premium"
                  >
                    <Trash2 size={18} strokeWidth={3} />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toggle Button */}
          {!isHolidayEmpty && (
            <motion.div
              whileTap={{ scale: 0.9 }}
              className={`w-11 h-11 rounded-xl flex items-center justify-center border-2 transition-all ${
                isExpanded 
                  ? 'bg-white text-red-900 border-red-200 shadow-inner rotate-0' 
                  : isExisting || isHoliday ? 'bg-white/10 text-white border-white/20' : 'bg-white text-emerald-400 border-emerald-200'
              }`}
            >
              {isExpanded ? <X size={20} strokeWidth={3} /> : <ChevronsUpDown size={20} strokeWidth={3} />}
            </motion.div>
          )}
        </div>
      </div>

      {/* Body */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subText}`}>Nomor Shipment</span>
                  <span className={`text-[15px] font-black block tracking-tight ${isExisting || isHoliday ? 'text-white' : 'text-slate-900'}`}>{row.shipment_id || '———'}</span>
                </div>
                <div className="space-y-1.5 text-right">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${subText}`}>Jumlah Toko</span>
                  <span className={`text-[15px] font-black block tracking-tight ${isExisting || isHoliday ? 'text-white' : 'text-slate-900'}`}>{row.jumlah_toko || '—'}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className={`flex flex-col items-center p-3 rounded-xl border-2 ${isExisting || isHoliday ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${subText}`}>Berangkat</span>
                  <span className={`text-[13px] font-black ${isExisting || isHoliday ? 'text-white' : 'text-slate-700'}`}>{row.jam_berangkat || '—'}</span>
                </div>
                <div className={`flex flex-col items-center p-3 rounded-xl border-2 ${isExisting || isHoliday ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${subText}`}>Pulang</span>
                  <span className={`text-[13px] font-black ${isExisting || isHoliday ? 'text-white' : 'text-slate-700'}`}>{row.jam_pulang || '—'}</span>
                </div>
                <div className={`flex flex-col items-center p-3 rounded-xl border-2 ${isExisting || isHoliday ? 'bg-blue-900/40 border-blue-400/30 shadow-lg shadow-blue-900/20' : 'bg-blue-50 border-blue-100 shadow-sm'}`}>
                  <span className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${isExisting || isHoliday ? 'text-blue-200' : 'text-blue-400'}`}>Kirim</span>
                  <span className={`text-[13px] font-black ${isExisting || isHoliday ? 'text-blue-100' : 'text-blue-700'}`}>{row.terkirim || '—'}</span>
                </div>
              </div>

              <div className={`flex items-center gap-4 p-5 rounded-2xl border-2 ${
                isExisting || isHoliday ? 'bg-black/20 border-white/5 shadow-inner' : 'bg-slate-50 border-slate-100 shadow-inner'
              }`}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 shadow-sm ${
                  row.gagal > 0 
                    ? 'bg-red-500/20 text-red-100 border-red-500/30' 
                    : isExisting || isHoliday ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {row.gagal > 0 ? <XCircle size={14} strokeWidth={3} /> : <CheckCircle size={14} strokeWidth={3} />}
                  <span className="text-[10px] font-black uppercase tracking-wider">Gagal: {row.gagal !== null ? row.gagal : '—'}</span>
                </div>
                <div className={`text-[12px] font-bold italic truncate flex-1 tracking-tight ${isExisting || isHoliday ? 'text-white/50' : 'text-slate-500'}`}>
                  {row.keterangan || '———'}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const ShipmentCard: React.FC<ShipmentCardProps> = ({ data, onEdit, onDelete }) => {
  return (
    <div className="md:hidden mt-8 space-y-4 pb-24">
      <AnimatePresence initial={false}>
        {data.map((row, idx) => (
          <ShipmentCardItem 
            key={`${row.dateStr}-${row.nik_kerja}-${row.shipment_id ?? idx}`} 
            row={row} 
            idx={idx} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ShipmentCard;
