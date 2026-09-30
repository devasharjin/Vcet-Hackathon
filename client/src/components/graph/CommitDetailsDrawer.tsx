import React, { useState } from 'react';
import { GitGraphNode } from '../../types/repository.js';
import {
  X,
  GitCommit,
  GitMerge,
  GitBranch,
  Calendar,
  User,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  GitPullRequest,
  Hash,
} from 'lucide-react';

interface CommitDetailsDrawerProps {
  commit: GitGraphNode | null;
  onClose: () => void;
  onSelectCommitHash: (hash: string) => void;
}

const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600',
  'from-purple-600 to-pink-600',
  'from-emerald-600 to-teal-600',
  'from-amber-600 to-orange-600',
  'from-rose-600 to-red-600',
];

const getAvatarGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  }
  return AVATAR_GRADIENTS[hash];
};

export const CommitDetailsDrawer: React.FC<CommitDetailsDrawerProps> = ({
  commit,
  onClose,
  onSelectCommitHash,
}) => {
  const [copiedSha, setCopiedSha] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!commit) return null;

  const handleCopySha = () => {
    navigator.clipboard.writeText(commit.hash);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const handleCopyMsg = () => {
    navigator.clipboard.writeText(commit.message);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  const isMerge = commit.isMerge || commit.parents.length > 1;

  return (
    <div className="w-[420px] border-l border-[#30363d] bg-[#161b22]/95 backdrop-blur-md flex flex-col h-full shrink-0 shadow-2xl z-30 transition-all duration-200 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-16 px-6 border-b border-[#30363d] flex items-center justify-between bg-[#181e26]/80">
        <div className="flex items-center gap-2.5">
          {isMerge ? (
            <div className="p-2 rounded-lg bg-linear-to-br from-[#a371f7]/20 to-[#58a6ff]/20 border border-[#a371f7]/40 text-[#d2a8ff]">
              <GitMerge className="w-4 h-4 text-[#a371f7]" />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-[#58a6ff]/15 border border-[#58a6ff]/30 text-[#58a6ff]">
              <GitCommit className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                {isMerge ? 'Merge Commit' : 'Commit Details'}
              </span>
              <span className="font-mono text-xs text-[#79c0ff] bg-[#58a6ff]/10 px-1.5 py-0.2 rounded border border-[#58a6ff]/20">
                {commit.shortHash}
              </span>
            </div>
            <p className="text-[11px] text-[#8b949e]">
              {isMerge ? 'Dual-branch convergence point' : 'Topological commit node'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
        {/* Full Commit SHA Box */}
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e] block mb-1.5">
            Full SHA Identifier
          </label>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] font-mono text-xs text-[#c9d1d9]">
            <div className="flex items-center gap-2 truncate pr-2">
              <Hash className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
              <span className="truncate">{commit.hash}</span>
            </div>
            <button
              onClick={handleCopySha}
              className="p-1.5 hover:text-white text-[#8b949e] transition-colors rounded hover:bg-[#21262d] shrink-0"
              title="Copy full SHA"
            >
              {copiedSha ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Commit Message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e]">
              Message
            </label>
            <button
              onClick={handleCopyMsg}
              className="text-[11px] text-[#8b949e] hover:text-white flex items-center gap-1 font-mono"
            >
              {copiedMsg ? <Check className="w-3 h-3 text-[#3fb950]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedMsg ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs font-mono leading-relaxed text-[#f0f6fc] shadow-inner">
            {commit.message}
          </div>
        </div>

        {/* Dual-Branch Convergence Architecture Card */}
        {isMerge && (
          <div className="p-4 rounded-xl border border-[#a371f7]/40 bg-linear-to-b from-[#a371f7]/15 to-[#161b22] space-y-3.5 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold text-[#d2a8ff]">
              <GitPullRequest className="w-4 h-4 text-[#a371f7]" />
              <span>Two Branches Merged at this Point</span>
            </div>

            <p className="text-[11px] text-[#8b949e] leading-relaxed">
              This merge commit reconciles divergent changes between two separate branch tracks into a single unified commit.
            </p>

            {/* Interactive Visual Merge Flow Diagram */}
            <div className="space-y-2 p-3 rounded-lg bg-[#0d1117]/90 border border-[#30363d]">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#8b949e] flex items-center justify-between">
                <span>Incoming Parent Branches</span>
                <span>Action</span>
              </div>

              {commit.parents.map((pHash, idx) => {
                const isTarget = idx === 0;
                return (
                  <div
                    key={pHash}
                    className="flex items-center justify-between py-1.5 border-t border-[#21262d] first:border-none text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isTarget ? 'bg-[#58a6ff]' : 'bg-[#a371f7]'
                        }`}
                      />
                      <span className="text-[#8b949e]">
                        {isTarget ? 'Target Branch (Parent 1)' : 'Merged Branch (Parent 2)'}
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectCommitHash(pHash)}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#21262d] hover:bg-[#30363d] text-[#79c0ff] border border-[#30363d] transition-colors"
                      title="Jump to parent in graph"
                    >
                      <span>{pHash.substring(0, 7)}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Author & Timestamp Card */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full bg-linear-to-br ${getAvatarGradient(
                commit.author.name
              )} flex items-center justify-center text-xs font-bold text-white shadow-xs shrink-0`}
            >
              {commit.author.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{commit.author.name}</div>
              <div className="text-[11px] text-[#8b949e] font-mono truncate">{commit.author.email}</div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#21262d] flex items-center gap-2 text-xs text-[#8b949e]">
            <Calendar className="w-3.5 h-3.5 text-[#58a6ff]" />
            <div className="flex items-center gap-2">
              <span className="text-[#c9d1d9]">{commit.relativeDate}</span>
              <span className="text-[11px] font-mono text-[#6e7681]">
                ({new Date(commit.date).toLocaleDateString()}{' '}
                {new Date(commit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            </div>
          </div>
        </div>

        {/* Branch Tips referencing this commit */}
        {commit.branches.length > 0 && (
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e] block mb-2">
              Branch Tips Pointing Here
            </label>
            <div className="flex flex-wrap gap-1.5">
              {commit.branches.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-[#58a6ff]/10 text-[#79c0ff] border border-[#58a6ff]/30"
                >
                  <GitBranch className="w-3 h-3 text-[#58a6ff]" />
                  <span>{b}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Regular Parent Commits list if not merge */}
        {!isMerge && commit.parents.length > 0 && (
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-[#8b949e] block mb-2">
              Parent Commit
            </label>
            <div className="space-y-1.5">
              {commit.parents.map((p) => (
                <button
                  key={p}
                  onClick={() => onSelectCommitHash(p)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] text-xs font-mono text-[#79c0ff] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#58a6ff]" />
                    <span>{p.substring(0, 10)}</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#8b949e]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
