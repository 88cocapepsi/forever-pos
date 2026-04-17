const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

const PORT = 3000;
const SECRET = "forever_secret_key";
const DB_FILE = "./db.json";

/* ===== DB ===== */
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    const init = {
      users: [
        { username: "admin", password: "123456", role: "admin" },
        { username: "thungan", password: "123456", role: "cashier" },
      ],
      menu: [],
      orders: {},
      bills: [],
      inventory: [],
      recipes: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ===== SOCKET ===== */
io.on("connection", (socket) => {
  console.log("📡 Client connected");
});

/* ===== AUTH ===== */
app.post("/api/login", (req, res) => {
  const db = loadDB();
  const { username, password } = req.body;

  const user = db.users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) return res.status(401).json({ message: "Sai tài khoản" });

  const token = jwt.sign(user, SECRET);
  res.json({ token, user });
});

/* ===== CHECKOUT (TRỪ KHO + PUSH REALTIME) ===== */
app.post("/api/checkout", (req, res) => {
  const db = loadDB();
  const { table, items } = req.body;

  // 👉 TRỪ KHO
  items.forEach((i) => {
    const recipe = db.recipes.find((r) => r.menuId == i.id);
    if (recipe) {
      recipe.items.forEach((r) => {
        const inv = db.inventory.find((x) => x.id == r.inventoryId);
        if (inv) {
          inv.quantity -= r.qty * i.qty;

          // 🚨 cảnh báo hết hàng
          if (inv.quantity <= 0) {
            io.emit("out_of_stock", inv.name);
          }
        }
      });
    }
  });

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const bill = {
    id: Date.now(),
    table,
    items,
    total,
    time: new Date(),
  };

  db.bills.push(bill);
  delete db.orders[table];

  saveDB(db);

  // 🔔 PUSH REALTIME
  io.emit("new_bill", bill);

  res.json(bill);
});

/* ===== START ===== */
server.listen(PORT, () => {
  console.log("🔥 Backend PRO MAX chạy tại " + PORT);
});
