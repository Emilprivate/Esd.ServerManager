const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 7000;

app.use(cors());
app.use(express.json());

const fileRoutes = require("./routes/files");
const statsRouter = require("./routes/stats");
const logsRoutes = require("./routes/logs");
const docsRoutes = require("./routes/docs");

app.use("/api/files", fileRoutes);
app.use("/api/stats", statsRouter);
app.use("/api/logs", logsRoutes);
app.use("/api/docs", docsRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
