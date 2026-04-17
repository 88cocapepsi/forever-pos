import { useEffect, useMemo, useRef, useState } from "react";

const API_URL = "https://forever-pos.onrender.com";

const STORE_INFO = {
  name: "FOREVER COFFEE & BEER",
  address1: "B38 đường 4A",
  address2: "P. Tân Hưng, Q.7",
  phone: "0788880891",
};

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
  {
    id: "cf_den",
    name: "Cà phê đen đá",
    price: 25000,
    category: "Cà phê",
    active: true,
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
    active: true,
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
    active: true,
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
    active: true,
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
    active: true,
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
    active: true,
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
    active: true,
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
    active: true,
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
    active: true,
    recipe: [
      { sku: "yaourt", qty: 1, unit: "hũ" },
      { sku: "vai_ngam", qty: 35, unit: "g" },
      { sku: "da_vien", qty: 1, unit: "ly" },
    ],
  },
];

const DEFAULT_INVENTORY = [
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

const DEFAULT_STAFF = [
  {
    id: "u_admin",
    username: "admin",
    password: "123456",
    name: "Quản trị viên",
    role: "admin",
    active: true,
  },
  {
    id: "u_staff",
    username: "staff",
    password: "123456",
    name: "Nhân viên",
    role: "staff",
    active: true,
  },
];

const SHIFT_OPTIONS = ["Ca sáng", "Ca chiều", "Ca tối"];

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value || 0));
const formatMoneyVND = (value) => `${formatMoney(value)} đ`;

