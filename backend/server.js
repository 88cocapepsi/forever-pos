import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "forever_pos_secret_change_me";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, "db.json");

const app = express();
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN }));
app.use(express.json());

const eventClients = new Map();

function readDb() { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")); }
function writeDb(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8"); }
function todayKey() { return new Date().toISOString().slice(0, 10); }

function seedPasswords() {
  const db = readDb();
  let changed = false;
  for (const user of db.users) {
    if (!user.passwordHash) { user.passwordHash = bcrypt.hashSync("123456", 10); changed = true; }
  }
  if (changed) writeDb(db);
}
seedPasswords();

function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : (req.query.token || "");
  if (!token) return res.status(401).json({ message: "Thiếu token" });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: "Token không hợp lệ" }); }
}

function adminRequired(req, res, next) {
  if (req.user?.role !== "admin") return res.status(403).json({ message: "Không đủ quyền" });
  next();
}

function broadcast(eventName, payload) {
  const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [id, client] of eventClients.entries()) {
    try { client.write(data); }
    catch { eventClients.delete(id); }
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/events", authRequired, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  const clientId = nanoid();
  eventClients.set(clientId, res);
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, clientId, user: req.user.fullName })}\n\n`);
  const heartbeat = setInterval(() => {
    try { res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`); }
    catch { clearInterval(heartbeat); eventClients.delete(clientId); }
  }, 25000);
  req.on("close", () => { clearInterval(heartbeat); eventClients.delete(clientId); });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const db = readDb();
  const user = db.users.find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
  }
  const payload = { id: user.id, username: user.username, role: user.role, fullName: user.fullName };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: payload });
});

app.get("/api/me", authRequired, (req, res) => res.json({ user: req.user }));
app.get("/api/shop", authRequired, (_req, res) => res.json(readDb().shop));

app.put("/api/shop", authRequired, adminRequired, (req, res) => {
  const db = readDb();
  db.shop = { ...db.shop, ...req.body };
  writeDb(db);
  res.json(db.shop);
});

app.get("/api/menu", authRequired, (_req, res) => res.json(readDb().menu));

app.post("/api/menu", authRequired, adminRequired, (req, res) => {
  const { name, price, category } = req.body || {};
  if (!name || !price || !category) return res.status(400).json({ message: "Thiếu thông tin món" });
  const db = readDb();
  const item = { id: nanoid(), name, price: Number(price), category, active: true };
  db.menu.unshift(item); writeDb(db); broadcast("menu_updated", { type: "created", item }); res.json(item);
});

app.patch("/api/menu/:id/toggle", authRequired, adminRequired, (req, res) => {
  const db = readDb();
  const item = db.menu.find((m) => m.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Không tìm thấy món" });
  item.active = !item.active; writeDb(db); broadcast("menu_updated", { type: "toggled", item }); res.json(item);
});

app.delete("/api/menu/:id", authRequired, adminRequired, (req, res) => {
  const db = readDb();
  db.menu = db.menu.filter((m) => m.id !== req.params.id);
  writeDb(db); broadcast("menu_updated", { type: "deleted", id: req.params.id }); res.json({ ok: true });
});

app.get("/api/users", authRequired, adminRequired, (_req, res) => {
  const db = readDb();
  res.json(db.users.map(({ passwordHash, ...u }) => u));
});

app.post("/api/users", authRequired, adminRequired, (req, res) => {
  const { fullName, username, password, role } = req.body || {};
  if (!fullName || !username || !password || !role) return res.status(400).json({ message: "Thiếu thông tin tài khoản" });
  const db = readDb();
  if (db.users.some((u) => u.username === username)) return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
  const user = { id: nanoid(), fullName, username, passwordHash: bcrypt.hashSync(password, 10), role, createdAt: new Date().toISOString() };
  db.users.unshift(user); writeDb(db); const { passwordHash, ...safe } = user; res.json(safe);
});

app.delete("/api/users/:id", authRequired, adminRequired, (req, res) => {
  if (req.user.id === req.params.id) return res.status(400).json({ message: "Không thể tự xóa tài khoản đang đăng nhập" });
  const db = readDb(); db.users = db.users.filter((u) => u.id !== req.params.id); writeDb(db); res.json({ ok: true });
});

app.get("/api/orders", authRequired, (_req, res) => res.json(readDb().orders));

app.put("/api/orders/:table", authRequired, (req, res) => {
  const { items, shiftId } = req.body || {};
  const db = readDb();
  db.orders[req.params.table] = { table: req.params.table, items: Array.isArray(items) ? items : [], shiftId: shiftId || "morning", updatedAt: new Date().toISOString() };
  writeDb(db); broadcast("orders_updated", { table: req.params.table }); res.json({ ok: true });
});

app.delete("/api/orders/:table", authRequired, (req, res) => {
  const db = readDb(); delete db.orders[req.params.table]; writeDb(db); broadcast("orders_updated", { table: req.params.table, deleted: true }); res.json({ ok: true });
});

app.post("/api/checkout", authRequired, (req, res) => {
  const { table, shiftId, items } = req.body || {};
  if (!table || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Dữ liệu thanh toán không hợp lệ" });
  const db = readDb();
  const totalQty = items.reduce((s, i) => s + Number(i.qty || 0), 0);
  const totalPrice = items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.price || 0), 0);
  const bill = { id: nanoid(), billCode: "HD-" + Date.now(), businessDate: todayKey(), billTime: new Date().toISOString(), table, shiftId: shiftId || "morning", cashierName: req.user.fullName, totalQty, totalPrice, items };
  db.bills.unshift(bill); delete db.orders[table]; writeDb(db);
  broadcast("bill_paid", { billCode: bill.billCode, table: bill.table, totalPrice: bill.totalPrice, cashierName: bill.cashierName, billTime: bill.billTime });
  res.json(bill);
});

app.get("/api/reports/today", authRequired, (_req, res) => {
  const db = readDb();
  const bills = db.bills.filter((b) => b.businessDate === todayKey());
  const totalRevenue = bills.reduce((s, b) => s + b.totalPrice, 0);
  const totalBills = bills.length;
  const totalQty = bills.reduce((s, b) => s + b.totalQty, 0);
  const shiftStats = ["morning","afternoon","evening"].map((shiftId) => {
    const group = bills.filter((b) => b.shiftId === shiftId);
    return { shiftId, count: group.length, qty: group.reduce((s, b) => s + b.totalQty, 0), revenue: group.reduce((s, b) => s + b.totalPrice, 0) };
  });
  const map = {};
  for (const bill of bills) for (const item of bill.items) {
    if (!map[item.name]) map[item.name] = { name: item.name, qty: 0, revenue: 0 };
    map[item.name].qty += Number(item.qty || 0);
    map[item.name].revenue += Number(item.qty || 0) * Number(item.price || 0);
  }
  const topItems = Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10);
  res.json({ totalRevenue, totalBills, totalQty, shiftStats, topItems, bills });
});

app.listen(PORT, () => console.log(`FOREVER POS PRO V1 backend running on http://localhost:${PORT}`));
