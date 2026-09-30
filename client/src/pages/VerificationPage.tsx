import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  GitCommit,
  RotateCcw,
  CheckCircle2,
  FolderGit2,
  ArrowRight,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useRepositoryContext } from '../context/RepositoryContext.js';
import { useConflicts } from '../hooks/useConflicts.js';
import { VerificationPanel } from '../components/verification/VerificationPanel.js';
import { Button } from '../components/common/Button.js';
import { Toast } from '../components/common/Toast.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { conflictApi } from '../services/conflictApi.js';
import { verificationApi } from '../services/verificationApi.js';
import { VerificationResult, ApplyResolutionResult } from '../types/verification.js';

export const VerificationPage: React.FC = () => {
  const { currentRepo, activeSessionId, setActiveSessionId } = useRepositoryContext();
  const { session, conflicts, loadSession } = useConflicts();

  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [applyResult, setApplyResult] = useState<ApplyResolutionResult | null>(null);
  const [toast, setToast] = useState<{ type: any; title: string; message?: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeSessionId) {
      loadSession(activeSessionId);
      // Run initial verification check
      runVerification();
    }
  }, [activeSessionId]);

  const runVerification = async () => {
    if (!activeSessionId) return;
    setIsVerifying(true);
    try {
      const result = await verificationApi.verifySession(activeSessionId);
      setVerificationResult(result);
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleApplyAndCommit = async () => {
    if (!activeSessionId) return;
    setIsApplying(true);
    try {
      const result = await conflictApi.applyResolution(activeSessionId);
      setApplyResult(result);
      if (result.success) {
        setToast({
          type: 'success',
          title: 'Commit Created!',
          message: `Created commit: ${result.commitHash} ("resolved merge conflict")`,
        });
      } else {
        setToast({
          type: 'error',
          title: 'Verification Failed',
          message: result.message,
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Apply Failed',
        message: err.message,
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRollback = async () => {
    if (!activeSessionId) return;
    if (!confirm('Are you sure you want to rollback all applied resolutions? This will restore files to their pre-application state.')) {
      return;
    }

    setIsRollingBack(true);
    try {
      const res = await conflictApi.rollbackSession(activeSessionId);
      if (res.success) {
        setApplyResult(null);
        setToast({
          type: 'success',
          title: 'Rollback Complete',
          message: 'Repository has been restored to pre-application state.',
        });
        await runVerification();
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Rollback Failed',
        message: err.message,
      });
    } finally {
      setIsRollingBack(false);
    }
  };

  const allApproved =
    conflicts.length > 0 &&
    conflicts.every((c) => c.status === 'APPROVED' || c.status === 'APPLIED');

  const aiApprovedCount = conflicts.filter((c) => c.resolutionSource === 'ai_approved').length;
  const humanReviewedCount = conflicts.filter((c) => c.resolutionSource === 'human_modified' || c.resolutionSource === 'human_required').length;

  if (!activeSessionId) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          icon={<ShieldCheck className="w-12 h-12 text-[#58a6ff]" />}
          title="No Active Session to Verify"
          description="Resolve conflicts on the Conflict Resolver page first before verifying and committing."
          action={
            <Button onClick={() => navigate('/repository')} icon={<ArrowRight className="w-4 h-4" />}>
              Go to Repository
            </Button>
          }
        />
      </div>
    );
  }

  // Section 23: Final Success Screen!
  if (applyResult && applyResult.success) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
        <div className="text-center space-y-3 pb-4">
          <div className="w-16 h-16 rounded-full bg-[#238636]/20 border-2 border-[#2ea043] flex items-center justify-center mx-auto shadow-lg shadow-[#2ea043]/20">
            <CheckCircle2 className="w-9 h-9 text-[#3fb950]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Merge Resolved Successfully
          </h1>
          <p className="text-sm text-[#8b949e]">
            Approved resolutions were applied, verified, and safely committed back to your local Git repository.
          </p>
        </div>

        {/* Success Card Details */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-6">
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#30363d] text-xs font-mono">
            <div>
              <span className="text-[#8b949e] block text-[10px] uppercase">Repository</span>
              <span className="text-white font-medium truncate block">{currentRepo?.path}</span>
            </div>
            <div>
              <span className="text-[#8b949e] block text-[10px] uppercase">Branches Merged</span>
              <span className="text-[#58a6ff]">{session?.sourceBranch}</span>
              <span className="text-[#8b949e] mx-1">→</span>
              <span className="text-[#3fb950]">{session?.targetBranch}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center font-mono">
            <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
              <span className="block text-xl font-bold text-white">{conflicts.length}</span>
              <span className="text-[10px] text-[#8b949e] uppercase">Conflicts</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
              <span className="block text-xl font-bold text-[#a371f7]">{aiApprovedCount}</span>
              <span className="text-[10px] text-[#8b949e] uppercase">AI Resolved</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
              <span className="block text-xl font-bold text-[#58a6ff]">{humanReviewedCount}</span>
              <span className="text-[10px] text-[#8b949e] uppercase">Human Reviewed</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
              <span className="block text-xl font-bold text-[#3fb950]">PASSED</span>
              <span className="text-[10px] text-[#8b949e] uppercase">Verification</span>
            </div>
          </div>

          {/* Commit Message Box */}
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#2ea043]/40 space-y-1.5 font-mono">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8b949e]">Git Commit Hash:</span>
              <span className="text-[#58a6ff] font-bold">{applyResult.commitHash}</span>
            </div>
            <div className="text-sm font-semibold text-white">
              "resolved merge conflict"
            </div>
            <div className="text-[11px] text-[#3fb950] flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{applyResult.filesApplied.length} file(s) staged and committed</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => navigate('/history')}
            >
              View in Merge History
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/repository')}
              icon={<FolderGit2 className="w-4 h-4" />}
            >
              Back to Repository
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Verification & Final Commit
          </h1>
          <p className="text-xs text-[#8b949e] mt-1 font-mono">
            {conflicts.filter((c) => c.status === 'APPROVED' || c.status === 'APPLIED').length} of{' '}
            {conflicts.length} conflict(s) approved by developer
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/conflicts')}
        >
          Back to Conflict Resolver
        </Button>
      </div>

      {/* Verification Panel */}
      <VerificationPanel
        verificationResult={verificationResult}
        isVerifying={isVerifying}
        isApplying={isApplying}
        isRollingBack={isRollingBack}
        allApproved={allApproved}
        onRunVerification={runVerification}
        onApplyAndCommit={handleApplyAndCommit}
        onRollback={handleRollback}
      />
    </div>
  );
};
