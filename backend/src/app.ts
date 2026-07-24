import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import apiRouter from './presentation/routes';
import { errorHandler } from './presentation/middlewares/error.middleware';
import { globalLimiter } from './presentation/middlewares/rateLimit.middleware';

const app = express();

// Security Headers (Helmet)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://api.dicebear.com"],
            connectSrc: ["'self'"]
        }
    }
}));

// CORS Configuration
const allowedOrigins = [
    process.env.FRONTEND_URL, 
    'http://localhost:3000', 
    'http://localhost:5173', 
    'https://nerdsctf.web.app',
    'https://nerdsctf.firebaseapp.com'
].filter(Boolean) as string[];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS security policy.'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Standard Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Morgan Request logging
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// Apply rate limiting globally
app.use('/api', globalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Register API Routes
app.use('/api/v1', apiRouter);

// Central error handler (MUST be registered last)
app.use(errorHandler);

export default app;
