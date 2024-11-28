const express = require("express");
const os = require("os");
const { exec } = require("child_process");
const router = express.Router();

let lastCpuUsage = { idle: 0, total: 0 };
let lastNetworkTraffic = {};

/**
 * Calculates CPU usage as a percentage (overall and per core).
 */
function getCpuUsage() {
  const cpus = os.cpus();
  const usageByCore = cpus.map((cpu) => {
    const total =
      cpu.times.user +
      cpu.times.nice +
      cpu.times.sys +
      cpu.times.irq +
      cpu.times.idle;
    const idle = cpu.times.idle;

    return total === 0 ? 0 : ((1 - idle / total) * 100).toFixed(2);
  });

  const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
  const totalTick = cpus.reduce(
    (acc, cpu) =>
      acc +
      cpu.times.user +
      cpu.times.nice +
      cpu.times.sys +
      cpu.times.irq +
      cpu.times.idle,
    0
  );

  const idleDifference = totalIdle - lastCpuUsage.idle;
  const totalDifference = totalTick - lastCpuUsage.total;
  const overallCpuUsage =
    totalDifference === 0 ? 0 : (1 - idleDifference / totalDifference) * 100;

  lastCpuUsage = { idle: totalIdle, total: totalTick };

  return {
    overall: overallCpuUsage.toFixed(2),
    byCore: usageByCore,
  };
}

/**
 * Retrieves network traffic statistics by parsing /proc/net/dev (Linux).
 */
function getNetworkTraffic() {
  const isWindows = os.platform() === "win32";

  return new Promise((resolve, reject) => {
    if (isWindows) {
      // Fetch network stats using PowerShell on Windows
      exec(
        'powershell -Command "Get-NetAdapterStatistics | Select-Object -Property Name,ReceivedBytes,SentBytes | ConvertTo-Json"',
        (err, stdout) => {
          if (err) {
            console.error(
              "Network traffic fetch error (Windows):",
              err.message
            );
            return reject("Failed to fetch network traffic on Windows.");
          }

          try {
            const stats = JSON.parse(stdout);
            const traffic = Array.isArray(stats)
              ? stats.reduce((acc, iface) => {
                  acc[iface.Name] = {
                    received: iface.ReceivedBytes,
                    sent: iface.SentBytes,
                  };
                  return acc;
                }, {})
              : {
                  [stats.Name]: {
                    received: stats.ReceivedBytes,
                    sent: stats.SentBytes,
                  },
                };

            console.log("Parsed Network Traffic (Windows):", traffic);
            resolve(traffic);
          } catch (parseError) {
            console.error(
              "Error parsing network traffic (Windows):",
              parseError.message
            );
            reject("Error parsing network traffic on Windows.");
          }
        }
      );
    } else {
      // Fetch network stats using Linux-specific command
      exec("cat /proc/net/dev", (err, stdout) => {
        if (err) {
          console.error("Network traffic fetch error (Linux):", err.message);
          return reject("Failed to fetch network traffic on Linux.");
        }

        try {
          const interfaces = stdout
            .split("\n")
            .slice(2)
            .map((line) => line.trim().split(/\s+/))
            .filter((line) => line.length > 0);

          const stats = {};
          interfaces.forEach(([iface, rxBytes, txBytes]) => {
            stats[iface] = {
              received: parseInt(rxBytes, 10),
              sent: parseInt(txBytes, 10),
            };
          });

          console.log("Parsed Network Traffic (Linux):", stats);
          resolve(stats);
        } catch (parseError) {
          console.error(
            "Error parsing network traffic (Linux):",
            parseError.message
          );
          reject("Error parsing network traffic on Linux.");
        }
      });
    }
  });
}

/**
 * Formats disk usage data for consistent output.
 */
function formatDiskUsage(diskInfo) {
  return diskInfo.map((disk) => ({
    drive: disk.drive || "Total",
    used: Math.round((disk.size - disk.freeSpace) / 1024 ** 3), // Convert bytes to GB
    free: Math.round(disk.freeSpace / 1024 ** 3), // Convert bytes to GB
  }));
}

/**
 * Fetches and returns server stats.
 */
router.get("/", async (req, res) => {
  try {
    console.log("Fetching system stats...");
    const platform = os.platform();
    console.log("Platform:", platform);

    const memoryUsage = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
    };
    console.log("Memory Usage:", memoryUsage);

    const cpuStats = getCpuUsage();
    console.log("CPU Stats:", cpuStats);

    const networkTraffic = await getNetworkTraffic();
    console.log("Network Traffic:", networkTraffic);

    const stats = {
      platform,
      uptime: os.uptime(),
      cpuUsage: cpuStats.overall,
      cpuUsageByCore: cpuStats.byCore,
      memoryUsage,
      networkTraffic,
    };

    console.log("Stats Object:", stats);

    if (platform === "linux") {
      exec(
        "df -h --total | grep 'total' | awk '{print $2, $3, $4, $5}'",
        (err, stdout) => {
          if (err) {
            console.error("Disk usage fetch error (Linux):", err.message);
            return res
              .status(500)
              .json({ error: "Failed to fetch disk usage (Linux)" });
          }
          const [total, used, free] = stdout.trim().split(/\s+/);
          stats.diskUsage = [
            {
              drive: "Total",
              size: parseInt(total) * 1024 ** 3,
              freeSpace: parseInt(free) * 1024 ** 3,
            },
          ];
          console.log("Final Stats with Disk Usage:", stats);
          res.json(stats);
        }
      );
    } else if (platform === "win32") {
      console.log("Fetching disk usage for Windows...");
      exec("wmic logicaldisk get size,freespace,caption", (err, stdout) => {
        if (err) {
          console.error("Disk usage fetch error (Windows):", err.message);
          return res
            .status(500)
            .json({ error: "Failed to fetch disk usage (Windows)" });
        }
        console.log("Disk usage command output:", stdout);
        const lines = stdout.trim().split("\n").slice(1);
        try {
          const diskInfo = lines.map((line) => {
            const [drive, freeSpace, size] = line.trim().split(/\s+/);
            return {
              drive,
              freeSpace: parseInt(freeSpace, 10),
              size: parseInt(size, 10),
            };
          });
          stats.diskUsage = diskInfo;
          console.log("Disk Info Parsed:", diskInfo);
          res.json(stats);
        } catch (parseError) {
          console.error("Error parsing disk usage:", parseError.message);
          res.status(500).json({ error: "Error parsing disk usage (Windows)" });
        }
      });
    } else {
      console.warn("Unsupported platform for disk usage");
      stats.diskUsage = [{ drive: "Unsupported", size: 0, freeSpace: 0 }];
      res.json(stats);
    }
  } catch (error) {
    console.error("Unexpected error occurred:", error.message, error.stack);
    res.status(500).json({ error: "Unexpected error occurred" });
  }
});

module.exports = router;
