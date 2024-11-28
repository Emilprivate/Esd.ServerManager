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
    res.setHeader("Content-Type", "text/markdown");
    res.send(data);
  });
});

module.exports = router;
