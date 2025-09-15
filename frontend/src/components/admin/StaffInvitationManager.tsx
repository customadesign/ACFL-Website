'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  User,
  Calendar,
  Building2
} from 'lucide-react';
import { getApiUrl } from '@/lib/api';

interface StaffInvitation {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  role_level: string;
  employment_type: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  invited_at: string;
  expires_at: string;
  responded_at?: string;
  message?: string;
  invited_by: string;
}

interface StaffInvitationManagerProps {
  onError: (title: string, message: string) => void;
  onSuccess: (title: string, message: string) => void;
  onWarning: (title: string, message: string, onConfirm?: () => void, onCancel?: () => void) => void;
}

export default function StaffInvitationManager({
  onError,
  onSuccess,
  onWarning
}: StaffInvitationManagerProps) {
  const [invitations, setInvitations] = useState<StaffInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/staff/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch staff invitations:', error);
      onError('Failed to Load Invitations', 'Unable to fetch staff invitations. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const resendInvitation = async (invitationId: string) => {
    if (processingIds.has(invitationId)) return;

    setProcessingIds(prev => new Set(prev).add(invitationId));

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/staff/invitations/${invitationId}/resend`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation');
      }

      onSuccess('Invitation Resent', 'Invitation resent successfully');
      fetchInvitations(); // Refresh the list

    } catch (error) {
      console.error('Failed to resend invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      onError('Resend Failed', `Failed to resend invitation: ${errorMessage}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (processingIds.has(invitationId)) return;

    setProcessingIds(prev => new Set(prev).add(invitationId));

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/admin/staff/invitations/${invitationId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cancel invitation');
      }

      onSuccess('Invitation Canceled', 'Invitation canceled successfully');
      fetchInvitations(); // Refresh the list

    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Please try again.';
      onError('Cancel Failed', `Failed to cancel invitation: ${errorMessage}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Expired' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt);
  };

  const filteredInvitations = invitations.filter(invitation => {
    if (statusFilter === 'all') return true;
    return invitation.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Staff Invitations ({invitations.length})
        </h3>
        <button
          onClick={fetchInvitations}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Filter */}
      <div className="flex space-x-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Invitations List */}
      {filteredInvitations.length > 0 ? (
        <div className="space-y-4">
          {filteredInvitations.map((invitation) => (
            <div
              key={invitation.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {invitation.first_name && invitation.last_name
                          ? `${invitation.first_name} ${invitation.last_name}`
                          : 'Unnamed Invitee'}
                      </h4>
                      {getStatusBadge(invitation.status)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Mail className="h-4 w-4 mr-2" />
                        {invitation.email}
                      </div>

                      {invitation.department && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <Building2 className="h-4 w-4 mr-2" />
                          {invitation.department} • {invitation.role_level.charAt(0).toUpperCase() + invitation.role_level.slice(1)}
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        Invited: {new Date(invitation.invited_at).toLocaleDateString()}
                        {invitation.status === 'pending' && (
                          <>
                            {' • '}
                            <span className={isExpired(invitation.expires_at) ? 'text-red-600' : ''}>
                              Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                              {isExpired(invitation.expires_at) && ' (Expired)'}
                            </span>
                          </>
                        )}
                      </div>

                      {invitation.responded_at && (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Responded: {new Date(invitation.responded_at).toLocaleDateString()}
                        </div>
                      )}

                      {invitation.message && (
                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                          "{invitation.message}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {invitation.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        onWarning(
                          'Resend Invitation',
                          `Are you sure you want to resend the invitation to ${invitation.email}? This will generate a new invitation link and extend the expiry date.`,
                          () => resendInvitation(invitation.id)
                        );
                      }}
                      disabled={processingIds.has(invitation.id)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Resend invitation"
                    >
                      {processingIds.has(invitation.id) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        onWarning(
                          'Cancel Invitation',
                          `Are you sure you want to cancel the invitation for ${invitation.email}? This action cannot be undone.`,
                          () => cancelInvitation(invitation.id)
                        );
                      }}
                      disabled={processingIds.has(invitation.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancel invitation"
                    >
                      {processingIds.has(invitation.id) ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {statusFilter === 'all' ? (
            <>
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No staff invitations found.</p>
            </>
          ) : (
            <>
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No {statusFilter} invitations found.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}