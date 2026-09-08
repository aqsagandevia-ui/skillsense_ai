require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");

const User = require("./models/User");
const Message = require("./models/Message");

// =====================
// Routes
// =====================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const matchRoutes = require("./routes/matchRoutes");
const aiMatchRoutes = require("./routes/aiMatchRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const skillRoutes = require("./routes/skillRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const calendarRoutes = require("./routes/calendarRoutes");

// =====================
// App & Server
// =====================
const app = express();
const server = http.createServer(app);

// =====================
// Middlewares
// =====================
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow explicit dev origins plus any CLIENT_URL from env
      const allowed = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"];
      if (process.env.CLIENT_URL) allowed.push(process.env.CLIENT_URL);
      if (!origin || allowed.indexOf(origin) !== -1) return cb(null, true);
      // In development allow all origins for convenience
      if (process.env.NODE_ENV !== 'production') return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
// Increase payload limit for profile photo uploads (10MB)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Security headers for COOP policy (fixes popup issues)
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

// =====================
// API Routes
// =====================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/ai", aiMatchRoutes);
app.use("/api/session", sessionRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/calendar", calendarRoutes);

app.use("/api/skills", skillRoutes);
app.use("/api/admin", adminRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("SkillSwap API & Socket Running 🚀");
});

// Debug Route - test if server is accessible
app.get("/api/debug/test", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date(),
    mongoConnected: isDbConnected()
  });
});

// =====================
// MongoDB Connection Helper
// =====================
const isDbConnected = () => {
  const state = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return state === 1;
};

// =====================
// MongoDB Connection
// =====================
const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("✅ MongoDB Connected");
    })
    .catch((err) => {
      console.log("❌ MongoDB Connection Error:", err.message);
    });
};

// Connect to MongoDB
connectDB();

// Track online users: Map<userId, socketId>
// Initialize centralized socket server (keeps socket logic in server/socket.js)
try {
  const socketServer = require("./socket");
  socketServer(server);
  console.log("🔌 Socket server initialized from ./socket.js");
} catch (err) {
  console.error("❌ Failed to initialize socket server:", err.message);
}
// =====================
// MongoDB Connection Event Listeners
// =====================
mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.log("❌ MongoDB error:", err.message);
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄 MongoDB reconnected");
});

// =====================
// Server Start
// =====================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server & Socket running on port ${PORT}`);
});
