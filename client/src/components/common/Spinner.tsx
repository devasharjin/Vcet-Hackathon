import React from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }[size];

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-[#58a6ff] border-t-transparent ${sizeClasses} ${className}`}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
