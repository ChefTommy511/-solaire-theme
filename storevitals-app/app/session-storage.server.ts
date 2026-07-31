import type { Session } from "@shopify/shopify-api";
import type { SessionStorage } from "@shopify/shopify-app-session-storage";
import { getDb, saveDbSync } from "./db.server";

/**
 * Custom sql.js-based SessionStorage for Shopify.
 * Replaces @shopify/shopify-app-session-storage-sqlite (which requires better-sqlite3).
 */
export class SqlJsSessionStorage implements SessionStorage {
  private ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private async init() {
    const db = await getDb();
    db.run(`
      CREATE TABLE IF NOT EXISTS shopify_sessions (
        id TEXT PRIMARY KEY,
        shop TEXT NOT NULL,
        state TEXT NOT NULL,
        isOnline INTEGER NOT NULL DEFAULT 0,
        scope TEXT,
        expires TEXT,
        accessToken TEXT,
        onlineAccessInfo TEXT
      );
    `);
    saveDbSync(db);
  }

  async storeSession(session: Session): Promise<Session> {
    await this.ready;
    const db = await getDb();
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO shopify_sessions (id, shop, state, isOnline, scope, expires, accessToken, onlineAccessInfo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.bind([
      session.id,
      session.shop,
      session.state,
      session.isOnline ? 1 : 0,
      session.scope ?? null,
      session.expires ? session.expires.toISOString() : null,
      session.accessToken ?? null,
      session.onlineAccessInfo ? JSON.stringify(session.onlineAccessInfo) : null,
    ]);
    stmt.step();
    stmt.free();
    saveDbSync(db);
    return session;
  }

  async loadSession(id: string): Promise<Session | undefined> {
    await this.ready;
    const db = await getDb();
    const stmt = db.prepare("SELECT * FROM shopify_sessions WHERE id = ?");
    stmt.bind([id]);
    let row: any = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();

    if (!row) return undefined;
    return this.rowToSession(row);
  }

  async deleteSession(id: string): Promise<boolean> {
    await this.ready;
    const db = await getDb();
    const stmt = db.prepare("DELETE FROM shopify_sessions WHERE id = ?");
    stmt.bind([id]);
    stmt.step();
    stmt.free();
    saveDbSync(db);
    return true;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    await this.ready;
    if (ids.length === 0) return true;
    const db = await getDb();
    const placeholders = ids.map(() => "?").join(", ");
    const stmt = db.prepare(`DELETE FROM shopify_sessions WHERE id IN (${placeholders})`);
    stmt.bind(ids);
    stmt.step();
    stmt.free();
    saveDbSync(db);
    return true;
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    await this.ready;
    const db = await getDb();
    const stmt = db.prepare("SELECT * FROM shopify_sessions WHERE shop = ?");
    stmt.bind([shop]);
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows.map((r) => this.rowToSession(r));
  }

  private rowToSession(row: any): Session {
    return {
      id: row.id as string,
      shop: row.shop as string,
      state: row.state as string,
      isOnline: (row.isOnline as number) === 1,
      scope: (row.scope as string) ?? undefined,
      expires: row.expires ? new Date(row.expires as string) : undefined,
      accessToken: (row.accessToken as string) ?? undefined,
      onlineAccessInfo: row.onlineAccessInfo
        ? (JSON.parse(row.onlineAccessInfo as string) as any)
        : undefined,
    };
  }
}
