const app = require('./app');
const { connectDb } = require('./config/database');
require('dotenv').config();

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await connectDb();
    const server = app.listen(DEFAULT_PORT, () => {
      console.log(`FarmaBusca server running on port ${DEFAULT_PORT}`);
    });
    server.on('error', (error) => {
      console.error(error.code === 'EADDRINUSE'
        ? `Port ${DEFAULT_PORT} is already in use. Stop the other process or configure PORT.`
        : 'Server startup error:', error.code === 'EADDRINUSE' ? '' : error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Database startup error:', error.message);
    process.exit(1);
  }
};

startServer();
