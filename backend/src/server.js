const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "";

/* =========================
   MongoDB Connect
========================= */
async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI in environment variables");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

/* =========================
   Schemas
========================= */
const userSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true, required: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "staff"], default: "staff" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const inventorySchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    stock: { type: Number, default: 0 },
    unit: { type: String, required: true, trim: true },
    cost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const menuItemSchema = new mongoose.Schema(
  {
    itemId: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    recipe: [
      {
        sku: String,
        inventoryId: String,
        name: String,
        qty: Number,
        unit: String,
      },
    ],
  },
  { timestamps: true }
);

const orderItemSchema = new mongoose.Schema(
  {
    itemId: String,
    name: String,
    price: Number,
    category: String,
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    tableName: { type: String, required: true, unique: true },
    customerName: { type: String, default: "Khách lẻ" },
    discount: { type: Number, default: 0 },
    items: [orderItemSchema],
    status: { type: String, enum: ["open", "paid"], default: "open" },
  },
  { timestamps: true }
);

const billSchema = new mongoose.Schema(
  {
    receiptCode: { type: String, required: true, unique: true },
    tableName: { type: String, required: true },
    customerName: { type: String, default: "Khách lẻ" },
    seller: { type: String, required: true },
    shift: { type: String, default: "Ca sáng" },
    items: [orderItemSchema],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const stockLogSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    note: { type: String, required: true },
    items: [
      {
        sku: String,
        qty: Number,
        cost: Number,
      },
    ],
  },
  { timestamps: true }
);

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, required: true },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Inventory = mongoose.model("Inventory", inventorySchema);
const MenuItem = mongoose.model("MenuItem", menuItemSchema);
const Order = mongoose.model("Order", orderSchema);
const Bill = mongoose.model("Bill", billSchema);
const StockLog = mongoose.model("StockLog", stockLogSchema);
const Setting = mongoose.model("Setting", settingSchema);

/* =========================
   Helpers
========================= */
const DEFAULT_TABLES = [
  "Bàn 1",
  "Bàn 2",
  "Bàn 3",
  "Bàn 4",
  "Bàn 5",
  "Bàn 6",
  "Bàn 7",
  "Bàn 8",
  "Bàn 9",
  "Bàn 10",
  "Mang về",
  "Giao đi",
];

const DEFAULT_MENU = [
  { itemId: "cf_den", name: "Cà phê đen đá", price: 25000, category: "Cà phê", active: true, recipe: [] },
  { itemId: "cf_sua", name: "Cà phê sữa đá", price: 30000, category: "Cà phê", active: true, recipe: [] },
  { itemId: "bac_xiu", name: "Bạc xỉu", price: 35000, category: "Cà phê", active: true, recipe: [] },
  { itemId: "tra_dao", name: "Trà đào", price: 35000, category: "Trà", active: true, recipe: [] },
  { itemId: "tra_tac", name: "Trà tắc", price: 30000, category: "Trà", active: true, recipe: [] },
  { itemId: "tra_sua", name: "Trà sữa", price: 40000, category: "Trà sữa", active: true, recipe: [] },
  { itemId: "cacao_da", name: "Cacao đá", price: 38000, category: "Đá xay", active: true, recipe: [] },
  { itemId: "yaourt_da", name: "Yaourt đá", price: 32000, category: "Khác", active: true, recipe: [] },
  { itemId: "yaourt_vai", name: "Yaourt vải", price: 28000, category: "Khác", active: true, recipe: [] }
];

function buildReceiptCode() {
  const now = new Date();
  const stamp =
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");
  return `HD${stamp}`;
}

async function getTables() {
  const setting = await Setting.findOne({ key: "tables" });
  if (!setting) return DEFAULT_TABLES;
  return Array.isArray(setting.value) ? setting.value : DEFAULT_TABLES;
}

async function saveTables(tables) {
  await Setting.findOneAndUpdate(
    { key: "tables" },
    { value: tables },
    { upsert: true, new: true }
  );
}

function calcSubtotal(items = []) {
  return items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0), 0);
}

async function ensureSeedData() {
  const admin = await User.findOne({ username: "admin" });
  if (!admin) {
    await User.create({
      username: "admin",
      password: "123456",
      name: "Administrator",
      role: "admin",
      active: true,
    });
  }

  const staff = await User.findOne({ username: "staff" });
  if (!staff) {
    await User.create({
      username: "staff",
      password: "123456",
      name: "Staff",
      role: "staff",
      active: true,
    });
  }

  const menuCount = await MenuItem.countDocuments();
  if (menuCount === 0) {
    await MenuItem.insertMany(DEFAULT_MENU);
  }

  const setting = await Setting.findOne({ key: "tables" });
  if (!setting) {
    await saveTables(DEFAULT_TABLES);
  }
}

/* =========================
   Health
========================= */
app.get("/", async (req, res) => {
  res.json({
    success: true,
    message: "FOREVER POS backend is running",
  });
});

