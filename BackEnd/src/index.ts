import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db';
import userRoutes from './routes/userRoutes';
import repositoryRoutes from './routes/repositoryRoutes';
import { errorHandler, notFound } from './middlewares/errorHandler';
import cors from 'cors';
import reviewRoutes from './routes/reviewRoutes';

dotenv.config();

// CONNECT TO MONGODB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARES
app.use(express.json());

// CORS CONFIGURATION
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}
app.use(cors(corsOptions));

// ROUTES
app.use('/api/users', userRoutes);
app.use('/api/repositories', repositoryRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'CodePro API is running! 🚀' });
});

// ERROR HANDLING MIDDLEWARES
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} `);
});


