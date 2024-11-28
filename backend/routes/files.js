const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetPath = path.resolve(req.query.path || '.');
    cb(null, targetPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

const router = express.Router();

router.get('/list', (req, res) => {
  const dirPath = req.query.path || '.';
  const absolutePath = path.resolve(dirPath);

  fs.readdir(absolutePath, { withFileTypes: true }, (err, files) => {
    if (err) {
      return res.status(500).json({
        error: 'Unable to read directory',
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

router.post('/upload', upload.single('file'), (req, res) => {
  res.json({ message: 'File uploaded successfully.' });
});

router.delete('/delete', (req, res) => {
  const filePath = path.resolve(req.query.path || '.');
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete the file.' });
    }
    res.json({ message: 'File deleted successfully.' });
  });
});

router.get('/read', (req, res) => {
    const filePath = path.resolve(req.query.path || '.');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
        return res.status(500).json({ error: 'Failed to read the file.' });
        }
        res.json({ content: data });
    });
});
  
router.post('/save', (req, res) => {
const filePath = path.resolve(req.query.path || '.');
const { content } = req.body;

    fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
        return res.status(500).json({ error: 'Failed to save the file.' });
        }
        res.json({ message: 'File saved successfully.' });
    });
});

module.exports = router;
