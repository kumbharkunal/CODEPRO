import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import connectDB from './config/db';
import { initializeSocket } from './config/socket';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { apiLimiter } from './config/rateLimiter';
import userRoutes from './routes/userRoutes';
import repositoryRoutes from './routes/repositoryRoutes';
import reviewRoutes from './routes/reviewRoutes';
import authRoutes from './routes/authRoutes';
import webhookRoutes from './routes/webhookRoutes';


// CONNECT TO MONGODB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP Server
const httpServer = http.createServer(app);

// Inititalize Socket.io
initializeSocket(httpServer);

// Security headers
app.use(helmet());

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Webhook routes (must be before express.json())
app.use('/api/webhook', webhookRoutes);

// BODY PARSER
app.use(express.json());

// CORS CONFIGURATION
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}
app.use(cors(corsOptions));

// Rate limiting
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        database: 'connected',
        WebSocket: 'active',
    });
});

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/', (req: express.Request , res: express.Response) => {
    res.json({ message: 'CodePro API is running! 🚀' });
});

// ERROR HANDLING MIDDLEWARES
app.use(notFound);
app.use(errorHandler);

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
    console.log('WebSocket server is ready');
});


