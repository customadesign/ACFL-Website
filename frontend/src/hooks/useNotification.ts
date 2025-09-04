'use client';

import { useState, useCallback } from 'react';
import { NotificationType } from '@/components/NotificationModal';

interface NotificationState {
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showNotification = useCallback((params: Omit<NotificationState, 'isOpen'>) => {
    setNotification({
      ...params,
      isOpen: true,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const showError = useCallback((title: string, message: string) => {
    showNotification({
      type: 'error',
      title,
      message,
      confirmText: 'OK'
    });
  }, [showNotification]);

  const showSuccess = useCallback((title: string, message: string) => {
    showNotification({
      type: 'success',
      title,
      message,
      confirmText: 'OK'
    });
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string) => {
    showNotification({
      type: 'warning',
      title,
      message,
      confirmText: 'OK'
    });
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    showNotification({
      type: 'info',
      title,
      message,
      confirmText: 'OK'
    });
  }, [showNotification]);

  const showConfirm = useCallback((
    title: string, 
    message: string, 
    onConfirm: () => void | Promise<void>,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) => {
    showNotification({
      type: 'confirm',
      title,
      message,
      onConfirm,
      confirmText,
      cancelText
    });
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showConfirm,
  };
};

export default useNotification;