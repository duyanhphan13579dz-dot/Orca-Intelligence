import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// ====================================================================
// Lazy database initialization
// --------------------------------------------------------------------
// KHÔNG đọc DATABASE_URL, KHÔNG tạo Pool/drizzle và KHÔNG throw ở
// top-level (thời điểm import / build). Mọi khởi tạo chỉ diễn ra khi
// thực sự cần dùng tại runtime (API route / server action / service).
// Nhờ vậy `next build` thu thập page data mà không bị "DATABASE_URL is
// required" và không cố kết nối DB trong lúc build.
// ====================================================================

type DrizzleDb = NodePgDatabase<Record<string, never>>;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: DrizzleDb;
};

let cachedPool: Pool | undefined = globalForDb.__arenaNextJsPostgresqlPool;
let cachedDb: DrizzleDb | undefined = globalForDb.__arenaNextJsPostgresqlDb;

/** Lấy Pool (khởi tạo lười). Chỉ gọi tại runtime. */
export function getPool(): Pool {
  if (cachedPool) return cachedPool;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    // Ném lỗi tại RUNTIME (khi gọi hàm), không phải lúc import/build.
    throw new Error("DATABASE_URL is required");
  }

  cachedPool = new Pool({ connectionString: databaseUrl });

  // Lưu vào global để tránh tạo nhiều pool khi hot-reload ở môi trường dev.
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = cachedPool;
  }
  return cachedPool;
}

/** Lấy Drizzle client (khởi tạo lười, singleton). Chỉ gọi tại runtime. */
export function getDb(): DrizzleDb {
  if (cachedDb) return cachedDb;

  cachedDb = drizzle(getPool());

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlDb = cachedDb;
  }
  return cachedDb;
}

/**
 * `db` — giữ nguyên API `import { db } from "@/db"` và cú pháp
 * `db.select()/insert()/update()/delete()/execute()` ở mọi nơi đang dùng,
 * NHƯNG là một Proxy lười: không khởi tạo kết nối tại thời điểm import.
 * Mỗi lần truy cập thuộc tính mới gọi getDb() (lazy) ở runtime.
 */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(instance) : value;
  },
});