/* =========================
   Auth
========================= */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    const user = await User.findOne({
      username,
      password,
      active: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Sai tài khoản hoặc mật khẩu",
      });
    }

    return res.json({
      success: true,
      token: `demo-token-${user.username}`,
      user: {
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi đăng nhập",
      error: error.message,
    });
  }
});

/* =========================
   Tables
========================= */
app.get("/api/tables", async (req, res) => {
  try {
    const tables = await getTables();
    return res.json({ success: true, data: tables });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/tables", async (req, res) => {
  try {
    const { tableName } = req.body || {};
    const name = String(tableName || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, message: "Thiếu tên bàn" });
    }

    const tables = await getTables();
    if (tables.includes(name)) {
      return res.status(400).json({ success: false, message: "Bàn đã tồn tại" });
    }

    const nextTables = [...tables, name];
    await saveTables(nextTables);

    return res.json({ success: true, data: nextTables });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/tables/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const order = await Order.findOne({ tableName, status: "open" });

    if (order && order.items.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bàn đang có đơn, không thể xóa",
      });
    }

    const tables = await getTables();
    const nextTables = tables.filter((t) => t !== tableName);
    await saveTables(nextTables);

    return res.json({ success: true, data: nextTables });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================
   Menu
========================= */
app.get("/api/menu", async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/menu", async (req, res) => {
  try {
    const { name, price, category, active = true } = req.body || {};

    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tên món, giá hoặc danh mục",
      });
    }

    const item = await MenuItem.create({
      itemId: uidServer("menu"),
      name,
      price: Number(price),
      category,
      active,
      recipe: [],
    });

    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/menu/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, active } = req.body || {};

    const item = await MenuItem.findByIdAndUpdate(
      id,
      {
        name,
        price: Number(price),
        category,
        active: !!active,
      },
      { new: true }
    );

    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/menu/:id", async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Đã xóa món" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/menu/:id/recipe", async (req, res) => {
  try {
    const { sku, inventoryId, name, qty, unit } = req.body || {};
    const item = await MenuItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Không tìm thấy món" });
    }

    const existing = item.recipe.find((r) => r.sku === sku);
    if (existing) {
      item.recipe = item.recipe.map((r) =>
        r.sku === sku ? { ...r.toObject(), qty: Number(qty) } : r
      );
    } else {
      item.recipe.push({
        sku,
        inventoryId,
        name,
        qty: Number(qty),
        unit,
      });
    }

    await item.save();
    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/menu/:id/recipe/:sku", async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Không tìm thấy món" });
    }

    item.recipe = item.recipe.filter((r) => r.sku !== req.params.sku);
    await item.save();

    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================
   Inventory
========================= */
app.get("/api/inventory", async (req, res) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/inventory/import", async (req, res) => {
  try {
    const { name, unit, qty, cost = 0 } = req.body || {};
    const quantity = Number(qty || 0);

    if (!name || !unit || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Thiếu tên hàng, đơn vị tính hoặc số lượng",
      });
    }

    let item = await Inventory.findOne({
      name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
    });

    if (item) {
      item.stock = Number(item.stock) + quantity;
      item.unit = unit;
      item.cost = Number(cost || item.cost || 0);
      await item.save();
    } else {
      item = await Inventory.create({
        sku: uidServer("sku"),
        name,
        stock: quantity,
        unit,
        cost: Number(cost || 0),
      });
    }

    await StockLog.create({
      type: "import",
      note: `Nhập hàng: ${name}`,
      items: [{ sku: item.sku, qty: quantity, cost: Number(cost || 0) }],
    });

    return res.json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/inventory/:id", async (req, res) => {
  try {
    const target = await Inventory.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hàng" });
    }

    const usedInMenu = await MenuItem.findOne({ "recipe.sku": target.sku });
    if (usedInMenu) {
      return res.status(400).json({
        success: false,
        message: "Hàng này đang được gán trong công thức món, hãy xóa công thức trước",
      });
    }

    await Inventory.findByIdAndDelete(req.params.id);

    await StockLog.create({
      type: "delete_item",
      note: `Xóa hàng khỏi kho: ${target.name}`,
      items: [{ sku: target.sku, qty: Number(target.stock || 0), cost: Number(target.cost || 0) }],
    });

    return res.json({ success: true, message: "Đã xóa hàng" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/stock-logs", async (req, res) => {
  try {
    const logs = await StockLog.find().sort({ createdAt: -1 }).limit(300);
    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================
   Staff
========================= */
app.get("/api/staffs", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/staffs", async (req, res) => {
  try {
    const { username, password, name, role = "staff" } = req.body || {};

    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Thiếu username, password hoặc name",
      });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Username đã tồn tại",
      });
    }

    const user = await User.create({
      username,
      password,
      name,
      role,
      active: true,
    });

    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/staffs/:id", async (req, res) => {
  try {
    const { username, password, name, role, active } = req.body || {};

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, password, name, role, active: !!active },
      { new: true }
    );

    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/staffs/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Đã xóa nhân viên" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================
   Orders
