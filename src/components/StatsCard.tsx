'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  hk: number;
  hke: number;
  ratio: number;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ hk, hke, ratio, color }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-3 md:gap-6 mt-8"
    >
      {/* HK Card - Constant Blue #0000FF */}
      <div 
        className="p-4 md:p-8 rounded-xl shadow-md flex flex-col items-center justify-center relative overflow-hidden border-2 border-blue-700"
        style={{ backgroundColor: '#0000FF' }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <span className="relative z-10 text-[16px] md:text-[11px] font-black text-white uppercase md:tracking-[0.3em] mb-1">HARI  KERJA</span>
        <span className="relative z-10 text-4xl md:text-6xl font-black text-white tracking-tighter">{hk}</span>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      </div>
      
      {/* HKE Card - Color based on Ratio */}
      <div 
        className="p-4 md:p-8 rounded-xl shadow-md flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 border-2"
        style={{ 
          backgroundColor: color,
          borderColor: 'rgba(0,0,0,0.15)'
        }}
      >
        <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-[11px] md:text-[11px] font-black text-white uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1">HARI KERJA EFEKTIF</span>
            <div className="flex flex-col md:flex-row items-center md:items-baseline gap-1 md:gap-3 mt-1 md:mt-2">
              <span className="text-4xl md:text-6xl font-black text-white tracking-tighter">{hke}</span>
            </div>
          </div>
        </div>
    </motion.div>
  );
};

export default StatsCard;
