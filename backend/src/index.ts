import express = require('express');
import cors = require('cors');
import * as dotenv from 'dotenv';
import matchRoutes from './routes/matchRoutes';
import coachRoutes from './routes/coachRoutes';
import clientRoutes from './routes/clientRoutes';
import adminRoutes from './routes/adminRoutes';
import authRoutes from './routes/authRoutes';
import meetingRoutes from './routes/meetingRoutes';
import notificationRoutes from './routes/notificationRoutes';
import { supabase } from './lib/supabase';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Socket.io setup
import http = require('http');
import jwt = require('jsonwebtoken');
import { Server } from 'socket.io';

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
// app.options('*', cors(corsOptions));
app.use(express.json());

// Note: File uploads now handled by Supabase Storage

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', matchRoutes);
app.use('/api', coachRoutes);
app.use('/api', clientRoutes);
app.use('/admin', adminRoutes);

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Add a database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (error) {
      return res.status(500).json({ 
        message: 'Database error', 
        error: error.message 
      });
    }
    
    res.json({ 
      message: 'Database connection working!', 
      data: data 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database test failed', 
      error: error.message 
    });
  }
});

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: (origin: string | undefined, callback: any) => {
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? ['https://therapist-matcher-frontend.onrender.com', process.env.CORS_ORIGIN].filter(Boolean)
        : ['http://localhost:3002', 'http://localhost:4000', 'http://localhost:4002', 'http://localhost:4003', 'http://localhost:3000', 'http://frontend:3000'];
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
});

// Make io instance available to routes
app.set('io', io);

type SocketUser = { userId: string; role: string } | null;

io.use((socket, next) => {
  try {
    const authHeader = socket.handshake.auth?.token || socket.handshake.headers['authorization'];
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '')
      : (typeof socket.handshake.auth?.token === 'string' ? socket.handshake.auth.token : undefined);
    if (!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    (socket as any).user = { userId: decoded.userId, role: decoded.role } as SocketUser;
    return next();
  } catch (e) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const user = (socket as any).user as SocketUser;
  if (!user) {
    socket.disconnect(true);
    return;
  }
  const room = `user:${user.userId}`;
  socket.join(room);

  socket.on('message:send', async (payload: { recipientId: string; body: string; attachment?: { url: string; name: string; size: number; type: string } }) => {
    try {
      const senderId = user.userId;
      const { recipientId, body, attachment } = payload;
      if (!recipientId || (!body?.trim() && !attachment)) return;
      const now = new Date().toISOString();
      const insert = {
        sender_id: senderId,
        recipient_id: recipientId,
        body: body?.trim() || (attachment ? `[Attachment: ${attachment.name}]` : ''),
        attachment_url: attachment?.url || null,
        attachment_name: attachment?.name || null,
        attachment_size: attachment?.size || null,
        attachment_type: attachment?.type || null,
        created_at: now,
        read_at: null as string | null,
      } as any;

      const { data: saved, error } = await supabase
        .from('messages')
        .insert(insert)
        .select('*')
        .single();

      if (error) throw error;

      // Fetch sender information to include in the message
      let senderName = 'Unknown';
      try {
        // Try to find sender in coaches table first
        const { data: coachSender } = await supabase
          .from('coaches')
          .select('first_name, last_name')
          .eq('id', senderId)
          .single();
        
        if (coachSender) {
          senderName = `${coachSender.first_name} ${coachSender.last_name}`;
        } else {
          // Try to find sender in clients table
          const { data: clientSender } = await supabase
            .from('clients')
            .select('first_name, last_name')
            .eq('id', senderId)
            .single();
          
          if (clientSender) {
            senderName = `${clientSender.first_name} ${clientSender.last_name}`;
          }
        }
      } catch (error) {
        console.log('Could not fetch sender name:', error);
      }

      // Add sender name to the message
      const messageWithSender = {
        ...saved,
        sender_name: senderName
      };

      // Emit to both participants
      io.to(`user:${recipientId}`).emit('message:new', messageWithSender);
      io.to(`user:${senderId}`).emit('message:new', messageWithSender);
    } catch (err) {
      socket.emit('message:error', { message: 'Failed to send message' });
    }
  });

  socket.on('message:read', async (payload: { messageIds: string[] }) => {
    try {
      const { messageIds } = payload || { messageIds: [] };
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;
      const now = new Date().toISOString();
      const { data: updated, error } = await supabase
        .from('messages')
        .update({ read_at: now })
        .in('id', messageIds)
        .select('*');
      if (error) throw error;
      // Notify senders of read receipts
      (updated || []).forEach((m: any) => {
        io.to(`user:${m.sender_id}`).emit('message:read', { id: m.id, read_at: m.read_at });
      });
    } catch (err) {
      socket.emit('message:error', { message: 'Failed to mark read' });
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


