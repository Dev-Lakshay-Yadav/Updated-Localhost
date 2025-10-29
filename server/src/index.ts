import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import watchLocalRoutes from "./routes/watchLocal.js";
import uploadRoutes from "./routes/uploadFile.js";
import newWatchLogicRoutesRoutes from "./routes/newWatchLogicRoutes.js";

import { getClient } from "./config/box.js";
import { processCases } from "./utils/downloader/ts_portal_box_cases_downloader.js";

dotenv.config();

const app = express();
const PORT = 5000;

// CORS & JSON first
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

getClient((client) => {
  processCases(client);
});

// Run every 1 minute
setInterval(() => {
  getClient((client) => {
    processCases(client);
  });
}, 60 * 1000);

// Then your routes
app.use("/api", watchLocalRoutes, uploadRoutes, newWatchLogicRoutesRoutes);

// ------------------- Start Server -------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
