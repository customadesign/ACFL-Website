import { supabase } from '../lib/supabase';
import { Request } from 'express';

export interface AuditLogEntry {
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: string;
  metadata?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
}

export interface AuditRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'staff' | 'coach' | 'client';
    first_name?: string;
    last_name?: string;
  };
}

class AuditLogger {
  private getIpAddress(req: AuditRequest): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.connection?.remoteAddress || req.ip || 'unknown';
  }

  private getUserAgent(req: AuditRequest): string {
    return req.headers['user-agent'] || 'unknown';
  }

  async logAdminAction(req: AuditRequest, entry: AuditLogEntry): Promise<void> {
    if (!req.user || req.user.role !== 'admin') {
      console.error('Cannot log admin action - user is not admin');
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: req.user.id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: entry.details,
          metadata: entry.metadata || {},
          ip_address: this.getIpAddress(req),
          user_agent: this.getUserAgent(req)
        });

      if (error) {
        console.error('Failed to log admin action:', error);
      } else {
        console.log(`Admin action logged: ${entry.action}`);
      }
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  async logStaffAction(req: AuditRequest, entry: AuditLogEntry): Promise<void> {
    if (!req.user || req.user.role !== 'staff') {
      console.error('Cannot log staff action - user is not staff');
      return;
    }

    try {
      const { error } = await supabase
        .from('staff_audit_log')
        .insert({
          staff_id: req.user.id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: entry.details,
          metadata: entry.metadata || {},
          ip_address: this.getIpAddress(req),
          user_agent: this.getUserAgent(req)
        });

      if (error) {
        console.error('Failed to log staff action:', error);
      } else {
        console.log(`Staff action logged: ${entry.action}`);
      }
    } catch (error) {
      console.error('Error logging staff action:', error);
    }
  }

  async logClientAction(req: AuditRequest, entry: AuditLogEntry): Promise<void> {
    if (!req.user || req.user.role !== 'client') {
      console.error('Cannot log client action - user is not client');
      return;
    }

    try {
      const { error } = await supabase
        .from('client_audit_log')
        .insert({
          client_id: req.user.id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: entry.details,
          metadata: entry.metadata || {},
          ip_address: this.getIpAddress(req),
          user_agent: this.getUserAgent(req)
        });

      if (error) {
        console.error('Failed to log client action:', error);
      } else {
        console.log(`Client action logged: ${entry.action}`);
      }
    } catch (error) {
      console.error('Error logging client action:', error);
    }
  }

  async logCoachAction(req: AuditRequest, entry: AuditLogEntry): Promise<void> {
    if (!req.user || req.user.role !== 'coach') {
      console.error('Cannot log coach action - user is not coach');
      return;
    }

    try {
      const { error } = await supabase
        .from('coach_audit_log')
        .insert({
          coach_id: req.user.id,
          action: entry.action,
          resource_type: entry.resource_type,
          resource_id: entry.resource_id,
          details: entry.details,
          metadata: entry.metadata || {},
          ip_address: this.getIpAddress(req),
          user_agent: this.getUserAgent(req)
        });

      if (error) {
        console.error('Failed to log coach action:', error);
      } else {
        console.log(`Coach action logged: ${entry.action}`);
      }
    } catch (error) {
      console.error('Error logging coach action:', error);
    }
  }

  async logSessionAction(
    req: AuditRequest,
    sessionId: string,
    entry: AuditLogEntry & { old_values?: any; new_values?: any }
  ): Promise<void> {
    if (!req.user) {
      console.error('Cannot log session action - no user');
      return;
    }

    try {
      const { error } = await supabase
        .from('session_audit_log')
        .insert({
          session_id: sessionId,
          user_id: req.user.id,
          user_type: req.user.role,
          action: entry.action,
          old_values: entry.old_values,
          new_values: entry.new_values,
          details: entry.details,
          metadata: entry.metadata || {},
          ip_address: this.getIpAddress(req),
          user_agent: this.getUserAgent(req)
        });

      if (error) {
        console.error('Failed to log session action:', error);
      } else {
        console.log(`Session action logged: ${entry.action}`);
      }
    } catch (error) {
      console.error('Error logging session action:', error);
    }
  }

  async logAction(req: AuditRequest, entry: AuditLogEntry): Promise<void> {
    if (!req.user) {
      console.error('Cannot log action - no user in request');
      return;
    }

    switch (req.user.role) {
      case 'admin':
        await this.logAdminAction(req, entry);
        break;
      case 'staff':
        await this.logStaffAction(req, entry);
        break;
      case 'client':
        await this.logClientAction(req, entry);
        break;
      case 'coach':
        await this.logCoachAction(req, entry);
        break;
      default:
        console.error(`Unknown user role: ${req.user.role}`);
    }
  }

  async logLogin(req: AuditRequest, email: string, role: string, success: boolean): Promise<void> {
    const action = success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
    const details = success ? `${role} logged in successfully` : `Failed login attempt for ${role}`;

    // For successful logins, we have user info
    if (success && req.user) {
      await this.logAction(req, {
        action,
        resource_type: 'authentication',
        details,
        metadata: { email, role }
      });
    } else {
      // For failed logins, log directly without user context
      try {
        // Log to appropriate table based on role attempt
        const table = role === 'admin' ? 'admin_audit_log' :
                     role === 'staff' ? 'staff_audit_log' :
                     role === 'client' ? 'client_audit_log' :
                     role === 'coach' ? 'coach_audit_log' : null;

        if (table) {
          await supabase
            .from(table)
            .insert({
              action,
              resource_type: 'authentication',
              details,
              metadata: { email, role, failed: true },
              ip_address: this.getIpAddress(req),
              user_agent: this.getUserAgent(req)
            });
        }
      } catch (error) {
        console.error('Error logging failed login:', error);
      }
    }
  }
}

export const auditLogger = new AuditLogger();