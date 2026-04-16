import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ShoppingCart,
  LayoutGrid,
  BarChart3,
  Settings,
  LogOut,
  User,
  Lock,
  Plus,
  Trash2,
  Save,
  Receipt,
  Printer,
  Search,
  ShieldCheck,
  Coffee,
  Users,
  Bell,
  X,
} from "lucide-react";

const API =
  import.meta.env.VITE_API_URL?.trim() || "https://forever-pos.onrender.com";

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

const SHIFTS = [
  { id: "morning", name: "Ca sáng" },
  { id: "afternoon", name: "Ca chiều" },
  { id: "evening", name: "Ca tối" },
];

const money = (v) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v || 0);

const formatTime = (v) => new Date(v).toLocaleString("vi-VN");

async function api(path, opt = {}) {
  const token = localStorage.getItem("forever_token");

  try {
    const res = await fetch(`${API}${path}`, {
      ...opt,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opt.headers || {}),
      },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || `Lỗi API: ${res.status}`);
    }

    return data;
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Không kết nối được tới máy chủ");
    }
    throw err;
  }
}

function Toasts({ toasts, onClose }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div className="toast-card" key={t.id}>
          <div className="toast-head">
            <div className="toast-title">
              <Bell size={16} /> {t.title}
            </div>
            <button className="toast-close" onClick={() => onClose(t.id)}>
              <X size={14} />
            </button>
          </div>
          <div className="toast-body">{t.message}</div>
        </div>
      ))}
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem("forever_token", data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand-mark">
          <Coffee size={34} />
        </div>
        <h1>FOREVER POS PRO V1</h1>
        <p className="muted center">Đăng nhập để vào hệ thống</p>

        <form onSubmit={submit} className="stack mt16">
          <label className="field">
            <span>
              <User size={16} /> Tài khoản
            </span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="field">
            <span>
              <Lock size={16} /> Mật khẩu
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button className="btn primary full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="demo-box">
          <div>
            <strong>Admin:</strong> admin / 123456
          </div>
          <div>
            <strong>Thu ngân:</strong> thungan / 123456
          </div>
        </div>
      </div>
    </div>
  );
}

