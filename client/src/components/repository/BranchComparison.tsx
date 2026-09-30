import React from 'react';
import { GitCompare, FileCode, CheckCircle2 } from 'lucide-react';
import { BranchComparison as IBranchComparison } from '../../types/branch.js';

export interface BranchComparisonProps {
  comparison: IBranchComparison | null;
  loading: boolean;
}

export const BranchComparison: React.FC<BranchComparisonProps> = ({ comparison, loading }) => {
  if (loading) {
    return (
      <div className="p-8 text-center bg-[#161b22] border border-[#30363d] rounded-xl animate-pulse">
        <p className="text-xs text-[#8b949e]">Comparing branches and calculating merge base...</p>
      </div>
    );
  }

  if (!comparison) return null;

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-[#a371f7]" />
          <h4 className="text-sm font-semibold text-white">Branch Divergence Analysis</h4>
        </div>
        <div className="text-xs font-mono text-[#8b949e]">
          Merge Base:{' '}
          <span className="text-[#58a6ff]">{comparison.mergeBase.substring(0, 7)}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
          Changed Files ({comparison.changedFiles.length})
        </div>
        {comparison.changedFiles.length === 0 ? (
          <p className="text-xs text-[#3fb950] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Branches are identical or have no differing files.
          </p>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1">
            {comparison.changedFiles.map((file) => (
              <div
                key={file}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0d1117] border border-[#30363d] text-xs font-mono text-[#c9d1d9]"
              >
                <FileCode className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span>{file}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
