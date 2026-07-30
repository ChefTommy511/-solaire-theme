/**
 * StoreVitals Database Layer
 *
 * Pure WASM SQLite via sql.js — zero native dependencies.
 * Works on any platform (Windows, macOS, Linux) without build tools.
 *
 * This module is used by the scanner for persisting scan results and issues.
 */

import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";
import type { Database as SqlJsDatabase } from "sql.js";

const DB_PATH = path.resolve(process.cwd(), "prisma", "storevitals.db");

let _db: SqlJsDatabase | null = null;

/** Get (or initialize) the sql.js database. */
async function getDb(): Promise<SqlJsDatabase> {
  if (_db) return _db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(filebuffer);
  } else {
    _db = new SQL.Database();
    ensureDir();
    persist();
  }

  // _db is guaranteed non-null here since we just assigned it above
  const db = _db!;
  migrate(db);
  return db;
}

/** Ensure the data directory exists. */
function ensureDir(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Persist the database to disk. */
function persist(): void {
  if (!_db) return;
  ensureDir();
  fs.writeFileSync(DB_PATH, Buffer.from(_db.export()));
}

/** Run migrations to create tables if they don't exist. */
function migrate(db: SqlJsDatabase): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      pages_scanned INTEGER DEFAULT 0,
      error TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      fix_recommendation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (scan_id) REFERENCES scans(id)
    );
  `);

  persist();
}

// ---------------------------------------------------------------------------
// Exported database operations
// ---------------------------------------------------------------------------

export interface ScanRow {
  id: number;
  shop: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  pages_scanned: number;
  error: string | null;
}

export interface IssueRow {
  id: number;
  scan_id: number;
  url: string;
  type: string;
  severity: string;
  message: string;
  fix_recommendation: string | null;
  created_at: string;
}

/** Create a new scan record. Returns the scan ID. */
export async function createScan(shop: string): Promise<number> {
  const db = await getDb();
  db.run("INSERT INTO scans (shop) VALUES (?)", [shop]);
  persist();
  const result = db.exec("SELECT last_insert_rowid() as id");
  return result[0].values[0][0] as number;
}

/** Mark a scan as completed. */
export async function completeScan(
  scanId: number,
  pagesScanned: number
): Promise<void> {
  const db = await getDb();
  db.run(
    "UPDATE scans SET status = 'completed', completed_at = datetime('now'), pages_scanned = ? WHERE id = ?",
    [pagesScanned, scanId]
  );
  persist();
}

/** Mark a scan as failed with an error message. */
export async function failScan(
  scanId: number,
  error: string
): Promise<void> {
  const db = await getDb();
  db.run(
    "UPDATE scans SET status = 'failed', completed_at = datetime('now'), error = ? WHERE id = ?",
    [error, scanId]
  );
  persist();
}

/** Insert issues for a scan. */
export async function insertIssues(
  scanId: number,
  issues: Array<{
    url: string;
    type: string;
    severity: string;
    message: string;
    fix_recommendation?: string;
  }>
): Promise<void> {
  const db = await getDb();
  const stmt = db.prepare(
    "INSERT INTO issues (scan_id, url, type, severity, message, fix_recommendation) VALUES (?, ?, ?, ?, ?, ?)"
  );
  for (const issue of issues) {
    stmt.run([
      scanId,
      issue.url,
      issue.type,
      issue.severity,
      issue.message,
      issue.fix_recommendation || null,
    ]);
  }
  stmt.free();
  persist();
}

/** Get all issues for a scan. */
export async function getIssuesForScan(
  scanId: number
): Promise<IssueRow[]> {
  const db = await getDb();
  const result = db.exec(
    "SELECT * FROM issues WHERE scan_id = ? ORDER BY severity, created_at",
    [scanId]
  );
  if (!result.length) return [];
  return rowsToObjects(result[0].columns, result[0].values) as IssueRow[];
}

/** Get the most recent scan for a shop. */
export async function getLatestScan(
  shop: string
): Promise<ScanRow | null> {
  const db = await getDb();
  const result = db.exec(
    "SELECT * FROM scans WHERE shop = ? ORDER BY id DESC LIMIT 1",
    [shop]
  );
  if (!result.length || !result[0].values.length) return null;
  return rowsToObjects(result[0].columns, result[0].values)[0] as ScanRow;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowsToObjects(
  columns: string[],
  values: any[][]
): Record<string, any>[] {
  return values.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}
