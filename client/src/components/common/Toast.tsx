import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
}) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#3fb950]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#d29922]" />,
    error: <XCircle className="w-5 h-5 text-[#f85149]" />,
    info: <Info className="w-5 h-5 text-[#58a6ff]" />,
  };

  const borders = {
    success: 'border-[#238636]/50 bg-[#161b22]',
    warning: 'border-[#d29922]/50 bg-[#161b22]',
    error: 'border-[#da3633]/50 bg-[#161b22]',
    info: 'border-[#58a6ff]/50 bg-[#161b22]',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-xl max-w-md w-full animate-in slide-in-from-top-2 duration-200 ${borders[type]}`}
    >
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-[#c9d1d9]">{title}</h4>
        {message && <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-[#8b949e] hover:text-[#c9d1d9] p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
