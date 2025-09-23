import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import emailService from '../services/emailService';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    [key: string]: any;
  };
}

interface StaffInvitationData {
  email: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  role_level: string;
  employment_type: string;
  message?: string;
  permissions?: { [key: string]: boolean };
}

// Send staff invitation
export const sendStaffInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const {
      email,
      first_name,
      last_name,
      department,
      role_level = 'staff',
      employment_type = 'full-time',
      message,
      permissions = {}
    }: StaffInvitationData = req.body;

    const adminUser = req.user;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists in staff table
    const { data: existingStaff, error: staffCheckError } = await supabase
      .from('staff')
      .select('id')
      .eq('email', email)
      .single();

    if (staffCheckError && staffCheckError.code !== 'PGRST116') {
      console.error('Error checking existing staff:', staffCheckError);
      return res.status(500).json({ error: 'Failed to check existing staff' });
    }

    if (existingStaff) {
      return res.status(409).json({ error: 'A staff member with this email already exists' });
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation, error: inviteCheckError } = await supabase
      .from('staff_invitations')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (inviteCheckError && inviteCheckError.code !== 'PGRST116') {
      console.error('Error checking existing invitation:', inviteCheckError);
      return res.status(500).json({ error: 'Failed to check existing invitations' });
    }

    if (existingInvitation) {
      return res.status(409).json({ error: 'A pending invitation already exists for this email' });
    }

    // Generate secure invitation token
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation record
    const { data: invitation, error: createError } = await supabase
      .from('staff_invitations')
      .insert({
        email,
        first_name,
        last_name,
        invitation_token: invitationToken,
        invited_by: adminUser?.id,
        expires_at: expiresAt.toISOString(),
        department,
        role_level,
        employment_type,
        message,
        permissions: permissions,
        status: 'pending'
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating invitation:', createError);
      return res.status(500).json({ error: 'Failed to create invitation' });
    }

    // Send invitation email
    try {
      const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/staff/accept-invitation?token=${invitationToken}`;

      const emailResult = await emailService.sendStaffInvitation({
        email,
        first_name: first_name || 'New Team Member',
        last_name: last_name || '',
        invitationUrl,
        invitedBy: adminUser?.email || 'Admin',
        department: department || 'Staff',
        role_level,
        customMessage: message,
        expiresAt: expiresAt.toLocaleDateString()
      });

      if (!emailResult.success) {
        // If email fails, delete the invitation
        await supabase
          .from('staff_invitations')
          .delete()
          .eq('id', invitation.id);

        return res.status(500).json({ error: 'Failed to send invitation email' });
      }

      res.status(201).json({
        success: true,
        message: 'Staff invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          status: invitation.status,
          expires_at: invitation.expires_at
        }
      });

    } catch (emailError) {
      console.error('Error sending invitation email:', emailError);

      // Delete the invitation if email fails
      await supabase
        .from('staff_invitations')
        .delete()
        .eq('id', invitation.id);

      return res.status(500).json({ error: 'Failed to send invitation email' });
    }

  } catch (error) {
    console.error('Error sending staff invitation:', error);
    res.status(500).json({ error: 'Failed to send staff invitation' });
  }
};

// Get all staff invitations
export const getStaffInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const { data: invitations, error } = await supabase
      .from('staff_invitations')
      .select(`
        id,
        email,
        first_name,
        last_name,
        department,
        role_level,
        employment_type,
        status,
        invited_at,
        expires_at,
        responded_at,
        message,
        invited_by
      `)
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff invitations:', error);
      return res.status(500).json({ error: 'Failed to fetch staff invitations' });
    }

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching staff invitations:', error);
    res.status(500).json({ error: 'Failed to fetch staff invitations' });
  }
};

// Resend staff invitation
export const resendStaffInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminUser = req.user;

    // Get invitation details
    const { data: invitation, error: fetchError } = await supabase
      .from('staff_invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching invitation:', fetchError);
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Can only resend pending invitations' });
    }

    // Generate new token and extend expiry
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Update invitation
    const { error: updateError } = await supabase
      .from('staff_invitations')
      .update({
        invitation_token: newToken,
        expires_at: newExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      return res.status(500).json({ error: 'Failed to update invitation' });
    }

    // Resend email
    try {
      const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:4000'}/staff/accept-invitation?token=${newToken}`;

      const emailResult = await emailService.sendStaffInvitation({
        email: invitation.email,
        first_name: invitation.first_name || 'New Team Member',
        last_name: invitation.last_name || '',
        invitationUrl,
        invitedBy: adminUser?.email || 'Admin',
        department: invitation.department || 'Staff',
        role_level: invitation.role_level,
        customMessage: invitation.message,
        expiresAt: newExpiresAt.toLocaleDateString()
      });

      if (!emailResult.success) {
        return res.status(500).json({ error: 'Failed to resend invitation email' });
      }

      res.json({
        success: true,
        message: 'Invitation resent successfully'
      });

    } catch (emailError) {
      console.error('Error resending invitation email:', emailError);
      return res.status(500).json({ error: 'Failed to resend invitation email' });
    }

  } catch (error) {
    console.error('Error resending staff invitation:', error);
    res.status(500).json({ error: 'Failed to resend staff invitation' });
  }
};

