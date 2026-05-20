// Cloudflare Workers types for Plate Dashboard
// These types exist at runtime in Cloudflare Pages Functions

declare global {
  interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    error?: string;
    meta?: Record<string, unknown>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    all<T = unknown>(): Promise<D1Result<T>>;
    run<T = unknown>(): Promise<D1Result<T>>;
    raw<T = unknown>(): Promise<T[]>;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    dump(): Promise<ArrayBuffer>;
    exec(query: string): Promise<D1Result>;
  }

  var __env: Record<string, unknown> | undefined;
}

export {};
