import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import repositoryRoutes from './routes/repositoryRoutes';
import authRoutes from './routes/authRoutes';
import { errorHandler, notFound } from './middlewares/errorHandler';
import cors from 'cors';
import reviewRoutes from './routes/reviewRoutes';
import { apiLimiter } from './config/rateLimiter';
import helmet from 'helmet';
import morgan from 'morgan';

dotenv.config();

// CONNECT TO MONGODB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

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

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
  });
});

app.get('/', (req, res) => {
    res.json({ message: 'CodePro API is running! 🚀' });
});

// ERROR HANDLING MIDDLEWARES
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});


