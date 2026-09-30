import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
  }[size];

  const variantClasses = {
    default: 'bg-[#21262d] text-[#c9d1d9] border border-[#30363d]',
    success: 'bg-[#238636]/15 text-[#3fb950] border border-[#238636]/40',
    warning: 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/40',
    danger: 'bg-[#f85149]/15 text-[#f85149] border border-[#f85149]/40',
    info: 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/40',
    purple: 'bg-[#a371f7]/15 text-[#a371f7] border border-[#a371f7]/40',
    outline: 'bg-transparent text-[#8b949e] border border-[#30363d]',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono tracking-tight select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
