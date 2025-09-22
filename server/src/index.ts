import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import watchLocalRoutes from "./routes/watchLocal.js";
import uploadRoutes from "./routes/uploadFile.js";

dotenv.config();

const app = express();
const PORT = 3000;

// ✅ CORS & JSON first
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// ✅ Then your routes
app.use("/api", watchLocalRoutes,uploadRoutes);

// ------------------- Start Server -------------------
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
