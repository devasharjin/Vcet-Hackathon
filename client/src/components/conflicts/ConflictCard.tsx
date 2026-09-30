import React from 'react';
import { FileCode, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { ConflictItem } from '../../types/conflict.js';
import { CONFLICT_TYPE_LABELS } from '../../utils/constants.js';

export interface ConflictCardProps {
  conflict: ConflictItem;
  isSelected: boolean;
  onSelect: () => void;
}

export const ConflictCard: React.FC<ConflictCardProps> = ({
  conflict,
  isSelected,
  onSelect,
}) => {
  const badgeConfig =
    CONFLICT_TYPE_LABELS[conflict.conflictType] || CONFLICT_TYPE_LABELS.UNKNOWN;

  const statusIcons = {
    APPROVED: <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950]" />,
    APPLIED: <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950]" />,
    PENDING: <Clock className="w-3.5 h-3.5 text-[#d29922]" />,
    REJECTED: <XCircle className="w-3.5 h-3.5 text-[#f85149]" />,
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all select-none ${
        isSelected
          ? 'bg-[#21262d] border-[#58a6ff] shadow-sm ring-1 ring-[#58a6ff]'
          : 'bg-[#161b22] border-[#30363d] hover:border-[#444c56] hover:bg-[#1c2128]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 truncate">
          <FileCode className="w-4 h-4 text-[#58a6ff] shrink-0" />
          <span className="text-xs font-mono font-medium text-[#c9d1d9] truncate">
            {conflict.filePath}
          </span>
        </div>
        <div className="shrink-0">{statusIcons[conflict.status]}</div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-[#8b949e]">
        <span className={`px-1.5 py-0.2 rounded border text-[10px] ${badgeConfig.color}`}>
          {badgeConfig.label}
        </span>
        <span
          className={
            conflict.confidence >= 90
              ? 'text-[#3fb950]'
              : conflict.confidence >= 70
              ? 'text-[#d29922]'
              : 'text-[#f85149]'
          }
        >
          {conflict.confidence}% conf
        </span>
      </div>
    </button>
  );
};
