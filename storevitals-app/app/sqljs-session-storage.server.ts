/**
 * SQL.js-based Session Storage for Shopify App
 *
 * Pure WASM SQLite — no native compilation needed.
 * Works on Windows, macOS, Linux without Visual Studio or build tools.
 *
 * Drop-in replacement for @shopify/shopify-app-session-storage-sqlite.
 */

import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";
import type { Database as SqlJsDatabase } from "sql.js";
import { Session } from "@shopify/shopify-api";
import {
  MigrationOperation,
  RdbmsSessionStorageMigrator,
  type RdbmsConnection,
  type RdbmsSessionStorageMigratorOptions,
  type DBConnection,
} from "@shopify/shopify-app-session-storage";

// ---------------------------------------------------------------------------
// SQL.js Connection — implements the RdbmsConnection interface
// ---------------------------------------------------------------------------

class SqlJsConnection implements RdbmsConnection {
  sessionStorageIdentifier: string;
  private ready: Promise<void>;
  private db!: SqlJsDatabase;
  private dbPath: string;

  constructor(
    database: string | SqlJsDatabase,
    sessionStorageIdentifier: string
  ) {
    this.sessionStorageIdentifier = sessionStorageIdentifier;
    this.dbPath =
      typeof database === "string" ? database : ":memory:";
    this.ready = this.init(database);
  }

  /** Execute a query with params. For SELECT: returns rows as objects. */
  async query(query: string, params: any[] = []): Promise<any[]> {
    await this.ready;

    const converted = this.convertPlaceholders(query, params);

    try {
      const results = this.db.exec(converted.sql, converted.params);
      if (!results || results.length === 0) return [];

      const { columns, values } = results[0];
      return values.map((row: any[]) => {
        const obj: Record<string, any> = {};
        columns.forEach((col: string, i: number) => {
          obj[col] = row[i];
        });
        return obj;
      });
    } catch (_err) {
      this.db.run(converted.sql, converted.params);
      return [];
    }
  }

  /** Execute raw SQL statements (e.g. BEGIN, COMMIT, ALTER, DROP). */
  async executeRawQuery(query: string): Promise<void> {
    await this.ready;
    this.db.run(query);
  }

  /** Check if a table exists. */
  async hasTable(tablename: string): Promise<boolean> {
    await this.ready;
    const query = `
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name = $name
    `;
    try {
      const rows = this.db.exec(query, { $name: tablename });
      return rows.length > 0 && rows[0].values.length > 0;
    } catch {
      return false;
    }
  }

  /** Return the argument placeholder for positional params. */
  getArgumentPlaceholder(_position?: number): string {
    return "?";
  }

  async connect(): Promise<void> {
    await this.ready;
  }

  async disconnect(): Promise<void> {
    await this.ready;
    this.persist();
    this.db.close();
  }

  /** Persist the database to disk. */
  persist(): void {
    if (this.dbPath === ":memory:") return;
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  // --- internals ---

  private async init(database: string | SqlJsDatabase): Promise<void> {
    const SQL = await initSqlJs();

    if (typeof database === "string" && database !== ":memory:") {
      if (fs.existsSync(database)) {
        const filebuffer = fs.readFileSync(database);
        this.db = new SQL.Database(filebuffer);
      } else {
        this.db = new SQL.Database();
        this.persist();
      }
    } else if (typeof database === "string") {
      this.db = new SQL.Database();
    } else {
      this.db = database;
    }
  }

  /**
   * Convert `?` placeholders to sql.js `$paramN` placeholders.
   * sql.js doesn't support bare `?` — it needs named params like `$p1`, `$p2`.
   */
  private convertPlaceholders(
    sql: string,
    params: any[]
  ): { sql: string; params: Record<string, any> } {
    let idx = 0;
    const convertedParams: Record<string, any> = {};

    const convertedSql = sql.replace(/\?/g, () => {
      idx++;
      const name = `$p${idx}`;
      convertedParams[name] = params[idx - 1];
      return name;
    });

    return { sql: convertedSql, params: convertedParams };
  }
}

// ---------------------------------------------------------------------------
// Migrations — must match the standard Shopify session schema exactly
// ---------------------------------------------------------------------------

async function migrateScopeFieldToVarchar1024(
  connection: DBConnection
): Promise<void> {
  const conn = connection as unknown as SqlJsConnection;
  const tableName = connection.sessionStorageIdentifier;
  const tempTableName = `${tableName}_migrate_scope`;

  await conn.executeRawQuery("BEGIN");
  await conn.query(
    `ALTER TABLE ${tableName} RENAME TO ${tempTableName};`
  );
  await conn.query(`
    CREATE TABLE ${tableName} (
      id varchar(255) NOT NULL PRIMARY KEY,
      shop varchar(255) NOT NULL,
      state varchar(255) NOT NULL,
      isOnline integer NOT NULL,
      expires integer,
      scope varchar(1024),
      accessToken varchar(255),
      onlineAccessInfo varchar(255)
    );
  `);
  await conn.query(`
    INSERT INTO ${tableName}
      (id,shop,state,isOnline,expires,scope,accessToken,onlineAccessInfo)
    SELECT id,shop,state,isOnline,expires,scope,accessToken,onlineAccessInfo
    FROM ${tempTableName};
  `);
  await conn.query(`DROP TABLE ${tempTableName};`);
  await conn.executeRawQuery("COMMIT");
}

const migrationList = [
  new MigrationOperation(
    "migrateScopeFieldToVarchar1024",
    migrateScopeFieldToVarchar1024
  ),
];

// ---------------------------------------------------------------------------
// Migrator — extends Shopify's RdbmsSessionStorageMigrator
// ---------------------------------------------------------------------------

class SqlJsSessionStorageMigrator extends RdbmsSessionStorageMigrator {
  constructor(
    dbConnection: SqlJsConnection,
    opts: Partial<RdbmsSessionStorageMigratorOptions> | undefined,
    migrations: MigrationOperation[]
  ) {
    super(dbConnection, opts, migrations);
  }

