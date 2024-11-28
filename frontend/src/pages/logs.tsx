import React, { useState, useEffect } from "react";

const Logs: React.FC = () => {
    const [services, setServices] = useState<string[]>([]);
    const [selectedService, setSelectedService] = useState<string>("");
    const [logs, setLogs] = useState<string[]>([]);
    const [filter, setFilter] = useState<string>("");

    useEffect(() => {
        fetch("/api/logs/services")
            .then((res) => res.json())
            .then((data) => setServices(data.services || []))
            .catch((err) => console.error(err));
    }, []);

    useEffect(() => {
        if (!selectedService) return;

        const eventSource = new EventSource(`/api/logs?service=${selectedService}`);
        eventSource.onmessage = (event) => {
            setLogs((prevLogs) => [...prevLogs, event.data]);
        };

        return () => eventSource.close();
    }, [selectedService]);

    const filteredLogs = logs.filter((log) => log.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Service Logs</h2>
            <div className="mb-4">
                <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="p-2 bg-gray-700 text-white rounded"
                >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                        <option key={service} value={service}>
                            {service}
                        </option>
                    ))}
                </select>
            </div>
            <input
                type="text"
                placeholder="Filter logs..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="p-2 mb-4 bg-gray-800 text-white rounded w-full"
            />
            <div className="bg-gray-900 p-4 rounded h-96 overflow-auto">
                {filteredLogs.map((log, index) => (
                    <div key={index} className="text-gray-300 mb-2">
                        {log}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Logs;