========================= */
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find({ status: "open" }).sort({ updatedAt: -1 });
    return res.json({ success: true, data: orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/orders/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { customerName = "Khách lẻ", discount = 0, items = [] } = req.body || {};

    const order = await Order.findOneAndUpdate(
      { tableName, status: "open" },
      { tableName, customerName, discount: Number(discount || 0), items, status: "open" },
      { new: true, upsert: true }
    );

    return res.json({ success: true, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/orders/move", async (req, res) => {
  try {
    const { fromTable, toTable } = req.body || {};

    const source = await Order.findOne({ tableName: fromTable, status: "open" });
    const target = await Order.findOne({ tableName: toTable, status: "open" });

    if (!source || source.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bàn nguồn chưa có đơn",
      });
    }

    if (target && target.items.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Bàn đích đang có đơn, hãy dùng gộp bàn",
      });
    }

    source.tableName = toTable;
    await source.save();

    return res.json({ success: true, message: "Đã chuyển bàn" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/orders/merge", async (req, res) => {
  try {
    const { fromTable, toTable } = req.body || {};

    const source = await Order.findOne({ tableName: fromTable, status: "open" });
    const target = await Order.findOne({ tableName: toTable, status: "open" });

    if (!source || source.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Bàn nguồn chưa có đơn",
      });
    }

    const mergedMap = {};

    [...(target?.items || []), ...source.items].forEach((item) => {
      if (!mergedMap[item.itemId]) {
        mergedMap[item.itemId] = { ...item.toObject?.() || item };
      } else {
        mergedMap[item.itemId].qty += item.qty;
      }
    });

    if (target) {
      target.items = Object.values(mergedMap);
      await target.save();
    } else {
      await Order.create({
        tableName: toTable,
        customerName: source.customerName || "Khách lẻ",
        discount: Number(source.discount || 0),
        items: Object.values(mergedMap),
        status: "open",
      });
    }

    await Order.findByIdAndDelete(source._id);

    return res.json({ success: true, message: "Đã gộp bàn" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================
   Checkout
========================= */
app.post("/api/orders/:tableName/checkout", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { seller, shift = "Ca sáng" } = req.body || {};

    const order = await Order.findOne({ tableName, status: "open" });
    if (!order || order.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có đơn để thanh toán",
      });
    }

    const menuMap = {};
    const menuDocs = await MenuItem.find({
      itemId: { $in: order.items.map((i) => i.itemId) },
    });

    menuDocs.forEach((m) => {
      menuMap[m.itemId] = m;
    });

    const required = {};
    for (const orderItem of order.items) {
      const menu = menuMap[orderItem.itemId];
      if (!menu?.recipe?.length) continue;

      for (const recipeItem of menu.recipe) {
        required[recipeItem.sku] =
          (required[recipeItem.sku] || 0) + Number(recipeItem.qty || 0) * Number(orderItem.qty || 0);
      }
    }

    for (const [sku, qtyNeeded] of Object.entries(required)) {
      const inv = await Inventory.findOne({ sku });
      if (!inv || Number(inv.stock) < qtyNeeded) {
        return res.status(400).json({
          success: false,
          message: `Không đủ tồn kho: ${inv?.name || sku}`,
        });
      }
    }

    for (const [sku, qtyNeeded] of Object.entries(required)) {
      await Inventory.findOneAndUpdate(
        { sku },
        { $inc: { stock: -Number(qtyNeeded) } }
      );
    }

    await StockLog.create({
      type: "auto_deduct",
      note: `Tự động trừ kho sau thanh toán ${tableName}`,
      items: Object.entries(required).map(([sku, qty]) => ({
        sku,
        qty: Number(qty),
      })),
    });

    const subtotal = calcSubtotal(order.items);
    const total = Math.max(0, subtotal - Number(order.discount || 0));

    const bill = await Bill.create({
      receiptCode: buildReceiptCode(),
      tableName,
      customerName: order.customerName || "Khách lẻ",
      seller: seller || "staff",
      shift,
      items: order.items,
      subtotal,
      discount: Number(order.discount || 0),
      total,
    });

    await Order.findByIdAndDelete(order._id);

    return res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================
   Bills
========================= */
app.get("/api/bills", async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 }).limit(500);
    return res.json({ success: true, data: bills });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* =========================
   Utils
========================= */
function uidServer(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* =========================
   Start
========================= */
async function startServer() {
  try {
    await connectDB();
    await ensureSeedData();

    app.listen(PORT, () => {
      console.log(`FOREVER POS backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start failed:", error.message);
    process.exit(1);
  }
}

startServer();
import express from "express";
import mongoose from "mongoose";

const app = express();

app.use(express.json());

// 🔥 CONNECT MONGODB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ MongoDB error:", err));

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("FOREVER POS API RUNNING");
});

// PORT
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});
