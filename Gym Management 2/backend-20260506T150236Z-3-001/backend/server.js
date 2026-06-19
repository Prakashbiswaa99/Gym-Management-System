const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { spawn, execSync } = require('child_process');
const path = require('path');
const net = require('net');

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/workout', require('./routes/workout'));
app.use('/api/diet', require('./routes/diet'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// --- Auto-start MongoDB if not running ---
const MONGOD_PATH = 'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe';
const DB_PATH = path.resolve(__dirname, '..', '..', 'mongodb_data');
const MONGO_PORT = 27017;

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') resolve(true);
      else resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, '127.0.0.1');
  });
}

function startMongoDB() {
  return new Promise(async (resolve, reject) => {
    const alreadyRunning = await isPortInUse(MONGO_PORT);
    if (alreadyRunning) {
      console.log('ℹ️  MongoDB is already running on port ' + MONGO_PORT);
      return resolve();
    }

    console.log('🔄 Starting MongoDB automatically...');
    console.log(`   Data path: ${DB_PATH}`);

    const mongod = spawn(MONGOD_PATH, [
      '--dbpath', DB_PATH,
      '--port', String(MONGO_PORT),
    ], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
      windowsHide: true,
    });

    // Unref so the Node process can exit without waiting for mongod
    mongod.unref();

    let started = false;

    mongod.stdout.on('data', (data) => {
      const output = data.toString();
      if (!started && (output.includes('Waiting for connections') || output.includes('waiting for connections'))) {
        started = true;
        console.log('✅ MongoDB started successfully');
        resolve();
      }
    });

    mongod.stderr.on('data', (data) => {
      const output = data.toString();
      // MongoDB logs to stderr as well, check for ready message here too
      if (!started && (output.includes('Waiting for connections') || output.includes('waiting for connections'))) {
        started = true;
        console.log('✅ MongoDB started successfully');
        resolve();
      }
    });

    mongod.on('error', (err) => {
      reject(new Error(`Failed to start MongoDB: ${err.message}`));
    });

    mongod.on('exit', (code) => {
      if (!started) {
        reject(new Error(`MongoDB exited unexpectedly with code ${code}`));
      }
    });

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!started) {
        // Check port one more time before giving up
        isPortInUse(MONGO_PORT).then((inUse) => {
          if (inUse) {
            started = true;
            console.log('✅ MongoDB started successfully');
            resolve();
          } else {
            reject(new Error('MongoDB startup timed out after 15 seconds'));
          }
        });
      }
    }, 15000);
  });
}

// --- Start everything ---
(async () => {
  try {
    await startMongoDB();

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  } catch (err) {
    console.error('❌ Startup error:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
