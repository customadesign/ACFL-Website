'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Check, AlertTriangle } from 'lucide-react';

interface BulkActionsModalProps {
  selectedApplications: string[];
  applications: any[];
  onClose: () => void;
  onBulkAction: (action: string, reason?: string) => Promise<void>;
  loading: boolean;
}

export default function BulkActionsModal({
  selectedApplications,
  applications,
  onClose,
  onBulkAction,
  loading
}: BulkActionsModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'under_review' | null>(null);
  const [reason, setReason] = useState('');

  const selectedApps = applications.filter(app => selectedApplications.includes(app.id));
  const pendingApps = selectedApps.filter(app => app.status === 'pending');

  const handleAction = async () => {
    if (!action) return;
    
    if (action === 'reject' && !reason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    await onBulkAction(action, reason || undefined);
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'approve': return 'bg-green-600 hover:bg-green-700';
      case 'reject': return 'bg-red-600 hover:bg-red-700';
      case 'under_review': return 'bg-blue-600 hover:bg-blue-700';
      default: return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'approve': return <Check className="w-4 h-4" />;
      case 'reject': return <X className="w-4 h-4" />;
      case 'under_review': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Bulk Actions</CardTitle>
              <CardDescription>
                Perform actions on {selectedApplications.length} selected application{selectedApplications.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Selected Applications Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Selected Applications:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {selectedApps.map((app) => (
                <div key={app.id} className="flex justify-between items-center text-sm">
                  <span>{app.first_name} {app.last_name}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    app.status === 'approved' ? 'bg-green-100 text-green-800' :
                    app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning for non-pending applications */}
          {pendingApps.length !== selectedApps.length && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Warning</p>
                  <p className="text-sm text-yellow-700">
                    {selectedApps.length - pendingApps.length} of the selected applications are not in pending status.
                    Only pending applications will be affected by bulk actions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Selection */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">Select Action:</h4>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant={action === 'approve' ? 'default' : 'outline'}
                onClick={() => setAction('approve')}
                className={action === 'approve' ? getActionColor('approve') : ''}
                disabled={pendingApps.length === 0}
              >
                {getActionIcon('approve')}
                <span className="ml-2">Approve</span>
              </Button>
              
              <Button
                variant={action === 'under_review' ? 'default' : 'outline'}
                onClick={() => setAction('under_review')}
                className={action === 'under_review' ? getActionColor('under_review') : ''}
                disabled={pendingApps.length === 0}
              >
                {getActionIcon('under_review')}
                <span className="ml-2">Under Review</span>
              </Button>
              
              <Button
                variant={action === 'reject' ? 'default' : 'outline'}
                onClick={() => setAction('reject')}
                className={action === 'reject' ? getActionColor('reject') : ''}
                disabled={pendingApps.length === 0}
              >
                {getActionIcon('reject')}
                <span className="ml-2">Reject</span>
              </Button>
            </div>
          </div>

          {/* Reason Input for Rejection */}
          {action === 'reject' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Provide a detailed reason for rejection that will be sent to applicants..."
              />
            </div>
          )}

          {/* Action Summary */}
          {action && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2">Action Summary:</h4>
              <p className="text-sm text-blue-700">
                {action === 'approve' && `${pendingApps.length} application(s) will be approved and coaches will receive welcome emails with login credentials.`}
                {action === 'reject' && `${pendingApps.length} application(s) will be rejected and applicants will receive notification emails with the provided reason.`}
                {action === 'under_review' && `${pendingApps.length} application(s) will be marked as under review for further evaluation.`}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button onClick={onClose} variant="outline" disabled={loading}>
              Cancel
            </Button>
            
            <Button
              onClick={handleAction}
              disabled={!action || loading || (action === 'reject' && !reason.trim()) || pendingApps.length === 0}
              className={action ? getActionColor(action) : ''}
            >
              {loading ? 'Processing...' : `${action ? action.charAt(0).toUpperCase() + action.slice(1) : 'Select Action'} ${pendingApps.length} Application${pendingApps.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}