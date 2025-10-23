'use client';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  showZero?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'red' | 'blue' | 'green' | 'orange';
  showDot?: boolean; // Show just a dot for presence indication
  className?: string;
}

export default function NotificationBadge({
  count,
  maxCount = 99,
  showZero = false,
  size = 'md',
  variant = 'red',
  showDot = false,
  className = ''
}: NotificationBadgeProps) {
  // Don't show badge if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  // Format count according to UX standards
  const formatCount = (num: number): string => {
    if (num === 0) return '0';
    
    // UX Standard: Show exact count up to 9, then use abbreviated format
    if (num <= 9) return num.toString();
    
    // For 10-99, show exact count
    if (num <= 99) return num.toString();
    
    // For 100-999, show as "99+"
    if (num <= 999) return '99+';
    
    // For 1000+, show as "999+" (extremely rare case)
    return '999+';
  };

  // Determine if we should show a dot instead of number for very small counts
  const shouldShowDot = count > 0 && count <= 0; // This logic can be customized

  // Size configurations - optimized for readability
  const getSizeClasses = () => {
    if (showDot) {
      return {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3'
      };
    }
    
    return {
      sm: count > 99 ? 'h-4 px-1.5 text-[10px] min-w-[20px]' : 'w-4 h-4 text-[10px] min-w-[16px]',
      md: count > 99 ? 'h-5 px-2 text-xs min-w-[24px]' : 'w-5 h-5 text-xs min-w-[20px]',
      lg: count > 99 ? 'h-6 px-2.5 text-sm min-w-[28px]' : 'w-6 h-6 text-sm min-w-[24px]'
    };
  };
  
  const sizeClasses = getSizeClasses();

  // Color variants with better contrast and accessibility
  const variantClasses = {
    red: 'bg-red-500 hover:bg-red-600 text-white',
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-500 hover:bg-green-600 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white'
  };

  // Position classes for proper alignment
  const positionClasses = 'absolute -top-1 -right-1 transform translate-x-1/2 -translate-y-1/2';

  const formattedCount = formatCount(count);
  
  // Generate proper accessibility label
  const getAccessibilityLabel = (): string => {
    if (count === 0) return 'No unread notifications';
    if (count === 1) return '1 unread notification';
    if (count <= 99) return `${count} unread notifications`;
    if (formattedCount.includes('+')) return `More than ${formattedCount.replace('+', '')} unread notifications`;
    return `${formattedCount} unread notifications`;
  };

  return (
    <span
      className={`
        ${positionClasses}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        inline-flex items-center justify-center
        rounded-full font-bold leading-none
        border-2 border-white dark:border-gray-800
        shadow-sm transition-colors duration-200
        ${className}
      `}
      aria-label={getAccessibilityLabel()}
      aria-live="polite"
      role="status"
      title={getAccessibilityLabel()}
    >
      {!showDot && (
        <span aria-hidden="true">
          {formattedCount}
        </span>
      )}
    </span>
  );
}