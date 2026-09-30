import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  GitBranch,
  GitCommit,
  CheckCircle2,
  FolderGit2,
  Calendar,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { conflictApi } from '../services/conflictApi.js';
import { Button } from '../components/common/Button.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { formatDate, formatTimeAgo } from '../utils/formatting.js';
import { useRepositoryContext } from '../context/RepositoryContext.js';

export const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { setActiveSessionId } = useRepositoryContext();
  const navigate = useNavigate();

  useEffect(() => {
    conflictApi
      .getHistory()
      .then((data) => setHistory(data))
      .catch((err) => console.error('Failed fetching history:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleOpenSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    navigate('/conflicts');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#238636]/15 text-[#3fb950] border border-[#238636]/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COMMITTED
          </span>
        );
      case 'ROLLED_BACK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#da3633]/15 text-[#f85149] border border-[#da3633]/40">
            <RotateCcw className="w-3.5 h-3.5" />
            ROLLED BACK
          </span>
        );
      case 'VERIFIED':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/40">
            <ShieldCheck className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#21262d] text-[#c9d1d9] border border-[#30363d]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-[#58a6ff]" />
            Merge Resolution History
          </h1>
          <p className="text-xs text-[#8b949e] mt-1">
            Audit log of all analyzed Git merge conflicts, human approvals, and committed resolutions.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center bg-[#161b22] border border-[#30363d] rounded-xl animate-pulse">
          <p className="text-xs text-[#8b949e]">Loading merge history...</p>
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={<History className="w-12 h-12 text-[#8b949e]" />}
          title="No Past Merge Sessions Found"
          description="Merge sessions analyzed with MergeMind will be permanently logged here with verification results and commit references."
          action={
            <Button onClick={() => navigate('/repository')} icon={<GitBranch className="w-4 h-4" />}>
              Analyze a Merge
            </Button>
          }
        />
      ) : (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181d24] border-b border-[#30363d] text-[#8b949e] uppercase font-mono tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Repository</th>
                <th className="py-3.5 px-4">Branches Merged</th>
                <th className="py-3.5 px-4 text-center">Conflicts</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Commit Hash</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d] font-mono">
              {history.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-[#1c2128] transition-colors group cursor-pointer"
                  onClick={() => handleOpenSession(item._id)}
                >
                  <td className="py-4 px-4 font-medium text-[#c9d1d9]">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-4 h-4 text-[#58a6ff] shrink-0" />
                      <span className="truncate max-w-[150px]">{item.repositoryPath}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#58a6ff] font-semibold">{item.sourceBranch}</span>
                      <span className="text-[#8b949e]">→</span>
                      <span className="text-[#3fb950] font-semibold">{item.targetBranch}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-center">
                    <span className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-white">
                      {item.conflictCount || 0}
                    </span>
                  </td>

                  <td className="py-4 px-4">{getStatusBadge(item.status)}</td>

                  <td className="py-4 px-4 text-[#8b949e]">
                    {item.commitHash ? (
                      <span className="flex items-center gap-1 text-[#58a6ff]">
                        <GitCommit className="w-3.5 h-3.5" />
                        {item.commitHash.substring(0, 7)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>

                  <td className="py-4 px-4 text-[#8b949e]">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </td>

                  <td className="py-4 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSession(item._id);
                      }}
                      icon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
