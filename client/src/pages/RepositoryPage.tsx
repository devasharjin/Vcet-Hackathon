import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderGit2,
  GitBranch,
  GitMerge,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useRepositoryContext } from '../context/RepositoryContext.js';
import { RepositoryInfo } from '../components/repository/RepositoryInfo.js';
import { BranchSelector } from '../components/repository/BranchSelector.js';
import { BranchComparison } from '../components/repository/BranchComparison.js';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { conflictApi } from '../services/conflictApi.js';
import { BranchComparison as IBranchComparison } from '../types/branch.js';

export const RepositoryPage: React.FC = () => {
  const { currentRepo, branches, status, refreshRepo, setActiveSessionId } = useRepositoryContext();
  const [sourceBranch, setSourceBranch] = useState<string>('');
  const [targetBranch, setTargetBranch] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [comparison, setComparison] = useState<IBranchComparison | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize selected branches
  useEffect(() => {
    if (branches.length > 0) {
      const current = branches.find((b) => b.isCurrent) || branches[0];
      setTargetBranch(current.name);

      const other = branches.find((b) => b.name !== current.name && !b.isRemote);
      if (other) {
        setSourceBranch(other.name);
      } else if (branches.length > 1) {
        setSourceBranch(branches[1].name);
      }
    }
  }, [branches]);

  const steps = [
    'Validating repository state and branch pointers',
    'Identifying common merge base ancestor',
    'Analyzing branch divergence and file changes',
    'Simulating merge in isolated sandbox worktree',
    'Detecting Git conflict markers across files',
    'Extracting file context, commits, and diffs',
    'Gemini AI performing deep intent analysis',
    'Synthesizing safe combined resolutions',
  ];

  const handleAnalyzeMerge = async () => {
    if (!currentRepo || !sourceBranch || !targetBranch) return;

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisStep(0);

    // Simulate progress updates for the stepper while backend executes
    const interval = setInterval(() => {
      setAnalysisStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    try {
      const res = await conflictApi.analyzeMerge(currentRepo.path, sourceBranch, targetBranch);
      clearInterval(interval);
      setAnalysisStep(steps.length);

      setActiveSessionId(res.sessionId);

      if (!res.hasConflicts) {
        // No conflicts! Direct clean merge
        alert('Zero conflicts detected between selected branches! Clean merge is possible.');
      } else {
        // Navigate to Conflict Resolution Studio
        navigate('/conflicts');
      }
    } catch (err: any) {
      clearInterval(interval);
      setErrorMsg(err.message || 'Merge analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!currentRepo) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          icon={<FolderGit2 className="w-12 h-12 text-[#58a6ff]" />}
          title="No Repository Selected"
          description="Open a local Git repository from your workstation to inspect branches and resolve conflicts."
          action={
            <Button onClick={() => navigate('/')} icon={<FolderGit2 className="w-4 h-4" />}>
              Open Repository from Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Repository Overview</h1>
          <p className="text-xs text-[#8b949e] mt-1 font-mono">
            {currentRepo.path}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={refreshRepo}>
          Refresh Git Status
        </Button>
      </div>

      {/* Repository Info Card */}
      <RepositoryInfo info={currentRepo} status={status} />

      {/* Branch Selection & Merge Analysis */}
      <BranchSelector
        branches={branches}
        sourceBranch={sourceBranch}
        targetBranch={targetBranch}
        onSourceChange={setSourceBranch}
        onTargetChange={setTargetBranch}
        onAnalyze={handleAnalyzeMerge}
        isAnalyzing={isAnalyzing}
      />

      {/* Progress Stepper Modal/Card when analyzing */}
      {isAnalyzing && (
        <div className="p-6 rounded-xl bg-[#161b22] border border-[#58a6ff]/40 shadow-2xl space-y-4 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#58a6ff] animate-spin" />
              <h3 className="text-sm font-semibold text-white">
                Safe Merge Simulation & AI Intent Analysis in Progress...
              </h3>
            </div>
            <span className="text-xs font-mono text-[#58a6ff]">
              Step {analysisStep + 1} of {steps.length}
            </span>
          </div>

          <div className="w-full bg-[#0d1117] h-2 rounded-full overflow-hidden border border-[#30363d]">
            <div
              className="bg-linear-to-r from-[#58a6ff] to-[#a371f7] h-full transition-all duration-300"
              style={{ width: `${((analysisStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="space-y-2 pt-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2.5 text-xs font-mono transition-opacity duration-200 ${
                  idx === analysisStep
                    ? 'text-white font-semibold'
                    : idx < analysisStep
                    ? 'text-[#3fb950] opacity-80'
                    : 'text-[#8b949e] opacity-40'
                }`}
              >
                {idx < analysisStep ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950] shrink-0" />
                ) : idx === analysisStep ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#58a6ff] border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-[#8b949e] shrink-0" />
                )}
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#da3633]/15 border border-[#da3633]/40 text-xs text-[#f85149] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Analysis Failed</span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* Branch Comparison if available */}
      <BranchComparison comparison={comparison} loading={false} />
    </div>
  );
};
