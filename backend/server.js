const express = require("express");
const cors = require("cors");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const SECRET = "forever_secret_key";

const DB_FILE = "./db.json";

/* ================= DB ================= */

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const init = {
      users: [
        {
          id: 1,
          username: "admin",
          password: "123456",
          fullName: "Admin",
          role: "admin",
        },
        {
          id: 2,
          username: "thungan",
          password: "123456",
          fullName: "Thu ngân",
          role: "cashier",
        },
      ],
      menu: [],
      orders: {},
      bills: [],
      inventory: [],
      inventoryTransactions: [],
      recipes: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

/* ================= AUTH ================= */

app.post("/api/auth/login", (req, res) => {
  const db = loadDB();
  const { username, password } = req.body;

  const user = db.users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ message: "Sai tài khoản" });

  const token = jwt.sign(user, SECRET);
  res.json({ token, user });
});

app.get("/api/me", auth, (req, res) => {
  res.json({ user: req.user });
});

/* ================= MENU ================= */

app.get("/api/menu", auth, (req, res) => {
  res.json(loadDB().menu);
});

app.post("/api/menu", auth, (req, res) => {
  const db = loadDB();
  const item = {
    id: Date.now(),
    ...req.body,
    active: true,
  };
  db.menu.push(item);
  saveDB(db);
  res.json(item);
});

/* ================= ORDERS ================= */

app.get("/api/orders", auth, (req, res) => {
  res.json(loadDB().orders);
});

app.put("/api/orders/:table", auth, (req, res) => {
  const db = loadDB();
  db.orders[req.params.table] = {
    table: req.params.table,
    items: req.body.items,
  };
  saveDB(db);
  res.json({ ok: true });
});

app.delete("/api/orders/:table", auth, (req, res) => {
  const db = loadDB();
  delete db.orders[req.params.table];
  saveDB(db);
  res.json({ ok: true });
});

/* ================= INVENTORY ================= */

// lấy danh sách kho
app.get("/api/inventory", auth, (req, res) => {
  res.json(loadDB().inventory);
});

// thêm hàng
app.post("/api/inventory", auth, (req, res) => {
  const db = loadDB();
  const item = {
    id: Date.now(),
    ...req.body,
    quantity: Number(req.body.quantity || 0),
  };
  db.inventory.push(item);
  saveDB(db);
  res.json(item);
});

// nhập kho
app.post("/api/inventory/:id/stock-in", auth, (req, res) => {
  const db = loadDB();
  const item = db.inventory.find((i) => i.id == req.params.id);

  item.quantity += Number(req.body.quantity);

  db.inventoryTransactions.push({
    id: Date.now(),
    type: "IN",
    inventoryId: item.id,
    inventoryName: item.name,
    quantity: req.body.quantity,
    createdAt: new Date(),
  });

  saveDB(db);
  res.json(item);
});

// điều chỉnh kho
app.post("/api/inventory/:id/adjust", auth, (req, res) => {
  const db = loadDB();
  const item = db.inventory.find((i) => i.id == req.params.id);

  item.quantity += Number(req.body.quantity);

  db.inventoryTransactions.push({
    id: Date.now(),
    type: "ADJUST",
    inventoryId: item.id,
    inventoryName: item.name,
    quantity: req.body.quantity,
    createdAt: new Date(),
  });

  saveDB(db);
  res.json(item);
});

/* ================= RECIPES ================= */

// lấy công thức
app.get("/api/recipes", auth, (req, res) => {
  res.json(loadDB().recipes);
});

// lưu công thức
app.put("/api/recipes/:menuId", auth, (req, res) => {
  const db = loadDB();

  db.recipes = db.recipes.filter(
    (r) => r.menuId != req.params.menuId
  );

  db.recipes.push({
    menuId: Number(req.params.menuId),
    items: req.body.items,
  });

  saveDB(db);
  res.json({ ok: true });
});

/* ================= CHECKOUT ================= */

app.post("/api/checkout", auth, (req, res) => {
  const db = loadDB();
  const { table, items } = req.body;

  // 👉 TRỪ KHO
  items.forEach((orderItem) => {
    const recipe = db.recipes.find(
      (r) => r.menuId == orderItem.id
    );

    if (recipe) {
      recipe.items.forEach((r) => {
        const inv = db.inventory.find(
          (i) => i.id == r.inventoryId
        );

        if (inv) {
          inv.quantity -= r.qtyPerUnit * orderItem.qty;

          db.inventoryTransactions.push({
            id: Date.now(),
            type: "OUT",
            inventoryId: inv.id,
            inventoryName: inv.name,
            quantity: -r.qtyPerUnit * orderItem.qty,
            createdAt: new Date(),
          });
        }
      });
    }
  });

  const total = items.reduce(
    (s, i) => s + i.price * i.qty,
    0
  );

  const bill = {
    billCode: "B" + Date.now(),
    table,
    items,
    totalPrice: total,
    billTime: new Date(),
  };

  db.bills.push(bill);
  delete db.orders[table];

  saveDB(db);
  res.json(bill);
});

/* ================= REPORT ================= */

app.get("/api/reports/today", auth, (req, res) => {
  const db = loadDB();
  const totalRevenue = db.bills.reduce(
    (s, b) => s + b.totalPrice,
    0
  );

  res.json({
    totalRevenue,
    totalBills: db.bills.length,
    totalQty: db.bills.reduce(
      (s, b) =>
        s + b.items.reduce((ss, i) => ss + i.qty, 0),
      0
    ),
    bills: db.bills,
    shiftStats: [],
    topItems: [],
  });
});

/* ================= START ================= */

app.listen(PORT, () => {
  console.log("Server chạy tại http://localhost:" + PORT);
});
