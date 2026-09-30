import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0d1117] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }[size];

  const variantClasses = {
    primary:
      'bg-[#238636] hover:bg-[#2ea043] text-white focus:ring-[#2ea043] shadow-sm shadow-[#238636]/20 border border-[#2ea043]/30',
    secondary:
      'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] focus:ring-[#58a6ff]',
    outline:
      'bg-transparent hover:bg-[#21262d] text-[#58a6ff] border border-[#30363d] hover:border-[#58a6ff]/50 focus:ring-[#58a6ff]',
    danger:
      'bg-[#da3633] hover:bg-[#f85149] text-white focus:ring-[#f85149] shadow-sm shadow-[#da3633]/20 border border-[#f85149]/30',
    success:
      'bg-[#238636] hover:bg-[#2ea043] text-white focus:ring-[#2ea043] border border-[#2ea043]/30',
    ghost:
      'bg-transparent hover:bg-[#21262d] text-[#8b949e] hover:text-[#c9d1d9] focus:ring-[#58a6ff]',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