  async initMigrationPersistence(): Promise<void> {
    const alreadyExists = await this.connection.hasTable(
      this.getOptions().migrationDBIdentifier
    );
    if (!alreadyExists) {
      await this.connection.query(
        `CREATE TABLE ${this.getOptions().migrationDBIdentifier} (
          ${this.getOptions().migrationNameColumnName} varchar(255) NOT NULL PRIMARY KEY
        );`,
        []
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Options type
// ---------------------------------------------------------------------------

export interface SqlJsSessionStorageOptions {
  sessionTableName?: string;
  migratorOptions?: Partial<RdbmsSessionStorageMigratorOptions>;
}

const defaultOptions = {
  sessionTableName: "shopify_sessions",
  migratorOptions: {
    migrationDBIdentifier: "shopify_sessions_migrations",
    migrationNameColumnName: "migration_name",
  } satisfies RdbmsSessionStorageMigratorOptions,
};

// ---------------------------------------------------------------------------
// Main SessionStorage class
// ---------------------------------------------------------------------------

export class SqlJsSessionStorage {
  private ready: Promise<void>;
  private options: typeof defaultOptions;
  private db: SqlJsConnection;
  private internalInit: Promise<void>;
  private migrator: SqlJsSessionStorageMigrator;

  constructor(
    database: string | SqlJsDatabase,
    opts: SqlJsSessionStorageOptions = {}
  ) {
    this.options = { ...defaultOptions, ...opts } as typeof defaultOptions;
    this.db = new SqlJsConnection(database, this.options.sessionTableName);
    this.internalInit = this.init();
    this.migrator = new SqlJsSessionStorageMigrator(
      this.db,
      this.options.migratorOptions,
      migrationList
    );
    this.ready = this.migrator.applyMigrations(this.internalInit);
  }

  async storeSession(session: Session): Promise<boolean> {
    await this.ready;
    const entries = session
      .toPropertyArray()
      .map(([key, value]) =>
        key === "expires"
          ? [key, Math.floor((value as number) / 1000)]
          : [key, value]
      );
    const query = `
      INSERT OR REPLACE INTO ${this.options.sessionTableName}
      (${entries.map(([key]) => key).join(", ")})
      VALUES (${entries
        .map(() => this.db.getArgumentPlaceholder())
        .join(", ")});
    `;
    await this.db.query(query, entries.map(([, value]) => value));
    this.db.persist();
    return true;
  }

  async loadSession(id: string): Promise<Session | undefined> {
    await this.ready;
    const query = `
      SELECT * FROM ${this.options.sessionTableName}
      WHERE id = ${this.db.getArgumentPlaceholder()};
    `;
    const rows = await this.db.query(query, [id]);
    if (!Array.isArray(rows) || rows?.length !== 1) return undefined;
    return this.databaseRowToSession(rows[0]);
  }

  async deleteSession(id: string): Promise<boolean> {
    await this.ready;
    const query = `
      DELETE FROM ${this.options.sessionTableName}
      WHERE id = ${this.db.getArgumentPlaceholder()};
    `;
    await this.db.query(query, [id]);
    this.db.persist();
    return true;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    await this.ready;
    const query = `
      DELETE FROM ${this.options.sessionTableName}
      WHERE id IN (${ids
        .map(() => this.db.getArgumentPlaceholder())
        .join(",")});
    `;
    await this.db.query(query, ids);
    this.db.persist();
    return true;
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    await this.ready;
    const query = `
      SELECT * FROM ${this.options.sessionTableName}
      WHERE shop = ${this.db.getArgumentPlaceholder()};
    `;
    const rows = await this.db.query(query, [shop]);
    if (!Array.isArray(rows) || rows?.length === 0) return [];
    return rows.map((row: Record<string, any>) =>
      this.databaseRowToSession(row)
    );
  }

  /** Ensure the session table exists. */
  private async init(): Promise<void> {
    const hasSessionTable = await this.db.hasTable(
      this.options.sessionTableName
    );
    if (!hasSessionTable) {
      const query = `
        CREATE TABLE ${this.options.sessionTableName} (
          id varchar(255) NOT NULL PRIMARY KEY,
          shop varchar(255) NOT NULL,
          state varchar(255) NOT NULL,
          isOnline integer NOT NULL,
          expires integer,
          scope varchar(1024),
          accessToken varchar(255),
          onlineAccessInfo varchar(255)
        );
      `;
      await this.db.query(query);
      this.db.persist();
    }
  }

  private databaseRowToSession(row: Record<string, any>): Session {
    if (row.expires) row.expires *= 1000;
    return Session.fromPropertyArray(
      Object.entries(row) as [string, string | number | boolean][]
    );
  }
}
