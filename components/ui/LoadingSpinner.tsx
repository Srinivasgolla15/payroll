import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
  };

  return (
    <div className={`inline-block ${className}`} role="status">
      <div
        className={`${sizeClasses[size]} border-current border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export const LoadingDots: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center justify-center gap-1 ${className}`}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full bg-current opacity-0"
        style={{
          animation: 'pulse 1.5s infinite ease-in-out',
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
);

export const LoadingShimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`relative overflow-hidden ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-shimmer" />
  </div>
);

export const LoadingOverlay: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="text-center">
      <LoadingSpinner size="lg" className="mb-4" />
      {message && <p className="text-gray-600 mt-2">{message}</p>}
    </div>
  </div>
);
