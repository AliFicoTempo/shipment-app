'use client';

import React from 'react';
import { Calendar, User, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterFormProps {
  users: { nik_kerja: string; nama_kerja: string }[];
  filters: { nik_kerja: string; startDate: string; endDate: string };
  setFilters: (filters: any) => void;
  onShow: () => void;
}

const FilterForm: React.FC<FilterFormProps> = ({ users, filters, setFilters, onShow }) => {
  const isButtonActive = filters.nik_kerja && filters.startDate && filters.endDate && filters.endDate >= filters.startDate;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl p-6 border-2 border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-end"
    >
      <div className="flex-1 w-full space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
          <User size={14} className="text-slate-900" /> Nama Driver
        </label>
        <div className="relative">
          <select
            value={filters.nik_kerja}
            onChange={(e) => setFilters({ ...filters, nik_kerja: e.target.value })}
            className="w-full h-12 px-4 rounded-lg bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold focus:border-slate-900 focus:bg-white transition-all cursor-pointer appearance-none outline-none"
          >
            <option key="default-user" value="">Pilih Nama</option>
            {users.map((user, i) => (
              <option key={`user-${user.nik_kerja || i}`} value={user.nik_kerja}>
                {user.nama_kerja}
              </option>
            ))}
          </select>
          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Calendar size={14} className="text-slate-900" /> Tanggal Awal
        </label>
        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          className="w-full h-12 px-4 rounded-lg bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold focus:border-slate-900 focus:bg-white transition-all cursor-pointer outline-none"
        />
      </div>

      <div className="flex-1 w-full space-y-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
          <Calendar size={14} className="text-slate-900" /> Tanggal Akhir
        </label>
        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          className="w-full h-12 px-4 rounded-lg bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold focus:border-slate-900 focus:bg-white transition-all cursor-pointer outline-none"
        />
      </div>

      <motion.button
        whileTap={isButtonActive ? { scale: 0.97 } : {}}
        onClick={onShow}
        disabled={!isButtonActive}
        className={`h-12 px-10 rounded-lg font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 w-full md:w-auto border-2 ${
          isButtonActive 
            ? 'bg-slate-900 text-white border-slate-900 hover:bg-black hover:border-black shadow-md' 
            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
        }`}
      >
        Tampilkan
      </motion.button>
    </motion.div>
  );
};

export default FilterForm;
