'use client';

import React from 'react';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ShipmentTableProps {
  data: any[];
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
}

const ShipmentTable: React.FC<ShipmentTableProps> = ({ data, onEdit, onDelete }) => {
  return (
    <div className="hidden md:block overflow-hidden bg-white border-2 border-gray-600 rounded-xl shadow-sm mt-8">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-gray-600">
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Tanggal</th>
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Shipment</th>
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Berangkat</th>
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Pulang</th>
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Toko</th>
            <th className="px-6 py-4 text-[11px] font-black text-blue-700 uppercase tracking-widest text-center">Kirim</th>
            <th className="px-6 py-4 text-[11px] font-black text-red-700 uppercase tracking-widest text-center">Gagal</th>
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Keterangan</th>
            <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black">
          {data.map((row, idx) => {
            const isExisting = !!row.shipment_id;
            const isHoliday = row.status.includes('Libur') || row.status === 'Libur Minggu' || (row.status !== 'Sudah Diisi' && row.status !== 'Belum Diisi' && row.status !== 'Masuk Minggu');
            const isReadonly = isHoliday && !isExisting;

            // Row style logic
            let rowStyle = 'bg-white hover:bg-slate-50';
            if (isExisting) {
              rowStyle = 'bg-slate-900 text-white hover:bg-black border-gray-600';
            } else if (isHoliday) {
              rowStyle = 'bg-red-600 text-white hover:bg-red-700 border-gray-600';
            } else {
              rowStyle = 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-gray-600';
            }

            return (
              <motion.tr 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                key={`${row.dateStr}-${row.nik_kerja}-${row.shipment_id ?? idx}`} 
                className={`group transition-all border-b ${rowStyle}`}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className={`text-sm font-black tracking-tight ${isExisting || isHoliday ? 'text-white' : 'text-slate-900'}`}>{format(new Date(row.dateStr), 'EEEE, dd MMM yyyy', { locale: localeID })}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border mt-1.5 w-fit uppercase tracking-wider ${
                      isExisting 
                        ? 'bg-white/10 text-white border-white/20' 
                        : isHoliday 
                          ? 'bg-white/20 text-white border-white/30' 
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}>
                      {row.status}
                    </span>
                  </div>
                </td>
                <td className={`px-6 py-4 text-sm font-bold ${isExisting || isHoliday ? 'text-white/90' : 'text-slate-700'}`}>{row.shipment_id || <span className={isHoliday ? 'text-white/30' : 'text-slate-300'}>—</span>}</td>
                <td className={`px-6 py-4 text-sm text-center font-black ${isExisting || isHoliday ? 'text-white/80' : 'text-slate-600'}`}>{row.jam_berangkat || '—'}</td>
                <td className={`px-6 py-4 text-sm text-center font-black ${isExisting || isHoliday ? 'text-white/80' : 'text-slate-600'}`}>{row.jam_pulang || '—'}</td>
                <td className={`px-6 py-4 text-sm text-center font-black ${isExisting || isHoliday ? 'text-white' : 'text-slate-900'}`}>{row.jumlah_toko || '—'}</td>
                <td className={`px-6 py-4 text-sm text-center font-black ${isExisting || isHoliday ? 'text-blue-300' : 'text-blue-700'}`}>{row.terkirim || '—'}</td>
                <td className={`px-6 py-4 text-sm text-center font-black ${isExisting || isHoliday ? 'text-red-300' : 'text-red-700'}`}>{row.gagal !== null ? row.gagal : '—'}</td>
                <td className={`px-6 py-4 text-sm max-w-50 truncate font-medium ${isExisting || isHoliday ? 'text-white/70' : 'text-slate-500'}`}>
                  {row.keterangan || <span className={isHoliday ? 'text-white/20 italic' : 'text-slate-200 italic'}>No notes</span>}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {!isReadonly && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEdit(row)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          isExisting 
                            ? 'bg-white text-slate-900 border-white hover:bg-slate-100' 
                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                        }`}
                        title={isExisting ? 'Edit Data' : 'Input Baru'}
                      >
                        {isExisting ? <Edit2 size={14} strokeWidth={3} /> : <Plus size={14} strokeWidth={3} />}
                      </motion.button>
                    )}
                    {isExisting && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(row)}
                        className="p-2 rounded-lg bg-white text-red-600 border-2 border-red-100 hover:bg-red-50 hover:border-red-200 transition-all"
                        title="Hapus Data"
                      >
                        <Trash2 size={14} strokeWidth={3} />
                      </motion.button>
                    )}
                    {isReadonly && <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">Locked</span>}
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ShipmentTable;
