import React, { useState } from 'react';
import { GitCommit, RotateCcw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '../common/Button.js';
import { TestResults } from './TestResults.js';
import { VerificationResult } from '../../types/verification.js';

export interface VerificationPanelProps {
  verificationResult: VerificationResult | null;
  isVerifying: boolean;
  isApplying: boolean;
  isRollingBack: boolean;
  allApproved: boolean;
  onRunVerification: () => void;
  onApplyAndCommit: () => void;
  onRollback: () => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  verificationResult,
  isVerifying,
  isApplying,
  isRollingBack,
  allApproved,
  onRunVerification,
  onApplyAndCommit,
  onRollback,
}) => {
  const [showConfirmCommit, setShowConfirmCommit] = useState(false);

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#58a6ff]" />
            Verification & Final Commit Engine
          </h3>
          <p className="text-xs text-[#8b949e] mt-1">
            Automated verification validates conflict markers, syntax balance, build scripts, and git tree integrity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onRunVerification}
            loading={isVerifying}
            icon={<ShieldCheck className="w-4 h-4" />}
          >
            Re-run Verification
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={onRollback}
            loading={isRollingBack}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Rollback Changes
          </Button>
        </div>
      </div>

      {/* Verification Steps Result */}
      <TestResults result={verificationResult} loading={isVerifying} />

      {/* Commit Trigger Section */}
      <div className="p-5 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-[#3fb950]" />
              Commit to Local Repository
            </h4>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Once approved and verified, MergeMind writes the resolved files, stages them with{' '}
              <code className="text-[#c9d1d9] font-mono">git add</code>, and executes{' '}
              <code className="text-[#c9d1d9] font-mono">git commit -m "resolved merge conflict"</code>.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            disabled={!allApproved || isApplying}
            loading={isApplying}
            onClick={onApplyAndCommit}
            icon={<GitCommit className="w-5 h-5" />}
          >
            Apply & Commit Merge
          </Button>
        </div>

        {!allApproved && (
          <div className="flex items-center gap-2 text-xs text-[#d29922] bg-[#d29922]/10 p-2.5 rounded-lg border border-[#d29922]/30">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              All conflicted files must be reviewed and approved by a developer before committing.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
