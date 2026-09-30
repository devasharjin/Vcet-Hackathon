import React, { useState, useEffect } from 'react';
import { FolderGit2, ArrowRight, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button.js';
import { repositoryApi } from '../../services/repositoryApi.js';
import { useRepositoryContext } from '../../context/RepositoryContext.js';

export interface RepositorySelectorProps {
  onSelectRepository: (path: string) => Promise<void>;
}

export const RepositorySelector: React.FC<RepositorySelectorProps> = ({ onSelectRepository }) => {
  const [inputPath, setInputPath] = useState('');
  const [recentRepos, setRecentRepos] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { createDemoRepo } = useRepositoryContext();

  useEffect(() => {
    repositoryApi
      .getRecentRepositories()
      .then((data) => setRecentRepos(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPath.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onSelectRepository(inputPath.trim());
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid repository path');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLaunchDemo = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const demo = await createDemoRepo();
      setInputPath(demo.path);
      await onSelectRepository(demo.path);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed generating sample demo repository');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Demo Callout */}
      <div className="p-4 rounded-xl bg-linear-to-r from-[#1f242c] to-[#161b22] border border-[#58a6ff]/30 flex items-center justify-between shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#58a6ff]" />
            <h4 className="text-sm font-semibold text-white">Instant Hackathon Demo</h4>
          </div>
          <p className="text-xs text-[#8b949e]">
            Auto-generate a real local Git repository with conflicting branches (<span className="text-[#58a6ff]">feature/payment</span> vs <span className="text-[#3fb950]">main</span>) ready to resolve!
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={submitting}
          onClick={handleLaunchDemo}
          icon={<Sparkles className="w-3.5 h-3.5" />}
        >
          Load Demo Repo
        </Button>
      </div>

      {/* Manual Path Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-2">
            Local Repository Path
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FolderGit2 className="h-4 w-4 text-[#8b949e]" />
            </div>
            <input
              type="text"
              value={inputPath}
              onChange={(e) => setInputPath(e.target.value)}
              placeholder="e.g. C:/Projects/coop or C:\Projects\coop"
              className="block w-full pl-10 pr-24 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm font-mono text-[#c9d1d9] placeholder-[#8b949e]/50 focus:outline-none focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] transition-all"
            />
            <div className="absolute inset-y-1 right-1 flex items-center">
              <Button
                type="submit"
                size="sm"
                loading={submitting}
                disabled={!inputPath.trim()}
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Open
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-[#8b949e] mt-1.5">
            Path must be an accessible local directory containing a valid <code className="text-[#c9d1d9]">.git</code> repository.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#da3633]/10 border border-[#da3633]/30 text-xs text-[#f85149] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </form>

      {/* Recent Repositories */}
      {recentRepos.length > 0 && (
        <div className="pt-2 border-t border-[#30363d]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-3">
            <Clock className="w-3.5 h-3.5" />
            <span>Recent Repositories</span>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {recentRepos.map((repo) => (
              <button
                key={repo._id || repo.path}
                type="button"
                onClick={() => {
                  setInputPath(repo.path);
                  onSelectRepository(repo.path);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#21262d]/50 hover:bg-[#21262d] border border-transparent hover:border-[#30363d] text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <FolderGit2 className="w-4 h-4 text-[#8b949e] group-hover:text-[#58a6ff] shrink-0" />
                  <div className="truncate">
                    <p className="text-xs font-medium text-[#c9d1d9] group-hover:text-white truncate">
                      {repo.name}
                    </p>
                    <p className="text-[11px] font-mono text-[#8b949e] truncate">{repo.path}</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#8b949e] shrink-0">
                  {repo.currentBranch}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
