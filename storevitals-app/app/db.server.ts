import initSqlJs, { type Database, type SqlJsStatic, type Statement } from "sql.js";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = path.resolve("./prisma/dev.db");

// ── Module-level lazy async init ──

let SQL: SqlJsStatic | null = null;
let _db: Database | null = null;

async function getSQL(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

async function getDb(): Promise<Database> {
  if (!_db) {
    const sql = await getSQL();
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      _db = new sql.Database(buffer);
    } else {
      _db = new sql.Database();
    }
    _db.run("PRAGMA journal_mode = WAL");
    _db.run("PRAGMA foreign_keys = ON");
    initSchemaSync(_db);
  }
  return _db;
}

function initSchemaSync(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_domain TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      pages_scanned INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning', 'info')),
      type TEXT NOT NULL,
      page_url TEXT NOT NULL,
      source_url TEXT,
      description TEXT NOT NULL,
      fix_recommendation TEXT NOT NULL,
      element_detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    );
  `);
  db.run("CREATE INDEX IF NOT EXISTS idx_issues_scan_id ON issues(scan_id)");
  db.run("CREATE INDEX IF NOT EXISTS idx_scans_shop_domain ON scans(shop_domain)");
  saveDbSync(db);
}

function saveDbSync(db: Database) {
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, buffer);
}

// ── Helpers for sql.js quirks ──

/** Run a query that returns rows (SELECT). Returns array of row objects. */
function queryAll(db: Database, sql: string, params?: Record<string, any>): any[] {
  // Build parameterized query manually since sql.js bind is positional
  let boundSql = sql;
  const values: any[] = [];
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      const placeholder = `@${key}`;
      // Replace @param with ? for positional binding
      while (boundSql.includes(placeholder)) {
        boundSql = boundSql.replace(placeholder, "?");
        values.push(val);
      }
    }
  }
  const stmt = db.prepare(boundSql);
  if (values.length > 0) {
    stmt.bind(values);
  }
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/** Run an INSERT/UPDATE/DELETE and return changes + lastInsertRowid */
function runMutate(
  db: Database,
  sql: string,
  params?: Record<string, any>
): { changes: number; lastInsertRowid: number } {
  let boundSql = sql;
  const values: any[] = [];
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      const placeholder = `@${key}`;
      while (boundSql.includes(placeholder)) {
        boundSql = boundSql.replace(placeholder, "?");
        values.push(val ?? null);
      }
    }
  }
  const stmt = db.prepare(boundSql);
  if (values.length > 0) {
    stmt.bind(values);
  }
  stmt.step();
  stmt.free();

  // Get last insert rowid
  const lastInsertRowid = db.exec("SELECT last_insert_rowid()")[0]?.values[0]?.[0] as number ?? 0;
  const changes = db.getRowsModified();

  saveDbSync(db);
  return { changes, lastInsertRowid };
}

// ── Scan CRUD ──

export async function createScan(shopDomain: string): Promise<{ id: number }> {
  const db = await getDb();
  const result = runMutate(
    db,
    "INSERT INTO scans (shop_domain, status, started_at) VALUES (?, 'running', datetime('now'))",
    { shop_domain: shopDomain }
  );
  return { id: result.lastInsertRowid };
}

export async function completeScan(scanId: number, pagesScanned: number) {
  const db = await getDb();
  runMutate(
    db,
    "UPDATE scans SET status = 'complete', pages_scanned = ?, completed_at = datetime('now') WHERE id = ?",
    { pages_scanned: pagesScanned, id: scanId }
  );
}

export async function failScan(scanId: number, pagesScanned: number) {
  const db = await getDb();
  runMutate(
    db,
    "UPDATE scans SET status = 'failed', pages_scanned = ?, completed_at = datetime('now') WHERE id = ?",
    { pages_scanned: pagesScanned, id: scanId }
  );
}

export async function getLatestScan(
  shopDomain: string
): Promise<{ id: number; status: string; pages_scanned: number; started_at: string; completed_at: string | null } | null> {
  const db = await getDb();
  const rows = queryAll(db, "SELECT * FROM scans WHERE shop_domain = ? ORDER BY id DESC LIMIT 1", {
    shop_domain: shopDomain,
  });
  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id as number,
    status: row.status as string,
    pages_scanned: row.pages_scanned as number,
    started_at: row.started_at as string,
    completed_at: row.completed_at as string | null,
  };
}

// ── Issue CRUD ──

export interface InsertIssue {
  scan_id: number;
  severity: "critical" | "warning" | "info";
  type: string;
  page_url: string;
  source_url?: string;
  description: string;
  fix_recommendation: string;
  element_detail?: string;
}

export async function insertIssue(issue: InsertIssue) {
  const db = await getDb();
  runMutate(
    db,
    `INSERT INTO issues (scan_id, severity, type, page_url, source_url, description, fix_recommendation, element_detail)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    {
      scan_id: issue.scan_id,
      severity: issue.severity,
      type: issue.type,
      page_url: issue.page_url,
      source_url: issue.source_url ?? null,
      description: issue.description,
      fix_recommendation: issue.fix_recommendation,
      element_detail: issue.element_detail ?? null,
    }
  );
}

export async function insertIssues(issues: InsertIssue[]) {
  const db = await getDb();
  db.run("BEGIN");
  try {
    for (const issue of issues) {
      let sql = `INSERT INTO issues (scan_id, severity, type, page_url, source_url, description, fix_recommendation, element_detail)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const stmt = db.prepare(sql);
      stmt.bind([
        issue.scan_id,
        issue.severity,
        issue.type,
        issue.page_url,
        issue.source_url ?? null,
        issue.description,
        issue.fix_recommendation,
        issue.element_detail ?? null,
      ]);
      stmt.step();
      stmt.free();
    }
    db.run("COMMIT");
    saveDbSync(db);
  } catch (err) {
    db.run("ROLLBACK");
    throw err;
  }
}

export interface IssueRow {
  id: number;
  scan_id: number;
  severity: "critical" | "warning" | "info";
  type: string;
  page_url: string;
  source_url: string | null;
  description: string;
  fix_recommendation: string;
  element_detail: string | null;
  created_at: string;
}

export async function getIssuesForScan(scanId: number): Promise<IssueRow[]> {
  const db = await getDb();
  const rows = queryAll(
    db,
    "SELECT * FROM issues WHERE scan_id = ? ORDER BY severity ASC, type ASC",
    { scan_id: scanId }
  );
  return rows.map((r: any) => ({
    id: r.id as number,
    scan_id: r.scan_id as number,
    severity: r.severity as "critical" | "warning" | "info",
    type: r.type as string,
    page_url: r.page_url as string,
    source_url: r.source_url as string | null,
    description: r.description as string,
    fix_recommendation: r.fix_recommendation as string,
    element_detail: r.element_detail as string | null,
    created_at: r.created_at as string,
  }));
}

export async function deleteIssuesForScan(scanId: number) {
  const db = await getDb();
  runMutate(db, "DELETE FROM issues WHERE scan_id = ?", { scan_id: scanId });
}

// ── Re-export getDb for session storage ──
export { getDb, saveDbSync };
