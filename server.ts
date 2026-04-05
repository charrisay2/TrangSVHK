import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import sequelize from "./server/config/database";
import authRoutes from "./server/routes/authRoutes";
import userRoutes from "./server/routes/userRoutes";
import courseRoutes from "./server/routes/courseRoutes";
import notificationRoutes from "./server/routes/notificationRoutes";
import invoiceRoutes from "./server/routes/invoiceRoutes";
import resourceRoutes from "./server/routes/resourceRoutes";
import gradeRoutes from "./server/routes/gradeRoutes";
import majorRoutes from "./server/routes/majorRoutes";
import subjectRoutes from "./server/routes/subjectRoutes";
import semesterRoutes from "./server/routes/semesterRoutes";
import enrollmentRoutes from "./server/routes/enrollmentRoutes";
import departmentRoutes from "./server/routes/departmentRoutes";
import classRoutes from "./server/routes/classRoutes";
import roomRoutes from "./server/routes/roomRoutes";
import curriculumRoutes from "./server/routes/curriculumRoutes";
import attendanceRoutes from "./server/routes/attendanceRoutes";
import paymentRoutes from "./server/routes/paymentRoutes";
import { EventEmitter } from "events";

// (Vẫn giữ lại import các Model để Sequelize nhận diện các quan hệ - Associations)
import User from "./server/models/User";
import Course from "./server/models/Course";
import Notification from "./server/models/Notification";
import Invoice from "./server/models/Invoice";
import Resource from "./server/models/Resource";
import { Grade } from "./server/models/Grade";
import Major from "./server/models/Major";
import Subject from "./server/models/Subject";
import Curriculum from "./server/models/Curriculum";
import Department from "./server/models/Department";
import Class from "./server/models/Class";
import Room from "./server/models/Room";
import Semester from "./server/models/Semester";
import Attendance from "./server/models/Attendance";

declare global {
  var notificationEmitter: EventEmitter;
}

// Initialize global event emitter for notifications
if (!global.notificationEmitter) {
  global.notificationEmitter = new EventEmitter();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" },
});

// Make io accessible to routes
app.set("io", io);

// Listen for new notifications and emit via socket.io
global.notificationEmitter.on("new_notification", (notification) => {
  io.emit("notification", notification);
});

const PORT = 3001;

// Middleware
app.use(cors({
  origin: [
    "https://trangsv.congsinhvieen.id.vn"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log("Request:", req.url);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/majors", majorRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/curriculums", curriculumRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);

// Basic Route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "University Management System API is running",
  });
});

// Start Server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database MySQL connected successfully.");

    // ĐÃ XÓA: sequelize.sync({ force: true }) và seedData()
    // Hệ thống giờ sẽ sử dụng npx sequelize-cli db:migrate và db:seed:all

    // Vite integration for development
    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      // Serve static files in production
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

startServer();

export { sequelize };
