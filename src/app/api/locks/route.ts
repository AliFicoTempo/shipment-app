import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import pool from '@/lib/db';

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
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  try {
    await ensureLocksTable();
    const nik_kerja = searchParams.get('nik_kerja');
    const params: any[] = [startDate, endDate];

    const whereNik = nik_kerja ? `AND (nik_kerja IS NULL OR nik_kerja = $3)` : ``;
    if (nik_kerja) params.push(nik_kerja);

    const res = await query(
      `SELECT id, nik_kerja, start_date, end_date
       FROM shipment_locks
       WHERE NOT (end_date < $1::date OR start_date > $2::date)
       ${whereNik}
       ORDER BY start_date ASC`,
      params
    );

    const exactGlobal = res.rows.find((r: any) => {
      const sd = String(r.start_date).slice(0, 10);
      const ed = String(r.end_date).slice(0, 10);
      return r.nik_kerja === null && sd === startDate && ed === endDate;
    });

    return NextResponse.json({
      locks: res.rows.map((r: any) => ({
        id: r.id,
        startDate: String(r.start_date).slice(0, 10),
        endDate: String(r.end_date).slice(0, 10),
        nik_kerja: r.nik_kerja,
      })),
      exactLockId: exactGlobal?.id ?? null,
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
    const startDate = body?.startDate;
    const endDate = body?.endDate;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await ensureLocksTable();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const overlaps = await client.query(
        `SELECT id, start_date, end_date
         FROM shipment_locks
         WHERE nik_kerja IS NULL
           AND NOT (end_date < $1::date - 1 OR start_date > $2::date + 1)
         ORDER BY start_date ASC`,
        [startDate, endDate]
      );

      let mergedStart = startDate;
      let mergedEnd = endDate;
      for (const row of overlaps.rows) {
        const sd = String(row.start_date).slice(0, 10);
        const ed = String(row.end_date).slice(0, 10);
        if (sd < mergedStart) mergedStart = sd;
        if (ed > mergedEnd) mergedEnd = ed;
      }

      if (overlaps.rowCount && overlaps.rowCount > 0) {
        await client.query(
          `DELETE FROM shipment_locks
           WHERE nik_kerja IS NULL
             AND NOT (end_date < $1::date - 1 OR start_date > $2::date + 1)`,
          [startDate, endDate]
        );
      }

      const inserted = await client.query(
        `INSERT INTO shipment_locks (nik_kerja, start_date, end_date)
         VALUES (NULL, $1::date, $2::date)
         RETURNING id, nik_kerja, start_date, end_date`,
        [mergedStart, mergedEnd]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        id: inserted.rows[0].id,
        nik_kerja: inserted.rows[0].nik_kerja,
        startDate: String(inserted.rows[0].start_date).slice(0, 10),
        endDate: String(inserted.rows[0].end_date).slice(0, 10),
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!id && (!startDate || !endDate)) {
      return NextResponse.json({ error: 'Missing lock ID or date range' }, { status: 400 });
    }

    await ensureLocksTable();

    if (id) {
      const res = await query(`DELETE FROM shipment_locks WHERE id = $1`, [id]);
      return NextResponse.json({ deleted: res.rowCount ?? 0 });
    }

    const unlockStart = startDate as string;
    const unlockEnd = endDate as string;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const overlapping = await client.query(
        `SELECT id, start_date, end_date
         FROM shipment_locks
         WHERE nik_kerja IS NULL
           AND NOT (end_date < $1::date OR start_date > $2::date)
         ORDER BY start_date ASC`,
        [unlockStart, unlockEnd]
      );

      let deleted = 0;
      let updated = 0;
      let inserted = 0;

      for (const row of overlapping.rows) {
        const lockStart = String(row.start_date).slice(0, 10);
        const lockEnd = String(row.end_date).slice(0, 10);

        const unlockCoversAll = unlockStart <= lockStart && unlockEnd >= lockEnd;
        if (unlockCoversAll) {
          const r = await client.query(`DELETE FROM shipment_locks WHERE id = $1`, [row.id]);
          deleted += r.rowCount ?? 0;
          continue;
        }

        const overlapOnLeft = unlockStart <= lockStart && unlockEnd >= lockStart && unlockEnd < lockEnd;
        if (overlapOnLeft) {
          const r = await client.query(
            `UPDATE shipment_locks
             SET start_date = ($2::date + 1)
             WHERE id = $1`,
            [row.id, unlockEnd]
          );
          updated += r.rowCount ?? 0;
          continue;
        }

        const overlapOnRight = unlockStart > lockStart && unlockStart <= lockEnd && unlockEnd >= lockEnd;
        if (overlapOnRight) {
          const r = await client.query(
            `UPDATE shipment_locks
             SET end_date = ($2::date - 1)
             WHERE id = $1`,
            [row.id, unlockStart]
          );
          updated += r.rowCount ?? 0;
          continue;
        }

        const splitMiddle = unlockStart > lockStart && unlockEnd < lockEnd;
        if (splitMiddle) {
          const leftUpdate = await client.query(
            `UPDATE shipment_locks
             SET end_date = ($2::date - 1)
             WHERE id = $1`,
            [row.id, unlockStart]
          );
          updated += leftUpdate.rowCount ?? 0;

          const rightInsert = await client.query(
            `INSERT INTO shipment_locks (nik_kerja, start_date, end_date)
             VALUES (NULL, ($1::date + 1), $2::date)`,
            [unlockEnd, lockEnd]
          );
          inserted += rightInsert.rowCount ?? 0;
          continue;
        }
      }

      await client.query(
        `DELETE FROM shipment_locks
         WHERE nik_kerja IS NULL
           AND start_date > end_date`
      );

      await client.query('COMMIT');
      return NextResponse.json({ deleted, updated, inserted });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to delete lock' }, { status: 500 });
  }
}
