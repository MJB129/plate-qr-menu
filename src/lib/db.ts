// Plate Dashboard — D1 Database Client
// Uses Cloudflare Workers D1 binding (available at env.DB in production)
// For local dev, uses wrangler's local D1 via getPlatformProxy

let db: D1Database | null = null;

export function getDB(): D1Database {
  if (!db) {
    // In Cloudflare Pages Functions, env.DB is injected
    // In local dev, @cloudflare/next-on-pages provides process.env
    throw new Error(
      'DB not initialized. Call initDB(env) first with the Cloudflare env bindings.'
    );
  }
  return db;
}

export function initDB(d1: D1Database) {
  db = d1;
}

// Generate UUID v4
export function generateId(): string {
  return crypto.randomUUID();
}

// SHA-256 hash for passwords
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate a random session token
export function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

// Escape SQL strings safely
function escape(str: string): string {
  return str.replace(/'/g, "''");
}

// Run a query and return all rows
export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = getDB();
  // Replace ? placeholders with numbered ones for D1
  let idx = 0;
  const prepared = sql.replace(/\?/g, () => `?${++idx}`);
  const stmt = db.prepare(prepared);
  if (params.length > 0) {
    stmt.bind(...params);
  }
  const result = await stmt.all();
  if (!result.success) {
    console.error('Query failed:', sql, result.error);
    return [];
  }
  return result.results as T[];
}

// Run a query and return the first row
export async function queryFirst<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await queryAll<T>(`${sql} LIMIT 1`, params);
  return rows[0] || null;
}

// Execute a query (INSERT/UPDATE/DELETE) and return success
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<{ success: boolean; error?: string }> {
  const db = getDB();
  let idx = 0;
  const prepared = sql.replace(/\?/g, () => `?${++idx}`);
  const stmt = db.prepare(prepared);
  if (params.length > 0) {
    stmt.bind(...params);
  }
  try {
    const result = await stmt.run();
    return { success: result.success, error: result.error || undefined };
  } catch (err) {
    console.error('Execute failed:', sql, err);
    return { success: false, error: String(err) };
  }
}

// Get the current ISO timestamp
export function now(): string {
  return new Date().toISOString();
}

// Parse a D1 boolean (0/1 as integer)
export function isTrue(val: unknown): boolean {
  return val === 1 || val === true || val === '1';
}

export function toInt(val: boolean): number {
  return val ? 1 : 0;
}
