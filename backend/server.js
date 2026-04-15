import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'db.json');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Missing token' });
  const db = readDb();
  const user = db.users.find((u) => u.id === token);
  if (!user) return res.status(401).json({ message: 'Invalid token' });
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}

function applyInventoryForPaidOrder(db, order) {
  if (order.inventoryApplied) return db;
  for (const item of order.items) {
    const product = db.products.find((p) => p.id === item.productId);
    if (!product?.recipe) continue;
    for (const ingredient of product.recipe) {
      const stock = db.inventory.find((i) => i.id === ingredient.inventoryId);
      if (stock) {
        stock.quantity = Math.max(0, Number(stock.quantity) - ingredient.qty * item.qty);
      }
    }
  }
  order.inventoryApplied = true;
  return db;
}

app.get('/health', (_, res) => {
  res.json({ ok: true, app: 'FOREVER POS PRO backend' });
});

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.username === username && u.password === password && u.active);
  if (!user) return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
  res.json({
    token: user.id,
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
    },
  });
});

app.get('/bootstrap', requireAuth, (req, res) => {
  const db = readDb();
  res.json({
    user: req.user,
    tables: db.tables,
    categories: db.categories,
    products: db.products,
    orders: db.orders,
    inventory: db.inventory,
    shifts: db.shifts,
    settings: db.settings,
  });
});

app.get('/users', requireAuth, requireRole('admin'), (req, res) => {
  const db = readDb();
  res.json(db.users.map(({ password, ...rest }) => rest));
});

app.post('/users', requireAuth, requireRole('admin'), (req, res) => {
  const db = readDb();
  const newUser = {
    id: `u_${Date.now()}`,
    active: true,
    ...req.body,
  };
  db.users.push(newUser);
  db.auditLogs.unshift({ id: `log_${Date.now()}`, action: 'CREATE_USER', user: req.user.fullName, at: new Date().toISOString(), detail: newUser.username });
  writeDb(db);
  const { password, ...safe } = newUser;
  res.json(safe);
});

app.put('/users/:id', requireAuth, requireRole('admin'), (req, res) => {
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'User not found' });
  db.users[idx] = { ...db.users[idx], ...req.body };
  db.auditLogs.unshift({ id: `log_${Date.now()}`, action: 'UPDATE_USER', user: req.user.fullName, at: new Date().toISOString(), detail: db.users[idx].username });
  writeDb(db);
  const { password, ...safe } = db.users[idx];
  res.json(safe);
});

app.get('/products', requireAuth, (req, res) => {
  const db = readDb();
  res.json(db.products);
});

app.post('/products', requireAuth, requireRole('admin'), (req, res) => {
  const db = readDb();
  const product = { id: `p_${Date.now()}`, active: true, ...req.body };
  db.products.push(product);
  db.auditLogs.unshift({ id: `log_${Date.now()}`, action: 'CREATE_PRODUCT', user: req.user.fullName, at: new Date().toISOString(), detail: product.name });
  writeDb(db);
  res.json(product);
});

app.put('/products/:id', requireAuth, requireRole('admin'), (req, res) => {
  const db = readDb();
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Product not found' });
  db.products[idx] = { ...db.products[idx], ...req.body };
  db.auditLogs.unshift({ id: `log_${Date.now()}`, action: 'UPDATE_PRODUCT', user: req.user.fullName, at: new Date().toISOString(), detail: db.products[idx].name });
  writeDb(db);
  res.json(db.products[idx]);
});

app.get('/inventory', requireAuth, (req, res) => {
  const db = readDb();
  res.json(db.inventory);
});

app.post('/inventory/adjust', requireAuth, requireRole('admin'), (req, res) => {
  const { id, quantity } = req.body;
  const db = readDb();
  const item = db.inventory.find((x) => x.id === id);
  if (!item) return res.status(404).json({ message: 'Inventory item not found' });
  item.quantity = Number(quantity);
  db.auditLogs.unshift({ id: `log_${Date.now()}`, action: 'ADJUST_INVENTORY', user: req.user.fullName, at: new Date().toISOString(), detail: `${item.name}: ${item.quantity}` });
  writeDb(db);
  res.json(item);
});

app.get('/orders', requireAuth, (req, res) => {
  const db = readDb();
  res.json(db.orders);
});

