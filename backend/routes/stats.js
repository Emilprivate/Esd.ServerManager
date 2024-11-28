const express = require('express');
const os = require('os');
const { exec } = require('child_process');
const router = express.Router();

let lastCpuUsage = { idle: 0, total: 0 };
let lastNetworkStats = {};

function getCpuUsage() {
  const cpus = os.cpus();
  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce(
    (acc, cpu) => acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.irq + cpu.times.idle,
    0
  );

  const idleDifference = totalIdle - lastCpuUsage.idle;
  const totalDifference = totalTick - lastCpuUsage.total;
  const cpuUsage = totalDifference === 0 ? 0 : (1 - idleDifference / totalDifference) * 100;

  lastCpuUsage = { idle: totalIdle, total: totalTick };
  return cpuUsage.toFixed(2);
}

function getNetworkTraffic() {
  const interfaces = os.networkInterfaces();
  const stats = {};

  for (const [name, values] of Object.entries(interfaces)) {
    const iface = values.find((val) => !val.internal && val.family === 'IPv4');
    if (iface) {
      const receivedBytes = iface.rx || 0;
      const sentBytes = iface.tx || 0;
      const previous = lastNetworkStats[name] || { receivedBytes: 0, sentBytes: 0 };

      stats[name] = {
        received: receivedBytes - previous.receivedBytes,
        sent: sentBytes - previous.sentBytes,
      };

      lastNetworkStats[name] = { receivedBytes, sentBytes };
    }
  }

  return stats;
}

router.get('/', (req, res) => {
  const platform = os.platform();
  const stats = {
    platform,
    uptime: os.uptime(),
    cpuUsage: getCpuUsage(),
    memoryUsage: {
      total: os.totalmem(),
      free: os.freemem(),
    },
    networkTraffic: getNetworkTraffic(),
  };

  if (platform === 'linux') {
    exec("df -h --total | grep 'total' | awk '{print $2, $3, $4, $5}'", (err, stdout) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch disk usage' });
      }
      const [total, used, free, percent] = stdout.trim().split(' ');
      stats.diskUsage = { total, used, free, percent };
      res.json(stats);
    });
  } else if (platform === 'win32') {
    exec('wmic logicaldisk get size,freespace,caption', (err, stdout) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch disk usage' });
      }
      const lines = stdout.trim().split('\n').slice(1);
      const diskInfo = lines.map((line) => {
        const [drive, freeSpace, size] = line.trim().split(/\s+/);
        return { drive, freeSpace: parseInt(freeSpace, 10), size: parseInt(size, 10) };
      });
      stats.diskUsage = diskInfo;
      res.json(stats);
    });
  } else {
    stats.diskUsage = { error: 'Unsupported platform for disk usage' };
    res.json(stats);
  }
});

module.exports = router;
