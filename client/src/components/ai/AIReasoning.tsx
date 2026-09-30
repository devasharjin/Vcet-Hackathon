import React from 'react';
import { Target, GitCommit, Layers, Sparkles } from 'lucide-react';
import { ConflictItem } from '../../types/conflict.js';
import { CONFLICT_TYPE_LABELS } from '../../utils/constants.js';

export interface AIReasoningProps {
  conflict: ConflictItem;
}

export const AIReasoning: React.FC<AIReasoningProps> = ({ conflict }) => {
  const badgeConfig =
    CONFLICT_TYPE_LABELS[conflict.conflictType] || CONFLICT_TYPE_LABELS.UNKNOWN;

  return (
    <div className="space-y-4">
      {/* Classification Tag */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
          Intent & Classification
        </span>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${badgeConfig.color}`}
        >
          {badgeConfig.label}
        </span>
      </div>

      {/* Target Intent */}
      <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#3fb950]">
          <Target className="w-3.5 h-3.5" />
          <span>Target Branch Intent (Ours)</span>
        </div>
        <p className="text-xs text-[#c9d1d9] leading-relaxed">
          {conflict.aiExplanation.targetIntent}
        </p>
      </div>

      {/* Source Intent */}
      <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#58a6ff]">
          <GitCommit className="w-3.5 h-3.5" />
          <span>Source Branch Intent (Theirs)</span>
        </div>
        <p className="text-xs text-[#c9d1d9] leading-relaxed">
          {conflict.aiExplanation.sourceIntent}
        </p>
      </div>

      {/* Combined Intent */}
      <div className="p-3.5 rounded-lg bg-[#1f242c] border border-[#a371f7]/40 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#a371f7]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Harmonized Combined Intent</span>
        </div>
        <p className="text-xs text-[#c9d1d9] leading-relaxed">
          {conflict.aiExplanation.combinedIntent}
        </p>
      </div>
    </div>
  );
};
