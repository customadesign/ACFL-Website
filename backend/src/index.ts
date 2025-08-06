import express = require('express');
import cors = require('cors');
import * as dotenv from 'dotenv';
import matchRoutes from './routes/matchRoutes';
import coachRoutes from './routes/coachRoutes';
import clientRoutes from './routes/clientRoutes';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://therapist-matcher-frontend.onrender.com', process.env.CORS_ORIGIN].filter(Boolean)
      : ['http://localhost:3002', 'http://localhost:4000', 'http://localhost:4002', 'http://localhost:4003', 'http://localhost:3000', 'http://frontend:3000'];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Range'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', matchRoutes);
app.use('/api', coachRoutes);
app.use('/api', clientRoutes);
app.use('/admin', adminRoutes);

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 

