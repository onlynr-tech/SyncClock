console.clear();
console.log("🚀 SyncClock WebSocket Server Starting...");

const express = require('express');
const http = require('http');
const WebSocket = require("ws");
const os = require('os');
const path = require('path');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// Serve static files (HTML, CSS, Images)
app.use(express.static(path.join(__dirname, '/')));

// Handle default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const wss = new WebSocket.Server({ server });

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
}

console.log(`✅ WebSocket Server aktif di port ${PORT}`);
console.log(`🌐 Local Link: http://${getLocalIP()}:${PORT}`);

let clients = new Map();

function broadcastClientInfo() {
    const clientCount = clients.size;

    console.log("📩 Broadcast CLIENTS =", clientCount);

    const msg = `CLIENTS|${clientCount}`;

    wss.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(msg);
        }
    });
}

wss.on("connection", (ws, req) => {
    // Handle IP differently if behind proxy (common in cloud)
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    clients.set(ip, ws);

    console.log(`🌐 Client connected: ${ip}`);
    console.log(`👥 Total client: ${clients.size}`);

    broadcastClientInfo();

    ws.on("message", (msg) => {
        const text = msg.toString();

        if (text.startsWith("REQ|")) {
            const t1 = parseFloat(text.split("|")[1]);
            const t2 = Date.now() / 1000;
            const t3 = Date.now() / 1000;

            ws.send(`RESP|${t1}|${t2}|${t3}`);
        }
    });

    ws.on("close", () => {
        clients.delete(ip);
        console.log(`❌ Client disconnected: ${ip}`);
        broadcastClientInfo();
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
});