app.post('/orders', requireAuth, (req, res) => {
  const db = readDb();
  const payload = req.body;
  const existingIndex = db.orders.findIndex((o) => o.id === payload.id);

  const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = Number(payload.discount || 0);
  const total = Math.max(0, subtotal - discount);

  const orderData = {
    ...payload,
    updatedAt: new Date().toISOString(),
    cashier: req.user.fullName,
    subtotal,
    total,
  };

  if (existingIndex >= 0) {
    db.orders[existingIndex] = { ...db.orders[existingIndex], ...orderData };
  } else {
    db.orders.unshift({ createdAt: new Date().toISOString(), inventoryApplied: false, ...orderData });
  }

  const order = existingIndex >= 0 ? db.orders[existingIndex] : db.orders[0];

  const table = db.tables.find((t) => t.id === order.tableId);
  if (table) {
    table.status = order.status === 'paid' ? 'paid' : order.items.length ? 'serving' : 'empty';
    table.currentOrderId = order.status === 'paid' ? null : order.id;
    table.total = order.status === 'paid' ? 0 : order.total;
  }

  if (order.status === 'paid') {
    applyInventoryForPaidOrder(db, order);
    const today = new Date().toISOString().slice(0, 10);
    let shift = db.shifts.find((s) => s.date === today && s.status === 'open');
    if (!shift) {
      shift = {
        id: `shift_${Date.now()}`,
        date: today,
        openedBy: req.user.fullName,
        openedAt: new Date().toISOString(),
        openingCash: 0,
        revenue: 0,
        status: 'open',
      };
      db.shifts.unshift(shift);
    }
    shift.revenue = Number(shift.revenue) + order.total;
  }

  db.auditLogs.unshift({ id: `log_${Date.now()}`, action: existingIndex >= 0 ? 'UPDATE_ORDER' : 'CREATE_ORDER', user: req.user.fullName, at: new Date().toISOString(), detail: `${order.code} - ${order.status}` });

  writeDb(db);
  res.json(order);
});

app.post('/orders/:id/pay', requireAuth, (req, res) => {
  const db = readDb();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  order.status = 'paid';
  order.paymentMethod = req.body.paymentMethod || 'cash';
  order.paidAt = new Date().toISOString();
  applyInventoryForPaidOrder(db, order);

  const table = db.tables.find((t) => t.id === order.tableId);
  if (table) {
    table.status = 'empty';
    table.currentOrderId = null;
    table.total = 0;
  }

  const today = new Date().toISOString().slice(0, 10);
  let shift = db.shifts.find((s) => s.date === today && s.status === 'open');
  if (!shift) {
    shift = {
      id: `shift_${Date.now()}`,
      date: today,
      openedBy: req.user.fullName,
      openedAt: new Date().toISOString(),
      openingCash: 0,
      revenue: 0,
      status: 'open',
    };
    db.shifts.unshift(shift);
  }
  shift.revenue = Number(shift.revenue) + Number(order.total || 0);

  db.auditLogs.unshift({ id: `log_${Date.now()}`, action: 'PAY_ORDER', user: req.user.fullName, at: new Date().toISOString(), detail: `${order.code} - ${order.paymentMethod}` });
  writeDb(db);
  res.json(order);
});

app.get('/reports/summary', requireAuth, (req, res) => {
  const db = readDb();
  const paidOrders = db.orders.filter((o) => o.status === 'paid');
  const revenue = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const bills = paidOrders.length;
  const avgBill = bills ? Math.round(revenue / bills) : 0;
  const topProductsMap = {};
  for (const order of paidOrders) {
    for (const item of order.items) {
      topProductsMap[item.name] = (topProductsMap[item.name] || 0) + item.qty;
    }
  }
  const topProducts = Object.entries(topProductsMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  res.json({
    revenue,
    bills,
    avgBill,
    openTables: db.tables.filter((t) => t.status === 'serving').length,
    lowStock: db.inventory.filter((i) => i.quantity <= i.alertAt),
    topProducts,
    shifts: db.shifts.slice(0, 10),
  });
});

app.get('/audit-logs', requireAuth, requireRole('admin'), (req, res) => {
  const db = readDb();
  res.json(db.auditLogs.slice(0, 100));
});

app.post('/shifts/open', requireAuth, (req, res) => {
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  let shift = db.shifts.find((s) => s.date === today && s.status === 'open');
  if (shift) return res.json(shift);
  shift = {
    id: `shift_${Date.now()}`,
    date: today,
    openedBy: req.user.fullName,
    openedAt: new Date().toISOString(),
    openingCash: Number(req.body.openingCash || 0),
    revenue: 0,
    status: 'open',
  };
  db.shifts.unshift(shift);
  writeDb(db);
  res.json(shift);
});

app.post('/shifts/close/:id', requireAuth, (req, res) => {
  const db = readDb();
  const shift = db.shifts.find((s) => s.id === req.params.id);
  if (!shift) return res.status(404).json({ message: 'Shift not found' });
  shift.status = 'closed';
  shift.closedAt = new Date().toISOString();
  shift.closingCash = Number(req.body.closingCash || 0);
  shift.note = req.body.note || '';
  writeDb(db);
  res.json(shift);
});

app.listen(PORT, () => {
  console.log(`FOREVER POS PRO backend running on http://localhost:${PORT}`);
});
