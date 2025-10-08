'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Check, AlertTriangle, Users, FileCheck } from 'lucide-react';
import NotificationModal from '@/components/NotificationModal';
import useNotification from '@/hooks/useNotification';
import { cn } from '@/lib/utils';

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
  const [isVisible, setIsVisible] = useState(false);
  const { notification, hideNotification, showError } = useNotification();
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  const selectedApps = applications.filter(app => selectedApplications.includes(app.id));
  const pendingApps = selectedApps.filter(app => app.status === 'pending');

  // Handle modal animations and focus management
  useEffect(() => {
    // Store the currently focused element
    lastActiveElement.current = document.activeElement as HTMLElement;
    
    // Show modal with animation
    setIsVisible(true);
    
    // Focus management after animation completes
    setTimeout(() => {
      firstButtonRef.current?.focus();
    }, 150);
    
    // Disable body scroll
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
      // Restore focus to the previously focused element
      if (lastActiveElement.current) {
        lastActiveElement.current.focus();
      }
    };
  }, []);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      } else if (event.key === 'Tab') {
        // Focus trapping
        event.preventDefault();
        const focusableElements = modalRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          
          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
            }
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  const handleAction = async () => {
    if (!action) return;
    
    if (action === 'reject' && !reason.trim()) {
      showError('Validation Error', 'Please provide a reason for rejection');
      return;
    }

    await onBulkAction(action, reason || undefined);
    handleClose();
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
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
        isVisible ? "bg-black/60 backdrop-blur-sm" : "bg-transparent"
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-actions-title"
      aria-describedby="bulk-actions-description"
    >
      <Card 
        ref={modalRef}
        className={cn(
          "w-full max-w-2xl shadow-2xl border-0 transition-all duration-200 transform bg-white dark:bg-gray-900",
          isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle id="bulk-actions-title" className="text-xl font-semibold text-gray-900 dark:text-white">
                  Bulk Actions
                </CardTitle>
                <CardDescription id="bulk-actions-description" className="text-gray-600 dark:text-gray-400">
                  Perform actions on {selectedApplications.length} selected application{selectedApplications.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={handleClose} 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Selected Applications Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2 mb-3">
              <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h4 className="font-medium text-gray-900 dark:text-white">Selected Applications</h4>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                {selectedApplications.length} total
              </span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
              {selectedApps.map((app) => (
                <div key={app.id} className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                    {app.first_name} {app.last_name}
                  </span>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    app.status === 'pending' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
                    app.status === 'approved' && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
                    app.status === 'rejected' && 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
                    app.status === 'under_review' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
                    !['pending', 'approved', 'rejected', 'under_review'].includes(app.status) && 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                  )}>
                    {app.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning for non-pending applications */}
          {pendingApps.length !== selectedApps.length && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-l-4 border-amber-400 dark:border-amber-600 rounded-r-lg p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Status Warning</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                    {selectedApps.length - pendingApps.length} of the selected applications are not in pending status.
                    Only <span className="font-medium">{pendingApps.length} pending applications</span> will be affected by bulk actions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Selection */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Select Action
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                ref={firstButtonRef}
                variant={action === 'approve' ? 'default' : 'outline'}
                onClick={() => setAction('approve')}
                className={cn(
                  "h-12 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2",
                  action === 'approve' 
                    ? "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white focus:ring-green-500" 
                    : "hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700"
                )}
                disabled={pendingApps.length === 0}
              >
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "p-1 rounded-full",
                    action === 'approve' ? "bg-white/20" : "bg-green-100 dark:bg-green-900/30"
                  )}>
                    {getActionIcon('approve')}
                  </div>
                  <span className="font-medium">Approve</span>
                </div>
              </Button>
              
              <Button
                variant={action === 'under_review' ? 'default' : 'outline'}
                onClick={() => setAction('under_review')}
                className={cn(
                  "h-12 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2",
                  action === 'under_review' 
                    ? "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white focus:ring-blue-500" 
                    : "hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700"
                )}
                disabled={pendingApps.length === 0}
              >
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "p-1 rounded-full",
                    action === 'under_review' ? "bg-white/20" : "bg-blue-100 dark:bg-blue-900/30"
                  )}>
                    {getActionIcon('under_review')}
                  </div>
                  <span className="font-medium">Under Review</span>
                </div>
              </Button>
              
              <Button
                variant={action === 'reject' ? 'default' : 'outline'}
                onClick={() => setAction('reject')}
                className={cn(
                  "h-12 transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2",
                  action === 'reject' 
                    ? "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white focus:ring-red-500" 
                    : "hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700"
                )}
                disabled={pendingApps.length === 0}
              >
                <div className="flex items-center space-x-2">
                  <div className={cn(
                    "p-1 rounded-full",
                    action === 'reject' ? "bg-white/20" : "bg-red-100 dark:bg-red-900/30"
                  )}>
                    {getActionIcon('reject')}
                  </div>
                  <span className="font-medium">Reject</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Reason Input for Rejection */}
          {action === 'reject' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-in slide-in-from-top duration-300">
              <label className="block text-sm font-semibold text-red-800 dark:text-red-300 mb-3 items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Reason for Rejection *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-red-300 dark:border-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                rows={4}
                placeholder="Provide a detailed reason for rejection that will be sent to applicants. Be specific about what requirements were not met..."
              />
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                This message will be included in the rejection email sent to applicants.
              </p>
            </div>
          )}

          {/* Action Summary */}
          {action && (
            <div className={cn(
              "border rounded-lg p-4 animate-in slide-in-from-top duration-300",
              action === 'approve' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
              action === 'reject' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
              action === 'under_review' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            )}>
              <div className="flex items-center space-x-2 mb-3">
                <div className={cn(
                  "p-1.5 rounded-full",
                  action === 'approve' && "bg-green-100 dark:bg-green-900/30",
                  action === 'reject' && "bg-red-100 dark:bg-red-900/30",
                  action === 'under_review' && "bg-blue-100 dark:bg-blue-900/30"
                )}>
                  {getActionIcon(action)}
                </div>
                <h4 className={cn(
                  "font-semibold",
                  action === 'approve' && "text-green-800 dark:text-green-300",
                  action === 'reject' && "text-red-800 dark:text-red-300",
                  action === 'under_review' && "text-blue-800 dark:text-blue-300"
                )}>Action Summary</h4>
              </div>
              <div className={cn(
                "text-sm leading-relaxed",
                action === 'approve' && "text-green-700 dark:text-green-400",
                action === 'reject' && "text-red-700 dark:text-red-400",
                action === 'under_review' && "text-blue-700 dark:text-blue-400"
              )}>
                {action === 'approve' && (
                  <>
                    <p className="font-medium mb-1">✅ {pendingApps.length} application(s) will be approved</p>
                    <p className="text-xs opacity-80">Coaches will receive welcome emails with login credentials and platform access.</p>
                  </>
                )}
                {action === 'reject' && (
                  <>
                    <p className="font-medium mb-1">❌ {pendingApps.length} application(s) will be rejected</p>
                    <p className="text-xs opacity-80">Applicants will receive notification emails with the provided reason.</p>
                  </>
                )}
                {action === 'under_review' && (
                  <>
                    <p className="font-medium mb-1">🔍 {pendingApps.length} application(s) will be marked under review</p>
                    <p className="text-xs opacity-80">Applications will be flagged for additional evaluation and follow-up.</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              onClick={handleClose} 
              variant="outline" 
              disabled={loading}
              className="transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleAction}
              disabled={!action || loading || (action === 'reject' && !reason.trim()) || pendingApps.length === 0}
              className={cn(
                "transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2 min-w-[200px]",
                action === 'approve' && "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white focus:ring-green-500",
                action === 'reject' && "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white focus:ring-red-500",
                action === 'under_review' && "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white focus:ring-blue-500",
                !action && "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              )}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                `${action ? action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ') : 'Select Action'} ${pendingApps.length} Application${pendingApps.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={hideNotification}
        onConfirm={notification.onConfirm}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        confirmText={notification.confirmText}
        cancelText={notification.cancelText}
        loading={notification.loading}
      />
    </div>
  );
}