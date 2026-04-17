const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Health check
app.get("/", (req, res) => {
  res.send("FOREVER POS Backend is running");
});

// Demo login
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (username === "admin" && password === "123456") {
      return res.status(200).json({
        success: true,
        token: "demo-admin-token",
        user: {
          username: "admin",
          role: "admin",
          name: "Administrator",
        },
      });
    }

    if (username === "staff" && password === "123456") {
      return res.status(200).json({
        success: true,
        token: "demo-staff-token",
        user: {
          username: "staff",
          role: "staff",
          name: "Staff",
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: "Sai tài khoản hoặc mật khẩu",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`FOREVER POS Backend running on port ${PORT}`);
});
