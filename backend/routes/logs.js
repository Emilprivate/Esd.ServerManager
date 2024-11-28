const express = require("express");
const { spawn } = require("child_process");

const router = express.Router();

const logStreams = {};

function startLogStream(service, res) {
    if (!logStreams[service]) {
        const command = ["-u", service, "--no-pager", "--follow", "--output=json"];
        const process = spawn("journalctl", command);

        logStreams[service] = { process, listeners: [] };

        process.stdout.on("data", (data) => {
            const lines = data.toString().split("\n");
            lines.forEach((line) => {
                logStreams[service].listeners.forEach((listener) => listener.write(`data: ${line}\n\n`));
            });
        });

        process.stderr.on("data", (data) => {
            logStreams[service].listeners.forEach((listener) => listener.write(`data: Error: ${data.toString()}\n\n`));
        });

        process.on("exit", () => delete logStreams[service]);
    }
    logStreams[service].listeners.push(res);
}

router.get("/logs", (req, res) => {
    const { service } = req.query;

    if (!service) {
        return res.status(400).send("Service name is required.");
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    startLogStream(service, res);

    req.on("close", () => {
        logStreams[service].listeners = logStreams[service].listeners.filter((listener) => listener !== res);
    });
});

router.get("/services", (req, res) => {
    const { exec } = require("child_process");

    exec("systemctl list-units --type=service --no-pager", (err, stdout) => {
        if (err) {
            return res.status(500).json({ error: "Failed to list services." });
        }

        const services = stdout
            .split("\n")
            .slice(1, -1)
            .map((line) => line.split(/\s+/)[0]);

        res.json({ services });
    });
});

module.exports = router;
