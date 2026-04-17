import { useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng nhập thất bại");
      }

      localStorage.setItem("forever_pos_token", data.token);
      localStorage.setItem("forever_pos_user", JSON.stringify(data.user));
      setLoggedInUser(data.user);
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
  };

  if (loggedInUser) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.watermark}>FOREVER</div>
          <h1 style={styles.title}>FOREVER POS PRO</h1>
          <p style={styles.subtitle}>Đăng nhập thành công</p>

          <div style={styles.successBox}>
            <p><strong>Tài khoản:</strong> {loggedInUser.username}</p>
            <p><strong>Vai trò:</strong> {loggedInUser.role}</p>
          </div>

          <button style={styles.button} onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
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
          />

          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "#e9e7e5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "24px",
    fontFamily: "Arial, sans-serif"
  },
  card: {
    width: "100%",
    maxWidth: "760px",
    background: "#f5f3f1",
    borderRadius: "28px",
    padding: "48px",
    position: "relative",
    boxSizing: "border-box"
  },
  watermark: {
    fontSize: "88px",
    fontWeight: "800",
    color: "#dcd9d7",
    lineHeight: 1,
    marginBottom: "40px"
  },
  title: {
    fontSize: "52px",
    fontWeight: "800",
    color: "#1f1818",
    margin: "0 0 18px 0"
  },
  subtitle: {
    fontSize: "28px",
    color: "#524c4a",
    marginBottom: "36px"
  },
  input: {
    width: "100%",
    height: "74px",
    borderRadius: "24px",
    border: "2px solid #d2cdca",
    padding: "0 22px",
    fontSize: "28px",
    marginBottom: "20px",
    boxSizing: "border-box",
    outline: "none",
    background: "#f8f7f6"
  },
  errorBox: {
    background: "#f7d8d8",
    color: "#b11f1f",
    fontSize: "24px",
    padding: "22px",
    borderRadius: "22px",
    marginBottom: "20px"
  },
  successBox: {
    background: "#dff1df",
    color: "#1f5f1f",
    fontSize: "24px",
    padding: "22px",
    borderRadius: "22px",
    marginBottom: "24px"
  },
  button: {
    width: "100%",
    height: "78px",
    border: "none",
    borderRadius: "24px",
    background: "#9a430a",
    color: "#fff",
    fontSize: "34px",
    fontWeight: "700",
    cursor: "pointer"
  },
  demoInfo: {
    marginTop: "42px",
    fontSize: "26px",
    lineHeight: 1.7,
    color: "#585250",
    fontWeight: "700"
  }
};