const formatDateTime = (date = new Date()) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const dateOnly = (date = new Date()) => {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const uid = (prefix = "id") =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

const getStorage = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const buildReceiptHTML = ({
  type = "sale",
  tableName,
  sellerName,
  customerName = "Khách lẻ",
  items = [],
  subtotal = 0,
  discount = 0,
  total = 0,
  createdAt = new Date(),
  receiptCode,
}) => {
  const title = type === "temp" ? "PHIẾU TẠM TÍNH" : "HÓA ĐƠN BÁN HÀNG";
  const rows = items
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
        .line { border-top: 1px dashed #000; margin: 10px 0; }
        .item-head,.item-row {
          display: grid;
          grid-template-columns: 1fr 40px 1fr;
          gap: 6px;
          align-items: center;
        }
        .item-head div:nth-child(2), .item-row div:nth-child(2) { text-align: center; }
        .item-head div:nth-child(3), .item-row div:nth-child(3) { text-align: right; }
        .item-name { margin: 8px 0 2px; }
        .sum-row {
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
          <div class="center bold big" style="margin-top:8px">${title}</div>
          <div class="center bold">${receiptCode}</div>
          <div style="margin-top:10px">Phòng bàn: ${tableName}</div>
          <div>Giờ vào: ${formatDateTime(createdAt)}</div>
          <div>Khách hàng: ${customerName}</div>
          <div class="bold">Người bán: ${sellerName}</div>
        `
          : `
          <div>Liên số: Liên 1</div>
          <div>Ngày bán: ${formatDateTime(createdAt)}</div>
          <div class="center bold big" style="margin-top:8px">${title}</div>
          <div class="center bold">${receiptCode}</div>
          <div style="margin-top:10px"><span class="bold">Khách hàng:</span> ${customerName}</div>
          <div>Địa chỉ:</div>
          <div>Khu vực:</div>
          <div>Thời gian giao hàng:</div>
          <div>Điện thoại:</div>
          <div class="bold">Người bán: ${sellerName}</div>
        `
      }

      <div class="line"></div>

      <div class="item-head bold">
        <div>Đơn giá</div>
        <div>SL</div>
        <div>Thành tiền</div>
      </div>

      ${rows}

      <div class="line"></div>

      <div class="sum-row"><div>Tổng tiền hàng:</div><div>${formatMoney(subtotal)}</div></div>
      <div class="sum-row"><div>Chiết khấu:</div><div>${formatMoney(discount)}</div></div>
      <div class="sum-row bold"><div>Tổng cộng:</div><div>${formatMoney(total)}</div></div>

      <div style="margin-top:18px" class="center">${STORE_INFO.name}</div>
      <div class="center">${STORE_INFO.address1} - ${STORE_INFO.address2}</div>
      <div class="center">Điện thoại: ${STORE_INFO.phone}</div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 500);
        }
      </script>
    </body>
  </html>
  `;
};

export default function App() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [activeTab, setActiveTab] = useState("banhang");
  const [tables, setTables] = useState(() =>
    getStorage("forever_tables", DEFAULT_TABLES)
  );
  const [menuItems, setMenuItems] = useState(() =>
    getStorage("forever_menu", DEFAULT_MENU)
  );
  const [inventory, setInventory] = useState(() =>
    getStorage("forever_inventory", DEFAULT_INVENTORY)
  );
  const [staffs, setStaffs] = useState(() =>
    getStorage("forever_staffs", DEFAULT_STAFF)
  );
  const [orders, setOrders] = useState(() =>
    getStorage("forever_orders", {})
  );
  const [bills, setBills] = useState(() =>
    getStorage("forever_bills", [])
  );
  const [stockLogs, setStockLogs] = useState(() =>
    getStorage("forever_stock_logs", [])
  );
  const [notifications, setNotifications] = useState([]);
  const [selectedTable, setSelectedTable] = useState("Bàn 1");
  const [customerName, setCustomerName] = useState("Khách lẻ");
  const [discount, setDiscount] = useState(0);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [currentShift, setCurrentShift] = useState("Ca sáng");
  const [tableMoveTarget, setTableMoveTarget] = useState("");
  const [tableMergeTarget, setTableMergeTarget] = useState("");
  const [receiptCounter, setReceiptCounter] = useState(() =>
    getStorage("forever_receipt_counter", 1000)
  );

  const [menuForm, setMenuForm] = useState({
    id: "",
    name: "",
    price: "",
    category: "",
    active: true,
  });

  const [inventoryForm, setInventoryForm] = useState({
    sku: DEFAULT_INVENTORY[0].sku,
    qty: "",
    cost: "",
  });

  const [staffForm, setStaffForm] = useState({
    id: "",
    username: "",
    password: "",
    name: "",
    role: "staff",
    active: true,
  });

  const [filterBillDate, setFilterBillDate] = useState(dateOnly());
  const [filterBillShift, setFilterBillShift] = useState("Tất cả");
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const browserNotificationCooldown = useRef(0);

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

  useEffect(() => setStorage("forever_tables", tables), [tables]);
  useEffect(() => setStorage("forever_menu", menuItems), [menuItems]);
  useEffect(() => setStorage("forever_inventory", inventory), [inventory]);
  useEffect(() => setStorage("forever_staffs", staffs), [staffs]);
  useEffect(() => setStorage("forever_orders", orders), [orders]);
  useEffect(() => setStorage("forever_bills", bills), [bills]);
  useEffect(() => setStorage("forever_stock_logs", stockLogs), [stockLogs]);
  useEffect(() => setStorage("forever_receipt_counter", receiptCounter), [receiptCounter]);

  const pushNotification = (message, type = "success", browserTitle = "FOREVER POS") => {
    const id = uid("noti");
    setNotifications((prev) => [{ id, message, type }, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3500);

    const now = Date.now();
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted" &&
      now - browserNotificationCooldown.current > 1500
    ) {
      browserNotificationCooldown.current = now;
      new Notification(browserTitle, { body: message });
    }
  };

  const askBrowserNotificationPermission = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotificationPermission(result);
    if (result === "granted") {
      pushNotification("Đã bật thông báo trình duyệt cho thiết bị này", "success");
    }
  };

  const categories = useMemo(() => {
    return ["Tất cả", ...Array.from(new Set(menuItems.map((i) => i.category)))];
  }, [menuItems]);

  const activeMenuItems = useMemo(() => {
    return menuItems.filter((item) => item.active);
  }, [menuItems]);

  const filteredMenu = useMemo(() => {
    return activeMenuItems.filter((item) => {
      const okCategory =
        selectedCategory === "Tất cả" || item.category === selectedCategory;
      const keyword = searchKeyword.trim().toLowerCase();
      const okSearch =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword);
      return okCategory && okSearch;
    });
  }, [activeMenuItems, selectedCategory, searchKeyword]);

  const currentOrder = orders[selectedTable] || [];

  const subtotal = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [currentOrder]);

  const total = useMemo(() => {
    return Math.max(0, subtotal - Number(discount || 0));
  }, [subtotal, discount]);

  const openTableCount = useMemo(() => {
    return tables.filter((table) => (orders[table] || []).length > 0).length;
  }, [orders, tables]);

  const openItemsCount = useMemo(() => {
    return Object.values(orders)
      .flat()
      .reduce((sum, item) => sum + item.qty, 0);
  }, [orders]);

  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => Number(item.stock) <= 10);
  }, [inventory]);

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const billDate = dateOnly(bill.createdAt);
      const okDate = !filterBillDate || billDate === filterBillDate;
      const okShift =
        filterBillShift === "Tất cả" || bill.shift === filterBillShift;
      return okDate && okShift;
    });
  }, [bills, filterBillDate, filterBillShift]);

  const shiftRevenue = useMemo(() => {
    return SHIFT_OPTIONS.map((shift) => ({
      shift,
      total: bills
        .filter((bill) => bill.shift === shift)
        .reduce((sum, bill) => sum + Number(bill.total || 0), 0),
    }));
  }, [bills]);

  const todayRevenue = useMemo(() => {
    const today = dateOnly();
    return bills
      .filter((bill) => dateOnly(bill.createdAt) === today)
      .reduce((sum, bill) => sum + Number(bill.total || 0), 0);
  }, [bills]);

  const getReceiptCode = () => {
    const next = receiptCounter + 1;
    setReceiptCounter(next);
    return `HD${String(next).padStart(6, "0")}`;
  };

  const getTempCode = () => {
    return `${Math.floor(10 + Math.random() * 89)}-${Math.floor(
      100 + Math.random() * 900
    )}`;
  };

  const getTableItemCount = (tableName) =>
    (orders[tableName] || []).reduce((sum, item) => sum + item.qty, 0);

  const getInventoryItem = (sku) => inventory.find((item) => item.sku === sku);

  const getRequiredIngredients = (orderItems) => {
    const usageMap = {};
    orderItems.forEach((orderItem) => {
      const menu = menuItems.find((m) => m.id === orderItem.id);
      if (!menu?.recipe) return;
      menu.recipe.forEach((r) => {
        usageMap[r.sku] = (usageMap[r.sku] || 0) + r.qty * orderItem.qty;
      });
    });
    return usageMap;
  };

  const validateStockForOrder = (orderItems) => {
    const required = getRequiredIngredients(orderItems);
    for (const [sku, qtyNeeded] of Object.entries(required)) {
      const inv = getInventoryItem(sku);
      if (!inv || Number(inv.stock) < qtyNeeded) {
        return {
          ok: false,
          message: `Không đủ tồn kho: ${inv?.name || sku}`,
        };
      }
    }
    return { ok: true, required };
  };

  const syncLoginFromLocalStaff = (user, pass) => {
    const found = staffs.find(
      (s) =>
        s.active &&
        s.username.trim() === user.trim() &&
        s.password === pass
    );
    if (!found) return null;
    return {
      username: found.username,
      role: found.role,
      name: found.name,
    };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const localUser = syncLoginFromLocalStaff(username, password);
    if (localUser) {
      localStorage.setItem("forever_pos_user", JSON.stringify(localUser));
      setLoggedInUser(localUser);
      setLoading(false);
      pushNotification("Đăng nhập thành công", "success");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      localStorage.setItem("forever_pos_token", data.token || "");
      localStorage.setItem("forever_pos_user", JSON.stringify(data.user || {}));
      setLoggedInUser(data.user || null);
      pushNotification("Đăng nhập thành công", "success");
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
      let updated;
      if (found) {
        updated = tableOrder.map((i) =>
          i.id === menuItem.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        updated = [...tableOrder, { ...menuItem, qty: 1 }];
      }
      return { ...prev, [selectedTable]: updated };
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
      return { ...prev, [selectedTable]: updated };
    });
  };

  const removeOrderItem = (itemId) => {
    setOrders((prev) => ({
      ...prev,
      [selectedTable]: (prev[selectedTable] || []).filter((x) => x.id !== itemId),
    }));
  };

  const clearCurrentOrder = () => {
    setOrders((prev) => ({ ...prev, [selectedTable]: [] }));
    setCustomerName("Khách lẻ");
    setDiscount(0);
    pushNotification(`Đã xóa đơn ${selectedTable}`, "info");
  };

  const printReceipt = (type = "sale", receiptCode = "") => {
    if (!currentOrder.length) {
      pushNotification("Bàn này chưa có món để in", "warning");
      return;
    }

    const html = buildReceiptHTML({
      type,
      tableName: selectedTable,
      sellerName: loggedInUser?.username || "staff",
      customerName,
      items: currentOrder,
      subtotal,
      discount: Number(discount || 0),
      total,
      createdAt: new Date(),
      receiptCode: receiptCode || (type === "temp" ? getTempCode() : getReceiptCode()),
    });

    const popup = window.open("", "_blank", "width=420,height=820");
    if (!popup) {
      alert("Trình duyệt đang chặn popup in bill.");
      return;
    }
    popup.document.write(html);
    popup.document.close();
  };

  const handleTempPrint = () => {
    printReceipt("temp");
    pushNotification(`Đã in phiếu tạm tính ${selectedTable}`, "info");
  };

  const handleCheckout = () => {
    if (!currentOrder.length) {
      pushNotification("Chưa có món để thanh toán", "warning");
      return;
    }

    const stockCheck = validateStockForOrder(currentOrder);
    if (!stockCheck.ok) {
      pushNotification(stockCheck.message, "error");
      return;
    }

    const required = stockCheck.required;

    setInventory((prev) =>
      prev.map((item) => ({
        ...item,
        stock: Number(item.stock) - Number(required[item.sku] || 0),
      }))
    );

    const receiptCode = getReceiptCode();
    const bill = {
      id: uid("bill"),
      receiptCode,
      type: "sale",
      tableName: selectedTable,
      customerName,
      seller: loggedInUser?.username || "staff",
      shift: currentShift,
      items: currentOrder,
      subtotal,
      discount: Number(discount || 0),
      total,
      createdAt: new Date().toISOString(),
    };

    setBills((prev) => [bill, ...prev]);
    setStockLogs((prev) => [
      {
        id: uid("stock"),
        type: "auto_deduct",
        note: `Tự động trừ kho sau thanh toán ${selectedTable}`,
        createdAt: new Date().toISOString(),
        items: Object.entries(required).map(([sku, qty]) => ({ sku, qty })),
      },
      ...prev,
    ]);

    printReceipt("sale", receiptCode);

    setOrders((prev) => ({ ...prev, [selectedTable]: [] }));
    setCustomerName("Khách lẻ");
    setDiscount(0);

    pushNotification(
      `Thanh toán thành công ${selectedTable} - ${formatMoney(total)}`,
      "success",
      "Thanh toán FOREVER POS"
    );
  };

  const handleMoveTable = () => {
    if (!tableMoveTarget || tableMoveTarget === selectedTable) return;
    if ((orders[selectedTable] || []).length === 0) {
      pushNotification("Bàn hiện tại chưa có đơn để chuyển", "warning");
      return;
    }
    if ((orders[tableMoveTarget] || []).length > 0) {
      pushNotification("Bàn đích đang có đơn, hãy dùng gộp bàn", "warning");
      return;
    }

    setOrders((prev) => ({
      ...prev,
      [tableMoveTarget]: prev[selectedTable] || [],
      [selectedTable]: [],
    }));
    setSelectedTable(tableMoveTarget);
    pushNotification(`Đã chuyển đơn sang ${tableMoveTarget}`, "success");
    setTableMoveTarget("");
  };

  const handleMergeTable = () => {
    if (!tableMergeTarget || tableMergeTarget === selectedTable) return;
    const source = orders[selectedTable] || [];
    const target = orders[tableMergeTarget] || [];

    if (source.length === 0) {
      pushNotification("Bàn hiện tại chưa có đơn để gộp", "warning");
      return;
    }

    const mergedMap = {};

    [...target, ...source].forEach((item) => {
      if (!mergedMap[item.id]) {
        mergedMap[item.id] = { ...item };
      } else {
        mergedMap[item.id].qty += item.qty;
      }
    });

    setOrders((prev) => ({
      ...prev,
      [tableMergeTarget]: Object.values(mergedMap),
      [selectedTable]: [],
    }));

    setSelectedTable(tableMergeTarget);
    setTableMergeTarget("");
    pushNotification(`Đã gộp ${selectedTable} vào ${tableMergeTarget}`, "success");
  };

  const handleAddOrUpdateMenu = (e) => {
    e.preventDefault();

    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      pushNotification("Điền đủ tên món, giá bán, danh mục", "warning");
      return;
    }

    if (menuForm.id) {
      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === menuForm.id
            ? {
                ...item,
                name: menuForm.name,
                price: Number(menuForm.price),
                category: menuForm.category,
                active: !!menuForm.active,
              }
            : item
        )
      );
      pushNotification("Đã cập nhật món", "success");
    } else {
      setMenuItems((prev) => [
        {
          id: uid("menu"),
          name: menuForm.name,
          price: Number(menuForm.price),
          category: menuForm.category,
          active: true,
          recipe: [],
        },
        ...prev,
      ]);
      pushNotification("Đã thêm món mới", "success");
    }

    setMenuForm({
      id: "",
      name: "",
      price: "",
      category: "",
      active: true,
    });
  };

  const editMenuItem = (item) => {
    setMenuForm({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      active: item.active,
    });
    setActiveTab("menu");
  };

  const toggleMenuActive = (itemId) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, active: !item.active } : item
      )
    );
  };

  const deleteMenuItem = (itemId) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== itemId));
    pushNotification("Đã xóa món", "info");
  };

  const handleImportStock = (e) => {
    e.preventDefault();
    const qty = Number(inventoryForm.qty || 0);
    const cost = Number(inventoryForm.cost || 0);

    if (!inventoryForm.sku || qty <= 0) {
      pushNotification("Nhập số lượng hợp lệ", "warning");
      return;
    }

    const target = inventory.find((i) => i.sku === inventoryForm.sku);

    setInventory((prev) =>
      prev.map((item) =>
        item.sku === inventoryForm.sku
          ? {
              ...item,
              stock: Number(item.stock) + qty,
              cost: cost > 0 ? cost : item.cost,
            }
          : item
      )
    );

    setStockLogs((prev) => [
      {
        id: uid("stock"),
        type: "import",
        note: `Nhập hàng: ${target?.name || inventoryForm.sku}`,
        createdAt: new Date().toISOString(),
        items: [{ sku: inventoryForm.sku, qty, cost }],
      },
      ...prev,
    ]);

    setInventoryForm((prev) => ({ ...prev, qty: "", cost: "" }));
    pushNotification(`Đã nhập kho ${target?.name || ""}`, "success");
  };

  const handleAddOrUpdateStaff = (e) => {
    e.preventDefault();

    if (!staffForm.username || !staffForm.password || !staffForm.name) {
      pushNotification("Điền đủ thông tin nhân viên", "warning");
      return;
    }

    if (staffForm.id) {
      setStaffs((prev) =>
        prev.map((item) =>
          item.id === staffForm.id
            ? {
                ...item,
                username: staffForm.username,
                password: staffForm.password,
                name: staffForm.name,
                role: staffForm.role,
                active: staffForm.active,
              }
            : item
        )
      );
      pushNotification("Đã cập nhật nhân viên", "success");
    } else {
      setStaffs((prev) => [
        {
          id: uid("staff"),
          username: staffForm.username,
          password: staffForm.password,
          name: staffForm.name,
          role: staffForm.role,
          active: true,
        },
        ...prev,
      ]);
      pushNotification("Đã thêm nhân viên", "success");
    }

    setStaffForm({
      id: "",
      username: "",
      password: "",
      name: "",
      role: "staff",
      active: true,
    });
  };

  const editStaff = (staff) => {
    setStaffForm({
      id: staff.id,
      username: staff.username,
      password: staff.password,
      name: staff.name,
      role: staff.role,
      active: staff.active,
    });
    setActiveTab("nhanvien");
  };

  const toggleStaffActive = (staffId) => {
    setStaffs((prev) =>
      prev.map((item) =>
        item.id === staffId ? { ...item, active: !item.active } : item
      )
    );
  };

  const deleteStaff = (staffId) => {
    setStaffs((prev) => prev.filter((item) => item.id !== staffId));
    pushNotification("Đã xóa nhân viên", "info");
  };

  const handleAddTable = () => {
    const nextNum = tables.length + 1;
    const newName = `Bàn ${nextNum}`;
    setTables((prev) => [...prev, newName]);
    pushNotification(`Đã thêm ${newName}`, "success");
  };

  const tableCanDelete = (tableName) => !["Mang về", "Giao đi"].includes(tableName);

  const handleDeleteTable = (tableName) => {
    if (!tableCanDelete(tableName)) {
      pushNotification("Không xóa được bàn hệ thống", "warning");
      return;
    }
    if ((orders[tableName] || []).length > 0) {
      pushNotification("Bàn đang có đơn, không thể xóa", "warning");
      return;
    }
    setTables((prev) => prev.filter((t) => t !== tableName));
    if (selectedTable === tableName) {
      setSelectedTable("Bàn 1");
    }
    pushNotification(`Đã xóa ${tableName}`, "info");
  };

  const isAdmin = loggedInUser?.role === "admin";

  if (!loggedInUser) {
    return (
      <div style={styles.page}>
        <div style={styles.loginCard}>
          <div style={styles.loginWatermark}>FOREVER</div>
          <h1 style={styles.loginTitle}>FOREVER POS PRO MAX</h1>
          <p style={styles.loginSubtitle}>Đăng nhập hệ thống bán hàng internet</p>

          <form onSubmit={handleLogin}>
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tài khoản"
            />
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
            />
            {error ? <div style={styles.errorBox}>{error}</div> : null}
            <button style={styles.mainButton} type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <div style={styles.loginBottom}>
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
        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              ...styles.notification,
              ...(n.type === "success"
                ? styles.notificationSuccess
                : n.type === "error"
                ? styles.notificationError
                : n.type === "warning"
                ? styles.notificationWarning
                : styles.notificationInfo),
            }}
          >
            {n.message}
          </div>
        ))}
      </div>

      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logo}>FOREVER</div>
          <div style={styles.brandSub}>POS PRO MAX</div>

          <div style={styles.userCard}>
            <div style={styles.userName}>{loggedInUser.name || loggedInUser.username}</div>
            <div style={styles.userRole}>
              {isAdmin ? "Quản trị viên" : "Nhân viên"}
            </div>
          </div>

          <div style={styles.navList}>
            {[
              ["banhang", "Bán hàng"],
              ["hoadon", "Hóa đơn"],
              ["menu", "Quản lý menu"],
              ["kho", "Kho hàng"],
              ["nhanvien", "Nhân viên"],
              ["baocao", "Báo cáo"],
            ]
              .filter(
                ([key]) =>
                  isAdmin ||
                  ["banhang", "hoadon"].includes(key)
              )
              .map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    ...styles.navButton,
                    ...(activeTab === key ? styles.navButtonActive : {}),
                  }}
                >
                  {label}
                </button>
              ))}
          </div>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main style={styles.main}>
        <div style={styles.headerBar}>
          <div>
            <div style={styles.headerTitle}>{STORE_INFO.name}</div>
            <div style={styles.headerSub}>
              {STORE_INFO.address1}, {STORE_INFO.address2} • {STORE_INFO.phone}
            </div>
          </div>

          <div style={styles.headerActions}>
            <select
              style={styles.compactInput}
              value={currentShift}
              onChange={(e) => setCurrentShift(e.target.value)}
            >
              {SHIFT_OPTIONS.map((shift) => (
                <option key={shift} value={shift}>
                  {shift}
                </option>
              ))}
            </select>

            {notificationPermission !== "granted" && notificationPermission !== "unsupported" && (
              <button style={styles.secondaryBtn} onClick={askBrowserNotificationPermission}>
                Bật thông báo
              </button>
            )}

            <div style={styles.roleBadge}>{isAdmin ? "ADMIN" : "STAFF"}</div>
          </div>
        </div>

        {activeTab === "banhang" && (
          <div style={styles.salesLayout}>
            <section style={styles.card}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Sảnh chờ / Bàn</h3>
                {isAdmin && (
                  <button style={styles.smallButton} onClick={handleAddTable}>
                    + Thêm bàn
                  </button>
                )}
              </div>

              <div style={styles.tableGrid}>
                {tables.map((table) => (
                  <div
                    key={table}
                    style={{
                      ...styles.tableCard,
                      ...(selectedTable === table ? styles.tableCardActive : {}),
                    }}
                  >
                    <button
                      style={styles.tableMainButton}
                      onClick={() => setSelectedTable(table)}
                    >
                      <div>{table}</div>
                      <div style={styles.tableMeta}>
                        {getTableItemCount(table) > 0
                          ? `${getTableItemCount(table)} món`
                          : "Trống"}
                      </div>
                    </button>

                    {isAdmin && tableCanDelete(table) && (
                      <button
                        style={styles.tableDeleteBtn}
                        onClick={() => handleDeleteTable(table)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={styles.toolBox}>
                <div style={styles.toolTitle}>Chuyển / gộp bàn</div>

                <div style={styles.formBlock}>
                  <select
                    style={styles.compactInput}
                    value={tableMoveTarget}
                    onChange={(e) => setTableMoveTarget(e.target.value)}
                  >
                    <option value="">Chọn bàn để chuyển</option>
                    {tables
                      .filter((t) => t !== selectedTable)
                      .map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>
                  <button style={styles.secondaryBtn} onClick={handleMoveTable}>
                    Chuyển bàn
                  </button>
                </div>

                <div style={styles.formBlock}>
                  <select
                    style={styles.compactInput}
                    value={tableMergeTarget}
                    onChange={(e) => setTableMergeTarget(e.target.value)}
                  >
                    <option value="">Chọn bàn để gộp</option>
                    {tables
                      .filter((t) => t !== selectedTable)
                      .map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                  </select>
                  <button style={styles.secondaryBtn} onClick={handleMergeTable}>
                    Gộp bàn
                  </button>
                </div>
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Đơn hiện tại - {selectedTable}</h3>
                <div style={styles.muted}>Lưu đơn tự động theo bàn</div>
              </div>

              <div style={styles.form2Col}>
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

              <div style={styles.orderList}>
                {currentOrder.length === 0 ? (
                  <div style={styles.emptyState}>Chưa có món trong đơn.</div>
                ) : (
                  currentOrder.map((item) => (
                    <div key={item.id} style={styles.orderRow}>
                      <div>
                        <div style={styles.orderName}>{item.name}</div>
                        <div style={styles.orderSub}>
                          {formatMoney(item.price)} x {item.qty}
                        </div>
                      </div>

                      <div style={styles.qtyWrap}>
                        <button style={styles.qtyBtn} onClick={() => changeQty(item.id, -1)}>
                          -
                        </button>
                        <span style={styles.qtyValue}>{item.qty}</span>
                        <button style={styles.qtyBtn} onClick={() => changeQty(item.id, 1)}>
                          +
                        </button>
                        <button
                          style={styles.removeBtn}
                          onClick={() => removeOrderItem(item.id)}
                        >
                          Xóa
                        </button>
                      </div>

                      <div style={styles.orderAmount}>
                        {formatMoney(item.price * item.qty)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.totalBox}>
                <div style={styles.totalRow}>
                  <span>Tổng tiền hàng</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>
                <div style={styles.totalRow}>
                  <span>Chiết khấu</span>
                  <strong>{formatMoney(discount)}</strong>
                </div>
                <div style={{ ...styles.totalRow, ...styles.totalStrong }}>
                  <span>Tổng cộng</span>
                  <strong>{formatMoney(total)}</strong>
                </div>
              </div>

              <div style={styles.buttonGrid3}>
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

            <section style={styles.card}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Menu đồ uống</h3>
              </div>

              <div style={styles.form2Col}>
                <input
                  style={styles.compactInput}
                  placeholder="Tìm món..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                <select
                  style={styles.compactInput}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.menuGrid}>
                {filteredMenu.map((item) => (
                  <button
                    key={item.id}
                    style={styles.menuCard}
                    onClick={() => addItemToOrder(item)}
                  >
                    <div style={styles.menuTitle}>{item.name}</div>
                    <div style={styles.menuCat}>{item.category}</div>
                    <div style={styles.menuPrice}>{formatMoneyVND(item.price)}</div>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "menu" && isAdmin && (
          <div style={styles.twoCol}>
            <section style={styles.card}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Thêm / sửa món</h3>
              </div>

              <form onSubmit={handleAddOrUpdateMenu} style={styles.stackForm}>
                <input
                  style={styles.compactInput}
                  placeholder="Tên món"
                  value={menuForm.name}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <input
                  style={styles.compactInput}
                  type="number"
                  placeholder="Giá bán"
                  value={menuForm.price}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                />
                <input
                  style={styles.compactInput}
                  placeholder="Danh mục"
                  value={menuForm.category}
                  onChange={(e) =>
                    setMenuForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                />
                <div style={styles.formInline}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={!!menuForm.active}
                      onChange={(e) =>
                        setMenuForm((prev) => ({ ...prev, active: e.target.checked }))
                      }
                    />
                    Đang bán
                  </label>
                </div>

                <div style={styles.buttonGrid2}>
                  <button type="submit" style={styles.primaryBtn}>
                    {menuForm.id ? "Cập nhật món" : "Thêm món"}
                  </button>
                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    onClick={() =>
                      setMenuForm({
                        id: "",
                        name: "",
                        price: "",
                        category: "",
                        active: true,
                      })
                    }
                  >
                    Làm mới
                  </button>
                </div>
              </form>
            </section>

            <section style={styles.card}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Danh sách menu</h3>
              </div>

              <div style={styles.listBox}>
                {menuItems.map((item) => (
                  <div key={item.id} style={styles.listRow}>
                    <div>
                      <div style={styles.rowTitle}>{item.name}</div>
                      <div style={styles.rowSub}>
                        {item.category} • {formatMoneyVND(item.price)} •{" "}
                        {item.active ? "Đang bán" : "Đã ẩn"}
                      </div>
                    </div>

                    <div style={styles.rowActions}>
                      <button style={styles.smallActionBtn} onClick={() => editMenuItem(item)}>
                        Sửa
                      </button>
                      <button
                        style={styles.smallActionBtn}
                        onClick={() => toggleMenuActive(item.id)}
                      >
                        {item.active ? "Ẩn" : "Bật"}
                      </button>
                      <button
                        style={styles.smallActionBtnDanger}
                        onClick={() => deleteMenuItem(item.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "kho" && isAdmin && (
          <div style={styles.twoCol}>
            <section style={styles.card}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Nhập hàng</h3>
              </div>

              <form onSubmit={handleImportStock} style={styles.stackForm}>
                <select
                  style={styles.compactInput}
                  value={inventoryForm.sku}
                  onChange={(e) =>
                    setInventoryForm((prev) => ({ ...prev, sku: e.target.value }))
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
                  value={inventoryForm.qty}
                  onChange={(e) =>
                    setInventoryForm((prev) => ({ ...prev, qty: e.target.value }))
                  }
                />

                <input
                  style={styles.compactInput}
                  type="number"
                  placeholder="Giá nhập"
                  value={inventoryForm.cost}
                  onChange={(e) =>
                    setInventoryForm((prev) => ({ ...prev, cost: e.target.value }))
                  }
                />

                <button type="submit" style={styles.primaryBtn}>
                  Nhập kho
                </button>
              </form>

              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Lịch sử kho</h3>
              </div>
              <div style={styles.listBox}>
                {stockLogs.map((log) => (
                  <div key={log.id} style={styles.listRow}>
                    <div>
                      <div style={styles.rowTitle}>{log.note}</div>
                      <div style={styles.rowSub}>{formatDateTime(log.createdAt)}</div>
                    </div>
                    <div style={styles.rowSub}>
                      {log.items
                        .map((x) => `${x.sku}: ${formatMoney(x.qty)}`)
                        .join(" • ")}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Tồn kho hiện tại</h3>
              </div>

              <div style={styles.tableHeader4}>
                <div>Nguyên liệu</div>
                <div>Tồn</div>
                <div>ĐVT</div>
                <div>Giá nhập</div>
              </div>

              {inventory.map((item) => (
                <div key={item.sku} style={styles.tableRow4}>
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
            </section>
          </div>
        )}

        {activeTab === "nhanvien" && isAdmin && (
          <div style={styles.twoCol}>
            <section style={styles.card}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Thêm / sửa nhân viên</h3>
              </div>

              <form onSubmit={handleAddOrUpdateStaff} style={styles.stackForm}>
                <input
                  style={styles.compactInput}
                  placeholder="Tên hiển thị"
                  value={staffForm.name}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <input
                  style={styles.compactInput}
                  placeholder="Username"
                  value={staffForm.username}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                />
                <input
                  style={styles.compactInput}
                  placeholder="Mật khẩu"
                  value={staffForm.password}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
                <select
                  style={styles.compactInput}
                  value={staffForm.role}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                >
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>

                <div style={styles.buttonGrid2}>
                  <button type="submit" style={styles.primaryBtn}>
                    {staffForm.id ? "Cập nhật nhân viên" : "Thêm nhân viên"}
                  </button>
                  <button
                    type="button"
                    style={styles.secondaryBtn}
                    onClick={() =>
                      setStaffForm({
                        id: "",
                        username: "",
                        password: "",
                        name: "",
                        role: "staff",
                        active: true,
                      })
                    }
                  >
                    Làm mới
                  </button>
                </div>
              </form>
            </section>

            <section style={styles.card}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Danh sách nhân viên</h3>
              </div>

              <div style={styles.listBox}>
                {staffs.map((staff) => (
                  <div key={staff.id} style={styles.listRow}>
                    <div>
                      <div style={styles.rowTitle}>{staff.name}</div>
                      <div style={styles.rowSub}>
                        {staff.username} • {staff.role} •{" "}
                        {staff.active ? "Hoạt động" : "Đã khóa"}
                      </div>
                    </div>

                    <div style={styles.rowActions}>
                      <button style={styles.smallActionBtn} onClick={() => editStaff(staff)}>
                        Sửa
                      </button>
                      <button
                        style={styles.smallActionBtn}
                        onClick={() => toggleStaffActive(staff.id)}
                      >
                        {staff.active ? "Khóa" : "Mở"}
                      </button>
                      <button
                        style={styles.smallActionBtnDanger}
                        onClick={() => deleteStaff(staff.id)}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "hoadon" && (
          <section style={styles.card}>
            <div style={styles.sectionTop}>
              <h3 style={styles.sectionTitle}>Lịch sử hóa đơn</h3>
            </div>

            <div style={styles.form2Col}>
              <input
                style={styles.compactInput}
                type="date"
                value={filterBillDate}
                onChange={(e) => setFilterBillDate(e.target.value)}
              />
              <select
                style={styles.compactInput}
                value={filterBillShift}
                onChange={(e) => setFilterBillShift(e.target.value)}
              >
                <option value="Tất cả">Tất cả ca</option>
                {SHIFT_OPTIONS.map((shift) => (
                  <option key={shift} value={shift}>
                    {shift}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.listBox}>
              {filteredBills.length === 0 ? (
                <div style={styles.emptyState}>Không có hóa đơn phù hợp.</div>
              ) : (
                filteredBills.map((bill) => (
                  <div key={bill.id} style={styles.billCard}>
                    <div style={styles.billTop}>
                      <div>
                        <div style={styles.rowTitle}>{bill.receiptCode}</div>
                        <div style={styles.rowSub}>
                          {bill.tableName} • {bill.customerName} • {bill.seller} • {bill.shift}
                        </div>
                      </div>
                      <div style={styles.billTotal}>{formatMoneyVND(bill.total)}</div>
                    </div>

                    <div style={styles.billItems}>
                      {bill.items.map((item) => (
                        <div key={`${bill.id}_${item.id}`} style={styles.billItemRow}>
                          <span>
                            {item.name} x{item.qty}
                          </span>
                          <strong>{formatMoneyVND(item.price * item.qty)}</strong>
                        </div>
                      ))}
                    </div>

                    <div style={styles.rowSub}>{formatDateTime(bill.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {activeTab === "baocao" && isAdmin && (
          <>
            <div style={styles.reportGrid}>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Bàn đang phục vụ</div>
                <div style={styles.reportValue}>{openTableCount}</div>
              </div>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Tổng món đang mở</div>
                <div style={styles.reportValue}>{openItemsCount}</div>
              </div>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Doanh thu hôm nay</div>
                <div style={styles.reportValue}>{formatMoney(todayRevenue)}</div>
              </div>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Số hóa đơn</div>
                <div style={styles.reportValue}>{bills.length}</div>
              </div>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Nguyên liệu sắp hết</div>
                <div style={styles.reportValue}>{lowStockItems.length}</div>
              </div>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Thiết bị thông báo</div>
                <div style={{ ...styles.reportValue, fontSize: 18 }}>
                  {notificationPermission === "granted"
                    ? "Đã bật trên máy này"
                    : "Chưa bật / cần backend push"}
                </div>
              </div>
            </div>

            <section style={{ ...styles.card, marginTop: 18 }}>
              <div style={styles.sectionTop}>
                <h3 style={styles.sectionTitle}>Doanh thu theo ca</h3>
              </div>

              <div style={styles.listBox}>
                {shiftRevenue.map((item) => (
                  <div key={item.shift} style={styles.listRow}>
                    <div className="left">
                      <div style={styles.rowTitle}>{item.shift}</div>
                    </div>
                    <div style={styles.reportMiniValue}>{formatMoneyVND(item.total)}</div>
                  </div>
                ))}
              </div>
            </section>
          </>
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
    fontSize: 48,
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
  loginBottom: {
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
  brandSub: {
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
    gap: 12,
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
  headerActions: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  roleBadge: {
    background: "#9a430a",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 999,
    fontWeight: 700,
  },
  salesLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr 1fr",
    gap: 20,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "0.95fr 1.25fr",
    gap: 20,
  },
  card: {
    background: "#f8f4f1",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
    color: "#241816",
  },
  muted: {
    color: "#7f726a",
    fontSize: 14,
  },
  smallButton: {
    height: 38,
    padding: "0 14px",
    border: "none",
    borderRadius: 12,
    background: "#9a430a",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },
  tableCard: {
    position: "relative",
    background: "#fff",
    borderRadius: 18,
    border: "2px solid #e2d7d0",
    overflow: "hidden",
  },
  tableCardActive: {
    border: "2px solid #9a430a",
  },
  tableMainButton: {
    width: "100%",
    minHeight: 78,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontWeight: 700,
    color: "#241816",
  },
  tableMeta: {
    marginTop: 6,
    fontSize: 13,
    opacity: 0.8,
    fontWeight: 500,
  },
  tableDeleteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    border: "none",
    borderRadius: 999,
    background: "#d32f2f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    lineHeight: 1,
  },
  toolBox: {
    marginTop: 16,
    background: "#fff",
    borderRadius: 18,
    padding: 14,
    border: "1px solid #eadfd8",
  },
  toolTitle: {
    fontWeight: 700,
    marginBottom: 12,
    color: "#241816",
  },
  formBlock: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    marginBottom: 10,
  },
  form2Col: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 14,
  },
  compactInput: {
    height: 46,
    borderRadius: 14,
    border: "1px solid #d9cfc8",
    padding: "0 14px",
    fontSize: 15,
    boxSizing: "border-box",
    background: "#fff",
  },
  orderList: {
    background: "#fff",
    borderRadius: 18,
    padding: 12,
    minHeight: 300,
    maxHeight: 460,
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
    gap: 12,
    alignItems: "center",
    padding: "10px 8px",
    borderBottom: "1px dashed #eadfd8",
  },
  orderName: {
    fontWeight: 700,
    color: "#241816",
  },
  orderSub: {
    marginTop: 4,
    color: "#7b6c63",
    fontSize: 13,
  },
  qtyWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
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
  qtyValue: {
    minWidth: 18,
    textAlign: "center",
    fontWeight: 700,
  },
  removeBtn: {
    height: 30,
    padding: "0 10px",
    borderRadius: 10,
    border: "none",
    background: "#e8d8cf",
    color: "#6d4f40",
    cursor: "pointer",
    fontWeight: 700,
  },
  orderAmount: {
    minWidth: 90,
    textAlign: "right",
    fontWeight: 700,
    color: "#241816",
  },
  totalBox: {
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
  totalStrong: {
    fontSize: 20,
    marginBottom: 0,
  },
  buttonGrid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.2fr",
    gap: 10,
    marginTop: 14,
  },
  buttonGrid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 14,
    border: "none",
    background: "#9a430a",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryBtn: {
    height: 46,
    borderRadius: 14,
    border: "2px solid #d9c7bc",
    background: "#fff",
    color: "#6c5345",
    fontWeight: 700,
    cursor: "pointer",
  },
  menuGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },
  menuCard: {
    background: "#fff",
    border: "1px solid #e7dbd3",
    borderRadius: 18,
    padding: 14,
    textAlign: "left",
    cursor: "pointer",
  },
  menuTitle: {
    fontWeight: 700,
    color: "#241816",
  },
  menuCat: {
    color: "#8a7b72",
    marginTop: 4,
    fontSize: 13,
  },
  menuPrice: {
    marginTop: 10,
    color: "#9a430a",
    fontWeight: 800,
  },
  stackForm: {
    display: "grid",
    gap: 12,
  },
  formInline: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  checkboxLabel: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    color: "#241816",
  },
  listBox: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxHeight: 560,
    overflow: "auto",
  },
  listRow: {
    background: "#fff",
    border: "1px solid #e8ddd6",
    borderRadius: 16,
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  rowTitle: {
    fontWeight: 700,
    color: "#241816",
  },
  rowSub: {
    marginTop: 4,
    color: "#7d6f67",
    fontSize: 13,
  },
  rowActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  smallActionBtn: {
    height: 34,
    padding: "0 12px",
    border: "none",
    borderRadius: 12,
    background: "#e8d8cf",
    color: "#6d4f40",
    cursor: "pointer",
    fontWeight: 700,
  },
  smallActionBtnDanger: {
    height: 34,
    padding: "0 12px",
    border: "none",
    borderRadius: 12,
    background: "#d32f2f",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
  },
  tableHeader4: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: 10,
    padding: 14,
    background: "#f1e5dc",
    borderRadius: 16,
    fontWeight: 800,
    color: "#241816",
    marginBottom: 8,
  },
  tableRow4: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: 10,
    padding: 14,
    background: "#fff",
    borderRadius: 14,
    marginBottom: 8,
    border: "1px solid #e8ddd6",
    alignItems: "center",
  },
  billCard: {
    background: "#fff",
    border: "1px solid #e8ddd6",
    borderRadius: 18,
    padding: 16,
  },
  billTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  billTotal: {
    fontWeight: 800,
    color: "#9a430a",
    fontSize: 20,
  },
  billItems: {
    marginTop: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  billItemRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
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
  reportMiniValue: {
    fontWeight: 800,
    color: "#9a430a",
  },
};
