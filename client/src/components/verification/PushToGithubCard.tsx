import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Terminal,
  Settings2,
  Sparkles,
  GitBranch,
  GitCommit,
  RotateCcw,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { conflictApi } from '../../services/conflictApi.js';
import { GitRemoteInfo, PushResult } from '../../types/verification.js';
import { Button } from '../common/Button.js';

export interface PushToGithubCardProps {
  sessionId: string;
  commitHash?: string;
  defaultBranch?: string;
  sourceBranch?: string;
  onPushedSuccess?: (result: PushResult) => void;
}

export const PushToGithubCard: React.FC<PushToGithubCardProps> = ({
  sessionId,
  commitHash,
  defaultBranch = 'main',
  sourceBranch,
  onPushedSuccess,
}) => {
  const [remotes, setRemotes] = useState<GitRemoteInfo[]>([]);
  const [loadingRemotes, setLoadingRemotes] = useState(true);
  const [selectedRemote, setSelectedRemote] = useState<string>('origin');
  const [targetBranch, setTargetBranch] = useState<string>(defaultBranch);
  const [customRemoteUrl, setCustomRemoteUrl] = useState<string>('');
  const [isEditingRemote, setIsEditingRemote] = useState(false);
  const [savingRemote, setSavingRemote] = useState(false);

  // Push options
  const [setUpstream, setSetUpstream] = useState(true);
  const [forcePush, setForcePush] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Push state
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [showTerminalOutput, setShowTerminalOutput] = useState(false);

  useEffect(() => {
    fetchRemotes();
  }, [sessionId]);

  useEffect(() => {
    if (defaultBranch) {
      setTargetBranch(defaultBranch);
    }
  }, [defaultBranch]);

  const fetchRemotes = async () => {
    setLoadingRemotes(true);
    try {
      const data = await conflictApi.getSessionRemotes(sessionId);
      setRemotes(data);
      if (data.length > 0) {
        setSelectedRemote(data[0].name);
        setCustomRemoteUrl(data[0].url || data[0].pushUrl || data[0].fetchUrl);
      }
    } catch (err: any) {
      console.warn('Failed to load remotes:', err);
    } finally {
      setLoadingRemotes(false);
    }
  };

  const handleSaveRemote = async () => {
    if (!customRemoteUrl.trim()) return;
    setSavingRemote(true);
    setPushError(null);
    try {
      const updated = await conflictApi.setSessionRemote(
        sessionId,
        selectedRemote || 'origin',
        customRemoteUrl.trim()
      );
      setRemotes(updated);
      setIsEditingRemote(false);
    } catch (err: any) {
      setPushError(err.message || 'Failed to update remote configuration.');
    } finally {
      setSavingRemote(false);
    }
  };

  const handlePush = async () => {
    setIsPushing(true);
    setPushError(null);
    try {
      const result = await conflictApi.pushSession(sessionId, {
        remote: selectedRemote || 'origin',
        branch: targetBranch || defaultBranch,
        setUpstream,
        force: forcePush,
        dryRun,
        remoteUrl: !remotes.length && customRemoteUrl.trim() ? customRemoteUrl.trim() : undefined,
      });

      setPushResult(result);
      if (onPushedSuccess && result.success && !dryRun) {
        onPushedSuccess(result);
      }
    } catch (err: any) {
      setPushError(err.message || 'Push command failed. Check credentials and remote configuration.');
    } finally {
      setIsPushing(false);
    }
  };

  const currentRemote = remotes.find((r) => r.name === selectedRemote) || remotes[0];
  const hasGitHubRemote = currentRemote?.isGitHub || (customRemoteUrl && customRemoteUrl.includes('github.com'));

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl space-y-6">
      {/* Workflow Step Tracker */}
      <div className="pb-4 border-b border-[#30363d]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#238636]/20 border border-[#2ea043]/50 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-[#3fb950]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Step 6: Push to Remote Repository
                {pushResult?.success && !dryRun && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#238636]/20 text-[#3fb950] border border-[#2ea043]/40 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Complete
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#8b949e]">
                Publish your verified merge commit from the local repository to GitHub to complete the full workflow.
              </p>
            </div>
          </div>
        </div>

        {/* 6-Step Visual Workflow Progress Bar */}
        <div className="grid grid-cols-6 gap-1.5 pt-2 text-[10px] font-mono">
          <div className="p-2 rounded-lg bg-[#238636]/10 border border-[#2ea043]/30 text-center">
            <span className="block text-[#3fb950] font-bold">✓ 1. Simulate</span>
            <span className="text-[9px] text-[#8b949e]">Isolated Sandbox</span>
          </div>
          <div className="p-2 rounded-lg bg-[#238636]/10 border border-[#2ea043]/30 text-center">
            <span className="block text-[#3fb950] font-bold">✓ 2. AI Synthesize</span>
            <span className="text-[9px] text-[#8b949e]">Gemini Intent</span>
          </div>
          <div className="p-2 rounded-lg bg-[#238636]/10 border border-[#2ea043]/30 text-center">
            <span className="block text-[#3fb950] font-bold">✓ 3. Review</span>
            <span className="text-[9px] text-[#8b949e]">Monaco 3-Way</span>
          </div>
          <div className="p-2 rounded-lg bg-[#238636]/10 border border-[#2ea043]/30 text-center">
            <span className="block text-[#3fb950] font-bold">✓ 4. Verify</span>
            <span className="text-[9px] text-[#8b949e]">5-Point Engine</span>
          </div>
          <div className="p-2 rounded-lg bg-[#238636]/10 border border-[#2ea043]/30 text-center">
            <span className="block text-[#3fb950] font-bold">✓ 5. Commit</span>
            <span className="text-[9px] text-[#8b949e]">Local Git Tree</span>
          </div>
          <div
            className={`p-2 rounded-lg text-center transition-all ${
              pushResult?.success && !dryRun
                ? 'bg-[#238636]/20 border border-[#2ea043] text-[#3fb950] font-bold'
                : 'bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-[#58a6ff]'
            }`}
          >
            <span className="block font-bold">
              {pushResult?.success && !dryRun ? '✓ 6. Pushed' : '→ 6. Push Remote'}
            </span>
            <span className="text-[9px] text-[#8b949e]">GitHub Sync</span>
          </div>
        </div>
      </div>

      {/* Success Celebration View */}
      {pushResult && pushResult.success && !dryRun ? (
        <div className="p-6 rounded-2xl bg-[#0d1117] border-2 border-[#2ea043] shadow-lg shadow-[#2ea043]/10 space-y-4 animate-in zoom-in-95 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#238636]/20 border border-[#2ea043] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7 text-[#3fb950]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Full Workflow Complete!
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#388bfd]/20 text-[#58a6ff] border border-[#388bfd]/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Synced with GitHub
                </span>
              </div>
              <p className="text-xs text-[#8b949e] leading-relaxed">
                Commit{' '}
                <span className="font-mono text-white font-bold">
                  {commitHash ? commitHash.substring(0, 7) : 'HEAD'}
                </span>{' '}
                was pushed successfully to{' '}
                <span className="font-mono text-[#58a6ff]">
                  {pushResult.remote || selectedRemote}/{pushResult.branch || targetBranch}
                </span>
                .
              </p>
            </div>
          </div>

          {/* Quick Action Links to GitHub */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {pushResult.githubCommitUrl && (
              <a
                href={pushResult.githubCommitUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium border border-[#30363d] transition-all hover:border-[#58a6ff]"
              >
                <GitCommit className="w-4 h-4 text-[#58a6ff]" />
                <span>View Commit on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
              </a>
            )}

            {pushResult.githubRepoUrl && (
              <a
                href={pushResult.githubRepoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium border border-[#30363d] transition-all hover:border-[#3fb950]"
              >
                <UploadCloud className="w-4 h-4 text-[#3fb950]" />
                <span>Open GitHub Repository</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
              </a>
            )}

            {pushResult.githubCompareUrl && (
              <a
                href={pushResult.githubCompareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-medium border border-[#30363d] transition-all hover:border-[#a371f7]"
              >
                <GitBranch className="w-4 h-4 text-[#a371f7]" />
                <span>Compare & Create Pull Request</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
              </a>
            )}
          </div>

          {/* Git Terminal Output Drawer */}
          {pushResult.output && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowTerminalOutput(!showTerminalOutput)}
                className="text-[11px] font-mono text-[#8b949e] hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showTerminalOutput ? 'Hide Git Output' : 'Show Git Push Output'}</span>
              </button>
              {showTerminalOutput && (
                <pre className="mt-2 p-3 rounded-lg bg-[#010409] border border-[#30363d] text-[11px] font-mono text-[#c9d1d9] overflow-x-auto whitespace-pre-wrap">
                  {`$ git push ${setUpstream ? '-u ' : ''}${forcePush ? '--force-with-lease ' : ''}${pushResult.remote || selectedRemote} ${pushResult.branch || targetBranch}\n${pushResult.output}`}
                </pre>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Configuration & Action Area */
        <div className="space-y-4">
          {/* Remote Selection & URL Display */}
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#8b949e] text-[11px] uppercase tracking-wider font-semibold">
                Remote Repository
              </span>
              <button
                type="button"
                onClick={() => setIsEditingRemote(!isEditingRemote)}
                className="text-[11px] text-[#58a6ff] hover:underline flex items-center gap-1 font-sans"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>{isEditingRemote ? 'Cancel' : remotes.length ? 'Change Remote URL' : 'Configure Remote'}</span>
              </button>
            </div>

            {loadingRemotes ? (
              <p className="text-[#8b949e] animate-pulse">Inspecting Git remotes...</p>
            ) : isEditingRemote || remotes.length === 0 ? (
              <div className="space-y-2 pt-1 font-sans">
                <label className="text-[11px] text-[#8b949e] block">
                  GitHub Repository URL (HTTPS or SSH):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customRemoteUrl}
                    onChange={(e) => setCustomRemoteUrl(e.target.value)}
                    placeholder="https://github.com/username/repository.git"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-white text-xs font-mono focus:border-[#58a6ff] focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    loading={savingRemote}
                    onClick={handleSaveRemote}
                    disabled={!customRemoteUrl.trim()}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-[10px] text-[#8b949e]">
                  Example: <code className="text-[#c9d1d9]">https://github.com/username/my-project.git</code>
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#21262d] text-white font-semibold">
                    {currentRemote?.name || 'origin'}
                  </span>
                  <span className="text-[#58a6ff] truncate max-w-[340px]">
                    {currentRemote?.url || currentRemote?.pushUrl || customRemoteUrl}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[#8b949e] text-[11px]">
                  <span>Branch:</span>
                  <span className="text-[#3fb950] font-bold">{targetBranch}</span>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Push Options Toggle */}
          <div className="border border-[#30363d] rounded-xl overflow-hidden bg-[#0d1117]/50">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-[#8b949e] hover:text-white transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                Advanced Push Options
              </span>
              <span className="text-[10px] font-mono text-[#58a6ff]">
                {showAdvanced ? 'Hide' : 'Configure'}
              </span>
            </button>

            {showAdvanced && (
              <div className="px-4 pb-4 pt-1 border-t border-[#30363d] space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[11px] text-[#8b949e] block mb-1">Target Branch:</label>
                    <input
                      type="text"
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-white font-mono text-xs focus:border-[#58a6ff] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#8b949e] block mb-1">Remote Name:</label>
                    <input
                      type="text"
                      value={selectedRemote}
                      onChange={(e) => setSelectedRemote(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-white font-mono text-xs focus:border-[#58a6ff] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 text-[#c9d1d9] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setUpstream}
                      onChange={(e) => setSetUpstream(e.target.checked)}
                      className="rounded bg-[#161b22] border-[#30363d] text-[#238636] focus:ring-0"
                    />
                    <span>Set upstream tracking (<code className="text-[#58a6ff] font-mono">-u</code>)</span>
                  </label>

                  <label className="flex items-center gap-2 text-[#c9d1d9] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={(e) => setDryRun(e.target.checked)}
                      className="rounded bg-[#161b22] border-[#30363d] text-[#238636] focus:ring-0"
                    />
                    <span>Test run only (<code className="text-[#58a6ff] font-mono">--dry-run</code>, no commits pushed)</span>
                  </label>

                  <label className="flex items-center gap-2 text-[#f85149] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={forcePush}
                      onChange={(e) => setForcePush(e.target.checked)}
                      className="rounded bg-[#161b22] border-[#30363d] text-[#da3633] focus:ring-0"
                    />
                    <span>Force push with lease (<code className="font-mono">--force-with-lease</code>)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {pushError && (
            <div className="p-3.5 rounded-xl bg-[#da3633]/10 border border-[#da3633]/40 text-[#f85149] text-xs space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Push Encountered an Issue</span>
              </div>
              <p className="text-[11px] leading-relaxed pl-6 text-[#c9d1d9]">{pushError}</p>
              <div className="pl-6 pt-1 flex items-center gap-2 text-[10px] text-[#8b949e]">
                <span>Tip: If pushing requires GitHub credentials, ensure Git credential helper or SSH key is set.</span>
              </div>
            </div>
          )}

          {/* Dry Run Notice */}
          {dryRun && (
            <div className="p-2.5 rounded-lg bg-[#d29922]/10 border border-[#d29922]/30 text-[#d29922] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Dry Run is active. Git will simulate the push without updating the remote repository.</span>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-[#8b949e]">
              Push target:{' '}
              <span className="font-mono text-white font-medium">
                {selectedRemote}/{targetBranch}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              loading={isPushing}
              disabled={isPushing || (remotes.length === 0 && !customRemoteUrl.trim())}
              onClick={handlePush}
              icon={<UploadCloud className="w-5 h-5" />}
              className="w-full sm:w-auto shadow-lg shadow-[#2ea043]/20"
            >
              {isPushing ? 'Pushing to GitHub...' : `Push Commit to ${selectedRemote}/${targetBranch}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
