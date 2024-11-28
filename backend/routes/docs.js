const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/readme", (req, res) => {
  const filePath = path.resolve(__dirname, "../../README.md");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading README.md:", err);
      res.status(500).json({ error: "Failed to load README.md" });
      return;
    }
    const processedData = data.replace(
      /\bassets\/Preview\.png\b/g,
      "/api/docs/assets/Preview.png"
    );
    res.setHeader("Content-Type", "text/markdown");
    res.send(processedData);
  });
});

router.use("/assets", express.static(path.resolve(__dirname, "../../assets")));

module.exports = router;
