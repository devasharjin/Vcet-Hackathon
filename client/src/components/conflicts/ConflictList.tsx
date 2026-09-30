import React from 'react';
import { FileCode, CheckCircle2 } from 'lucide-react';
import { ConflictItem } from '../../types/conflict.js';
import { ConflictCard } from './ConflictCard.js';

export interface ConflictListProps {
  conflicts: ConflictItem[];
  selectedConflictId: string | null;
  onSelectConflict: (conflict: ConflictItem) => void;
}

export const ConflictList: React.FC<ConflictListProps> = ({
  conflicts,
  selectedConflictId,
  onSelectConflict,
}) => {
  const approvedCount = conflicts.filter((c) => c.status === 'APPROVED' || c.status === 'APPLIED').length;

  return (
    <div className="flex flex-col h-full bg-[#161b22] border-r border-[#30363d] w-72 shrink-0 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#30363d] bg-[#181d24]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            <FileCode className="w-4 h-4 text-[#58a6ff]" />
            <span>Conflicted Files</span>
          </div>
          <span className="text-xs font-mono font-medium text-[#c9d1d9]">
            {approvedCount}/{conflicts.length}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#21262d] h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="bg-[#2ea043] h-full transition-all duration-300 rounded-full"
            style={{
              width: `${conflicts.length ? (approvedCount / conflicts.length) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Conflicts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {conflicts.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#8b949e]">
            No conflicts detected.
          </div>
        ) : (
          conflicts.map((conflict) => (
            <ConflictCard
              key={conflict._id}
              conflict={conflict}
              isSelected={conflict._id === selectedConflictId}
              onSelect={() => onSelectConflict(conflict)}
            />
          ))
        )}
      </div>

      {/* Footer status */}
      <div className="p-3 border-t border-[#30363d] bg-[#181d24] text-[11px] text-[#8b949e] flex items-center justify-between">
        <span>Status</span>
        <span className="font-mono text-[#3fb950] flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {approvedCount === conflicts.length ? 'Ready to Apply' : 'Pending Approvals'}
        </span>
      </div>
    </div>
  );
};
