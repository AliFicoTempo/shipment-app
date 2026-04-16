import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function getAdminTokenFromRequest(request: Request) {
  const headerToken = request.headers.get('x-admin-token');
  if (headerToken) return headerToken;

  const auth = request.headers.get('authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }

  return null;
}

function requireAdmin(request: Request) {
  const expected = process.env.ADMIN_TOKEN;
  const provided = getAdminTokenFromRequest(request);

  if (!expected) {
    return NextResponse.json({ error: 'Admin token belum dikonfigurasi di server.' }, { status: 403 });
  }

  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return null;
}

async function ensureLocksTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS shipment_locks (
      id BIGSERIAL PRIMARY KEY,
      nik_kerja TEXT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );

  await query(`CREATE INDEX IF NOT EXISTS idx_shipment_locks_range ON shipment_locks (start_date, end_date)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_shipment_locks_nik ON shipment_locks (nik_kerja)`);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nik_kerja = searchParams.get('nik_kerja') || '';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!nik_kerja || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    await ensureLocksTable();
    const res = await query(
      `SELECT id, nik_kerja, start_date, end_date
       FROM shipment_locks
       WHERE (nik_kerja IS NULL OR nik_kerja = $1)
         AND NOT (end_date < $2::date OR start_date > $3::date)
       ORDER BY start_date ASC`,
      [nik_kerja, startDate, endDate]
    );

    const exact = res.rows.find(
      (r: any) =>
        (r.nik_kerja === null || r.nik_kerja === nik_kerja) &&
        String(r.start_date).slice(0, 10) === startDate &&
        String(r.end_date).slice(0, 10) === endDate
    );

    return NextResponse.json({
      locks: res.rows.map((r: any) => ({
        id: r.id,
        startDate: String(r.start_date).slice(0, 10),
        endDate: String(r.end_date).slice(0, 10),
        nik_kerja: r.nik_kerja,
      })),
      exactLockId: exact?.id ?? null,
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch locks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const nik_kerja = body?.nik_kerja;
    const startDate = body?.startDate;
    const endDate = body?.endDate;

    if (!nik_kerja || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await ensureLocksTable();
    const res = await query(
      `INSERT INTO shipment_locks (nik_kerja, start_date, end_date)
       VALUES ($1, $2::date, $3::date)
       RETURNING id, nik_kerja, start_date, end_date`,
      [nik_kerja, startDate, endDate]
    );

    return NextResponse.json({
      id: res.rows[0].id,
      nik_kerja: res.rows[0].nik_kerja,
      startDate: String(res.rows[0].start_date).slice(0, 10),
      endDate: String(res.rows[0].end_date).slice(0, 10),
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to create lock' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing lock ID' }, { status: 400 });
    }

    await ensureLocksTable();
    const res = await query(`DELETE FROM shipment_locks WHERE id = $1`, [id]);
    return NextResponse.json({ deleted: res.rowCount ?? 0 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to delete lock' }, { status: 500 });
  }
}
