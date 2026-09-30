import React from 'react';
import { GitBranch, FolderGit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { RepositoryInfo } from '../../types/repository.js';

export interface HeaderProps {
  currentRepo: RepositoryInfo | null;
  onOpenRepoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRepo, onOpenRepoClick }) => {
  return (
    <header className="h-16 bg-[#161b22] border-b border-[#30363d] px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        {currentRepo ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#21262d] border border-[#30363d] text-xs font-mono text-[#c9d1d9]">
              <FolderGit2 className="w-3.5 h-3.5 text-[#58a6ff]" />
              <span className="font-semibold text-white">{currentRepo.name}</span>
              <span className="text-[#8b949e] max-w-[200px] truncate">({currentRepo.path})</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-xs font-mono text-[#58a6ff]">
              <GitBranch className="w-3.5 h-3.5" />
              <span>{currentRepo.currentBranch}</span>
            </div>

            {currentRepo.isClean ? (
              <span className="flex items-center gap-1 text-[11px] text-[#3fb950]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Working tree clean
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-[#d29922]">
                <AlertCircle className="w-3.5 h-3.5" />
                {currentRepo.modifiedFilesCount} modified
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs text-[#8b949e] font-mono flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-[#8b949e]" />
            <span>No repository currently opened</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenRepoClick}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border border-[#30363d] transition-colors flex items-center gap-1.5"
        >
          <FolderGit2 className="w-3.5 h-3.5 text-[#58a6ff]" />
          Change Repository
        </button>
      </div>
    </header>
  );
};
