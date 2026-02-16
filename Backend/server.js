import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import helmet from "helmet";
import requestLogger from "./middleware/requestLogger.js";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import documentRoutes from "./routes/documents.js";
import performanceRoutes from "./routes/performance.js";
import adminRoutes from "./routes/admin.js";
import adminSettingsRoutes from "./routes/adminSettings.js";
import institutionPublicRoutes from "./routes/institutionPublic.js";
import feesApplicationRoutes from "./routes/feesApplication.js";
import reportsRoutes from "./routes/reports.js";
import institutionReports from "./routes/institutionReports.js";


//highschool
import adminHighSchoolsRoutes from "./routes/adminHighSchools.js";
import highSchoolStudents from "./routes/highSchoolStudents.js";
import highSchoolDashboard from "./routes/highSchoolDashboard.js";
import highSchoolStudentProfileRoutes from "./routes/highSchoolStudentProfile.js";

//shell
import monitoringRoutes from "./routes/monitoringRoutes.js";
import { applySecurity } from "./middleware/security.js";
import cookieParser from "cookie-parser";
import { applyTrafficGuards } from "./middleware/traffic.js";
import { httpLogger } from "./middleware/logger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

//feedback
import feedbackRoutes from "./routes/feedback.js";

//for license purpose
import { publicIpv4 } from "public-ip";
import licenseCheck from "./middleware/licenseCheck.js";

const ip = await publicIpv4();
console.log(ip);



dotenv.config();
const app = express();

const __dirname = path.resolve();

console.log("MONGO URI =", process.env.MONGO_URI);

app.use(cors());
app.use(helmet());

// Basic parsers (limit size!)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());

// Security + performance
applySecurity(app);
applyTrafficGuards(app);

// Logging
app.use(httpLogger);

app.use(requestLogger());

//license
app.use(licenseCheck);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/institutions", institutionPublicRoutes);
app.use("/api/fees", feesApplicationRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/reports/institution", institutionReports);

//highschool
app.use("/api/highschools", adminHighSchoolsRoutes);
app.use("/api/highschool/students", highSchoolStudents);
app.use("/api/dashboard", highSchoolDashboard);
app.use("/uploads",express.static(path.join(__dirname, "uploads")))
app.use("/api/highschool/student", highSchoolStudentProfileRoutes);

//shell
app.use("/api/admin/monitoring", monitoringRoutes);

//feedback
app.use("/api/feedback", feedbackRoutes);


/* Health check for load balancers
app.get("/api/health", async (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.json({
    ok: true,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    dbConnected: dbState === 1,
    timestamp: new Date().toISOString(),
  });
});*/

// Errors
app.use(notFound);
app.use(errorHandler);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  maxPoolSize: 50, // connection pool
  serverSelectionTimeoutMS: 10_000,
  socketTimeoutMS: 45_000, 
  useNewUrlParser: true, 
  useUnifiedTopology: true })
.then(() => {
  console.log("MongoDB connected");
  
})
.catch((err) => console.log(err));


//rest Api
app.get('/', (req, res) => {
    res.send('API is running')
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  await mongoose.connection.close();
  process.exit(0);
});

//Start Server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
