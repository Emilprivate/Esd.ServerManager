import React, { useEffect, useState } from "react";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import "chart.js/auto";
import CircularLoader from "../common/circularloader";

interface Stats {
  platform: string;
  uptime: number;
  cpuUsage: string;
  cpuUsageByCore: string[];
  memoryUsage: { total: number; free: number; used: number } | null;
  diskUsage: { drive: string; size: number; freeSpace: number }[] | null;
  networkTraffic: Record<string, { received: number; sent: number }> | null;
}

const ServerStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = () => {
    fetch("/api/stats")
      .then((res) => {
        if (!res.ok) {
          return res.json().then((err) => {
            throw new Error(err.error || "Failed to fetch server stats.");
          });
        }
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching stats:", err.message);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="absolute inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center">
        <CircularLoader message="Loading server stats..." />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!stats) {
    return <p className="text-gray-400">No data available.</p>;
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full overflow-auto space-y-6">
      <div className="bg-gray-900 p-4 rounded shadow-md">
        <h3 className="text-lg font-bold text-white mb-3">General Stats</h3>
        <ul className="text-gray-300 space-y-2">
          <li>
            <strong>Platform:</strong> {stats.platform}
          </li>
          <li>
            <strong>Uptime:</strong> {Math.floor(stats.uptime / 3600)}h{" "}
            {Math.floor((stats.uptime % 3600) / 60)}m
          </li>
          <li>
            <strong>CPU Usage:</strong> {stats.cpuUsage}%
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.memoryUsage && (
          <div className="bg-gray-900 p-4 rounded shadow-md">
            <h3 className="text-lg font-bold text-white mb-4">Memory Usage</h3>
            <Doughnut
              data={{
                labels: ["Used", "Free"],
                datasets: [
                  {
                    data: [stats.memoryUsage.used, stats.memoryUsage.free],
                    backgroundColor: ["#FF6384", "#36A2EB"],
                  },
                ],
              }}
            />
          </div>
        )}

        <div className="bg-gray-900 p-4 rounded shadow-md">
          <h3 className="text-lg font-bold text-white mb-4">
            CPU Usage Per Core
          </h3>
          <Bar
            data={{
              labels: stats.cpuUsageByCore.map((_, i) => `Core ${i + 1}`),
              datasets: [
                {
                  label: "CPU Usage (%)",
                  data: stats.cpuUsageByCore.map((usage) => parseFloat(usage)),
                  backgroundColor: "#FF6384",
                },
              ],
            }}
            options={{
              indexAxis: "y",
              responsive: true,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                x: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {stats.diskUsage && (
          <div className="bg-gray-900 p-4 rounded shadow-md">
            <h3 className="text-lg font-bold text-white mb-4">Disk Usage</h3>
            <Bar
              data={{
                labels: stats.diskUsage.map((disk) => disk.drive),
                datasets: [
                  {
                    label: "Free Space (GB)",
                    data: stats.diskUsage.map((disk) =>
                      (disk.freeSpace / 1024 ** 3).toFixed(2)
                    ),
                    backgroundColor: "#36A2EB",
                  },
                  {
                    label: "Used Space (GB)",
                    data: stats.diskUsage.map((disk) =>
                      ((disk.size - disk.freeSpace) / 1024 ** 3).toFixed(2)
                    ),
                    backgroundColor: "#FF6384",
                  },
                ],
              }}
              options={{
                indexAxis: "y",
                responsive: true,
                plugins: {
                  legend: {
                    position: "right",
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                  },
                  y: {
                    stacked: true,
                  },
                },
              }}
            />
          </div>
        )}

        {stats.networkTraffic && (
          <div className="bg-gray-900 p-4 rounded shadow-md">
            <h3 className="text-lg font-bold text-white mb-4">
              Network Traffic
            </h3>
            <Line
              data={{
                labels: Object.keys(stats.networkTraffic),
                datasets: [
                  {
                    label: "Data Received (MB)",
                    data: Object.values(stats.networkTraffic).map(
                      (iface) => iface.received / 1024 ** 2
                    ),
                    borderColor: "#36A2EB",
                    fill: false,
                    tension: 0.3,
                  },
                  {
                    label: "Data Sent (MB)",
                    data: Object.values(stats.networkTraffic).map(
                      (iface) => iface.sent / 1024 ** 2
                    ),
                    borderColor: "#FF6384",
                    fill: false,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: "Interfaces",
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "Traffic (MB)",
                    },
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerStats;
