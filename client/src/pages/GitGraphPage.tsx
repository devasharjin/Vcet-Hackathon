import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  GitGraphData,
  GitGraphNode,
  RepositoryInfo,
} from '../types/repository.js';
import { repositoryApi } from '../services/repositoryApi.js';
import { useRepositoryContext } from '../context/RepositoryContext.js';
import { GitGraphCanvas } from '../components/graph/GitGraphCanvas.js';
import { CommitDetailsDrawer } from '../components/graph/CommitDetailsDrawer.js';
import {
  GitBranch,
  GitMerge,
  Search,
  RefreshCw,
  FolderGit2,
  Sparkles,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';

interface LayoutContext {
  currentRepo: RepositoryInfo | null;
  onOpenRepoClick?: () => void;
}

const DEFAULT_SAMPLE_PATH = 'C:/Users/sharj/Desktop/sample1';

export const GitGraphPage: React.FC = () => {
  const outletCtx = useOutletContext<LayoutContext | undefined>();
  const { currentRepo, openRepo, createDemoRepo } = useRepositoryContext();
  const navigate = useNavigate();

  const [inputPath, setInputPath] = useState(currentRepo?.path || DEFAULT_SAMPLE_PATH);
  const [openingRepo, setOpeningRepo] = useState(false);
  const [graphData, setGraphData] = useState<GitGraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCommit, setSelectedCommit] = useState<GitGraphNode | null>(null);
  const [hoveredCommit, setHoveredCommit] = useState<GitGraphNode | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [creatingDemoMerge, setCreatingDemoMerge] = useState(false);
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  // If no repository is active in context on mount, attempt to auto-connect to sample1
  useEffect(() => {
    if (!currentRepo) {
      setOpeningRepo(true);
      openRepo(DEFAULT_SAMPLE_PATH)
        .catch(() => {})
        .finally(() => {
          setOpeningRepo(false);
        });
    } else {
      setInputPath(currentRepo.path);
    }
  }, [currentRepo, openRepo]);

  // Fetch Git DAG graph whenever currentRepo changes
  const fetchGraph = useCallback(async () => {
    if (!currentRepo) return;
    setLoading(true);
    setError(null);
    try {
      const data = await repositoryApi.getGitGraph(currentRepo.path, 150);
      setGraphData(data);
      if (data.nodes.length > 0) {
        setSelectedCommit((prev) => {
          if (!prev) return data.nodes[0];
          const exists = data.nodes.find((n) => n.hash === prev.hash);
          return exists || data.nodes[0];
        });
      } else {
        setSelectedCommit(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load Git graph.');
    } finally {
      setLoading(false);
    }
  }, [currentRepo]);

  useEffect(() => {
    if (currentRepo) {
      fetchGraph();
    }
  }, [currentRepo, fetchGraph]);

  const handleManualOpen = async (pathToOpen: string) => {
    if (!pathToOpen.trim()) return;
    setOpeningRepo(true);
    setError(null);
    try {
      await openRepo(pathToOpen.trim());
    } catch (err: any) {
      setError(err?.message || `Failed to open repository at ${pathToOpen}`);
    } finally {
      setOpeningRepo(false);
    }
  };

  const handleLaunchDemo = async () => {
    setOpeningRepo(true);
    setError(null);
    try {
      await createDemoRepo();
    } catch (err: any) {
      setError(err?.message || 'Failed to create demo repository.');
    } finally {
      setOpeningRepo(false);
    }
  };

  const handleSelectCommitHash = (hash: string) => {
    if (!graphData) return;
    const target = graphData.nodes.find((n) => n.hash === hash);
    if (target) {
      setSelectedCommit(target);
    }
  };

  const handleCreateDemoMerge = async () => {
    if (!currentRepo) return;
    setCreatingDemoMerge(true);
    setDemoMessage(null);
    try {
      const res = await repositoryApi.createSampleMerge(currentRepo.path);
      setDemoMessage(res.message);
      await fetchGraph();
      setTimeout(() => setDemoMessage(null), 6000);
    } catch (err: any) {
      setError(err?.message || 'Failed to create sample merge.');
    } finally {
      setCreatingDemoMerge(false);
    }
  };

  // State 1: No repository active
  if (!currentRepo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0d1117] min-h-[calc(100vh-4rem)]">
        <div className="max-w-xl w-full p-8 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#a371f7]/20 to-[#58a6ff]/20 border border-[#a371f7]/40 flex items-center justify-center mx-auto text-[#d2a8ff] shadow-lg shadow-[#a371f7]/15">
            {openingRepo ? (
              <Loader2 className="w-8 h-8 animate-spin text-[#58a6ff]" />
            ) : (
              <GitMerge className="w-8 h-8" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">
              {openingRepo ? 'Connecting to Repository...' : 'Open Git Repository for Graph View'}
            </h2>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Visualize branch DAGs, inspect commits, and trace clean dual-branch merge convergence points.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-[#f85149]/10 border border-[#f85149]/30 text-xs text-[#f85149] font-mono text-left flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Direct Path Input Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <FolderGit2 className="w-4 h-4 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputPath}
                onChange={(e) => setInputPath(e.target.value)}
                placeholder="C:/path/to/local/git/repo"
                disabled={openingRepo}
                className="w-full pl-9 pr-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs font-mono text-white placeholder-[#8b949e] focus:outline-hidden focus:border-[#58a6ff]"
              />
            </div>
            <button
              onClick={() => handleManualOpen(inputPath)}
              disabled={openingRepo || !inputPath.trim()}
              className="px-4 py-2.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold font-mono transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0 shadow-md"
            >
              {openingRepo ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Load Graph</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Quick Click Badges */}
          <div className="pt-3 border-t border-[#30363d] flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] text-[#8b949e]">Quick actions:</span>
            <button
              onClick={() => handleManualOpen(DEFAULT_SAMPLE_PATH)}
              disabled={openingRepo}
              className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-mono text-[#79c0ff] transition-colors flex items-center gap-1.5"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span>Open sample1</span>
            </button>
            <button
              onClick={handleLaunchDemo}
              disabled={openingRepo}
              className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-mono text-[#ffab70] transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#f0883e]" />
              <span>Simulate Conflict Repo</span>
            </button>
            {outletCtx?.onOpenRepoClick && (
              <button
                onClick={outletCtx.onOpenRepoClick}
                className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs text-[#c9d1d9] transition-colors"
              >
                Browse Folders...
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // State 2: Active Repository View
  return (
    <div className="flex-1 flex flex-col h-full min-h-[calc(100vh-4rem)] bg-[#0d1117] overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="border-b border-[#30363d] bg-[#161b22]/95 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        {/* Left: Title + Repo Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-linear-to-br from-[#a371f7] to-[#58a6ff] flex items-center justify-center shadow-xs">
              <GitMerge className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">Git Graph & Topology</h1>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#a371f7]/15 text-[#d2a8ff] border border-[#a371f7]/30">
                  Clean Convergence
                </span>
              </div>
            </div>
          </div>

          {/* Current Repo Pill */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#30363d]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#21262d] border border-[#30363d] text-xs font-mono text-[#c9d1d9]">
              <FolderGit2 className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span className="font-semibold text-white">{currentRepo.name}</span>
              <span className="text-[#8b949e] max-w-[200px] truncate">({currentRepo.path})</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-xs font-mono text-[#58a6ff]">
              <GitBranch className="w-3 h-3" />
              <span>{currentRepo.currentBranch}</span>
            </div>

            {outletCtx?.onOpenRepoClick && (
              <button
                onClick={outletCtx.onOpenRepoClick}
                className="text-xs text-[#8b949e] hover:text-white hover:underline font-mono"
              >
                Switch
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick button to navigate to Conflict Resolver if needed */}
          <button
            onClick={() => navigate('/conflicts')}
            className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-mono text-[#c9d1d9] transition-colors flex items-center gap-1.5"
            title="Go to Conflict Resolution Studio"
          >
            <Layers className="w-3.5 h-3.5 text-[#58a6ff]" />
            <span>Conflict Resolver</span>
          </button>

          {/* Simulate 2-Branch Merge Live */}
          <button
            onClick={handleCreateDemoMerge}
            disabled={creatingDemoMerge}
            title="Create a test branch and merge commit to see live 2-branch convergence in action"
            className="px-3 py-1.5 rounded-lg bg-linear-to-r from-[#238636] to-[#2ea043] hover:from-[#2ea043] hover:to-[#3fb950] text-white text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>{creatingDemoMerge ? 'Merging...' : 'Simulate 2-Branch Merge'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchGraph}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#c9d1d9] transition-colors"
            title="Refresh Git Graph"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#58a6ff]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Demo Merge Message Notification */}
      {demoMessage && (
        <div className="bg-[#238636]/15 border-b border-[#238636]/40 px-6 py-2 text-xs font-mono text-[#3fb950] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3fb950]" />
            <span>{demoMessage}</span>
          </div>
          <button onClick={() => setDemoMessage(null)} className="text-[#8b949e] hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Topology Metrics & Filter Bar */}
      <div className="border-b border-[#30363d] bg-[#12161c] px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        {/* Left: Metric Chips */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <span className="text-[#8b949e]">Total Commits:</span>
            <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d]">
              {graphData ? graphData.totalCommits : '...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8b949e]">Branch Merges:</span>
            <span className="font-mono font-bold text-[#d2a8ff] bg-[#a371f7]/20 px-2 py-0.5 rounded border border-[#a371f7]/35 shadow-xs">
              {graphData ? graphData.mergeCount : 0}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#8b949e]">Branches:</span>
            <span className="font-mono font-bold text-[#79c0ff] bg-[#58a6ff]/15 px-2 py-0.5 rounded border border-[#58a6ff]/30">
              {graphData ? graphData.branches.length : 0}
            </span>
          </div>

          {/* Visual Legend */}
          <div className="hidden xl:flex items-center gap-3 border-l border-[#30363d] pl-5 text-[11px] text-[#8b949e]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#58a6ff]" />
              <span>Target Branch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a371f7]" />
              <span>Merged Branch</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-[#a371f7] flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-[#a371f7]" />
              </span>
              <span>Merge Point</span>
            </div>
          </div>
        </div>

        {/* Right: Branch Selector & Search Bar */}
        <div className="flex items-center gap-2.5">
          {/* Branch Filter Dropdown */}
          {graphData && graphData.branches.length > 0 && (
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-[#21262d] border border-[#30363d] text-xs font-mono text-[#c9d1d9] rounded-lg px-2.5 py-1.5 pr-8 focus:outline-hidden focus:border-[#58a6ff] cursor-pointer"
              >
                <option value="ALL">All Branches ({graphData.branches.length})</option>
                {graphData.branches.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name} {b.isCurrent ? '● current' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
            <input
              type="text"
              placeholder="Filter commit or branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-8.5 pr-7 py-1.5 bg-[#21262d] border border-[#30363d] rounded-lg text-xs font-mono text-white placeholder-[#8b949e] focus:outline-hidden focus:border-[#58a6ff] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Main Graph Canvas Body + Commit Details Drawer */}
      <div className="flex-1 flex overflow-hidden relative min-h-[500px]">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="w-10 h-10 text-[#f85149] mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">Error Loading Git Graph</h3>
            <p className="text-xs text-[#8b949e] max-w-md font-mono">{error}</p>
            <button
              onClick={fetchGraph}
              className="mt-4 px-4 py-2 rounded-lg bg-[#21262d] border border-[#30363d] text-xs font-mono text-[#c9d1d9] hover:bg-[#30363d] transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : loading && !graphData ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-9 h-9 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-[#8b949e]">Tracing Git DAG topology...</span>
            </div>
          </div>
        ) : graphData ? (
          <>
            <GitGraphCanvas
              graphData={graphData}
              selectedCommit={selectedCommit}
              onSelectCommit={setSelectedCommit}
              hoveredCommit={hoveredCommit}
              onHoverCommit={setHoveredCommit}
              filterBranch={selectedBranch}
              searchQuery={searchQuery}
            />

            {selectedCommit && (
              <CommitDetailsDrawer
                commit={selectedCommit}
                onClose={() => setSelectedCommit(null)}
                onSelectCommitHash={handleSelectCommitHash}
              />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
