import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/auth';

const router = Router();

interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Middleware to verify JWT token
const verifyToken = (req: AuthRequest, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = {
      id: decoded.id || decoded.userId,
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get goals for a client
router.get('/goals', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { client_id, status } = req.query;

    if (!client_id) {
      return res.status(400).json({ message: 'client_id is required' });
    }

    let query = supabase
      .from('progress_goals')
      .select('*')
      .eq('client_id', client_id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: goals, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching goals:', error);
      return res.status(500).json({ message: 'Failed to fetch goals', error: error.message });
    }

    res.json({ goals: goals || [] });
  } catch (error) {
    console.error('Error in GET /goals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get session progress by session ID
router.get('/session/:sessionId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const { data: progress, error } = await supabase
      .from('session_progress')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching session progress:', error);
      return res.status(500).json({ message: 'Failed to fetch session progress', error: error.message });
    }

    res.json({ progress: progress || null });
  } catch (error) {
    console.error('Error in GET /session/:sessionId:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new session progress
router.post('/session', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      session_id,
      goal_id,
      progress_rating,
      achievements,
      challenges,
      next_session_focus,
      homework_assigned,
      coach_notes,
      client_reflection
    } = req.body;

    if (!session_id) {
      return res.status(400).json({ message: 'session_id is required' });
    }

    const progressData = {
      session_id,
      goal_id: goal_id || null,
      progress_rating: progress_rating || null,
      achievements: achievements || null,
      challenges: challenges || null,
      next_session_focus: next_session_focus || null,
      homework_assigned: homework_assigned || null,
      coach_notes: coach_notes || null,
      client_reflection: client_reflection || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: progress, error } = await supabase
      .from('session_progress')
      .insert(progressData)
      .select()
      .single();

    if (error) {
      console.error('Error creating session progress:', error);
      return res.status(500).json({ message: 'Failed to create session progress', error: error.message });
    }

    res.status(201).json({ progress, message: 'Session progress created successfully' });
  } catch (error) {
    console.error('Error in POST /session:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update existing session progress
router.put('/session/:progressId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { progressId } = req.params;
    const {
      goal_id,
      progress_rating,
      achievements,
      challenges,
      next_session_focus,
      homework_assigned,
      coach_notes,
      client_reflection
    } = req.body;

    const updateData = {
      goal_id: goal_id || null,
      progress_rating: progress_rating || null,
      achievements: achievements || null,
      challenges: challenges || null,
      next_session_focus: next_session_focus || null,
      homework_assigned: homework_assigned || null,
      coach_notes: coach_notes || null,
      client_reflection: client_reflection || null,
      updated_at: new Date().toISOString()
    };

    const { data: progress, error } = await supabase
      .from('session_progress')
      .update(updateData)
      .eq('id', progressId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session progress:', error);
      return res.status(500).json({ message: 'Failed to update session progress', error: error.message });
    }

    if (!progress) {
      return res.status(404).json({ message: 'Session progress not found' });
    }

    res.json({ progress, message: 'Session progress updated successfully' });
  } catch (error) {
    console.error('Error in PUT /session/:progressId:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new goal
router.post('/goals', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      client_id,
      coach_id,
      title,
      description,
      category,
      target_value,
      target_unit,
      target_date,
      priority
    } = req.body;

    if (!client_id || !coach_id || !title) {
      return res.status(400).json({ message: 'client_id, coach_id, and title are required' });
    }

    const goalData = {
      client_id,
      coach_id,
      title,
      description: description || null,
      category: category || 'personal',
      target_value: target_value || null,
      target_unit: target_unit || null,
      target_date: target_date || null,
      priority: priority || 'medium',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: goal, error } = await supabase
      .from('progress_goals')
      .insert(goalData)
      .select()
      .single();

    if (error) {
      console.error('Error creating goal:', error);
      return res.status(500).json({ message: 'Failed to create goal', error: error.message });
    }

    res.status(201).json({ goal, message: 'Goal created successfully' });
  } catch (error) {
    console.error('Error in POST /goals:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;