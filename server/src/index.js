import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './config/db.js';
import documentsRouter from './routes/documents.js';
import chatRouter from './routes/chat.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Initialize database
db.init();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
    next();
});

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'KB Copilot API',
        database: 'JSON File'
    });
});

app.use('/api/documents', documentsRouter);
app.use('/api/chat', chatRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   🚀 KB Copilot Server Running                   ║
║   📍 http://localhost:${PORT}                       ║
║   📚 API: http://localhost:${PORT}/api              ║
║   💾 Database: JSON File                         ║
╚══════════════════════════════════════════════════╝
  `);
});
