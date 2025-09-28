'use client';

// Status Badge Component - for showing status with colors
interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'info' | 'error' | 'default';
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  // Auto-detect variant based on common status values if not provided
  const getVariant = () => {
    if (variant) return variant;
    
    const statusLower = status.toLowerCase();
    if (['approved', 'active', 'completed', 'success'].includes(statusLower)) return 'success';
    if (['pending', 'draft', 'warning'].includes(statusLower)) return 'warning';
    if (['in review', 'processing', 'info'].includes(statusLower)) return 'info';
    if (['rejected', 'error', 'failed', 'cancelled'].includes(statusLower)) return 'error';
    return 'default';
  };

  const variantStyles = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${variantStyles[getVariant()]}`}>
      {status}
    </span>
  );
}

// Avatar Component - for user profiles in tables
interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'sm' }: AvatarProps) {
  const sizeStyles = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeStyles[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeStyles[size]} rounded-full bg-teal-500 flex items-center justify-center text-white font-medium`}>
      {initials}
    </div>
  );
}

// Priority Badge - for showing priority levels
interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const styles = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

// Date Format Helper - for consistent date display
export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'relative') {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return dateObj.toLocaleDateString();
  }
  
  if (format === 'long') {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Time Format Helper - for consistent time display
export function formatTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Phone Number Format Helper - for consistent phone display
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original if not standard format
  return phone;
}

// Action Button Component
interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
}

export function ActionButton({ children, onClick, variant = 'secondary', size = 'sm' }: ActionButtonProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-teal-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm'
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </button>
  );
}