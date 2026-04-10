'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import FilterForm from '@/components/FilterForm';
import StatsCard from '@/components/StatsCard';
import ShipmentTable from '@/components/ShipmentTable';
import ShipmentCard from '@/components/ShipmentCard';
import ShipmentModal from '@/components/ShipmentModal';
import DeleteModal from '@/components/DeleteModal';
import ConfirmModal from '@/components/ConfirmModal';
import { calculateShipmentStats, getRowStatus } from '@/lib/logic';
import { Truck, Loader2 } from 'lucide-react';

export default function Home() {
  const [users, setUsers] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [filters, setFilters] = useState({ nik_kerja: '', startDate: '', endDate: '' });
  const [shipments, setShipments] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals state
  const [shipmentModal, setShipmentModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'success' | 'error'; message: string }>({ 
    open: false, type: 'success', message: '' 
  });

  const fetchData = useCallback(async () => {
    if (!filters.nik_kerja || !filters.startDate || !filters.endDate) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/shipments?nik_kerja=${filters.nik_kerja}&startDate=${filters.startDate}&endDate=${filters.endDate}`);
      const data = await res.json();
      
      if (res.ok) {
        setShipments(Array.isArray(data) ? data : []);
        setIsDataLoaded(true);
      } else {
        setShipments([]);
        setConfirmModal({ open: true, type: 'error', message: data.error || 'Gagal mengambil data dari server.' });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setShipments([]);
      setConfirmModal({ open: true, type: 'error', message: 'Gagal mengambil data dari server.' });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Initial fetch for users and holidays
    const init = async () => {
      try {
        const [usersRes, holidaysRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/holidays')
        ]);
        setUsers(await usersRes.json());
        setHolidays(await holidaysRes.json());
      } catch (error) {
        console.error('Init error:', error);
      }
    };
    init();
  }, []);

  const handleSaveShipment = async (formData: any) => {
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShipmentModal({ open: false, data: null });
        setConfirmModal({ 
          open: true, 
          type: 'success', 
          message: formData.id ? 'Data shipment berhasil diperbarui.' : 'Data shipment berhasil disimpan.' 
        });
        fetchData();
      } else {
        const err = await res.json();
        setConfirmModal({ open: true, type: 'error', message: err.error || 'Gagal menyimpan data.' });
      }
    } catch (error) {
      setConfirmModal({ open: true, type: 'error', message: 'Gagal terhubung ke server.' });
    }
  };

  const handleDeleteShipment = async () => {
    if (!deleteModal.data?.id) return;
    try {
      const res = await fetch(`/api/shipments?id=${deleteModal.data.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteModal({ open: false, data: null });
        setConfirmModal({ open: true, type: 'success', message: 'Data shipment berhasil dihapus.' });
        fetchData();
      } else {
        setConfirmModal({ open: true, type: 'error', message: 'Gagal menghapus data.' });
      }
    } catch (error) {
      setConfirmModal({ open: true, type: 'error', message: 'Gagal terhubung ke server.' });
    }
  };

  // Generate full list of days for display
  const displayData = React.useMemo(() => {
    if (!isDataLoaded || !filters.startDate || !filters.endDate) return [];
    
    const start = parseISO(filters.startDate);
    const end = parseISO(filters.endDate);
    const days = eachDayOfInterval({ start, end });
    const holidayMap = new Map(Array.isArray(holidays) ? holidays.map(h => [format(new Date(h.tanggal_libur), 'yyyy-MM-dd'), h.keterangan]) : []);
    const shipmentMap = new Map(Array.isArray(shipments) ? shipments.map(s => [format(new Date(s.tanggal), 'yyyy-MM-dd'), s]) : []);

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const shipment = shipmentMap.get(dateStr);
      return {
        dateStr,
        ...shipment,
        status: getRowStatus(day, holidayMap, !!shipment),
        nik_kerja: filters.nik_kerja, // Ensure nik_kerja is passed for new entries
      };
    });
  }, [isDataLoaded, filters, shipments, holidays]);

  const stats = React.useMemo(() => {
    if (!isDataLoaded || !filters.startDate || !filters.endDate) return { hk: 0, hke: 0, ratio: 0, color: '#000000' };
    return calculateShipmentStats(filters.startDate, filters.endDate, shipments, holidays);
  }, [isDataLoaded, filters, shipments, holidays]);

  const selectedWorkerName = users.find(u => u.nik_kerja === filters.nik_kerja)?.nama_kerja || '';

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 pt-4">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center shadow-premium-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <Truck className="text-white relative z-10" size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 uppercase">Shipment_Tracker</h1>
              <div className="flex items-center gap-2">
                <span className="w-8 h-0.5 bg-blue-600 rounded-full" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Monitoring System v2.0</p>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-premium border border-slate-100/50">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Database Linked</span>
          </div>
        </header>

        {/* Filter Section */}
        <FilterForm 
          users={users} 
          filters={filters} 
          setFilters={setFilters} 
          onShow={fetchData} 
        />

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="relative">
                <Loader2 className="text-blue-600 animate-spin" size={48} strokeWidth={2.5} />
                <div className="absolute inset-0 blur-xl bg-blue-400/20 rounded-full" />
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Memproses Data...</p>
            </motion.div>
          ) : isDataLoaded ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <StatsCard {...stats} />
              
              <div className="space-y-4">
                {/* Tambahkan div pembungkus sticky di sini */}
                <div className="sticky top-0 z-20 bg-[#f8fafc] py-4 -mx-1">
                  <div className="p-4 md:p-8 flex items-center justify-center px-1">
                    <h2 className="text-lg font-black text-slate-800 tracking-normal">
                      ———— Detail Pengiriman ————
                    </h2>
                  </div>
                </div>

                <ShipmentTable 
                  data={displayData} 
                  onEdit={(row) => setShipmentModal({ open: true, data: row })} 
                  onDelete={(row) => setDeleteModal({ open: true, data: row })}
                />
                <ShipmentCard 
                  data={displayData} 
                  onEdit={(row) => setShipmentModal({ open: true, data: row })} 
                  onDelete={(row) => setDeleteModal({ open: true, data: row })}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center px-4"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                <Calendar className="text-slate-300" size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Belum Ada Data</h3>
              <p className="text-sm font-bold text-slate-400 max-w-xs leading-relaxed">
                Silakan pilih nama kerja dan rentang tanggal untuk menampilkan data shipment.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <ShipmentModal 
        isOpen={shipmentModal.open} 
        onClose={() => setShipmentModal({ open: false, data: null })}
        onSave={handleSaveShipment}
        data={shipmentModal.data}
        workerName={selectedWorkerName}
      />

      <DeleteModal 
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, data: null })}
        onConfirm={handleDeleteShipment}
        date={deleteModal.data ? format(new Date(deleteModal.data.dateStr), 'dd/MM/yyyy') : ''}
      />

      <ConfirmModal 
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        type={confirmModal.type}
        message={confirmModal.message}
      />
    </main>
  );
}

// Minimal helper component
const Calendar = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);
