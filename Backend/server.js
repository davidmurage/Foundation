import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import studentRoutes from "./routes/student.js";
import documentRoutes from "./routes/documents.js";
import performanceRoutes from "./routes/performance.js";
import adminRoutes from "./routes/admin.js";
import adminSettingsRoutes from "./routes/adminSettings.js";
import institutionPublicRoutes from "./routes/institutionPublic.js";
import feesApplicationRoutes from "./routes/feesApplication.js";

//highschool
import adminHighSchoolsRoutes from "./routes/adminHighSchools.js";
import highSchoolStudents from "./routes/highSchoolStudents.js";
import highSchoolDashboard from "./routes/highSchoolDashboard.js";


dotenv.config();
const app = express();

console.log("MONGO URI =", process.env.MONGO_URI);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/institutions", institutionPublicRoutes);
app.use("/api/fees", feesApplicationRoutes);

//highschool
app.use("/api/highschools", adminHighSchoolsRoutes);
app.use("/api/highschool/students", highSchoolStudents);
app.use("/api/dashboard", highSchoolDashboard);


// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
  console.log("MongoDB connected");
  
})
.catch((err) => console.log(err));

//rest Api
app.get('/', (req, res) => {
    res.send('API is running')
});
//Start Server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
