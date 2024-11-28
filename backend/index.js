const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 7000;

app.use(cors());
app.use(express.json());

const fileRoutes = require('./routes/files');
app.use('/api/files', fileRoutes);

const statsRouter = require('./routes/stats');
app.use('/api/stats', statsRouter);

const logsRoutes = require('./routes/logs');
app.use('/api/logs', logsRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});