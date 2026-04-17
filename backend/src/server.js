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