const SectionTitle = ({ icon, title, right }) => (
  <div className="section-title">
    <div className="section-title-left">
      {icon}
      <h3>{title}</h3>
    </div>
    {right}
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState({});
  const [report, setReport] = useState({
    totalRevenue: 0,
    totalBills: 0,
    totalQty: 0,
    shiftStats: [],
    topItems: [],
    bills: [],
  });
  const [toasts, setToasts] = useState([]);

  const [tab, setTab] = useState("sales");
  const [selectedTable, setSelectedTable] = useState("Bàn 1");
  const [currentShift, setCurrentShift] = useState("morning");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [draftItem, setDraftItem] = useState({
    name: "",
    price: "",
    category: "Cà phê",
  });
  const [draftUser, setDraftUser] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "cashier",
  });

  const eventSourceRef = useRef(null);
  const isAdmin = user?.role === "admin";

  const pushToast = (title, message) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [{ id, title, message }, ...prev].slice(0, 4));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  const closeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const askNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  };

  const showSystemNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body });
      } catch {}
    }
  };

  async function bootstrap() {
    setLoading(true);

    try {
      const me = await api("/api/me");
      setUser(me.user);

      const [shopData, menuData, ordersData, reportData] = await Promise.all([
        api("/api/shop"),
        api("/api/menu"),
        api("/api/orders"),
        api("/api/reports/today"),
      ]);

      setShop(shopData);
      setMenu(menuData);
      setOrders(ordersData);
      setReport(reportData);

      if (me.user.role === "admin") {
        setUsers(await api("/api/users"));
      }
    } catch {
      localStorage.removeItem("forever_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshOrdersAndReport() {
    const [o, r] = await Promise.all([
      api("/api/orders"),
      api("/api/reports/today"),
    ]);
    setOrders(o);
    setReport(r);
  }

  const connectEvents = () => {
    const token = localStorage.getItem("forever_token");
    if (!token) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(
      `${API}/api/events?token=${encodeURIComponent(token)}`
    );
    eventSourceRef.current = es;

    es.addEventListener("bill_paid", async (event) => {
      const data = JSON.parse(event.data);
      const msg = `${data.table} - ${money(data.totalPrice)}`;
      pushToast("Có bill thanh toán mới", msg);
      showSystemNotification("FOREVER POS", `Có bill mới: ${msg}`);
      await refreshOrdersAndReport();
    });

    es.addEventListener("orders_updated", async () => {
      setOrders(await api("/api/orders"));
    });

    es.addEventListener("menu_updated", async () => {
      setMenu(await api("/api/menu"));
    });
  };

  useEffect(() => {
    if (localStorage.getItem("forever_token")) {
      bootstrap();
    } else {
      setLoading(false);
    }

    askNotificationPermission();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      connectEvents();
    }
  }, [user]);

  const activeMenu = menu.filter((m) => m.active);

  const categories = useMemo(
    () => ["Tất cả", ...Array.from(new Set(activeMenu.map((m) => m.category)))],
    [activeMenu]
  );

  const order = orders[selectedTable] || {
    table: selectedTable,
    items: [],
    shiftId: currentShift,
  };

  const filteredMenu = activeMenu.filter(
    (item) =>
      (category === "Tất cả" || item.category === category) &&
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalQty = (order.items || []).reduce((s, i) => s + i.qty, 0);
  const totalPrice = (order.items || []).reduce(
    (s, i) => s + i.qty * i.price,
    0
  );

  function setOrderItems(nextItems) {
    setOrders((prev) => ({
      ...prev,
      [selectedTable]: {
        table: selectedTable,
        items: nextItems,
        shiftId: currentShift,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  const addItem = (item) => {
    const existing = (order.items || []).find((x) => x.id === item.id);
    const next = existing
      ? order.items.map((x) =>
          x.id === item.id ? { ...x, qty: x.qty + 1 } : x
        )
      : [...(order.items || []), { ...item, qty: 1 }];

    setOrderItems(next);
  };

  const updateQty = (id, delta) =>
    setOrderItems(
      (order.items || [])
        .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
        .filter((x) => x.qty > 0)
    );

  const saveOrder = async () => {
    await api(`/api/orders/${encodeURIComponent(selectedTable)}`, {
      method: "PUT",
      body: JSON.stringify({
        items: order.items || [],
        shiftId: currentShift,
      }),
    });

    await refreshOrdersAndReport();
    pushToast("Đã lưu đơn", `${selectedTable} đã được cập nhật`);
  };

  const clearOrder = async () => {
    if (!window.confirm(`Xóa đơn của ${selectedTable}?`)) return;

    await api(`/api/orders/${encodeURIComponent(selectedTable)}`, {
      method: "DELETE",
    });

    await refreshOrdersAndReport();
  };

  const openPrintWindow = () => {
    const w = window.open(
      "",
      "_blank",
      "width=420,height=720,noopener,noreferrer"
    );

    if (!w) {
      alert("Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup rồi thử lại.");
      return null;
    }

    return w;
  };

  const buildBillHtml = (bill) => {
    const billCode = bill?.billCode || `TAM-${Date.now()}`;
    const billTable = bill?.table || selectedTable;
    const billTime = bill?.billTime || new Date().toISOString();
    const billShift = bill?.shiftId || currentShift;
    const billCashier = bill?.cashierName || user?.fullName || "";
    const billItems = Array.isArray(bill?.items) ? bill.items : [];
    const billTotal = Number(
      bill?.totalPrice ??
        bill?.total ??
        billItems.reduce(
          (sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0),
          0
        )
    );

    const shiftName =
      SHIFTS.find((s) => s.id === billShift)?.name || billShift || "";

    const itemsHtml = billItems
      .map(
        (item) => `
          <tr>
            <td class="left">
              <div class="item-name">${item.name}</div>
              <div class="item-sub">${money(item.price)} x ${item.qty}</div>
            </td>
            <td class="right">${money(
              Number(item.price || 0) * Number(item.qty || 0)
            )}</td>
          </tr>
        `
      )
      .join("");

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Hóa đơn ${billCode}</title>
          <style>
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-family: Arial, Helvetica, sans-serif;
            }
            body {
              width: 58mm;
              font-size: 11px;
              line-height: 1.35;
              padding: 4mm 3mm;
            }
            .bill { width: 100%; }
            .center { text-align: center; }
            .shop-name {
              font-size: 16px;
              font-weight: 800;
              line-height: 1.2;
              margin-bottom: 4px;
            }
            .shop-sub {
              font-size: 11px;
              line-height: 1.35;
            }
            .line {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .meta {
              font-size: 11px;
              line-height: 1.45;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            td {
              padding: 3px 0;
              vertical-align: top;
            }
            .left { width: 68%; }
            .right {
              width: 32%;
              text-align: right;
              white-space: nowrap;
            }
            .item-name { font-weight: 700; }
            .item-sub { font-size: 10px; }
            .total-row td {
              padding-top: 6px;
              font-size: 14px;
              font-weight: 800;
            }
            .footer {
              text-align: center;
              margin-top: 8px;
              font-size: 11px;
              line-height: 1.5;
            }
            @page {
              size: 58mm auto;
              margin: 0;
            }
          </style>
        </head>
        <body onload="window.print(); window.onafterprint = () => window.close();">
          <div class="bill">
            <div class="center">
              <div class="shop-name">FOREVER Coffee & Beer</div>
              <div class="shop-sub">B38 Đường 4A, P. Tân Hưng, Q.7</div>
              <div class="shop-sub">Hotline: 07088880891</div>
            </div>

            <div class="line"></div>

            <div class="meta">
              <div><strong>Mã bill:</strong> ${billCode}</div>
              <div><strong>Bàn:</strong> ${billTable}</div>
              <div><strong>Ca:</strong> ${shiftName}</div>
              <div><strong>Thu ngân:</strong> ${billCashier}</div>
              <div><strong>Thời gian:</strong> ${formatTime(billTime)}</div>
            </div>

            <div class="line"></div>

            <table>
              <tbody>
                ${itemsHtml}
                <tr class="total-row">
                  <td>TỔNG</td>
                  <td class="right">${money(billTotal)}</td>
                </tr>
              </tbody>
            </table>

            <div class="line"></div>

            <div class="footer">
              Cảm ơn quý khách<br/>
              Hẹn gặp lại!
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const printBill = (bill, printWindow = null) => {
    const w = printWindow || openPrintWindow();
    if (!w) return;

    w.document.open();
    w.document.write(buildBillHtml(bill));
    w.document.close();
  };

  const handlePrintCurrentBill = () => {
    if (!order.items || !order.items.length) {
      return alert("Bàn này chưa có món để in");
    }

    const tempBill = {
      billCode: `TAM-${Date.now()}`,
      table: selectedTable,
      shiftId: currentShift,
      cashierName: user?.fullName || "",
      billTime: new Date().toISOString(),
      items: order.items,
      totalPrice,
    };

    printBill(tempBill);
  };

  const checkout = async () => {
    if (!order.items || !order.items.length) {
      return alert("Bàn này chưa có món");
    }

    const printWindow = openPrintWindow();
    if (!printWindow) return;

    try {
      const bill = await api("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          table: selectedTable,
          shiftId: currentShift,
          items: order.items,
        }),
      });

      await refreshOrdersAndReport();
      printBill(bill, printWindow);
      pushToast(
        "Thanh toán thành công",
        `${bill.table} - ${money(bill.totalPrice)}`
      );
      setTab("reports");
    } catch (err) {
      try {
        printWindow.close();
      } catch {}
      alert(err.message || "Thanh toán thất bại");
    }
  };

  const saveShop = async () => {
    const updated = await api("/api/shop", {
      method: "PUT",
      body: JSON.stringify(shop),
    });

    setShop(updated);
    alert("Đã lưu thông tin quán");
  };

  const addMenuItem = async () => {
    if (!draftItem.name || !draftItem.price) {
      return alert("Nhập tên món và giá");
    }

    const item = await api("/api/menu", {
      method: "POST",
      body: JSON.stringify({
        name: draftItem.name,
        price: Number(draftItem.price),
        category: draftItem.category,
      }),
    });

    setMenu((prev) => [item, ...prev]);
    setDraftItem({ name: "", price: "", category: "Cà phê" });
  };

  const toggleMenuItem = async (id) => {
    const updated = await api(`/api/menu/${id}/toggle`, {
      method: "PATCH",
    });
    setMenu((prev) => prev.map((m) => (m.id === id ? updated : m)));
  };

  const deleteMenuItem = async (id) => {
    if (!window.confirm("Xóa món này?")) return;

    await api(`/api/menu/${id}`, {
      method: "DELETE",
    });

    setMenu((prev) => prev.filter((m) => m.id !== id));
  };

  const addUser = async () => {
    if (!draftUser.fullName || !draftUser.username || !draftUser.password) {
      return alert("Nhập đủ thông tin tài khoản");
    }

    const created = await api("/api/users", {
      method: "POST",
      body: JSON.stringify(draftUser),
    });

    setUsers((prev) => [created, ...prev]);
    setDraftUser({
      fullName: "",
      username: "",
      password: "",
      role: "cashier",
    });
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Xóa tài khoản này?")) return;

    await api(`/api/users/${id}`, {
      method: "DELETE",
    });

    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const logout = () => {
    localStorage.removeItem("forever_token");
    if (eventSourceRef.current) eventSourceRef.current.close();
    setUser(null);
  };

  if (loading) {
    return <div className="loading-screen">Đang tải hệ thống...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={() => bootstrap()} />;
  }

  return (
    <div className="app-shell">
      <Toasts toasts={toasts} onClose={closeToast} />

      <div className="container">
        <header className="hero-card no-print">
          <div>
            <div className="hero-title">{shop?.name || "FOREVER POS"}</div>
            <div className="hero-subtitle">{shop?.address}</div>
          </div>

          <div className="hero-right">
            <button className="btn outline" onClick={askNotificationPermission}>
              <Bell size={16} /> Bật thông báo
            </button>

            <div className="user-pill">
              <ShieldCheck size={16} />
              {user.fullName} • {isAdmin ? "Quản lý" : "Thu ngân"}
            </div>

            <button className="btn outline" onClick={logout}>
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        </header>

        <nav className="tabs no-print">
          <button
            className={tab === "sales" ? "tab active" : "tab"}
            onClick={() => setTab("sales")}
          >
            <ShoppingCart size={16} /> Bán hàng
          </button>

          <button
            className={tab === "waiting" ? "tab active" : "tab"}
            onClick={() => setTab("waiting")}
          >
            <LayoutGrid size={16} /> Sảnh chờ
          </button>

          <button
            className={tab === "reports" ? "tab active" : "tab"}
            onClick={() => setTab("reports")}
          >
            <BarChart3 size={16} /> Báo cáo
          </button>

          {isAdmin && (
            <button
              className={tab === "manage" ? "tab active" : "tab"}
              onClick={() => setTab("manage")}
            >
              <Settings size={16} /> Quản lý
            </button>
          )}
        </nav>

        {tab === "sales" && (
          <section className="grid-3">
            <div className="card no-print">
              <SectionTitle
                icon={<ShoppingCart size={18} />}
                title="Điều khiển bán hàng"
              />

              <div className="stack">
                <select
                  className="input"
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                >
                  {TABLES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                <select
                  className="input"
                  value={currentShift}
                  onChange={(e) => setCurrentShift(e.target.value)}
                >
                  {SHIFTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <div className="search-box">
                  <Search size={16} />
                  <input
                    className="search-input"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm món..."
                  />
                </div>

                <div className="chip-wrap">
                  {categories.map((c) => (
                    <button
                      key={c}
                      className={category === c ? "chip active" : "chip"}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="mini-stat-box">
                  <div>
                    <strong>{Object.keys(orders).length}</strong>
                    <span>đơn đang phục vụ</span>
                  </div>
                  <div>
                    <strong>{money(report.totalRevenue)}</strong>
                    <span>doanh thu hôm nay</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card no-print">
              <SectionTitle icon={<Coffee size={18} />} title="Menu" />

              <div className="menu-grid">
                {filteredMenu.map((item) => (
                  <button
                    key={item.id}
                    className="menu-item"
                    onClick={() => addItem(item)}
                  >
                    <div className="menu-name">{item.name}</div>
                    <div className="menu-category">{item.category}</div>
                    <div className="menu-price">{money(item.price)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <SectionTitle
                icon={<Receipt size={18} />}
                title={`Đơn hiện tại - ${selectedTable}`}
              />

              <div className="order-list">
                {(!order.items || !order.items.length) && (
                  <div className="muted">Chưa có món nào.</div>
                )}

                {(order.items || []).map((item) => (
                  <div key={item.id} className="order-item">
                    <div className="row-between">
                      <div>
                        <div className="fw700">{item.name}</div>
                        <div className="muted small">
                          {money(item.price)} x {item.qty}
                        </div>
                      </div>
                      <div className="fw800">{money(item.qty * item.price)}</div>
                    </div>

                    <div className="qty-actions no-print">
                      <button
                        className="mini-btn"
                        onClick={() => updateQty(item.id, -1)}
                      >
                        -
                      </button>
                      <button
                        className="mini-btn"
                        onClick={() => updateQty(item.id, 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="summary-box">
                <div className="row-between">
                  <span>Tổng món</span>
                  <strong>{totalQty}</strong>
                </div>
                <div className="row-between total-row">
                  <span>Tổng tiền</span>
                  <strong>{money(totalPrice)}</strong>
                </div>
              </div>

              <div className="action-grid no-print">
                <button className="btn primary" onClick={saveOrder}>
                  <Save size={16} /> Lưu đơn
                </button>

                <button className="btn primary" onClick={checkout}>
                  <Receipt size={16} /> Thanh toán
                </button>

                <button className="btn outline" onClick={handlePrintCurrentBill}>
                  <Printer size={16} /> In bill
                </button>

                <button className="btn danger" onClick={clearOrder}>
                  <Trash2 size={16} /> Xóa bàn
                </button>
              </div>
            </div>
          </section>
        )}

        {tab === "waiting" && (
          <section className="card no-print">
            <SectionTitle
              icon={<LayoutGrid size={18} />}
              title="Sảnh chờ / bàn đang phục vụ"
            />

            <div className="table-grid">
              {TABLES.map((table) => {
                const current = orders[table];
                const itemCount =
                  current?.items?.reduce((s, i) => s + i.qty, 0) || 0;
                const total =
                  current?.items?.reduce((s, i) => s + i.qty * i.price, 0) || 0;

                return (
                  <button
                    key={table}
                    className="table-card"
                    onClick={() => {
                      setSelectedTable(table);
                      setTab("sales");
                    }}
                  >
                    <div className="row-between">
                      <div className="table-name">{table}</div>
                      <div className={itemCount ? "status on" : "status"}>
                        {itemCount ? "Đang phục vụ" : "Trống"}
                      </div>
                    </div>
                    <div className="muted mt8">
                      {itemCount ? `${itemCount} món` : "Chưa có đơn"}
                    </div>
                    <div className="table-total">{money(total)}</div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {tab === "reports" && (
          <section className="report-grid no-print">
            <div className="card">
              <SectionTitle
                icon={<BarChart3 size={18} />}
                title="Tổng quan hôm nay"
              />
              <div className="report-stat">
                <span>Doanh thu</span>
                <strong>{money(report.totalRevenue)}</strong>
              </div>
              <div className="report-stat">
                <span>Số hóa đơn</span>
                <strong>{report.totalBills}</strong>
              </div>
              <div className="report-stat">
                <span>Tổng món</span>
                <strong>{report.totalQty}</strong>
              </div>
            </div>

            <div className="card">
              <SectionTitle
                icon={<BarChart3 size={18} />}
                title="Thống kê theo ca"
              />
              <div className="stack">
                {(report.shiftStats || []).map((shift) => (
                  <div key={shift.shiftId} className="shift-box">
                    <div>
                      <div className="fw700">
                        {SHIFTS.find((s) => s.id === shift.shiftId)?.name ||
                          shift.shiftId}
                      </div>
                      <div className="muted small">
                        {shift.count} hóa đơn • {shift.qty} món
                      </div>
                    </div>
                    <div className="fw800 coffee">{money(shift.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <SectionTitle
                icon={<Coffee size={18} />}
                title="Món bán chạy hôm nay"
              />
              <div className="stack">
                {(report.topItems || []).length === 0 && (
                  <div className="muted">Chưa có dữ liệu.</div>
                )}
                {(report.topItems || []).map((item) => (
                  <div key={item.name} className="top-item row-between">
                    <div>
                      <div className="fw700">{item.name}</div>
                      <div className="muted small">{item.qty} món</div>
                    </div>
                    <div className="fw800">{money(item.revenue)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card report-wide">
              <SectionTitle
                icon={<Receipt size={18} />}
                title="Hóa đơn gần đây"
              />
              <div className="stack">
                {(report.bills || []).length === 0 && (
                  <div className="muted">Chưa có hóa đơn nào hôm nay.</div>
                )}
                {(report.bills || []).slice(0, 14).map((bill) => (
                  <div key={bill.billCode} className="bill-row">
                    <div>
                      <div className="fw700">
                        {bill.billCode} - {bill.table}
                      </div>
                      <div className="muted small">
                        {formatTime(bill.billTime)} • {bill.cashierName} •{" "}
                        {SHIFTS.find((s) => s.id === bill.shiftId)?.name}
                      </div>
                    </div>
                    <div className="fw800 coffee">{money(bill.totalPrice)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "manage" && isAdmin && (
          <section className="manage-grid no-print">
            <div className="card">
              <SectionTitle
                icon={<Settings size={18} />}
                title="Thông tin quán"
                right={
                  <button className="btn primary small-btn" onClick={saveShop}>
                    <Save size={14} /> Lưu
                  </button>
                }
              />
              <div className="stack">
                <input
                  className="input"
                  value={shop?.name || ""}
                  onChange={(e) => setShop({ ...shop, name: e.target.value })}
                  placeholder="Tên quán"
                />
                <input
                  className="input"
                  value={shop?.address || ""}
                  onChange={(e) =>
                    setShop({ ...shop, address: e.target.value })
                  }
                  placeholder="Địa chỉ"
                />
                <input
                  className="input"
                  value={shop?.printerName || ""}
                  onChange={(e) =>
                    setShop({ ...shop, printerName: e.target.value })
                  }
                  placeholder="Tên máy in"
                />
              </div>
            </div>

            <div className="card">
              <SectionTitle
                icon={<Coffee size={18} />}
                title="Thêm món"
                right={
                  <button className="btn primary small-btn" onClick={addMenuItem}>
                    <Plus size={14} /> Thêm
                  </button>
                }
              />
              <div className="stack">
                <input
                  className="input"
                  value={draftItem.name}
                  onChange={(e) =>
                    setDraftItem({ ...draftItem, name: e.target.value })
                  }
                  placeholder="Tên món"
                />
                <input
                  className="input"
                  type="number"
                  value={draftItem.price}
                  onChange={(e) =>
                    setDraftItem({ ...draftItem, price: e.target.value })
                  }
                  placeholder="Giá"
                />
                <select
                  className="input"
                  value={draftItem.category}
                  onChange={(e) =>
                    setDraftItem({ ...draftItem, category: e.target.value })
                  }
                >
                  <option>Cà phê</option>
                  <option>Trà</option>
                  <option>Soda</option>
                  <option>Khác</option>
                </select>
              </div>
            </div>

            <div className="card">
              <SectionTitle
                icon={<Users size={18} />}
                title="Thêm tài khoản"
                right={
                  <button className="btn primary small-btn" onClick={addUser}>
                    <Plus size={14} /> Thêm
                  </button>
                }
              />
              <div className="stack">
                <input
                  className="input"
                  value={draftUser.fullName}
                  onChange={(e) =>
                    setDraftUser({ ...draftUser, fullName: e.target.value })
                  }
                  placeholder="Họ tên"
                />
                <input
                  className="input"
                  value={draftUser.username}
                  onChange={(e) =>
                    setDraftUser({ ...draftUser, username: e.target.value })
                  }
                  placeholder="Tên đăng nhập"
                />
                <input
                  className="input"
                  value={draftUser.password}
                  onChange={(e) =>
                    setDraftUser({ ...draftUser, password: e.target.value })
                  }
                  placeholder="Mật khẩu"
                />
                <select
                  className="input"
                  value={draftUser.role}
                  onChange={(e) =>
                    setDraftUser({ ...draftUser, role: e.target.value })
                  }
                >
                  <option value="cashier">Thu ngân</option>
                  <option value="admin">Quản lý</option>
                </select>
              </div>
            </div>

            <div className="card manage-wide">
              <SectionTitle icon={<Coffee size={18} />} title="Danh sách menu" />
              <div className="stack">
                {menu.map((item) => (
                  <div key={item.id} className="manage-row">
                    <div>
                      <div className="fw700">{item.name}</div>
                      <div className="muted small">
                        {item.category} • {money(item.price)}
                      </div>
                    </div>
                    <div className="row-actions">
                      <button
                        className={
                          item.active
                            ? "btn outline small-btn"
                            : "btn primary small-btn"
                        }
                        onClick={() => toggleMenuItem(item.id)}
                      >
                        {item.active ? "Ẩn" : "Hiện"}
                      </button>
                      <button
                        className="btn danger small-btn"
                        onClick={() => deleteMenuItem(item.id)}
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card manage-wide">
              <SectionTitle
                icon={<Users size={18} />}
                title="Danh sách tài khoản"
              />
              <div className="stack">
                {users.map((u) => (
                  <div key={u.id} className="manage-row">
                    <div>
                      <div className="fw700">{u.fullName}</div>
                      <div className="muted small">
                        {u.username} •{" "}
                        {u.role === "admin" ? "Quản lý" : "Thu ngân"}
                      </div>
                    </div>
                    <div className="row-actions">
                      <button
                        className="btn danger small-btn"
                        disabled={u.id === user.id}
                        onClick={() => deleteUser(u.id)}
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
