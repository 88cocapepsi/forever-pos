import bcrypt from 'bcryptjs';
import { pool, query } from '../config/db.js';
import { defaultTables } from '../utils/tables.js';

async function main() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tables (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      zone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'empty' CHECK (status IN ('empty', 'serving', 'waiting_payment')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price NUMERIC(12,2) NOT NULL,
      cost NUMERIC(12,2) NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      table_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'cancelled')),
      subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
      total NUMERIC(12,2) NOT NULL DEFAULT 0,
      payment_method TEXT,
      created_by INTEGER REFERENCES users(id),
      paid_by INTEGER REFERENCES users(id),
      opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
      paid_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_price NUMERIC(12,2) NOT NULL,
      line_total NUMERIC(12,2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id SERIAL PRIMARY KEY,
      opened_by INTEGER REFERENCES users(id),
      closed_by INTEGER REFERENCES users(id),
      opening_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
      closing_cash NUMERIC(12,2),
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
      opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
      closed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  const adminHash = await bcrypt.hash('123456', 10);
  const staffHash = await bcrypt.hash('123456', 10);

  await query(
    `INSERT INTO users (username, password_hash, full_name, role)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (username) DO NOTHING`,
    ['admin', adminHash, 'Admin FOREVER', 'admin']
  );

  await query(
    `INSERT INTO users (username, password_hash, full_name, role)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (username) DO NOTHING`,
    ['staff', staffHash, 'Nhân viên FOREVER', 'staff']
  );

  for (const code of defaultTables) {
    const zone = code === 'MANG_VE' || code === 'GIAO_DI' ? 'delivery' : (['B1','B2','B3','B4','B5','B6'].includes(code) ? 'front' : 'back');
    await query(
      `INSERT INTO tables (code, zone) VALUES ($1,$2)
       ON CONFLICT (code) DO NOTHING`,
      [code, zone]
    );
  }

  const products = [
    ['Cà phê đen đá', 'coffee', 29000, 12000],
    ['Cà phê sữa đá', 'coffee', 35000, 15000],
    ['Bạc xỉu', 'coffee', 39000, 17000],
    ['Trà đào', 'tea', 45000, 18000],
    ['Trà tắc', 'tea', 32000, 12000],
    ['Soda chanh', 'soda', 39000, 16000],
    ['Nước ép cam', 'juice', 49000, 23000],
    ['Yaourt đá', 'yogurt', 42000, 20000],
  ];

  for (const [name, category, price, cost] of products) {
    await query(
      `INSERT INTO products (name, category, price, cost)
       SELECT $1,$2,$3,$4
       WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = $1)`,
      [name, category, price, cost]
    );
  }

  console.log('Database initialized successfully.');
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
}).finally(() => pool.end());
