import pg from "pg";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL || "";
const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "mini_ecommerce";
const DB_SSL = (process.env.DB_SSL || "").toLowerCase() === "true";

function toPgSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

function normalizeResult(result) {
  if (result.rows?.length > 0 && result.rows[0].id !== undefined) {
    return { ...result, insertId: result.rows[0].id };
  }
  return result;
}

async function query(poolOrClient, sql, params = []) {
  const pgSql = toPgSql(sql);
  const result = await poolOrClient.query(pgSql, params);
  return normalizeResult(result);
}

export async function initDb() {
  const poolConfig = DATABASE_URL
    ? {
        connectionString: DATABASE_URL,
        ssl: DB_SSL ? { rejectUnauthorized: false } : undefined
      }
    : {
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        ssl: DB_SSL ? { rejectUnauthorized: false } : undefined
      };

  const pool = new Pool(poolConfig);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      description TEXT NOT NULL,
      price_cents INT NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      category_id INT NULL REFERENCES categories(id)
    );
  `);
  await pool.query("CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id),
      total_cents INT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'paid',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL REFERENCES orders(id),
      product_id INT NOT NULL REFERENCES products(id),
      qty INT NOT NULL,
      price_cents INT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ads (
      id SERIAL PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      link_url VARCHAR(255) NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      quote_text VARCHAR(255) NOT NULL,
      author VARCHAR(120) NULL
    );
  `);

  await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INT NULL REFERENCES categories(id)");

  const run = async (sql, params = []) => query(pool, sql, params);

  const get = async (sql, params = []) => {
    const result = await query(pool, sql, params);
    return result.rows[0] || null;
  };

  const all = async (sql, params = []) => {
    const result = await query(pool, sql, params);
    return result.rows;
  };

  const transaction = async (fn) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const tx = {
        run: async (sql, params = []) => query(client, sql, params),
        get: async (sql, params = []) => {
          const result = await query(client, sql, params);
          return result.rows[0] || null;
        },
        all: async (sql, params = []) => {
          const result = await query(client, sql, params);
          return result.rows;
        }
      };
      const result = await fn(tx);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  };

  return { run, get, all, transaction };
}
