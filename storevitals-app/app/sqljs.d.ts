declare module "sql.js" {
  interface SqlJsStatic {
    Database: typeof Database;
  }

  interface Database {
    run(sql: string, params?: any[] | Record<string, any>): void;
    exec(
      sql: string,
      params?: any[] | Record<string, any>
    ): Array<{ columns: string[]; values: any[][] }>;
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  interface Statement {
    bind(params?: any[] | Record<string, any>): boolean;
    step(): boolean;
    getAsObject(params?: any[] | Record<string, any>): Record<string, any>;
    get(params?: any[] | Record<string, any>): any[];
    free(): boolean;
    run(params?: any[] | Record<string, any>): void;
  }

  export default function initSqlJs(
    config?: Partial<{ locateFile: (file: string) => string }>
  ): Promise<SqlJsStatic>;
}
