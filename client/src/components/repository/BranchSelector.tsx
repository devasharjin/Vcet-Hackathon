import React from 'react';
import { GitBranch, ArrowRight, GitMerge, AlertCircle } from 'lucide-react';
import { BranchInfo } from '../../types/branch.js';
import { Button } from '../common/Button.js';

export interface BranchSelectorProps {
  branches: BranchInfo[];
  sourceBranch: string;
  targetBranch: string;
  onSourceChange: (branch: string) => void;
  onTargetChange: (branch: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  branches,
  sourceBranch,
  targetBranch,
  onSourceChange,
  onTargetChange,
  onAnalyze,
  isAnalyzing,
}) => {
  const isSameBranch = sourceBranch === targetBranch && sourceBranch !== '';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm space-y-6">
      <div>
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-[#58a6ff]" />
          Select Branches to Compare & Merge
        </h3>
        <p className="text-xs text-[#8b949e] mt-1">
          Changes from <strong className="text-[#58a6ff]">SOURCE</strong> will be analyzed against{' '}
          <strong className="text-[#3fb950]">TARGET</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        {/* Source Branch */}
        <div className="md:col-span-5 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#58a6ff] flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            Source Branch (Incoming Changes)
          </label>
          <div className="relative">
            <select
              value={sourceBranch}
              onChange={(e) => onSourceChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm font-mono text-[#c9d1d9] focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
            >
              <option value="" disabled>
                Select source branch...
              </option>
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} {b.isCurrent ? '(current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="md:col-span-1 flex justify-center py-2 md:py-0">
          <div className="p-2 rounded-full bg-[#21262d] border border-[#30363d] text-[#8b949e]">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Target Branch */}
        <div className="md:col-span-5 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#3fb950] flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            Target Branch (Base to Merge Into)
          </label>
          <div className="relative">
            <select
              value={targetBranch}
              onChange={(e) => onTargetChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm font-mono text-[#c9d1d9] focus:outline-none focus:border-[#3fb950] focus:ring-1 focus:ring-[#3fb950]"
            >
              <option value="" disabled>
                Select target branch...
              </option>
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} {b.isCurrent ? '(current)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isSameBranch && (
        <div className="p-3 rounded-lg bg-[#da3633]/10 border border-[#da3633]/30 text-xs text-[#f85149] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Source and target branches must be different to analyze a merge.</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-[#30363d]">
        <div className="text-xs text-[#8b949e] font-mono">
          Safe Mode: Merge will be simulated in an isolated sandbox first.
        </div>
        <Button
          onClick={onAnalyze}
          disabled={!sourceBranch || !targetBranch || isSameBranch || isAnalyzing}
          loading={isAnalyzing}
          size="lg"
          icon={<GitMerge className="w-4 h-4" />}
        >
          Analyze Merge
        </Button>
      </div>
    </div>
  );
};
