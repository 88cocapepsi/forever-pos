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

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function ensureDbShape() {
  const db = readDb();
  let changed = false;

  if (!Array.isArray(db.users)) {
    db.users = [];
    changed = true;
  }

  if (!db.shop || typeof db.shop !== "object") {
    db.shop = {
      name: "FOREVER Coffee & Beer",
      address: "B38 Đường 4A, P. Tân Hưng, Q.7",
      printerName: "",
    };
    changed = true;
  }

  if (!Array.isArray(db.menu)) {
    db.menu = [];
    changed = true;
  }

  if (!db.orders || typeof db.orders !== "object") {
    db.orders = {};
    changed = true;
  }

  if (!Array.isArray(db.bills)) {
    db.bills = [];
    changed = true;
  }

  if (!Array.isArray(db.inventory)) {
    db.inventory = [];
    changed = true;
  }

  if (!Array.isArray(db.inventoryTransactions)) {
    db.inventoryTransactions = [];
    changed = true;
  }

  if (!db.recipes || typeof db.recipes !== "object") {
    db.recipes = {};
    changed = true;
  }

  if (changed) writeDb(db);
}

function seedPasswords() {
  const db = readDb();
  let changed = false;

  for (const user of db.users) {
    if (!user.passwordHash) {
      user.passwordHash = bcrypt.hashSync("123456", 10);
      changed = true;
    }
  }

  if (changed) writeDb(db);
}

ensureDbShape();
seedPasswords();

function authRequired(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ")
    ? auth.slice(7)
    : req.query.token || "";

  if (!token) {
    return res.status(401).json({ message: "Thiếu token" });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Token không hợp lệ" });
  }
}

function adminRequired(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Không đủ quyền" });
  }
  next();
}

function broadcast(eventName, payload) {
  const data = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;

  for (const [id, client] of eventClients.entries()) {
    try {
      client.write(data);
    } catch {
      eventClients.delete(id);
    }
  }
}

function safeUser(user) {
  const { passwordHash, ...rest } = user;
  return rest;
}

function normalizeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getRecipeForMenu(db, menuId) {
  const recipe = db.recipes[menuId];
  return Array.isArray(recipe) ? recipe : [];
}

function enrichInventoryItem(item) {
  return {
    ...item,
    quantity: normalizeNumber(item.quantity),
    minQuantity: normalizeNumber(item.minQuantity),
    unitCost: normalizeNumber(item.unitCost),
  };
}

function createInventoryTransaction({
  type,
  inventoryId,
  inventoryName,
  quantity,
  note,
  refType = "",
  refId = "",
  createdBy = "",
}) {
  return {
    id: nanoid(),
    type,
    inventoryId,
    inventoryName,
    quantity: normalizeNumber(quantity),
    note: note || "",
    refType,
    refId,
    createdBy,
    createdAt: nowIso(),
  };
}

