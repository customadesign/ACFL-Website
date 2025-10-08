import { Router, Request, Response } from 'express'
import { authenticate } from '../middleware/auth'
import { JWTPayload } from '../types/auth'
import { supabase } from '../lib/supabase'

interface AuthRequest extends Request {
  user?: JWTPayload;
}

const router = Router()

/**
 * Get notification counts for the current user
 */
router.get('/counts', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
    }

    // Get unread message count
    // This assumes you have a messages table with read status
    const { data: unreadMessages, error: messageError } = await supabase
      .from('messages')
      .select('id')
      .eq('recipient_id', userId)
      .eq('read', false)

    if (messageError) {
      console.error('Error fetching unread messages:', messageError)
    }

    // Get appointment notification count
    // This could be based on recent appointments or status changes
    const { data: recentAppointments, error: appointmentError } = await supabase
      .from('sessions')
      .select('id')
      .or(`client_id.eq.${userId},coach_id.eq.${userId}`)
      .eq('notification_read', false)
      .gte('scheduled_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    if (appointmentError) {
      console.error('Error fetching appointment notifications:', appointmentError)
    }

    res.json({
      success: true,
      unreadMessages: unreadMessages?.length || 0,
      appointmentNotifications: recentAppointments?.length || 0
    })

  } catch (error: any) {
    console.error('Error getting notification counts:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get notification counts'
    })
  }
})

/**
 * Mark messages as read for a user
 */
router.post('/messages/mark-read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
    }

    const { error } = await supabase
      .from('messages')
      .update({ read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('read', false)

    if (error) {
      console.error('Error marking messages as read:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to mark messages as read'
      })
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    })

  } catch (error: any) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    })
  }
})

/**
 * Mark appointment notifications as read for a user
 */
router.post('/appointments/mark-read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      })
    }

    const { error } = await supabase
      .from('sessions')
      .update({ notification_read: true })
      .or(`client_id.eq.${userId},coach_id.eq.${userId}`)
      .eq('notification_read', false)

    if (error) {
      console.error('Error marking appointment notifications as read:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to mark appointment notifications as read'
      })
    }

    res.json({
      success: true,
      message: 'Appointment notifications marked as read'
    })

  } catch (error: any) {
    console.error('Error marking appointment notifications as read:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to mark appointment notifications as read'
    })
  }
})

export default router