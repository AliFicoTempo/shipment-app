import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, AlertCircle, Check, ChevronRight, MessageSquare, Plus } from 'lucide-react';

interface ShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  data: any;
  workerName: string;
}

const DEFAULT_KETERANGAN_OPTIONS = [
  "Toko Tutup",
  "Tidak Cukup Waktu",
  "Dobel/Salah Order"
];

const ShipmentModal: React.FC<ShipmentModalProps> = ({ isOpen, onClose, onSave, data, workerName }) => {
  const [formData, setFormData] = useState({
    shipment_id: '',
    jam_berangkat: '',
    jam_pulang: '',
    jumlah_toko: '',
    terkirim: '',
    keterangan: '',
  });

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);
  const [tempOtherText, setTempOtherText] = useState('');

  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      const initialKeterangan = data.keterangan || '';
      setFormData({
        shipment_id: data.shipment_id || '',
        jam_berangkat: data.jam_berangkat || '',
        jam_pulang: data.jam_pulang || '',
        jumlah_toko: data.jumlah_toko || '',
        terkirim: data.terkirim || '',
        keterangan: initialKeterangan,
      });

      // Parse existing keterangan to selected options
      if (initialKeterangan) {
        const parts = initialKeterangan.split(', ')
          .map((p: string) => p.trim())
          .filter((p: string, index: number, self: string[]) => 
            p !== '' && self.indexOf(p) === index
        );
        const standard = parts.filter((p: string) => DEFAULT_KETERANGAN_OPTIONS.includes(p));
        const other = parts.find((p: string) => !DEFAULT_KETERANGAN_OPTIONS.includes(p));
        
        setSelectedOptions(standard);
        if (other) {
          setOtherText(other);
        } else {
          setOtherText('');
        }
      } else {
        setSelectedOptions([]);
        setOtherText('');
      }
    }
  }, [data]);

  // Update formData.keterangan whenever selectedOptions or otherText changes
  useEffect(() => {
    const parts = [...selectedOptions];
    if (otherText) {
      parts.push(otherText);
    }
    setFormData(prev => ({ ...prev, keterangan: parts.join(', ') }));
  }, [selectedOptions, otherText]);

  const toggleOption = (option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option) 
        : [...prev, option]
    );
  };

  const handleOtherSave = () => {
    setOtherText(tempOtherText);
    setIsOtherModalOpen(false);
  };

  const validate = () => {
    if (!formData.shipment_id || String(formData.shipment_id).length !== 10 || isNaN(Number(formData.shipment_id)) || String(formData.shipment_id).startsWith('0')) {
      return 'ShipmentID wajib 10 digit';
    }
    if (!formData.jam_berangkat || !formData.jam_pulang) {
      return 'Jam wajib diisi';
    }
    if (!formData.jumlah_toko || Number(formData.jumlah_toko) <= 0) {
      return 'Toko > 0';
    }
    if (formData.terkirim === '' || Number(formData.terkirim) < 0) {
      return 'Terkirim >= 0';
    }
    if (Number(formData.terkirim) > Number(formData.jumlah_toko)) {
      return 'Terkirim <= Total';
    }
    const gagal = Number(formData.jumlah_toko) - Number(formData.terkirim);
    if (gagal > 0 && !formData.keterangan) {
      return 'Keterangan wajib (Gagal > 0)';
    }
    return null;
  };

  const handleSave = () => {
    const error = validate();
    if (error) {
      setWarning(error);
      return;
    }
    setWarning(null);
    onSave({
      ...formData,
      id: data.id,
      nik_kerja: data.nik_kerja,
      tanggal: data.dateStr,
    });
  };

  const gagalCount = formData.jumlah_toko && formData.terkirim 
    ? Math.max(0, Number(formData.jumlah_toko) - Number(formData.terkirim)) 
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="shipment-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key="shipment-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />
          
          <motion.div
            key="shipment-modal-content"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden border-2 border-slate-900"
          >
            {/* Header */}
            <div className="bg-slate-900 px-8 py-6 flex items-center justify-between border-b-2 border-slate-900">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">
                  {data?.shipment_id ? 'Edit Shipment' : 'Tambah Shipment'}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{data?.dateStr}</span>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{workerName}</span>
                </div>
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={onClose} 
                className="p-2 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all"
              >
                <X size={20} strokeWidth={3} />
              </motion.button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              {warning && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 p-4 rounded-lg flex items-start gap-4"
                >
                  <AlertCircle size={20} className="text-red-600 shrink-0" />
                  <span className="text-[11px] font-black text-red-700 uppercase tracking-wide leading-relaxed">{warning}</span>
                </motion.div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nomor Shipment</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.shipment_id}
                    onChange={(e) => setFormData({ ...formData, shipment_id: e.target.value.replace(/\D/g, '') })}
                    className="w-full h-12 px-4 rounded-lg bg-slate-50 border-2 border-slate-200 text-slate-900 font-black tracking-widest focus:border-slate-900 focus:bg-white transition-all outline-none"
                    placeholder="0000000000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Berangkat</label>
                    <input
                      type="time"
                      value={formData.jam_berangkat}
                      onChange={(e) => setFormData({ ...formData, jam_berangkat: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg bg-slate-50 border-2 border-slate-200 text-slate-900 font-black focus:border-slate-900 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Pulang</label>
                    <input
                      type="time"
                      value={formData.jam_pulang}
                      onChange={(e) => setFormData({ ...formData, jam_pulang: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg bg-slate-50 border-2 border-slate-200 text-slate-900 font-black focus:border-slate-900 focus:bg-white transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Jml DP</label>
                    <input
                      type="number"
                      value={formData.jumlah_toko}
                      onChange={(e) => setFormData({ ...formData, jumlah_toko: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg bg-slate-50 border-2 border-slate-200 text-slate-900 font-black focus:border-slate-900 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-blue-700 uppercase tracking-widest ml-1">Terkirim</label>
                    <input
                      type="number"
                      value={formData.terkirim}
                      onChange={(e) => setFormData({ ...formData, terkirim: e.target.value })}
                      className="w-full h-12 px-4 rounded-lg bg-blue-50 border-2 border-blue-200 text-blue-700 font-black focus:border-blue-700 focus:bg-white transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-red-700 uppercase tracking-widest ml-1">Gagal</label>
                    <div className="w-full h-12 px-4 rounded-lg bg-red-50 border-2 border-red-200 text-red-700 font-black flex items-center shadow-sm">
                      <span className="ml-4">{gagalCount}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className={`text-[11px] font-black uppercase tracking-widest ml-1 ${gagalCount > 0 ? 'text-slate-500' : 'text-slate-300'}`}>
                    Keterangan {gagalCount > 0 && <span className="text-red-500 animate-pulse">*</span>}
                  </label>
                  
                  <button
                    type="button"
                    disabled={gagalCount === 0}
                    onClick={() => setIsSelectionModalOpen(true)}
                    className={`w-full min-h-14 p-4 rounded-lg border-2 text-left flex flex-wrap gap-2 items-center transition-all outline-none ${
                      gagalCount === 0 
                        ? 'bg-slate-50 border-slate-100 cursor-not-allowed opacity-50' 
                        : 'bg-slate-50 border-slate-200 hover:border-slate-900 focus:border-slate-900'
                    }`}
                  >
                    {selectedOptions.length === 0 && !otherText ? (
                      <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                        <MessageSquare size={14} />
                        {gagalCount === 0 ? 'Tidak Ada Gagal' : 'Klik untuk isi keterangan...'}
                      </div>
                    ) : (
                      <>
                        {selectedOptions.map((opt, i) => (
                          <span key={`opt-${opt}-${i}`} className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded flex items-center gap-1 uppercase tracking-widest border border-slate-900">
                            {opt}
                          </span>
                        ))}
                        {otherText && (
                          <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded flex items-center gap-1 uppercase tracking-widest border border-blue-700">
                            {otherText}
                          </span>
                        )}
                      </>
                    )}
                    {gagalCount > 0 && <ChevronRight size={16} className="ml-auto text-slate-400" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 pt-0">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className="w-full h-14 bg-slate-900 text-white rounded-lg font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <Save size={18} strokeWidth={3} /> Simpan Data
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reason Selection Popup */}
      {isSelectionModalOpen && (
        <div key="selection-modal-overlay" className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <motion.div
            key="selection-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSelectionModalOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            key="selection-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border-2 border-slate-900"
          >
            <div className="bg-slate-900 p-6 flex items-center justify-between border-b-2 border-slate-900">
              <h4 className="text-sm font-black text-white uppercase tracking-widest leading-none">Pilih Keterangan</h4>
              <button onClick={() => setIsSelectionModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={18} strokeWidth={3} />
              </button>
            </div>
            
            <div className="p-2">
              {DEFAULT_KETERANGAN_OPTIONS.map((opt, i) => {
                const active = selectedOptions.includes(opt);
                return (
                  <button
                    key={`option-${opt}-${i}`}
                    type="button"
                    onClick={() => toggleOption(opt)}
                    className={`
                      w-full px-6 py-4 text-left flex items-center justify-between group
                      transition-all
                      border-b border-slate-200 last:border-none
                      hover:bg-slate-50
                    `}
                  >
                    <span
                      className={`
                        text-[11px] font-black uppercase tracking-widest transition-colors
                        ${active ? 'text-blue-600' : 'text-black'}
                      `}
                    >
                      {opt}
                    </span>

                    <div
                      className={`
                        w-6 h-6 rounded-md flex items-center justify-center transition-all
                        border-2
                        ${active 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-slate-300 bg-white'}
                      `}
                    >
                      {active && (
                        <Check size={14} className="text-white" strokeWidth={4} />
                      )}
                    </div>
                  </button>
                );
              })}
              
              <div className="h-px bg-slate-100 my-2 mx-4" />
              
              <button
                type="button"
                onClick={() => {
                  setTempOtherText(otherText);
                  setIsOtherModalOpen(true);
                }}
                className="
                  w-full px-6 py-4 text-left flex items-center justify-between group
                  transition-all
                  border-t border-slate-200
                  hover:bg-slate-50"><div className="flex flex-col">
                  <span
                    className={`
                      text-[11px] font-black uppercase tracking-widest transition-colors
                      ${otherText ? 'text-blue-600' : 'text-black'}
                    `}
                  >
                    Lainnya
                  </span>

                  {otherText && (
                    <span className="text-[9px] font-bold text-blue-500 truncate max-w-45 mt-1">
                      {otherText}
                    </span>
                  )}
                </div>
                <div
                  className={`
                    w-6 h-6 rounded-md flex items-center justify-center transition-all
                    border-2
                    ${otherText
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-300 bg-white group-hover:border-blue-500'}`}>
                  {otherText ? (
                    <Check size={14} className="text-white" strokeWidth={4} />
                  ) : (
                    <Plus size={14} className="text-slate-400 group-hover:text-blue-600" strokeWidth={3} />
                  )}
                </div>
              </button>
            </div>

            <div className="p-6 pt-2">
              <button
                onClick={() => setIsSelectionModalOpen(false)}
                className="w-full h-12 bg-slate-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-black transition-all"
              >
                Selesai
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Other Reason Modal */}
      {isOtherModalOpen && (
        <div key="other-modal-overlay" className="fixed inset-0 z-70 flex items-center justify-center p-4">
          <motion.div
            key="other-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOtherModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            key="other-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl p-8 border-2 border-slate-900"
          >
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Keterangan Lainnya</h4>
            <textarea
              autoFocus
              value={tempOtherText}
              onChange={(e) => setTempOtherText(e.target.value)}
              className="w-full p-5 rounded-lg bg-slate-50 border-2 border-slate-200 text-slate-900 font-bold focus:border-slate-900 focus:bg-white transition-all resize-none h-32 outline-none mb-6 text-sm"
              placeholder="Tulis alasan di sini..."
            />
            <div className="flex gap-4">
              <button
                onClick={() => setIsOtherModalOpen(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleOtherSave}
                className="flex-1 h-12 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
              >
                Simpan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShipmentModal;