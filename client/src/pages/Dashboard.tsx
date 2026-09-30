import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitMerge,
  GitBranch,
  ShieldCheck,
  FolderGit2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/common/Button.js';
import { RepositorySelector } from '../components/repository/RepositorySelector.js';
import { useRepositoryContext } from '../context/RepositoryContext.js';
import { conflictApi } from '../services/conflictApi.js';
import { aiApi } from '../services/aiApi.js';
import { formatTimeAgo } from '../utils/formatting.js';

export const Dashboard: React.FC = () => {
  const { currentRepo, openRepo, createDemoRepo } = useRepositoryContext();
  const [history, setHistory] = useState<any[]>([]);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    conflictApi
      .getHistory()
      .then((data) => setHistory(data))
      .catch(() => {});

    aiApi
      .getStatus()
      .then((data) => setAiStatus(data))
      .catch(() => {});
  }, []);

  const handleOpenRepo = async (path: string) => {
    await openRepo(path);
    navigate('/repository');
  };

  const handleLaunchDemo = async () => {
    setLoadingDemo(true);
    try {
      const demo = await createDemoRepo();
      navigate('/repository');
    } finally {
      setLoadingDemo(false);
    }
  };

  const totalConflicts = history.reduce((acc, h) => acc + (h.conflictCount || 0), 0);
  const committedSessions = history.filter((h) => h.status === 'COMMITTED').length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-b from-[#161b22] to-[#0d1117] border border-[#30363d] p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#58a6ff]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-[#a371f7]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-xs font-mono text-[#58a6ff]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intelligent Git Merge Conflict Resolution</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Understand. Resolve. Verify.
          </h1>

          <p className="text-sm sm:text-base text-[#8b949e] leading-relaxed">
            MergeMind understands what <span className="text-[#3fb950] font-medium">both branches</span> were trying to achieve, uses Google Gemini to synthesize safe resolutions, keeps developers in the approval loop, and automatically commits back to your local Git repository.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="lg"
              variant="primary"
              onClick={handleLaunchDemo}
              loading={loadingDemo}
              icon={<Sparkles className="w-4 h-4" />}
            >
              Launch Instant Demo Repository
            </Button>

            {currentRepo && (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/repository')}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Go to Active Repo: {currentRepo.name}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Unique Value Workflow Architecture */}
      <div className="p-6 rounded-xl bg-[#161b22] border border-[#30363d] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
            MergeMind 5-Stage Safe Architecture
          </h3>
          <span className="text-xs text-[#58a6ff] font-mono">
            {aiStatus?.configured ? 'Gemini 1.5 Flash Connected' : 'Local AI Engine Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-xs font-bold text-[#58a6ff] block font-mono">01. UNDERSTAND</span>
            <p className="text-[11px] text-[#8b949e]">Deep intent analysis of both branches & merge base</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-xs font-bold text-[#a371f7] block font-mono">02. SYNTHESIZE</span>
            <p className="text-[11px] text-[#8b949e]">AI harmonizes both implementations safely</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-xs font-bold text-[#d29922] block font-mono">03. APPROVE</span>
            <p className="text-[11px] text-[#8b949e]">Human-in-the-loop review or Monaco code edit</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-xs font-bold text-[#3fb950] block font-mono">04. VERIFY</span>
            <p className="text-[11px] text-[#8b949e]">Markers check, syntax validation & test suite</p>
          </div>
          <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-xs font-bold text-white block font-mono">05. COMMIT</span>
            <p className="text-[11px] text-[#8b949e]">Automatic git commit "resolved merge conflict"</p>
          </div>
        </div>
      </div>

      {/* Grid: Open Repo Form + Stats & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Open Local Repository */}
        <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FolderGit2 className="w-5 h-5 text-[#58a6ff]" />
            <h3 className="text-base font-semibold text-white">Open Local Repository</h3>
          </div>
          <RepositorySelector onSelectRepository={handleOpenRepo} />
        </div>

        {/* Right: Stats & System Metrics */}
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
              Platform Metrics
            </h4>
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <span className="block text-2xl font-bold text-white">{history.length}</span>
                <span className="text-[11px] text-[#8b949e]">Merge Sessions</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <span className="block text-2xl font-bold text-[#3fb950]">{committedSessions}</span>
                <span className="text-[11px] text-[#8b949e]">Committed</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <span className="block text-2xl font-bold text-[#a371f7]">{totalConflicts}</span>
                <span className="text-[11px] text-[#8b949e]">Conflicts Resolved</span>
              </div>
              <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d]">
                <span className="block text-2xl font-bold text-[#58a6ff]">100%</span>
                <span className="text-[11px] text-[#8b949e]">Human Loop</span>
              </div>
            </div>
          </div>

          {/* Recent History snippet */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Recent Merges
              </h4>
              <button
                onClick={() => navigate('/history')}
                className="text-xs text-[#58a6ff] hover:underline"
              >
                View All
              </button>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-[#8b949e]">No merge sessions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 3).map((item) => (
                  <div
                    key={item._id}
                    onClick={() => {
                      localStorage.setItem('mergemind_active_session', item._id);
                      navigate('/conflicts');
                    }}
                    className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] hover:border-[#58a6ff]/50 cursor-pointer transition-colors text-xs font-mono flex items-center justify-between"
                  >
                    <div className="truncate">
                      <span className="text-[#58a6ff]">{item.sourceBranch}</span>
                      <span className="text-[#8b949e] mx-1">→</span>
                      <span className="text-[#3fb950]">{item.targetBranch}</span>
                    </div>
                    <span className="text-[10px] text-[#8b949e]">
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
