import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { ProviderManager } from './services/ProviderManager.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { authMiddleware } from './middleware/auth.js';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Provider Manager
let providerManager;
try {
    providerManager = new ProviderManager();
    app.set('providerManager', providerManager);
    console.log('🚀 Provider Manager initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Provider Manager:', error.message);
    process.exit(1);
}

// Apply authentication to all routes
app.use(authMiddleware);

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        providers: providerManager.providers.size
    });
});

// API Routes
app.use('/api', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'Multi-AI Chat API',
        version: '1.0.0',
        description: 'API with automatic rotation between multiple free AI providers',
        endpoints: {
            health: 'GET /health',
            chat: 'POST /api/chat',
            conversation: 'POST /api/chat/conversation',
            providersStatus: 'GET /api/providers/status'
        },
        documentation: 'https://github.com/ApiEasyPanel'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✨ Multi-AI Chat API is running!`);
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`📊 Status: http://localhost:${PORT}/api/providers/status`);
    console.log(`\n🤖 Active providers: ${providerManager.providers.size}`);
    console.log('─'.repeat(50));
});

export default app;
