// Database adapter — same interface for D1 (Cloudflare) and better-sqlite3 (Docker)

export class D1Adapter {
  constructor(db) { this.db = db; }

  async query(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const result = await (params.length ? stmt.bind(...params) : stmt).all();
    return result.results || [];
  }

  async run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const result = await (params.length ? stmt.bind(...params) : stmt).run();
    return { changes: result.meta?.changes || 0 };
  }

  async exec(sql) {
    await this.db.exec(sql);
  }
}

export class SqliteAdapter {
  constructor(db) { this.db = db; }

  async query(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }

  async run(sql, params = []) {
    const result = this.db.prepare(sql).run(...params);
    return { changes: result.changes };
  }

  async exec(sql) {
    this.db.exec(sql);
  }
}
