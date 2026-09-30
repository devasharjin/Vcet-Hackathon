import React from 'react';
import {
  FolderGit2,
  GitBranch,
  GitCommit,
  CheckCircle2,
  AlertCircle,
  FileCode,
  User,
  Calendar,
} from 'lucide-react';
import { RepositoryInfo as IRepoInfo, GitStatusSummary } from '../../types/repository.js';
import { formatDate, formatTimeAgo } from '../../utils/formatting.js';

export interface RepositoryInfoProps {
  info: IRepoInfo;
  status: GitStatusSummary | null;
}

export const RepositoryInfo: React.FC<RepositoryInfoProps> = ({ info, status }) => {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d] text-[#58a6ff]">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">{info.name}</h2>
            <p className="text-xs font-mono text-[#8b949e]">{info.path}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#21262d] border border-[#30363d] text-xs font-mono">
            <GitBranch className="w-4 h-4 text-[#58a6ff]" />
            <span className="text-[#8b949e]">HEAD:</span>
            <span className="text-white font-semibold">{info.currentBranch}</span>
          </div>

          {info.isClean ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#238636]/10 border border-[#238636]/30 text-xs text-[#3fb950]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Clean Tree</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#d29922]/10 border border-[#d29922]/30 text-xs text-[#d29922]">
              <AlertCircle className="w-4 h-4" />
              <span>{info.modifiedFilesCount} Modified Files</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Last Commit + Working Tree Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Last Commit */}
        <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            <GitCommit className="w-4 h-4 text-[#a371f7]" />
            <span>Latest Commit</span>
          </div>
          {info.lastCommit ? (
            <div className="space-y-1.5 pt-1">
              <p className="text-sm font-medium text-[#c9d1d9] leading-snug">
                {info.lastCommit.message}
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-[#8b949e]">
                <span className="text-[#58a6ff]">{info.lastCommit.hash.substring(0, 7)}</span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {info.lastCommit.author}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatTimeAgo(info.lastCommit.date)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#8b949e]">No commit history found.</p>
          )}
        </div>

        {/* Working Status Summary */}
        <div className="p-4 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            <FileCode className="w-4 h-4 text-[#58a6ff]" />
            <span>Working Tree Status</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
              <span className="block text-base font-bold text-[#3fb950]">
                {status?.staged.length || 0}
              </span>
              <span className="text-[10px] uppercase text-[#8b949e]">Staged</span>
            </div>
            <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
              <span className="block text-base font-bold text-[#d29922]">
                {status?.modified.length || 0}
              </span>
              <span className="text-[10px] uppercase text-[#8b949e]">Modified</span>
            </div>
            <div className="p-2 rounded bg-[#161b22] border border-[#30363d]">
              <span className="block text-base font-bold text-[#8b949e]">
                {status?.untracked.length || 0}
              </span>
              <span className="text-[10px] uppercase text-[#8b949e]">Untracked</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
