import { useEffect, useMemo, useState } from "react";

const API_URL = "https://forever-pos.onrender.com";

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
  { id: 1, name: "Cà phê đen đá", price: 25000, category: "Cà phê" },
  { id: 2, name: "Cà phê sữa đá", price: 30000, category: "Cà phê" },
  { id: 3, name: "Bạc xỉu", price: 35000, category: "Cà phê" },
  { id: 4, name: "Trà đào", price: 35000, category: "Trà" },
  { id: 5, name: "Trà tắc", price: 30000, category: "Trà" },
  { id: 6, name: "Trà sữa", price: 40000, category: "Trà sữa" },
  { id: 7, name: "Cacao đá", price: 38000, category: "Đá xay" },
  { id: 8, name: "Yaourt đá", price: 32000, category: "Khác" },
];

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN").format(value || 0) + " đ";

export default function App() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  const [activeTab, setActiveTab] = useState("banhang");
  const [selectedTable, setSelectedTable] = useState("Bàn 1");
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("forever_pos_orders");
    return saved ? JSON.parse(saved) : {};
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

  useEffect(() => {
    localStorage.setItem("forever_pos_orders", JSON.stringify(orders));
  }, [orders]);

  const currentOrder = orders[selectedTable] || [];

  const totalAmount = useMemo(() => {
    return currentOrder.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [currentOrder]);

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
      setError("");
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

  const clearTableOrder = () => {
    setOrders((prev) => ({
      ...prev,
      [selectedTable]: [],
    }));
  };

  const handlePrintBill = () => {
    if (!currentOrder.length) {
      alert("Bàn này chưa có món để in bill.");
      return;
    }

    const lines = currentOrder
      .map(
        (item) =>
          `${item.name} x${item.qty} - ${formatMoney(item.qty * item.price)}`
      )
      .join("\\n");

    alert(
      `FOREVER POS PRO\\n${selectedTable}\\n\\n${lines}\\n\\nTổng tiền: ${formatMoney(
        totalAmount
      )}`
    );
  };

  if (!loggedInUser) {
    return (
      <div style={styles.page}>
        <div style={styles.loginCard}>
          <div style={styles.watermark}>FOREVER</div>

          <h1 style={styles.title}>FOREVER POS PRO</h1>
          <p style={styles.subtitle}>Đăng nhập hệ thống bán hàng internet</p>

          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              autoComplete="username"
            />

            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              autoComplete="current-password"
            />

            {error ? <div style={styles.errorBox}>{error}</div> : null}

            <button type="submit" style={styles.button} disabled={loading}>
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
      <aside style={styles.sidebar}>
        <div>
          <div style={styles.logoBox}>FOREVER</div>
          <div style={styles.userBox}>
            <div style={styles.userName}>{loggedInUser.username}</div>
            <div style={styles.userRole}>
              {loggedInUser.role === "admin" ? "Quản trị viên" : "Nhân viên"}
            </div>
          </div>

          <div style={styles.navGroup}>
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
                ...(activeTab === "menu" ? styles.navButtonActive : {}),
              }}
              onClick={() => setActiveTab("menu")}
            >
              Thực đơn
            </button>

            {loggedInUser.role === "admin" && (
              <button
                style={{
                  ...styles.navButton,
                  ...(activeTab === "baocao" ? styles.navButtonActive : {}),
                }}
                onClick={() => setActiveTab("baocao")}
              >
                Báo cáo
              </button>
            )}
          </div>
        </div>

        <button style={styles.logoutButton} onClick={handleLogout}>
          Đăng xuất
        </button>
      </aside>

      <main style={styles.main}>
        {activeTab === "banhang" && (
          <>
            <div style={styles.topbar}>
              <div>
                <h2 style={styles.pageTitle}>Quản lý bán hàng</h2>
                <div style={styles.pageNote}>API: {API_URL}</div>
              </div>
              <div style={styles.roleBadge}>
                {loggedInUser.role === "admin" ? "ADMIN" : "STAFF"}
              </div>
            </div>

            <div style={styles.grid}>
              <section style={styles.panel}>
                <h3 style={styles.panelTitle}>Khu vực bàn</h3>
                <div style={styles.tableGrid}>
                  {TABLES.map((table) => {
                    const count = (orders[table] || []).reduce(
                      (sum, item) => sum + item.qty,
                      0
                    );
                    return (
                      <button
                        key={table}
                        onClick={() => setSelectedTable(table)}
                        style={{
                          ...styles.tableButton,
                          ...(selectedTable === table
                            ? styles.tableButtonActive
                            : {}),
                        }}
                      >
                        <div>{table}</div>
                        <div style={styles.tableMeta}>
                          {count > 0 ? `${count} món` : "Trống"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section style={styles.panel}>
                <h3 style={styles.panelTitle}>Đơn hiện tại - {selectedTable}</h3>

                {!currentOrder.length ? (
                  <div style={styles.emptyBox}>Chưa có món trong đơn.</div>
                ) : (
                  <div style={styles.orderList}>
                    {currentOrder.map((item) => (
                      <div key={item.id} style={styles.orderItem}>
                        <div>
                          <div style={styles.orderName}>{item.name}</div>
                          <div style={styles.orderPrice}>
                            {formatMoney(item.price)}
                          </div>
                        </div>

                        <div style={styles.qtyBox}>
                          <button
                            style={styles.qtyBtn}
                            onClick={() => changeQty(item.id, -1)}
                          >
                            -
                          </button>
                          <span style={styles.qtyValue}>{item.qty}</span>
                          <button
                            style={styles.qtyBtn}
                            onClick={() => changeQty(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div style={styles.totalBox}>
                  <span>Tổng tiền</span>
                  <strong>{formatMoney(totalAmount)}</strong>
                </div>

                <div style={styles.actionRow}>
                  <button style={styles.secondaryButton} onClick={clearTableOrder}>
                    Xóa đơn
                  </button>
                  <button style={styles.primaryButton} onClick={handlePrintBill}>
                    In bill
                  </button>
                </div>
              </section>

              <section style={styles.panel}>
                <h3 style={styles.panelTitle}>Menu đồ uống</h3>
                <div style={styles.menuList}>
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      style={styles.menuItem}
                      onClick={() => addItemToOrder(item)}
                    >
                      <div style={styles.menuName}>{item.name}</div>
                      <div style={styles.menuCategory}>{item.category}</div>
                      <div style={styles.menuPrice}>{formatMoney(item.price)}</div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {activeTab === "menu" && (
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Danh sách thực đơn</h3>
            <div style={styles.simpleList}>
              {MENU_ITEMS.map((item) => (
                <div key={item.id} style={styles.simpleRow}>
                  <span>{item.name}</span>
                  <strong>{formatMoney(item.price)}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "baocao" && loggedInUser.role === "admin" && (
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Báo cáo nhanh</h3>
            <div style={styles.reportGrid}>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Số bàn đang phục vụ</div>
                <div style={styles.reportValue}>
                  {
                    TABLES.filter((table) => (orders[table] || []).length > 0)
                      .length
                  }
                </div>
              </div>

              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Tổng món đang mở</div>
                <div style={styles.reportValue}>
                  {Object.values(orders)
                    .flat()
                    .reduce((sum, item) => sum + item.qty, 0)}
                </div>
              </div>

              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Tổng tiền tạm tính</div>
                <div style={styles.reportValue}>
                  {formatMoney(
                    Object.values(orders)
                      .flat()
                      .reduce((sum, item) => sum + item.qty * item.price, 0)
                  )}
                </div>
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
    background: "#e9e7e5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  loginCard: {
    width: "100%",
    maxWidth: 760,
    background: "#f5f3f1",
    borderRadius: 28,
    padding: 48,
    boxSizing: "border-box",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  watermark: {
    fontSize: 88,
    fontWeight: 800,
    color: "#dcd9d7",
    lineHeight: 1,
    marginBottom: 40,
    letterSpacing: 2,
  },
  title: {
    fontSize: 52,
    fontWeight: 800,
    color: "#1f1818",
    margin: "0 0 18px 0",
  },
  subtitle: {
    fontSize: 28,
    color: "#524c4a",
    marginBottom: 36,
  },
  input: {
    width: "100%",
    height: 74,
    borderRadius: 24,
    border: "2px solid #d2cdca",
    padding: "0 22px",
    fontSize: 28,
    marginBottom: 20,
    boxSizing: "border-box",
    outline: "none",
    background: "#f8f7f6",
  },
  errorBox: {
    background: "#f7d8d8",
    color: "#b11f1f",
    fontSize: 24,
    padding: 22,
    borderRadius: 22,
    marginBottom: 20,
  },
  button: {
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
    marginTop: 42,
    fontSize: 26,
    lineHeight: 1.7,
    color: "#585250",
    fontWeight: 700,
  },
  appShell: {
    minHeight: "100vh",
    background: "#ebe7e3",
    display: "flex",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: 280,
    background: "#2c1c14",
    color: "#fff",
    padding: 24,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  logoBox: {
    fontSize: 34,
    fontWeight: 800,
    marginBottom: 24,
  },
  userBox: {
    background: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  userName: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
  },
  userRole: {
    fontSize: 16,
    opacity: 0.85,
  },
  navGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  navButton: {
    height: 54,
    borderRadius: 16,
    border: "none",
    background: "#4a2e21",
    color: "#fff",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
  navButtonActive: {
    background: "#9a430a",
  },
  logoutButton: {
    height: 54,
    borderRadius: 16,
    border: "none",
    background: "#fff",
    color: "#2c1c14",
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: 24,
    boxSizing: "border-box",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  pageTitle: {
    margin: 0,
    fontSize: 34,
    color: "#2b1d17",
  },
  pageNote: {
    marginTop: 8,
    color: "#755f55",
    fontSize: 14,
    wordBreak: "break-all",
  },
  roleBadge: {
    background: "#9a430a",
    color: "#fff",
    padding: "10px 18px",
    borderRadius: 999,
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr 1fr",
    gap: 20,
  },
  panel: {
    background: "#f8f5f2",
    borderRadius: 24,
    padding: 20,
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  panelTitle: {
    margin: "0 0 18px 0",
    fontSize: 24,
    color: "#2b1d17",
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },
  tableButton: {
    minHeight: 74,
    borderRadius: 18,
    border: "2px solid #e2d8d1",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 16,
    color: "#2b1d17",
  },
  tableButtonActive: {
    background: "#9a430a",
    color: "#fff",
    border: "2px solid #9a430a",
  },
  tableMeta: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: 500,
    opacity: 0.85,
  },
  emptyBox: {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
    color: "#7c6b63",
    marginBottom: 16,
  },
  orderList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 16,
  },
  orderItem: {
    background: "#fff",
    borderRadius: 18,
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  orderName: {
    fontWeight: 700,
    color: "#2b1d17",
  },
  orderPrice: {
    color: "#7b6558",
    marginTop: 4,
  },
  qtyBox: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    border: "none",
    background: "#9a430a",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
  },
  qtyValue: {
    minWidth: 20,
    textAlign: "center",
    fontWeight: 700,
  },
  totalBox: {
    background: "#efe4db",
    borderRadius: 18,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 20,
    marginBottom: 16,
    color: "#2b1d17",
  },
  actionRow: {
    display: "flex",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    border: "2px solid #d4c2b6",
    background: "#fff",
    color: "#6c5143",
    fontWeight: 700,
    cursor: "pointer",
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    border: "none",
    background: "#9a430a",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  menuList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  menuItem: {
    textAlign: "left",
    border: "2px solid #eadfd8",
    borderRadius: 18,
    background: "#fff",
    padding: 14,
    cursor: "pointer",
  },
  menuName: {
    fontWeight: 700,
    color: "#2b1d17",
    marginBottom: 4,
  },
  menuCategory: {
    fontSize: 14,
    color: "#8a766a",
    marginBottom: 8,
  },
  menuPrice: {
    fontWeight: 700,
    color: "#9a430a",
  },
  simpleList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  simpleRow: {
    background: "#fff",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  reportGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  reportCard: {
    background: "#fff",
    borderRadius: 18,
    padding: 20,
  },
  reportLabel: {
    color: "#7a665a",
    marginBottom: 10,
  },
  reportValue: {
    color: "#2b1d17",
    fontSize: 28,
    fontWeight: 800,
  },
};
