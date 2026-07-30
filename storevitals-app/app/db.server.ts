import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.resolve("./prisma/dev.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    initSchema();
  }
  return _db;
}

function initSchema() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS scans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_domain TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      pages_scanned INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_id INTEGER NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('critical', 'warning')),
      type TEXT NOT NULL,
      page_url TEXT NOT NULL,
      source_url TEXT,
      description TEXT NOT NULL,
      fix_recommendation TEXT NOT NULL,
      element_detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_issues_scan_id ON issues(scan_id);
    CREATE INDEX IF NOT EXISTS idx_scans_shop_domain ON scans(shop_domain);
  `);
}

// ── Scan CRUD ──

export function createScan(shopDomain: string): { id: number } {
  const db = getDb();
  const stmt = db.prepare(
    "INSERT INTO scans (shop_domain, status, started_at) VALUES (?, 'running', datetime('now'))"
  );
  const result = stmt.run(shopDomain);
  return { id: Number(result.lastInsertRowid) };
}

export function completeScan(scanId: number, pagesScanned: number) {
  const db = getDb();
  db.prepare(
    "UPDATE scans SET status = 'complete', pages_scanned = ?, completed_at = datetime('now') WHERE id = ?"
  ).run(pagesScanned, scanId);
}

export function failScan(scanId: number, pagesScanned: number) {
  const db = getDb();
  db.prepare(
    "UPDATE scans SET status = 'failed', pages_scanned = ?, completed_at = datetime('now') WHERE id = ?"
  ).run(pagesScanned, scanId);
}

export function getLatestScan(
  shopDomain: string
): { id: number; status: string; pages_scanned: number; started_at: string; completed_at: string | null } | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM scans WHERE shop_domain = ? ORDER BY id DESC LIMIT 1")
    .get(shopDomain) as any;
  return row
    ? {
        id: row.id,
        status: row.status,
        pages_scanned: row.pages_scanned,
        started_at: row.started_at,
        completed_at: row.completed_at,
      }
    : null;
}

// ── Issue CRUD ──

export interface InsertIssue {
  scan_id: number;
  severity: "critical" | "warning";
  type: string;
  page_url: string;
  source_url?: string;
  description: string;
  fix_recommendation: string;
  element_detail?: string;
}

export function insertIssue(issue: InsertIssue) {
  const db = getDb();
  db.prepare(
    `INSERT INTO issues (scan_id, severity, type, page_url, source_url, description, fix_recommendation, element_detail)
     VALUES (@scan_id, @severity, @type, @page_url, @source_url, @description, @fix_recommendation, @element_detail)`
  ).run(issue);
}

export function insertIssues(issues: InsertIssue[]) {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO issues (scan_id, severity, type, page_url, source_url, description, fix_recommendation, element_detail)
     VALUES (@scan_id, @severity, @type, @page_url, @source_url, @description, @fix_recommendation, @element_detail)`
  );
  const insertMany = db.transaction((items: InsertIssue[]) => {
    for (const item of items) {
      stmt.run(item);
    }
  });
  insertMany(issues);
}

export interface IssueRow {
  id: number;
  scan_id: number;
  severity: "critical" | "warning";
  type: string;
  page_url: string;
  source_url: string | null;
  description: string;
  fix_recommendation: string;
  element_detail: string | null;
  created_at: string;
}

export function getIssuesForScan(scanId: number): IssueRow[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM issues WHERE scan_id = ? ORDER BY severity ASC, type ASC")
    .all(scanId) as any[];
  return rows.map((r) => ({
    id: r.id,
    scan_id: r.scan_id,
    severity: r.severity,
    type: r.type,
    page_url: r.page_url,
    source_url: r.source_url,
    description: r.description,
    fix_recommendation: r.fix_recommendation,
    element_detail: r.element_detail,
    created_at: r.created_at,
  }));
}

export function deleteIssuesForScan(scanId: number) {
  const db = getDb();
  db.prepare("DELETE FROM issues WHERE scan_id = ?").run(scanId);
}
