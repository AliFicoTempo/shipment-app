import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET shipments based on nik_kerja and date range
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nik_kerja = searchParams.get('nik_kerja');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!nik_kerja || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    const result = await query(
      `SELECT * FROM shipments_data 
       WHERE nik_kerja = $1 AND tanggal >= $2 AND tanggal <= $3 
       ORDER BY tanggal ASC`,
      [nik_kerja, startDate, endDate]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch shipments' }, { status: 500 });
  }
}

// POST to create or update shipment
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      nik_kerja, 
      tanggal, 
      shipment_id, 
      jam_berangkat, 
      jam_pulang, 
      jumlah_toko, 
      terkirim, 
      keterangan 
    } = data;

    // Server-side validation
    if (!nik_kerja || !tanggal || !shipment_id || !jam_berangkat || !jam_pulang || jumlah_toko === undefined || terkirim === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (String(shipment_id).length !== 10 || isNaN(Number(shipment_id)) || String(shipment_id).startsWith('0')) {
      return NextResponse.json({ error: 'Shipment ID must be 10 digits and not start with 0' }, { status: 400 });
    }

    if (Number(terkirim) > Number(jumlah_toko)) {
      return NextResponse.json({ error: 'Terkirim cannot be greater than Jumlah Toko' }, { status: 400 });
    }

    const gagal = Number(jumlah_toko) - Number(terkirim);
    if (gagal > 0 && !keterangan) {
      return NextResponse.json({ error: 'Keterangan is required when Gagal > 0' }, { status: 400 });
    }

    // Use UPSERT (INSERT ... ON CONFLICT)
    const result = await query(
      `INSERT INTO shipments_data (
        nik_kerja, tanggal, shipment_id, jam_berangkat, jam_pulang, jumlah_toko, terkirim, gagal, keterangan
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (nik_kerja, tanggal) DO UPDATE SET
        shipment_id = EXCLUDED.shipment_id,
        jam_berangkat = EXCLUDED.jam_berangkat,
        jam_pulang = EXCLUDED.jam_pulang,
        jumlah_toko = EXCLUDED.jumlah_toko,
        terkirim = EXCLUDED.terkirim,
        gagal = EXCLUDED.gagal,
        keterangan = EXCLUDED.keterangan
      RETURNING *`,
      [nik_kerja, tanggal, shipment_id, jam_berangkat, jam_pulang, jumlah_toko, terkirim, gagal, keterangan]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to save shipment' }, { status: 500 });
  }
}

// DELETE shipment
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing shipment ID' }, { status: 400 });
    }

    await query('DELETE FROM shipments_data WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to delete shipment' }, { status: 500 });
  }
}
