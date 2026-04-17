import { useEffect, useMemo, useState } from "react";

const API_URL = "https://forever-pos.onrender.com";

const STORE_INFO = {
  name: "FOREVER COFFEE & BEER",
  address1: "B38 đường 4A",
  address2: "P. Tân Hưng, Q.7",
  phone: "0788880891",
};

const TABLES = [
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

const MENU_ITEMS = [
  {
    id: "cf_den",
    name: "Cà phê đen đá",
    price: 25000,
    category: "Cà phê",
    recipe: [
      { sku: "cf_hat", qty: 18, unit: "g" },
      { sku: "duong", qty: 8, unit: "g" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
  {
    id: "cf_sua",
    name: "Cà phê sữa đá",
    price: 30000,
    category: "Cà phê",
    recipe: [
      { sku: "cf_hat", qty: 18, unit: "g" },
      { sku: "sua_dac", qty: 25, unit: "ml" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
  {
    id: "bac_xiu",
    name: "Bạc xỉu",
    price: 35000,
    category: "Cà phê",
    recipe: [
      { sku: "cf_hat", qty: 10, unit: "g" },
      { sku: "sua_dac", qty: 35, unit: "ml" },
      { sku: "sua_tuoi", qty: 80, unit: "ml" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
  {
    id: "tra_dao",
    name: "Trà đào",
    price: 35000,
    category: "Trà",
    recipe: [
      { sku: "tra_nen", qty: 12, unit: "g" },
      { sku: "dao_ngam", qty: 40, unit: "g" },
      { sku: "duong", qty: 12, unit: "g" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
  {
    id: "tra_tac",
    name: "Trà tắc",
    price: 30000,
    category: "Trà",
    recipe: [
      { sku: "tra_nen", qty: 12, unit: "g" },
      { sku: "tac", qty: 25, unit: "ml" },
      { sku: "duong", qty: 12, unit: "g" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
  {
    id: "tra_sua",
    name: "Trà sữa",
    price: 40000,
    category: "Trà sữa",
    recipe: [
      { sku: "tra_nen", qty: 12, unit: "g" },
      { sku: "bot_sua", qty: 30, unit: "g" },
      { sku: "duong", qty: 15, unit: "g" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
  {
    id: "cacao_da",
    name: "Cacao đá",
    price: 38000,
    category: "Đá xay",
    recipe: [
      { sku: "bot_cacao", qty: 22, unit: "g" },
      { sku: "sua_tuoi", qty: 100, unit: "ml" },
      { sku: "duong", qty: 10, unit: "g" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
  {
    id: "yaourt_da",
    name: "Yaourt đá",
    price: 32000,
    category: "Khác",
    recipe: [
      { sku: "yaourt", qty: 1, unit: "hũ" },
      { sku: "duong", qty: 8, unit: "g" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
  {
    id: "yaourt_vai",
    name: "Yaourt vải",
    price: 28000,
    category: "Khác",
    recipe: [
      { sku: "yaourt", qty: 1, unit: "hũ" },
      { sku: "vai_ngam", qty: 35, unit: "g" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
];

const INITIAL_INVENTORY = [
  { sku: "cf_hat", name: "Cà phê hạt", stock: 5000, unit: "g", cost: 0 },
  { sku: "tra_nen", name: "Trà nền", stock: 3000, unit: "g", cost: 0 },
  { sku: "duong", name: "Đường", stock: 4000, unit: "g", cost: 0 },
  { sku: "sua_dac", name: "Sữa đặc", stock: 3000, unit: "ml", cost: 0 },
  { sku: "sua_tuoi", name: "Sữa tươi", stock: 5000, unit: "ml", cost: 0 },
  { sku: "bot_sua", name: "Bột sữa", stock: 2000, unit: "g", cost: 0 },
  { sku: "bot_cacao", name: "Bột cacao", stock: 1500, unit: "g", cost: 0 },
  { sku: "dao_ngam", name: "Đào ngâm", stock: 2000, unit: "g", cost: 0 },
  { sku: "vai_ngam", name: "Vải ngâm", stock: 1500, unit: "g", cost: 0 },
  { sku: "tac", name: "Nước tắc", stock: 1200, unit: "ml", cost: 0 },
  { sku: "yaourt", name: "Yaourt", stock: 100, unit: "hũ", cost: 0 },
  { sku: "da_vien", name: "Đá viên", stock: 300, unit: "ly", cost: 0 },
];

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0));

const formatMoneyWithVND = (value) => `${formatMoney(value)} đ`;

const formatDateTime = (date = new Date()) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const generateReceiptCode = () => {
  return `HD${Date.now().toString().slice(-6)}`;
};

const generateTamTinhCode = () => {
  return `${Math.floor(100 + Math.random() * 900)}-${Math.floor(
    100 + Math.random() * 900
  )}`;
};

const getStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

function buildPrintHTML({
  type = "sale",
  tableName,
  sellerName,
  customerName = "Khách lẻ",
  items = [],
  subtotal = 0,
  discount = 0,
  total = 0,
  createdAt = new Date(),
}) {
  const title = type === "temp" ? "PHIẾU TẠM TÍNH" : "HÓA ĐƠN BÁN HÀNG";
  const code = type === "temp" ? generateTamTinhCode() : generateReceiptCode();

  const rowsHTML = items
    .map(
      (item) => `
      <div class="item-name">${item.name}</div>
      <div class="item-row">
        <div>${formatMoney(item.price)}</div>
        <div>${item.qty}</div>
        <div>${formatMoney(item.qty * item.price)}</div>
      </div>
    `
    )
    .join("");

  return `
  <html>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, Helvetica, sans-serif;
          width: 76mm;
          margin: 0 auto;
          padding: 8px 6px 18px;
          color: #000;
          font-size: 13px;
        }
        .center { text-align: center; }
        .bold { font-weight: 700; }
        .big { font-size: 18px; }
        .mt8 { margin-top: 8px; }
        .mt10 { margin-top: 10px; }
        .mt14 { margin-top: 14px; }
        .line {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin: 2px 0;
        }
        .item-header,
        .item-row {
          display: grid;
          grid-template-columns: 1fr 40px 1fr;
          gap: 6px;
          align-items: center;
        }
        .item-header div:nth-child(2),
        .item-row div:nth-child(2) {
          text-align: center;
        }
        .item-header div:nth-child(3),
        .item-row div:nth-child(3) {
          text-align: right;
        }
        .item-name {
          margin: 8px 0 2px;
        }
        .summary {
          margin-top: 8px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 3px 0;
        }
      </style>
    </head>
    <body>
      <div class="center bold">${STORE_INFO.name}</div>
      <div class="center">Đ/C: ${STORE_INFO.address1}</div>
      <div class="center">${STORE_INFO.address2}</div>
      <div class="center">Điện thoại: ${STORE_INFO.phone}</div>

      <div class="line"></div>

      ${
        type === "temp"
          ? `
            <div>Ngày bán: ${formatDateTime(createdAt)}</div>
            <div class="center bold big mt8">${title}</div>
            <div class="center bold">${code}</div>
            <div class="mt10">Phòng bàn: ${tableName}</div>
            <div>Giờ vào: ${formatDateTime(createdAt)}</div>
            <div>Khách hàng: ${customerName}</div>
            <div class="bold">Người bán: ${sellerName}</div>
          `
          : `
            <div>Liên số: Liên 1</div>
            <div>Ngày bán: ${formatDateTime(createdAt)}</div>
            <div class="center bold big mt8">${title}</div>
            <div class="center bold">${code}</div>
            <div class="mt10"><span class="bold">Khách hàng:</span> ${customerName}</div>
            <div>Địa chỉ:</div>
            <div>Khu vực:</div>
            <div>Thời gian giao hàng:</div>
            <div>Điện thoại:</div>
            <div class="bold">Người bán: ${sellerName}</div>
          `
      }

      <div class="line"></div>

      <div class="item-header bold">
        <div>Đơn giá</div>
        <div>SL</div>
        <div>Thành tiền</div>
      </div>

      ${rowsHTML}

      <div class="line"></div>

      <div class="summary">
        <div class="summary-row">
          <div>Tổng tiền hàng:</div>
          <div>${formatMoney(subtotal)}</div>
        </div>
        <div class="summary-row">
          <div>Chiết khấu:</div>
          <div>${formatMoney(discount)}</div>
        </div>
        <div class="summary-row bold">
          <div>Tổng cộng:</div>
          <div>${formatMoney(total)}</div>
        </div>
      </div>

      <div class="mt14 center">${STORE_INFO.name}</div>
      <div class="center">${STORE_INFO.address1} - ${STORE_INFO.address2}</div>
      <div class="center">Điện thoại: ${STORE_INFO.phone}</div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 500);
        };
      </script>
    </body>
  </html>
  `;
}

export default function App() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [activeTab, setActiveTab] = useState("banhang");
  const [selectedTable, setSelectedTable] = useState("Bàn 1");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const [orders, setOrders] = useState(() =>
    getStorage("forever_pos_orders", {})
  );
  const [inventory, setInventory] = useState(() =>
    getStorage("forever_pos_inventory", INITIAL_INVENTORY)
  );
  const [stockLogs, setStockLogs] = useState(() =>
    getStorage("forever_pos_stock_logs", [])
  );
  const [paymentLogs, setPaymentLogs] = useState(() =>
    getStorage("forever_pos_payment_logs", [])
  );
  const [notifications, setNotifications] = useState([]);
  const [customerName, setCustomerName] = useState("Khách lẻ");
  const [discount, setDiscount] = useState(0);

  const [stockForm, setStockForm] = useState({
    sku: INITIAL_INVENTORY[0].sku,
    qty: "",
    cost: "",
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("forever_pos_user");
    if (savedUser) {
      try {
        setLoggedInUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("forever_pos_user");
      }
    }
  }, []);

  useEffect(() => saveStorage("forever_pos_orders", orders), [orders]);
  useEffect(() => saveStorage("forever_pos_inventory", inventory), [inventory]);
  useEffect(() => saveStorage("forever_pos_stock_logs", stockLogs), [stockLogs]);
  useEffect(
    () => saveStorage("forever_pos_payment_logs", paymentLogs),
    [paymentLogs]
  );

  const categories = useMemo(
    () => ["Tất cả", ...Array.from(new Set(MENU_ITEMS.map((i) => i.category)))],
    []
  );

  const filteredMenu = useMemo(() => {
    if (selectedCategory === "Tất cả") return MENU_ITEMS;
    return MENU_ITEMS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const currentOrder = orders[selectedTable] || [];

  const subtotal = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [currentOrder]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - Number(discount || 0));
  }, [subtotal, discount]);

  const activeTablesCount = useMemo(() => {
    return Object.values(orders).filter((items) => items && items.length > 0).length;
  }, [orders]);

  const totalOpenItems = useMemo(() => {
    return Object.values(orders)
      .flat()
      .reduce((sum, item) => sum + item.qty, 0);
  }, [orders]);

  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => Number(item.stock) <= 10);
  }, [inventory]);

  const notify = (message, type = "success") => {
    const id = Date.now() + Math.random();
    const item = { id, message, type };
    setNotifications((prev) => [item, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  const getInventoryItem = (sku) => inventory.find((item) => item.sku === sku);

  const getTableItemCount = (tableName) => {
    return (orders[tableName] || []).reduce((sum, item) => sum + item.qty, 0);
  };

  const getRequiredIngredients = (orderItems) => {
    const usageMap = {};

    orderItems.forEach((orderItem) => {
      const menu = MENU_ITEMS.find((m) => m.id === orderItem.id);
      if (!menu || !menu.recipe) return;

      menu.recipe.forEach((recipeItem) => {
        if (!usageMap[recipeItem.sku]) {
          usageMap[recipeItem.sku] = 0;
        }
        usageMap[recipeItem.sku] += recipeItem.qty * orderItem.qty;
      });
    });

    return usageMap;
  };

  const canCheckout = () => {
    const required = getRequiredIngredients(currentOrder);

    for (const [sku, neededQty] of Object.entries(required)) {
      const stockItem = getInventoryItem(sku);
      if (!stockItem || Number(stockItem.stock) < neededQty) {
        return {
          ok: false,
          message: `Không đủ tồn kho: ${stockItem?.name || sku}`,
        };
      }
    }

    return { ok: true };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      localStorage.setItem("forever_pos_token", data.token || "");
      localStorage.setItem("forever_pos_user", JSON.stringify(data.user || {}));
      setLoggedInUser(data.user || null);
      notify("Đăng nhập thành công", "success");
    } catch (err) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("forever_pos_token");
    localStorage.removeItem("forever_pos_user");
    setLoggedInUser(null);
    setUsername("admin");
    setPassword("123456");
    setError("");
  };

  const addItemToOrder = (menuItem) => {
    setOrders((prev) => {
      const tableOrder = prev[selectedTable] || [];
      const found = tableOrder.find((i) => i.id === menuItem.id);

      let updatedOrder;
      if (found) {
        updatedOrder = tableOrder.map((i) =>
          i.id === menuItem.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        updatedOrder = [...tableOrder, { ...menuItem, qty: 1 }];
      }

      return {
        ...prev,
        [selectedTable]: updatedOrder,
      };
    });
  };

  const changeQty = (itemId, delta) => {
    setOrders((prev) => {
      const tableOrder = prev[selectedTable] || [];
      const updated = tableOrder
        .map((item) =>
          item.id === itemId ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0);

      return {
        ...prev,
        [selectedTable]: updated,
      };
    });
  };

  const clearCurrentOrder = () => {
    setOrders((prev) => ({
      ...prev,
      [selectedTable]: [],
    }));
    setDiscount(0);
    setCustomerName("Khách lẻ");
    notify(`Đã xóa đơn của ${selectedTable}`, "info");
  };

  const printReceipt = (type = "sale") => {
    if (!currentOrder.length) {
      notify("Bàn này chưa có món để in", "warning");
      return;
    }

    const html = buildPrintHTML({
      type,
      tableName: selectedTable,
      sellerName: loggedInUser?.username || "staff",
      customerName,
      items: currentOrder,
      subtotal,
      discount: Number(discount || 0),
      total,
      createdAt: new Date(),
    });

    const printWindow = window.open("", "_blank", "width=420,height=800");
    if (!printWindow) {
      alert("Trình duyệt đang chặn popup in bill.");
      return;
    }
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleTempPrint = () => {
    printReceipt("temp");
    notify(`Đã in phiếu tạm tính cho ${selectedTable}`, "info");
  };

  const handleCheckout = () => {
    if (!currentOrder.length) {
      notify("Chưa có món để thanh toán", "warning");
      return;
    }

    const stockCheck = canCheckout();
    if (!stockCheck.ok) {
      notify(stockCheck.message, "error");
      return;
    }

    const required = getRequiredIngredients(currentOrder);

    setInventory((prev) =>
      prev.map((stockItem) => {
        const usedQty = required[stockItem.sku] || 0;
        return {
          ...stockItem,
          stock: Number(stockItem.stock) - usedQty,
        };
      })
    );

    const receiptId = generateReceiptCode();
    const log = {
      id: receiptId,
      type: "payment",
      tableName: selectedTable,
      seller: loggedInUser?.username || "staff",
      customerName,
      items: currentOrder,
      subtotal,
      discount: Number(discount || 0),
      total,
      createdAt: new Date().toISOString(),
    };

    setPaymentLogs((prev) => [log, ...prev]);

    setStockLogs((prev) => [
      {
        id: Date.now(),
        type: "auto_deduct",
        note: `Tự động trừ kho khi thanh toán ${selectedTable}`,
        createdAt: new Date().toISOString(),
        items: Object.entries(required).map(([sku, qty]) => ({
          sku,
          qty,
        })),
      },
      ...prev,
    ]);

    printReceipt("sale");

    setOrders((prev) => ({
      ...prev,
      [selectedTable]: [],
    }));

    setDiscount(0);
    setCustomerName("Khách lẻ");
    notify(`Thanh toán thành công ${selectedTable} - ${formatMoney(total)}`, "success");
  };

  const handleImportStock = (e) => {
    e.preventDefault();

    const qty = Number(stockForm.qty || 0);
    const cost = Number(stockForm.cost || 0);

    if (!stockForm.sku || qty <= 0) {
      notify("Vui lòng nhập số lượng hợp lệ", "warning");
      return;
    }

    setInventory((prev) =>
      prev.map((item) =>
        item.sku === stockForm.sku
          ? {
              ...item,
              stock: Number(item.stock) + qty,
              cost: cost > 0 ? cost : item.cost,
            }
          : item
      )
    );

    const inv = inventory.find((i) => i.sku === stockForm.sku);

    setStockLogs((prev) => [
      {
        id: Date.now(),
        type: "import",
        note: `Nhập hàng: ${inv?.name || stockForm.sku}`,
        createdAt: new Date().toISOString(),
        items: [{ sku: stockForm.sku, qty, cost }],
      },
      ...prev,
    ]);

    setStockForm((prev) => ({
      ...prev,
      qty: "",
      cost: "",
    }));

    notify(`Đã nhập thêm ${qty} ${inv?.unit || ""} ${inv?.name || ""}`, "success");
  };

  if (!loggedInUser) {
    return (
      <div style={styles.page}>
        <div style={styles.loginCard}>
          <div style={styles.loginWatermark}>FOREVER</div>
          <h1 style={styles.loginTitle}>FOREVER POS PRO</h1>
          <p style={styles.loginSubtitle}>
            Đăng nhập hệ thống bán hàng internet
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
            {error ? <div style={styles.errorBox}>{error}</div> : null}
            <button type="submit" style={styles.mainButton}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div style={styles.demoInfo}>
            <div>Admin: admin / 123456</div>
            <div>Staff: staff / 123456</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appShell}>
      <div style={styles.notificationWrap}>
        {notifications.map((item) => (
          <div
            key={item.id}
            style={{
              ...styles.notification,
              ...(item.type === "success"
                ? styles.notificationSuccess
                : item.type === "error"
                ? styles.notificationError
                : item.type === "warning"
                ? styles.notificationWarning
                : styles.notificationInfo),
            }}
          >
            {item.message}
          </div>
        ))}
      </div>

      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logo}>FOREVER</div>
          <div style={styles.brandText}>POS PRO</div>

          <div style={styles.userCard}>
            <div style={styles.userName}>{loggedInUser.username}</div>
            <div style={styles.userRole}>
              {loggedInUser.role === "admin" ? "Quản trị viên" : "Nhân viên"}
            </div>
          </div>

          <div style={styles.navList}>
            <button
              style={{
                ...styles.navButton,
                ...(activeTab === "banhang" ? styles.navButtonActive : {}),
              }}
              onClick={() => setActiveTab("banhang")}
            >
              Bán hàng
            </button>

            <button
              style={{
                ...styles.navButton,
                ...(activeTab === "hoadon" ? styles.navButtonActive : {}),
              }}
              onClick={() => setActiveTab("hoadon")}
            >
              Hóa đơn
            </button>

            {loggedInUser.role === "admin" && (
              <>
                <button
                  style={{
                    ...styles.navButton,
                    ...(activeTab === "kho" ? styles.navButtonActive : {}),
                  }}
                  onClick={() => setActiveTab("kho")}
                >
                  Kho hàng
                </button>

                <button
                  style={{
                    ...styles.navButton,
                    ...(activeTab === "baocao" ? styles.navButtonActive : {}),
                  }}
                  onClick={() => setActiveTab("baocao")}
                >
                  Báo cáo
                </button>
              </>
            )}
          </div>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main style={styles.main}>
        <div style={styles.headerBar}>
          <div>
            <div style={styles.headerTitle}>FOREVER Coffee & Beer</div>
            <div style={styles.headerSub}>
              B38 đường 4A, P. Tân Hưng, Q.7 • {STORE_INFO.phone}
            </div>
          </div>
          <div style={styles.headerBadge}>
            {loggedInUser.role === "admin" ? "ADMIN" : "STAFF"}
          </div>
        </div>

        {activeTab === "banhang" && (
          <div style={styles.salesLayout}>
            <section style={styles.cardLarge}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Sảnh chờ / Bàn phục vụ</h3>
                <div style={styles.smallNote}>Lưu đơn tự động theo từng bàn</div>
              </div>

              <div style={styles.tableGrid}>
                {TABLES.map((table) => (
                  <button
                    key={table}
                    onClick={() => setSelectedTable(table)}
                    style={{
                      ...styles.tableBtn,
                      ...(selectedTable === table ? styles.tableBtnActive : {}),
                    }}
                  >
                    <div>{table}</div>
                    <div style={styles.tableCount}>
                      {getTableItemCount(table) > 0
                        ? `${getTableItemCount(table)} món`
                        : "Trống"}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section style={styles.cardLarge}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Đơn hiện tại - {selectedTable}</h3>
                <div style={styles.smallNote}>Bill in theo mẫu FOREVER</div>
              </div>

              <div style={styles.formRow}>
                <input
                  style={styles.compactInput}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Khách hàng"
                />
                <input
                  style={styles.compactInput}
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Chiết khấu"
                />
              </div>

              <div style={styles.orderBox}>
                {currentOrder.length === 0 ? (
                  <div style={styles.emptyState}>Chưa có món trong đơn này.</div>
                ) : (
                  currentOrder.map((item) => (
                    <div key={item.id} style={styles.orderRow}>
                      <div>
                        <div style={styles.orderName}>{item.name}</div>
                        <div style={styles.orderMeta}>
                          {formatMoney(item.price)} x {item.qty}
                        </div>
                      </div>

                      <div style={styles.orderActions}>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => changeQty(item.id, -1)}
                        >
                          -
                        </button>
                        <span style={styles.qtyText}>{item.qty}</span>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => changeQty(item.id, 1)}
                        >
                          +
                        </button>
                      </div>

                      <div style={styles.orderTotal}>
                        {formatMoney(item.price * item.qty)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.totalPanel}>
                <div style={styles.totalRow}>
                  <span>Tổng tiền hàng</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>
                <div style={styles.totalRow}>
                  <span>Chiết khấu</span>
                  <strong>{formatMoney(discount)}</strong>
                </div>
                <div style={{ ...styles.totalRow, ...styles.totalGrand }}>
                  <span>Tổng cộng</span>
                  <strong>{formatMoney(total)}</strong>
                </div>
              </div>

              <div style={styles.actionGrid}>
                <button style={styles.secondaryBtn} onClick={handleTempPrint}>
                  In tạm tính
                </button>
                <button style={styles.secondaryBtn} onClick={clearCurrentOrder}>
                  Xóa đơn
                </button>
                <button style={styles.primaryBtn} onClick={handleCheckout}>
                  Thanh toán + in bill
                </button>
              </div>
            </section>

            <section style={styles.cardLarge}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Menu đồ uống</h3>
                <div style={styles.categoryTabs}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      style={{
                        ...styles.catBtn,
                        ...(selectedCategory === cat ? styles.catBtnActive : {}),
                      }}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.menuGrid}>
                {filteredMenu.map((item) => (
                  <button
                    key={item.id}
                    style={styles.menuCard}
                    onClick={() => addItemToOrder(item)}
                  >
                    <div style={styles.menuCardName}>{item.name}</div>
                    <div style={styles.menuCardCategory}>{item.category}</div>
                    <div style={styles.menuCardPrice}>{formatMoney(item.price)}</div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "kho" && loggedInUser.role === "admin" && (
          <div style={styles.adminLayout}>
            <section style={styles.cardLarge}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Nhập hàng / cập nhật kho</h3>
              </div>

              <form onSubmit={handleImportStock} style={styles.stockForm}>
                <select
                  style={styles.compactInput}
                  value={stockForm.sku}
                  onChange={(e) =>
                    setStockForm((prev) => ({ ...prev, sku: e.target.value }))
                  }
                >
                  {inventory.map((item) => (
                    <option key={item.sku} value={item.sku}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <input
                  style={styles.compactInput}
                  type="number"
                  placeholder="Số lượng nhập"
                  value={stockForm.qty}
                  onChange={(e) =>
                    setStockForm((prev) => ({ ...prev, qty: e.target.value }))
                  }
                />

                <input
                  style={styles.compactInput}
                  type="number"
                  placeholder="Giá nhập"
                  value={stockForm.cost}
                  onChange={(e) =>
                    setStockForm((prev) => ({ ...prev, cost: e.target.value }))
                  }
                />

                <button type="submit" style={styles.primaryBtn}>
                  Nhập hàng
                </button>
              </form>
            </section>

            <section style={styles.cardLarge}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Tồn kho hiện tại</h3>
                <div style={styles.smallNote}>
                  Tự động trừ khi hóa đơn được thanh toán
                </div>
              </div>

              <div style={styles.inventoryTable}>
                <div style={styles.inventoryHead}>
                  <div>Nguyên liệu</div>
                  <div>Tồn</div>
                  <div>ĐVT</div>
                  <div>Giá nhập</div>
                </div>

                {inventory.map((item) => (
                  <div key={item.sku} style={styles.inventoryRow}>
                    <div>{item.name}</div>
                    <div
                      style={{
                        color: Number(item.stock) <= 10 ? "#c62828" : "#2c1c14",
                        fontWeight: 700,
                      }}
                    >
                      {formatMoney(item.stock)}
                    </div>
                    <div>{item.unit}</div>
                    <div>{formatMoney(item.cost)}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "hoadon" && (
          <section style={styles.cardLarge}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Lịch sử thanh toán</h3>
              <div style={styles.smallNote}>Hiển thị bill đã thanh toán</div>
            </div>

            {paymentLogs.length === 0 ? (
              <div style={styles.emptyState}>Chưa có hóa đơn nào.</div>
            ) : (
              <div style={styles.historyList}>
                {paymentLogs.map((bill) => (
                  <div key={bill.id} style={styles.historyCard}>
                    <div style={styles.historyTop}>
                      <div>
                        <div style={styles.historyCode}>{bill.id}</div>
                        <div style={styles.historyMeta}>
                          {bill.tableName} • {bill.customerName} • {bill.seller}
                        </div>
                      </div>
                      <div style={styles.historyTotal}>
                        {formatMoney(bill.total)}
                      </div>
                    </div>

                    <div style={styles.historyItems}>
                      {bill.items.map((item) => (
                        <div key={`${bill.id}-${item.id}`} style={styles.historyItemRow}>
                          <span>
                            {item.name} x{item.qty}
                          </span>
                          <strong>{formatMoney(item.price * item.qty)}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={styles.historyDate}>
                      {formatDateTime(bill.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "baocao" && loggedInUser.role === "admin" && (
          <div style={styles.reportGrid}>
            <div style={styles.reportCard}>
              <div style={styles.reportLabel}>Bàn đang phục vụ</div>
              <div style={styles.reportValue}>{activeTablesCount}</div>
            </div>

            <div style={styles.reportCard}>
              <div style={styles.reportLabel}>Tổng món đang mở</div>
              <div style={styles.reportValue}>{totalOpenItems}</div>
            </div>

            <div style={styles.reportCard}>
              <div style={styles.reportLabel}>Doanh thu đã thanh toán</div>
              <div style={styles.reportValue}>
                {formatMoney(
                  paymentLogs.reduce((sum, bill) => sum + Number(bill.total || 0), 0)
                )}
              </div>
            </div>

            <div style={styles.reportCard}>
              <div style={styles.reportLabel}>Số hóa đơn</div>
              <div style={styles.reportValue}>{paymentLogs.length}</div>
            </div>

            <div style={styles.reportCard}>
              <div style={styles.reportLabel}>Nguyên liệu sắp hết</div>
              <div style={styles.reportValue}>{lowStockItems.length}</div>
            </div>

            <div style={styles.reportCard}>
              <div style={styles.reportLabel}>API backend</div>
              <div style={{ ...styles.reportValue, fontSize: 18 }}>
                forever-pos.onrender.com
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ece8e4",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  loginCard: {
    width: "100%",
    maxWidth: 760,
    background: "#f7f4f1",
    borderRadius: 28,
    padding: 48,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },
  loginWatermark: {
    fontSize: 88,
    fontWeight: 800,
    color: "#ddd7d3",
    marginBottom: 36,
    lineHeight: 1,
  },
  loginTitle: {
    fontSize: 52,
    margin: 0,
    color: "#211917",
  },
  loginSubtitle: {
    fontSize: 28,
    color: "#5e5551",
    marginTop: 18,
    marginBottom: 34,
  },
  input: {
    width: "100%",
    height: 74,
    borderRadius: 24,
    border: "2px solid #d8d0cb",
    padding: "0 22px",
    fontSize: 28,
    boxSizing: "border-box",
    marginBottom: 18,
    background: "#fbfaf9",
  },
  errorBox: {
    background: "#f6d7d7",
    color: "#b71c1c",
    padding: 18,
    borderRadius: 18,
    marginBottom: 18,
    fontSize: 22,
  },
  mainButton: {
    width: "100%",
    height: 78,
    border: "none",
    borderRadius: 24,
    background: "#9a430a",
    color: "#fff",
    fontSize: 34,
    fontWeight: 700,
    cursor: "pointer",
  },
  demoInfo: {
    marginTop: 34,
    color: "#655d59",
    fontSize: 24,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  appShell: {
    minHeight: "100vh",
    display: "flex",
    background: "#efeae6",
    fontFamily: "Arial, sans-serif",
  },
  notificationWrap: {
    position: "fixed",
    top: 16,
    right: 16,
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  notification: {
    minWidth: 280,
    maxWidth: 420,
    padding: "14px 16px",
    borderRadius: 14,
    color: "#fff",
    fontWeight: 700,
    boxShadow: "0 10px 24px rgba(0,0,0,0.16)",
  },
  notificationSuccess: {
    background: "#2e7d32",
  },
  notificationError: {
    background: "#c62828",
  },
  notificationWarning: {
    background: "#ef6c00",
  },
  notificationInfo: {
    background: "#1565c0",
  },
  sidebar: {
    width: 280,
    background: "#2c1c14",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 22,
    boxSizing: "border-box",
  },
  logo: {
    fontSize: 34,
    fontWeight: 800,
    letterSpacing: 1,
  },
  brandText: {
    opacity: 0.8,
    marginTop: 4,
    marginBottom: 24,
  },
  userCard: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
  },
  userName: {
    fontSize: 24,
    fontWeight: 700,
  },
  userRole: {
    marginTop: 6,
    opacity: 0.8,
    fontSize: 15,
  },
  navList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  navButton: {
    height: 52,
    border: "none",
    borderRadius: 16,
    background: "#4b2f22",
    color: "#fff",
    fontWeight: 700,
    fontSize: 17,
    cursor: "pointer",
  },
  navButtonActive: {
    background: "#9a430a",
  },
  logoutBtn: {
    height: 52,
    borderRadius: 16,
    border: "none",
    background: "#fff",
    color: "#2c1c14",
    fontWeight: 700,
    fontSize: 17,
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: 24,
    boxSizing: "border-box",
  },
  headerBar: {
    background: "#f8f4f1",
    borderRadius: 22,
    padding: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 800,
    color: "#241816",
  },
  headerSub: {
    marginTop: 6,
    color: "#756861",
  },
  headerBadge: {
    background: "#9a430a",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 999,
    fontWeight: 700,
  },
  salesLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1.15fr 1fr",
    gap: 20,
  },
  adminLayout: {
    display: "grid",
    gridTemplateColumns: "0.95fr 1.25fr",
    gap: 20,
  },
  cardLarge: {
    background: "#f8f4f1",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
    color: "#241816",
  },
  smallNote: {
    marginTop: 6,
    color: "#7f726a",
    fontSize: 14,
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },
  tableBtn: {
    minHeight: 76,
    borderRadius: 18,
    border: "2px solid #e2d7d0",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    color: "#241816",
  },
  tableBtnActive: {
    background: "#9a430a",
    color: "#fff",
    border: "2px solid #9a430a",
  },
  tableCount: {
    marginTop: 6,
    fontSize: 13,
    opacity: 0.85,
    fontWeight: 500,
  },
  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 14,
  },
  compactInput: {
    height: 48,
    borderRadius: 14,
    border: "1px solid #d9cfc8",
    padding: "0 14px",
    fontSize: 16,
    boxSizing: "border-box",
    background: "#fff",
  },
  orderBox: {
    background: "#fff",
    borderRadius: 18,
    padding: 12,
    minHeight: 280,
    maxHeight: 420,
    overflow: "auto",
    border: "1px solid #ebe1da",
  },
  emptyState: {
    color: "#7d7169",
    padding: 14,
  },
  orderRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 14,
    alignItems: "center",
    padding: "10px 8px",
    borderBottom: "1px dashed #eadfd8",
  },
  orderName: {
    fontWeight: 700,
    color: "#241816",
  },
  orderMeta: {
    marginTop: 4,
    fontSize: 13,
    color: "#7b6c63",
  },
  orderActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    border: "none",
    borderRadius: 10,
    background: "#9a430a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  qtyText: {
    minWidth: 18,
    textAlign: "center",
    fontWeight: 700,
  },
  orderTotal: {
    minWidth: 90,
    textAlign: "right",
    fontWeight: 700,
    color: "#241816",
  },
  totalPanel: {
    background: "#efe3da",
    borderRadius: 18,
    padding: 14,
    marginTop: 14,
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
    color: "#241816",
  },
  totalGrand: {
    fontSize: 20,
    marginBottom: 0,
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.2fr",
    gap: 10,
    marginTop: 14,
  },
  secondaryBtn: {
    height: 50,
    borderRadius: 14,
    border: "2px solid #d9c7bc",
    background: "#fff",
    color: "#6c5345",
    fontWeight: 700,
    cursor: "pointer",
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    border: "none",
    background: "#9a430a",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  categoryTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  catBtn: {
    height: 38,
    padding: "0 14px",
    borderRadius: 999,
    border: "1px solid #decfc5",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
  catBtnActive: {
    background: "#9a430a",
    color: "#fff",
    border: "1px solid #9a430a",
  },
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },
  menuCard: {
    border: "1px solid #e7dbd3",
    background: "#fff",
    borderRadius: 18,
    padding: 14,
    textAlign: "left",
    cursor: "pointer",
  },
  menuCardName: {
    fontWeight: 700,
    color: "#241816",
  },
  menuCardCategory: {
    color: "#8a7b72",
    marginTop: 4,
    fontSize: 13,
  },
  menuCardPrice: {
    marginTop: 10,
    color: "#9a430a",
    fontWeight: 800,
  },
  stockForm: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
    gap: 12,
  },
  inventoryTable: {
    background: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #e8ddd6",
  },
  inventoryHead: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: 10,
    padding: 14,
    background: "#f1e5dc",
    fontWeight: 800,
    color: "#241816",
  },
  inventoryRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: 10,
    padding: 14,
    borderTop: "1px solid #efe4dd",
    alignItems: "center",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  historyCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 16,
    border: "1px solid #e8ddd6",
  },
  historyTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
  },
  historyCode: {
    fontWeight: 800,
    color: "#241816",
    fontSize: 18,
  },
  historyMeta: {
    color: "#7c6d65",
    marginTop: 6,
  },
  historyTotal: {
    fontWeight: 800,
    color: "#9a430a",
    fontSize: 20,
  },
  historyItems: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  historyItemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  historyDate: {
    marginTop: 12,
    color: "#84766d",
    fontSize: 13,
  },
  reportGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 18,
  },
  reportCard: {
    background: "#f8f4f1",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  reportLabel: {
    color: "#7b6d65",
    marginBottom: 10,
  },
  reportValue: {
    color: "#241816",
    fontSize: 30,
    fontWeight: 800,
  },
};
