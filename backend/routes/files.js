const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetPath = path.resolve(req.query.path || ".");
    const relativePath = path.dirname(file.originalname);
    const uploadPath = path.join(targetPath, relativePath);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, path.basename(file.originalname));
  },
});

const upload = multer({ storage });

router.get("/list", (req, res) => {
  const dirPath = req.query.path || ".";
  const absolutePath = path.resolve(dirPath);

  fs.readdir(absolutePath, { withFileTypes: true }, (err, files) => {
    if (err) {
      return res.status(500).json({
        error: "Unable to read directory",
        details: err.message,
      });
    }

    const response = files.map((file) => ({
      name: file.name,
      isDirectory: file.isDirectory(),
    }));

    res.json({ path: absolutePath, files: response });
  });
});

router.post("/upload", upload.single("file"), (req, res) => {
  res.json({ message: "File uploaded successfully." });
});

router.post("/upload-directory", upload.array("files"), (req, res) => {
  res.json({ message: "Files uploaded successfully." });
});

router.delete("/delete", (req, res) => {
  const filePath = path.resolve(req.query.path || ".");

  fs.stat(filePath, (err, stats) => {
    if (err) {
      return res.status(404).json({ error: "File or directory not found." });
    }

    if (stats.isDirectory()) {
      fs.rmdir(filePath, { recursive: true }, (err) => {
        if (err) {
          return res
            .status(500)
            .json({
              error: "Failed to delete the directory.",
              details: err.message,
            });
        }
        res.json({ message: "Directory deleted successfully." });
      });
    } else {
      fs.unlink(filePath, (err) => {
        if (err) {
          return res
            .status(500)
            .json({
              error: "Failed to delete the file.",
              details: err.message,
            });
        }
        res.json({ message: "File deleted successfully." });
      });
    }
  });
});

router.get("/read", (req, res) => {
  const filePath = path.resolve(req.query.path || ".");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ error: "Failed to read the file." });
    }
    res.json({ content: data });
  });
});

router.post("/save", (req, res) => {
  const filePath = path.resolve(req.query.path || ".");
  const { content } = req.body;

  fs.writeFile(filePath, content, "utf8", (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to save the file." });
    }
    res.json({ message: "File saved successfully." });
  });
});

router.post("/create", (req, res) => {
  const dirPath = req.query.path || ".";
  const { filename } = req.body;

  if (!filename || typeof filename !== "string") {
    return res.status(400).json({ error: "Invalid filename." });
  }

  const ext = path.extname(filename);
  const finalFilename = ext ? filename : `${filename}.txt`;

  const filePath = path.join(dirPath, finalFilename);
  const absolutePath = path.resolve(filePath);

  fs.writeFile(absolutePath, "", (err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to create the file.", details: err.message });
    }
    res.json({
      message: "File created successfully.",
      filename: finalFilename,
    });
  });
});

router.post("/create-folder", (req, res) => {
  const dirPath = req.query.path || ".";
  const { folderName } = req.body;

  if (!folderName || typeof folderName !== "string") {
    return res.status(400).json({ error: "Invalid folder name." });
  }

  const folderPath = path.join(dirPath, folderName);
  const absolutePath = path.resolve(folderPath);

  fs.mkdir(absolutePath, { recursive: true }, (err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Failed to create the folder.", details: err.message });
    }
    res.json({ message: "Folder created successfully.", folderName });
  });
});

module.exports = router;
