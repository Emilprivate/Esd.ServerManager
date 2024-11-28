import React, { useEffect, useState } from "react";
import { Doughnut, Line, Bar } from "react-chartjs-2";
import "chart.js/auto";
import CircularLoader from "../common/circularloader";

interface Stats {
  platform: string;
  uptime: number;
  cpuUsage: string;
  memoryUsage: { total: number; free: number };
  diskUsage: any;
  networkTraffic: any;
}

const formatBytes = (bytes: number) => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const ServerStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = () => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch(() => {
        setError("Failed to fetch server stats.");
      });
  };

  useEffect(() => {
    fetchStats();
    setLoading(false);
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full flex flex-col">
      {loading && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center">
          <CircularLoader message="Loading server stats..." />
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Server Statistics</h2>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full overflow-auto space-y-6">
        {error && <p className="text-red-500">{error}</p>}
        {stats ? (
          <>
            <div className="bg-gray-900 p-4 rounded shadow-md">
              <h3 className="text-lg font-bold text-white mb-3">
                General Stats
              </h3>
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
              <div className="bg-gray-900 p-4 rounded shadow-md flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <h3 className="text-lg font-bold text-white mb-4">
                    Memory Usage
                  </h3>
                  <div className="w-56 h-56">
                    <Doughnut
                      data={{
                        labels: ["Used", "Free"],
                        datasets: [
                          {
                            data: [
                              stats.memoryUsage.total - stats.memoryUsage.free,
                              stats.memoryUsage.free,
                            ],
                            backgroundColor: ["#FF6384", "#36A2EB"],
                          },
                        ],
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded shadow-md">
                <h3 className="text-lg font-bold text-white mb-4 text-center">
                  CPU Usage Over Time
                </h3>
                <div className="w-full h-64">
                  <Line
                    data={{
                      labels: Array.from(
                        { length: 10 },
                        (_, i) => `T-${10 - i}`
                      ),
                      datasets: [
                        {
                          label: "CPU Usage (%)",
                          data: Array(10).fill(parseFloat(stats.cpuUsage)),
                          borderColor: "#FF6384",
                          backgroundColor: "rgba(255, 99, 132, 0.1)",
                          fill: true,
                        },
                      ],
                    }}
                  />
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded shadow-md">
                <h3 className="text-lg font-bold text-white mb-4 text-center">
                  Disk Usage
                </h3>
                <div className="w-full h-64">
                  <Bar
                    data={{
                      labels: stats.diskUsage.map(
                        (disk: any) => disk.drive || "Total"
                      ),
                      datasets: [
                        {
                          label: "Used Space (GB)",
                          data: stats.diskUsage.map(
                            (disk: any) => disk.used || 0
                          ),
                          backgroundColor: "#FF6384",
                        },
                        {
                          label: "Free Space (GB)",
                          data: stats.diskUsage.map(
                            (disk: any) => disk.free || 0
                          ),
                          backgroundColor: "#36A2EB",
                        },
                      ],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>

              <div className="bg-gray-900 p-4 rounded shadow-md">
                <h3 className="text-lg font-bold text-white mb-4 text-center">
                  Network Traffic
                </h3>
                <div className="w-full h-64">
                  <Bar
                    data={{
                      labels: Object.keys(stats.networkTraffic),
                      datasets: [
                        {
                          label: "Data Received (KB)",
                          data: Object.values(stats.networkTraffic).map(
                            (iface: any) => iface.received
                          ),
                          backgroundColor: "#36A2EB",
                        },
                        {
                          label: "Data Sent (KB)",
                          data: Object.values(stats.networkTraffic).map(
                            (iface: any) => iface.sent
                          ),
                          backgroundColor: "#FF6384",
                        },
                      ],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center">
            <CircularLoader message="Loading server stats..." />
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerStats;