function applyRecipeStockDeduction(db, bill, currentUserFullName) {
  const stockUsageMap = new Map();

  for (const soldItem of bill.items) {
    const recipe = getRecipeForMenu(db, soldItem.id);

    for (const ingredient of recipe) {
      const inventoryId = ingredient.inventoryId;
      const qtyPerUnit = normalizeNumber(ingredient.qtyPerUnit);
      const soldQty = normalizeNumber(soldItem.qty);
      const deductQty = qtyPerUnit * soldQty;

      if (!inventoryId || deductQty <= 0) continue;

      const prev = stockUsageMap.get(inventoryId) || 0;
      stockUsageMap.set(inventoryId, prev + deductQty);
    }
  }

  for (const [inventoryId, deductQty] of stockUsageMap.entries()) {
    const stockItem = db.inventory.find((i) => i.id === inventoryId);
    if (!stockItem) {
      throw new Error("Công thức món đang tham chiếu tới hàng hóa không tồn tại");
    }

    if (normalizeNumber(stockItem.quantity) < deductQty) {
      throw new Error(`Không đủ tồn kho cho nguyên liệu: ${stockItem.name}`);
    }
  }

  for (const [inventoryId, deductQty] of stockUsageMap.entries()) {
    const stockItem = db.inventory.find((i) => i.id === inventoryId);
    stockItem.quantity = normalizeNumber(stockItem.quantity) - deductQty;

    db.inventoryTransactions.unshift(
      createInventoryTransaction({
        type: "sale_out",
        inventoryId: stockItem.id,
        inventoryName: stockItem.name,
        quantity: -deductQty,
        note: `Trừ kho theo bill ${bill.billCode}`,
        refType: "bill",
        refId: bill.id,
        createdBy: currentUserFullName,
      })
    );
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/events", authRequired, (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const clientId = nanoid();
  eventClients.set(clientId, res);

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      ok: true,
      clientId,
      user: req.user.fullName,
    })}\n\n`
  );

  const heartbeat = setInterval(() => {
    try {
      res.write(
        `event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`
      );
    } catch {
      clearInterval(heartbeat);
      eventClients.delete(clientId);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    eventClients.delete(clientId);
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const db = readDb();

  const user = db.users.find((u) => u.username === username);

  if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
  }

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user: payload });
});

app.get("/api/me", authRequired, (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/shop", authRequired, (_req, res) => {
  res.json(readDb().shop);
});

app.put("/api/shop", authRequired, adminRequired, (req, res) => {
  const db = readDb();
  db.shop = { ...db.shop, ...req.body };
  writeDb(db);
  res.json(db.shop);
});

app.get("/api/menu", authRequired, (_req, res) => {
  res.json(readDb().menu);
});

app.post("/api/menu", authRequired, adminRequired, (req, res) => {
  const { name, price, category } = req.body || {};

  if (!name || !price || !category) {
    return res.status(400).json({ message: "Thiếu thông tin món" });
  }

  const db = readDb();

  const item = {
    id: nanoid(),
    name,
    price: Number(price),
    category,
    active: true,
  };

  db.menu.unshift(item);
  db.recipes[item.id] = [];
  writeDb(db);

  broadcast("menu_updated", { type: "created", item });
  res.json(item);
});

app.patch("/api/menu/:id/toggle", authRequired, adminRequired, (req, res) => {
  const db = readDb();
  const item = db.menu.find((m) => m.id === req.params.id);

  if (!item) {
    return res.status(404).json({ message: "Không tìm thấy món" });
  }

  item.active = !item.active;
  writeDb(db);

  broadcast("menu_updated", { type: "toggled", item });
  res.json(item);
});

app.delete("/api/menu/:id", authRequired, adminRequired, (req, res) => {
  const db = readDb();
  db.menu = db.menu.filter((m) => m.id !== req.params.id);
  delete db.recipes[req.params.id];
  writeDb(db);

  broadcast("menu_updated", { type: "deleted", id: req.params.id });
  res.json({ ok: true });
});

app.get("/api/users", authRequired, adminRequired, (_req, res) => {
  const db = readDb();
  res.json(db.users.map(safeUser));
});

app.post("/api/users", authRequired, adminRequired, (req, res) => {
  const { fullName, username, password, role } = req.body || {};

  if (!fullName || !username || !password || !role) {
    return res.status(400).json({ message: "Thiếu thông tin tài khoản" });
  }

  const db = readDb();

  if (db.users.some((u) => u.username === username)) {
    return res.status(400).json({ message: "Tên đăng nhập đã tồn tại" });
  }

  const user = {
    id: nanoid(),
    fullName,
    username,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    createdAt: nowIso(),
  };

  db.users.unshift(user);
  writeDb(db);

  res.json(safeUser(user));
});

app.delete("/api/users/:id", authRequired, adminRequired, (req, res) => {
  if (req.user.id === req.params.id) {
    return res
      .status(400)
      .json({ message: "Không thể tự xóa tài khoản đang đăng nhập" });
  }

  const db = readDb();
  db.users = db.users.filter((u) => u.id !== req.params.id);
  writeDb(db);

  res.json({ ok: true });
});

app.get("/api/orders", authRequired, (_req, res) => {
  res.json(readDb().orders);
});

app.put("/api/orders/:table", authRequired, (req, res) => {
  const { items, shiftId } = req.body || {};
  const db = readDb();

  db.orders[req.params.table] = {
    table: req.params.table,
    items: Array.isArray(items) ? items : [],
    shiftId: shiftId || "morning",
    updatedAt: nowIso(),
  };

  writeDb(db);
  broadcast("orders_updated", { table: req.params.table });

  res.json({ ok: true });
});

app.delete("/api/orders/:table", authRequired, (req, res) => {
  const db = readDb();
  delete db.orders[req.params.table];
  writeDb(db);

  broadcast("orders_updated", { table: req.params.table, deleted: true });
  res.json({ ok: true });
});

/* =========================
   INVENTORY
========================= */

app.get("/api/inventory", authRequired, (_req, res) => {
  const db = readDb();
  const items = db.inventory.map(enrichInventoryItem);
  res.json(items);
});

app.post("/api/inventory", authRequired, adminRequired, (req, res) => {
  const {
    name,
    unit,
    quantity = 0,
    minQuantity = 0,
    unitCost = 0,
    note = "",
  } = req.body || {};

  if (!name || !unit) {
    return res.status(400).json({ message: "Thiếu tên hàng hoặc đơn vị tính" });
  }

  const db = readDb();

  const item = {
    id: nanoid(),
    name,
    unit,
    quantity: normalizeNumber(quantity),
    minQuantity: normalizeNumber(minQuantity),
    unitCost: normalizeNumber(unitCost),
    note,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  db.inventory.unshift(item);

  if (item.quantity > 0) {
    db.inventoryTransactions.unshift(
      createInventoryTransaction({
        type: "opening",
        inventoryId: item.id,
        inventoryName: item.name,
        quantity: item.quantity,
        note: "Tạo hàng hóa ban đầu",
        refType: "inventory",
        refId: item.id,
        createdBy: req.user.fullName,
      })
    );
  }

  writeDb(db);
  res.json(item);
});

app.put("/api/inventory/:id", authRequired, adminRequired, (req, res) => {
  const db = readDb();
  const item = db.inventory.find((i) => i.id === req.params.id);

  if (!item) {
    return res.status(404).json({ message: "Không tìm thấy hàng hóa" });
  }

  const { name, unit, minQuantity, unitCost, note } = req.body || {};

  if (!name || !unit) {
    return res.status(400).json({ message: "Thiếu tên hàng hoặc đơn vị tính" });
  }

  item.name = name;
  item.unit = unit;
  item.minQuantity = normalizeNumber(minQuantity);
  item.unitCost = normalizeNumber(unitCost);
  item.note = note || "";
  item.updatedAt = nowIso();

  writeDb(db);
  res.json(item);
});

app.post("/api/inventory/:id/stock-in", authRequired, adminRequired, (req, res) => {
  const { quantity, note = "" } = req.body || {};
  const qty = normalizeNumber(quantity);

  if (qty <= 0) {
    return res.status(400).json({ message: "Số lượng nhập phải lớn hơn 0" });
  }

  const db = readDb();
  const item = db.inventory.find((i) => i.id === req.params.id);

  if (!item) {
    return res.status(404).json({ message: "Không tìm thấy hàng hóa" });
  }

  item.quantity = normalizeNumber(item.quantity) + qty;
  item.updatedAt = nowIso();

  db.inventoryTransactions.unshift(
    createInventoryTransaction({
      type: "stock_in",
      inventoryId: item.id,
      inventoryName: item.name,
      quantity: qty,
      note: note || "Nhập kho",
      refType: "inventory",
      refId: item.id,
      createdBy: req.user.fullName,
    })
  );

  writeDb(db);
  res.json(item);
});

app.post("/api/inventory/:id/adjust", authRequired, adminRequired, (req, res) => {
  const { quantity, note = "" } = req.body || {};
  const qty = normalizeNumber(quantity);

  const db = readDb();
  const item = db.inventory.find((i) => i.id === req.params.id);

  if (!item) {
    return res.status(404).json({ message: "Không tìm thấy hàng hóa" });
  }

  const nextQty = normalizeNumber(item.quantity) + qty;
  if (nextQty < 0) {
    return res.status(400).json({ message: "Tồn kho không đủ để điều chỉnh giảm" });
  }

  item.quantity = nextQty;
  item.updatedAt = nowIso();

  db.inventoryTransactions.unshift(
    createInventoryTransaction({
      type: "adjust",
      inventoryId: item.id,
      inventoryName: item.name,
      quantity: qty,
      note: note || "Điều chỉnh tồn kho",
      refType: "inventory",
      refId: item.id,
      createdBy: req.user.fullName,
    })
  );

  writeDb(db);
  res.json(item);
});

app.delete("/api/inventory/:id", authRequired, adminRequired, (req, res) => {
  const db = readDb();

  const usedInRecipe = Object.values(db.recipes).some((recipe) =>
    Array.isArray(recipe) && recipe.some((r) => r.inventoryId === req.params.id)
  );

  if (usedInRecipe) {
    return res.status(400).json({
      message: "Hàng hóa đang được dùng trong công thức món, không thể xóa",
    });
  }

  db.inventory = db.inventory.filter((i) => i.id !== req.params.id);
  db.inventoryTransactions = db.inventoryTransactions.filter(
    (t) => t.inventoryId !== req.params.id
  );

  writeDb(db);
  res.json({ ok: true });
});

app.get("/api/inventory/transactions", authRequired, adminRequired, (_req, res) => {
  const db = readDb();
  res.json(db.inventoryTransactions);
});

app.get("/api/inventory/report", authRequired, adminRequired, (_req, res) => {
  const db = readDb();
  const items = db.inventory.map(enrichInventoryItem);

  const lowStock = items.filter(
    (item) => normalizeNumber(item.quantity) <= normalizeNumber(item.minQuantity)
  );

  res.json({
    totalItems: items.length,
    lowStockCount: lowStock.length,
    lowStock,
    inventory: items,
  });
});

/* =========================
   RECIPES
========================= */

app.get("/api/recipes", authRequired, adminRequired, (_req, res) => {
  const db = readDb();

  const result = db.menu.map((menuItem) => ({
    menuId: menuItem.id,
    menuName: menuItem.name,
    items: getRecipeForMenu(db, menuItem.id).map((r) => {
      const stockItem = db.inventory.find((i) => i.id === r.inventoryId);
      return {
        inventoryId: r.inventoryId,
        inventoryName: stockItem?.name || "Không tìm thấy hàng hóa",
        unit: stockItem?.unit || "",
        qtyPerUnit: normalizeNumber(r.qtyPerUnit),
      };
    }),
  }));

  res.json(result);
});

app.get("/api/recipes/:menuId", authRequired, adminRequired, (req, res) => {
  const db = readDb();
  const menuItem = db.menu.find((m) => m.id === req.params.menuId);

  if (!menuItem) {
    return res.status(404).json({ message: "Không tìm thấy món" });
  }

  const recipe = getRecipeForMenu(db, req.params.menuId).map((r) => {
    const stockItem = db.inventory.find((i) => i.id === r.inventoryId);
    return {
      inventoryId: r.inventoryId,
      inventoryName: stockItem?.name || "Không tìm thấy hàng hóa",
      unit: stockItem?.unit || "",
      qtyPerUnit: normalizeNumber(r.qtyPerUnit),
    };
  });

  res.json({
    menuId: menuItem.id,
    menuName: menuItem.name,
    items: recipe,
  });
});

app.put("/api/recipes/:menuId", authRequired, adminRequired, (req, res) => {
  const { items } = req.body || {};
  const db = readDb();

  const menuItem = db.menu.find((m) => m.id === req.params.menuId);
  if (!menuItem) {
    return res.status(404).json({ message: "Không tìm thấy món" });
  }

  if (!Array.isArray(items)) {
    return res.status(400).json({ message: "Danh sách công thức không hợp lệ" });
  }

  const normalized = [];

  for (const row of items) {
    const inventoryId = row.inventoryId;
    const qtyPerUnit = normalizeNumber(row.qtyPerUnit);

    if (!inventoryId || qtyPerUnit <= 0) continue;

    const stockItem = db.inventory.find((i) => i.id === inventoryId);
    if (!stockItem) {
      return res.status(400).json({ message: "Có nguyên liệu không tồn tại trong kho" });
    }

    normalized.push({
      inventoryId,
      qtyPerUnit,
    });
  }

  db.recipes[req.params.menuId] = normalized;
  writeDb(db);

  res.json({
    menuId: menuItem.id,
    menuName: menuItem.name,
    items: normalized,
  });
});

/* =========================
   CHECKOUT + REPORT
========================= */

app.post("/api/checkout", authRequired, (req, res) => {
  const { table, shiftId, items } = req.body || {};

  if (!table || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Dữ liệu thanh toán không hợp lệ" });
  }

  const db = readDb();

  const totalQty = items.reduce((s, i) => s + normalizeNumber(i.qty), 0);
  const totalPrice = items.reduce(
    (s, i) => s + normalizeNumber(i.qty) * normalizeNumber(i.price),
    0
  );

  const bill = {
    id: nanoid(),
    billCode: "HD-" + Date.now(),
    businessDate: todayKey(),
    billTime: nowIso(),
    table,
    shiftId: shiftId || "morning",
    cashierName: req.user.fullName,
    totalQty,
    totalPrice,
    items,
  };

  try {
    applyRecipeStockDeduction(db, bill, req.user.fullName);
  } catch (err) {
    return res.status(400).json({ message: err.message || "Không thể trừ kho" });
  }

  db.bills.unshift(bill);
  delete db.orders[table];

  writeDb(db);

  broadcast("bill_paid", {
    billCode: bill.billCode,
    table: bill.table,
    totalPrice: bill.totalPrice,
    cashierName: bill.cashierName,
    billTime: bill.billTime,
  });

  broadcast("orders_updated", { table, deleted: true });
  res.json(bill);
});

app.get("/api/reports/today", authRequired, (_req, res) => {
  const db = readDb();
  const bills = db.bills.filter((b) => b.businessDate === todayKey());

  const totalRevenue = bills.reduce((s, b) => s + b.totalPrice, 0);
  const totalBills = bills.length;
  const totalQty = bills.reduce((s, b) => s + b.totalQty, 0);

  const shiftStats = ["morning", "afternoon", "evening"].map((shiftId) => {
    const group = bills.filter((b) => b.shiftId === shiftId);
    return {
      shiftId,
      count: group.length,
      qty: group.reduce((s, b) => s + b.totalQty, 0),
      revenue: group.reduce((s, b) => s + b.totalPrice, 0),
    };
  });

  const map = {};
  for (const bill of bills) {
    for (const item of bill.items) {
      if (!map[item.name]) {
        map[item.name] = { name: item.name, qty: 0, revenue: 0 };
      }
      map[item.name].qty += normalizeNumber(item.qty);
      map[item.name].revenue +=
        normalizeNumber(item.qty) * normalizeNumber(item.price);
    }
  }

  const topItems = Object.values(map)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  res.json({
    totalRevenue,
    totalBills,
    totalQty,
    shiftStats,
    topItems,
    bills,
  });
});

app.listen(PORT, () => {
  console.log(`FOREVER POS PRO V1 backend running on http://localhost:${PORT}`);
});
