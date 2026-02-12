import mysql from "mysql2/promise";

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "root123";
const DB_NAME = process.env.DB_NAME || "mini_ecommerce";

export async function initDb() {
  const adminConn = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD
  });

  await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await adminConn.end();

  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    connectionLimit: 10
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(160) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user'
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      description TEXT NOT NULL,
      price_cents INT NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      category_id INT NULL,
      INDEX idx_products_category (category_id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      total_cents INT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'paid',
      created_at DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      qty INT NOT NULL,
      price_cents INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      link_url VARCHAR(255) NULL,
      active TINYINT(1) NOT NULL DEFAULT 1
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quotes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quote_text VARCHAR(255) NOT NULL,
      author VARCHAR(120) NULL
    );
  `);

  // Ensure category_id exists for older databases
  const [colRows] = await pool.query(
    "SELECT COUNT(*) as c FROM information_schema.columns WHERE table_schema = ? AND table_name = 'products' AND column_name = 'category_id'",
    [DB_NAME]
  );
  if (colRows[0].c === 0) {
    await pool.query("ALTER TABLE products ADD COLUMN category_id INT NULL");
  }

  const run = async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);
    return result;
  };

  const get = async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  };

  const all = async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  };

  const transaction = async (fn) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const tx = {
        run: async (sql, params = []) => {
          const [result] = await conn.execute(sql, params);
          return result;
        },
        get: async (sql, params = []) => {
          const [rows] = await conn.execute(sql, params);
          return rows[0] || null;
        },
        all: async (sql, params = []) => {
          const [rows] = await conn.execute(sql, params);
          return rows;
        }
      };

      const result = await fn(tx);
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  };

  return { run, get, all, transaction };
}
