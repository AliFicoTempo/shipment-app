import { isSunday, format, parseISO, eachDayOfInterval } from 'date-fns';

export const getRatioColor = (ratio: number): string => {
  if (ratio === 0) return '#000000';
  if (ratio >= 1 && ratio <= 14) return '#550000';
  if (ratio >= 15 && ratio <= 24) return '#FF0000';
  if (ratio >= 25 && ratio <= 34) return '#FF8000';
  if (ratio >= 35 && ratio <= 44) return '#FFD900';
  if (ratio >= 45 && ratio <= 54) return '#BBFF00';
  if (ratio >= 55 && ratio <= 64) return '#00FF00';
  if (ratio >= 65 && ratio <= 74) return '#00FF6A';
  if (ratio >= 75 && ratio <= 84) return '#00FFFF';
  if (ratio >= 85 && ratio <= 94) return '#0080FF';
  if (ratio >= 95 && ratio <= 100) return '#0000FF';
  return '#000000';
};

export const calculateShipmentStats = (
  startDate: string,
  endDate: string,
  shipments: any[],
  holidays: any[]
) => {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = eachDayOfInterval({ start, end });

  const holidayDates = new Set(holidays.map(h => format(new Date(h.tanggal_libur), 'yyyy-MM-dd')));

  let hk = 0;
  let hke = 0;

  days.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isHoliday = holidayDates.has(dateStr);
    const isSun = isSunday(day);
    const hasShipment = Array.isArray(shipments) && shipments.some(s => format(new Date(s.tanggal), 'yyyy-MM-dd') === dateStr);

    // HK Logic: 
    // - Not Sunday AND Not Holiday
    // - OR (Sunday or Holiday) AND Has Shipment
    if ((!isSun && !isHoliday) || hasShipment) {
      hk++;
    }

    // HKE Logic:
    // - Has Shipment
    if (hasShipment) {
      hke++;
    }
  });

  const ratio = hk > 0 ? Math.round((hke / hk) * 100) : 0;
  return { hk, hke, ratio, color: getRatioColor(ratio) };
};

export const getRowStatus = (date: Date, holidayMap: Map<string, string>, hasShipment: boolean) => {
  const isSun = isSunday(date);
  const dateStr = format(date, 'yyyy-MM-dd');
  const holidayLabel = holidayMap.get(dateStr);
  const isHoliday = !!holidayLabel;

  if (isSun) {
    return hasShipment ? 'Masuk Minggu' : 'Libur Minggu';
  }

  if (isHoliday) {
    return holidayLabel; // Use keterangan from DB for HKNE
  }

  return hasShipment ? 'Sudah Diisi' : 'Belum Diisi';
};