// Cancel staff invitation
export const cancelStaffInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if invitation exists and is pending
    const { data: invitation, error: fetchError } = await supabase
      .from('staff_invitations')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching invitation:', fetchError);
      return res.status(404).json({ error: 'Invitation not found' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Can only cancel pending invitations' });
    }

    // Update status to expired (soft delete)
    const { error: updateError } = await supabase
      .from('staff_invitations')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error canceling invitation:', updateError);
      return res.status(500).json({ error: 'Failed to cancel invitation' });
    }

    res.json({
      success: true,
      message: 'Invitation canceled successfully'
    });

  } catch (error) {
    console.error('Error canceling staff invitation:', error);
    res.status(500).json({ error: 'Failed to cancel staff invitation' });
  }
};

// Accept staff invitation (public endpoint)
export const acceptStaffInvitation = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Find valid invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('staff_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (fetchError) {
      console.error('Error fetching invitation:', fetchError);
      return res.status(404).json({ error: 'Invalid or expired invitation' });
    }

    // Check if invitation has expired
    if (new Date() > new Date(invitation.expires_at)) {
      // Update status to expired
      await supabase
        .from('staff_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return res.status(400).json({ error: 'Invitation has expired' });
    }

    // Hash password
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create staff member
    const { data: newStaff, error: createError } = await supabase
      .from('staff')
      .insert({
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        email: invitation.email,
        password_hash,
        department: invitation.department,
        role_level: invitation.role_level,
        employment_type: invitation.employment_type,
        status: 'active',
        is_verified: true
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating staff member:', createError);
      return res.status(500).json({ error: 'Failed to create staff account' });
    }

    // Set up permissions if specified
    if (invitation.permissions && Object.keys(invitation.permissions).length > 0) {
      const permissionInserts = Object.entries(invitation.permissions)
        .filter(([_, granted]) => granted)
        .map(([capability_id]) => ({
          staff_id: newStaff.id,
          capability_id,
          granted: true,
          granted_by: invitation.invited_by
        }));

      if (permissionInserts.length > 0) {
        const { error: permissionError } = await supabase
          .from('staff_permissions')
          .insert(permissionInserts);

        if (permissionError) {
          console.error('Error setting staff permissions:', permissionError);
          // Don't fail the whole process for permission errors
        }
      }
    }

    // Mark invitation as accepted
    const { error: updateError } = await supabase
      .from('staff_invitations')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString()
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation status:', updateError);
      // Don't fail since staff was created successfully
    }

    res.status(201).json({
      success: true,
      message: 'Staff account created successfully',
      staff: {
        id: newStaff.id,
        email: newStaff.email,
        first_name: newStaff.first_name,
        last_name: newStaff.last_name,
        role_level: newStaff.role_level
      }
    });

  } catch (error) {
    console.error('Error accepting staff invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
};

// Get invitation details for acceptance page
export const getInvitationDetails = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const { data: invitation, error } = await supabase
      .from('staff_invitations')
      .select(`
        email,
        first_name,
        last_name,
        department,
        role_level,
        employment_type,
        message,
        expires_at,
        status
      `)
      .eq('invitation_token', token)
      .single();

    if (error) {
      console.error('Error fetching invitation details:', error);
      return res.status(404).json({ error: 'Invalid invitation' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: 'Invitation is no longer valid' });
    }

    if (new Date() > new Date(invitation.expires_at)) {
      return res.status(400).json({ error: 'Invitation has expired' });
    }

    res.json({
      success: true,
      invitation: {
        email: invitation.email,
        first_name: invitation.first_name,
        last_name: invitation.last_name,
        department: invitation.department,
        role_level: invitation.role_level,
        employment_type: invitation.employment_type,
        message: invitation.message,
        expires_at: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Error getting invitation details:', error);
    res.status(500).json({ error: 'Failed to get invitation details' });
  }
};