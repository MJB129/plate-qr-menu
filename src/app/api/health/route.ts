import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx.env as Record<string, unknown>;
    const db = env.DB as Record<string, Function>;

    const r: Record<string, unknown> = {};

    // Test 1: bind returns a new object?
    const s = db.prepare('SELECT ?1 AS val');
    const s2 = s.bind('hello');
    r.bindReturnsNew = s !== s2;
    
    // Test 2: use the returned object
    const r2 = await s2.all();
    r.bindThenAll = r2;

    // Test 3: try with unnamed ?
    try {
      const s3 = db.prepare('SELECT ? AS val');
      const bound = s3.bind('world');
      r.unnamedBind = await bound.all();
    } catch (e) {
      r.unnamedBindError = String(e);
    }

    // Test 4: actual INSERT pattern
    try {
      const id = crypto.randomUUID();
      const ts = new Date().toISOString();
      const stmt = db.prepare(
        'INSERT INTO users (id, email, password_hash, restaurant_name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
      );
      const bound = stmt.bind(id, 'x@t.com', 'h', 'X', ts, ts);
      const result = await bound.run();
      r.insert = result;
      // cleanup
      const del = db.prepare('DELETE FROM users WHERE id = ?1');
      await del.bind(id).run();
    } catch (e) {
      r.insertError = String(e);
    }

    return NextResponse.json({ status: 'ok', r });
  } catch (err) {
    return NextResponse.json({ status: 'error', error: String(err) }, { status: 500 });
  }
}
