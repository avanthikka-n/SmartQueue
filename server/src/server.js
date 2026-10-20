import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './sockets/socketManager.js';
import { startTimeoutMonitor } from './services/timeoutEngine.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server, process.env.CLIENT_URL);

// Server Error Event Handling (e.g. EADDRINUSE)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [Port Error] Port ${PORT} is already in use by another process.`);
    console.error(`💡 Quick Fix:`);
    console.error(`   1. Free port ${PORT}: npx kill-port ${PORT}`);
    console.error(`   2. Or change PORT in server/.env (e.g. PORT=5001)\n`);
  } else {
    console.error('❌ [Server Error]', err);
  }
  process.exit(1);
});

// Connect to MongoDB & Start Server
connectDB().then(() => {
  // Start the background auto-skip timeout monitor
  startTimeoutMonitor(10000);

  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 SmartQueue Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`⏱️ Auto-Skip Monitor: Active (10s polling)`);
    console.log(`====================================================`);
  });
});
