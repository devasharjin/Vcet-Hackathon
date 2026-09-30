import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock, SkipForward } from 'lucide-react';
import { VerificationCheck } from '../../types/verification.js';

export interface VerificationStatusProps {
  check: VerificationCheck;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({ check }) => {
  const statusIcons = {
    PASSED: <CheckCircle2 className="w-4 h-4 text-[#3fb950]" />,
    FAILED: <XCircle className="w-4 h-4 text-[#f85149]" />,
    RUNNING: <Clock className="w-4 h-4 text-[#58a6ff] animate-spin" />,
    PENDING: <Clock className="w-4 h-4 text-[#8b949e]" />,
    SKIPPED: <SkipForward className="w-4 h-4 text-[#8b949e]" />,
  };

  const statusBg = {
    PASSED: 'bg-[#238636]/10 border-[#238636]/30',
    FAILED: 'bg-[#da3633]/10 border-[#da3633]/30',
    RUNNING: 'bg-[#58a6ff]/10 border-[#58a6ff]/30',
    PENDING: 'bg-[#21262d] border-[#30363d]',
    SKIPPED: 'bg-[#21262d]/50 border-[#30363d]',
  };

  return (
    <div className={`p-4 rounded-xl border space-y-2 transition-all ${statusBg[check.status]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {statusIcons[check.status]}
          <span className="text-sm font-semibold text-white">{check.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {check.durationMs !== undefined && (
            <span className="text-[11px] font-mono text-[#8b949e]">
              {check.durationMs}ms
            </span>
          )}
          <span
            className={`text-xs font-mono font-medium uppercase px-2 py-0.5 rounded ${
              check.status === 'PASSED'
                ? 'text-[#3fb950]'
                : check.status === 'FAILED'
                ? 'text-[#f85149]'
                : 'text-[#8b949e]'
            }`}
          >
            {check.status}
          </span>
        </div>
      </div>

      <p className="text-xs text-[#c9d1d9] pl-6.5">{check.message}</p>

      {check.output && (
        <div className="mt-2 pl-6.5">
          <pre className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs font-mono text-[#8b949e] overflow-x-auto whitespace-pre-wrap max-h-40">
            {check.output}
          </pre>
        </div>
      )}
    </div>
  );
};
