'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  type: NotificationType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const NotificationModal = ({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  loading = false
}: NotificationModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  // Handle modal open/close animations and focus management
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      lastActiveElement.current = document.activeElement as HTMLElement;
      
      // Show modal with animation
      setIsVisible(true);
      
      // Focus management after animation completes
      setTimeout(() => {
        if (type === 'confirm') {
          confirmButtonRef.current?.focus();
        } else {
          closeButtonRef.current?.focus();
        }
      }, 150);
      
      // Disable body scroll
      document.body.style.overflow = 'hidden';
      
      // Auto close for non-confirm modals
      if (type !== 'confirm') {
        const timer = setTimeout(() => {
          handleClose();
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      // Hide modal with animation
      setIsVisible(false);
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to the previously focused element
      setTimeout(() => {
        if (lastActiveElement.current) {
          lastActiveElement.current.focus();
        }
      }, 150);
    }
  }, [isOpen, type]);

  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        if (type !== 'confirm') {
          handleClose();
        }
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
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, type]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 150);
  };

  const handleConfirm = async () => {
    if (!onConfirm) return;
    
    setIsProcessing(true);
    try {
      await onConfirm();
      handleClose();
    } catch (error) {
      console.error('Error in confirmation action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && type !== 'confirm') {
      handleClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />;
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      default:
        return <Info className="w-6 h-6 text-gray-600" />;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'success':
        return {
          border: 'border-green-200 dark:border-green-800',
          background: 'bg-green-50 dark:bg-green-900/20',
          accent: 'bg-green-100 dark:bg-green-800/30'
        };
      case 'error':
        return {
          border: 'border-red-200 dark:border-red-800',
          background: 'bg-red-50 dark:bg-red-900/20',
          accent: 'bg-red-100 dark:bg-red-800/30'
        };
      case 'warning':
        return {
          border: 'border-yellow-200 dark:border-yellow-800',
          background: 'bg-yellow-50 dark:bg-yellow-900/20',
          accent: 'bg-yellow-100 dark:bg-yellow-800/30'
        };
      case 'info':
        return {
          border: 'border-blue-200 dark:border-blue-800',
          background: 'bg-blue-50 dark:bg-blue-900/20',
          accent: 'bg-blue-100 dark:bg-blue-800/30'
        };
      case 'confirm':
        return {
          border: 'border-orange-200 dark:border-orange-800',
          background: 'bg-orange-50 dark:bg-orange-900/20',
          accent: 'bg-orange-100 dark:bg-orange-800/30'
        };
      default:
        return {
          border: 'border-gray-200 dark:border-gray-700',
          background: 'bg-gray-50 dark:bg-gray-900/20',
          accent: 'bg-gray-100 dark:bg-gray-800/30'
        };
    }
  };

  if (!isOpen) return null;

  const colorClasses = getColorClasses();

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
        isVisible ? "bg-black/60 backdrop-blur-sm" : "bg-transparent"
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Card 
        ref={modalRef}
        className={cn(
          "w-full max-w-md border-2 shadow-2xl transition-all duration-200 transform",
          colorClasses.border,
          colorClasses.background,
          isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-full",
                colorClasses.accent
              )}>
                {getIcon()}
              </div>
              <div>
                <CardTitle id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </CardTitle>
              </div>
            </div>
            {type !== 'confirm' && (
              <Button 
                ref={closeButtonRef}
                onClick={handleClose} 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <CardDescription 
            id="modal-description" 
            className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed"
          >
            {message}
          </CardDescription>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {type === 'confirm' ? (
              <>
                <Button 
                  onClick={handleClose} 
                  variant="outline" 
                  disabled={isProcessing || loading}
                  className="transition-all duration-200 hover:scale-105"
                >
                  {cancelText}
                </Button>
                <Button
                  ref={confirmButtonRef}
                  onClick={handleConfirm}
                  disabled={isProcessing || loading}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {isProcessing || loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </Button>
              </>
            ) : (
              <Button 
                ref={closeButtonRef}
                onClick={handleClose}
                variant="default"
                className="transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-offset-2"
              >
                {confirmText}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationModal;