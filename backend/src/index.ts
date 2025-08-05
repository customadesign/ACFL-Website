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
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : [])
    : ['http://localhost:3002', 'http://localhost:4000', 'http://localhost:4002', 'http://localhost:4003', 'http://localhost:3000', 'http://frontend:3000'],
  credentials: true
};

app.use(cors(corsOptions));
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

