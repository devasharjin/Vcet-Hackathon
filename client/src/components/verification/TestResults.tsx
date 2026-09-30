import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { VerificationResult } from '../../types/verification.js';
import { VerificationStatus } from './VerificationStatus.js';

export interface TestResultsProps {
  result: VerificationResult | null;
  loading: boolean;
}

export const TestResults: React.FC<TestResultsProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <div className="p-8 text-center bg-[#161b22] border border-[#30363d] rounded-xl space-y-3 animate-pulse">
        <ShieldCheck className="w-8 h-8 text-[#58a6ff] mx-auto animate-bounce" />
        <p className="text-sm font-semibold text-white">Running Automated Verification Suite...</p>
        <p className="text-xs text-[#8b949e]">
          Checking conflict markers, language syntax, project build, and git integrity.
        </p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div
        className={`p-4 rounded-xl border flex items-center justify-between ${
          result.success
            ? 'bg-[#238636]/15 border-[#238636]/40 text-[#3fb950]'
            : 'bg-[#da3633]/15 border-[#da3633]/40 text-[#f85149]'
        }`}
      >
        <div className="flex items-center gap-3">
          {result.success ? (
            <ShieldCheck className="w-6 h-6 text-[#3fb950]" />
          ) : (
            <ShieldAlert className="w-6 h-6 text-[#f85149]" />
          )}
          <div>
            <h4 className="text-sm font-bold text-white">
              {result.success ? 'Verification Passed' : 'Verification Checks Failed'}
            </h4>
            <p className="text-xs text-[#c9d1d9] opacity-90">
              {result.success
                ? 'All integrity, syntax, and build verifications completed with zero errors.'
                : 'One or more verification checks failed. Review terminal logs before applying.'}
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#0d1117]/60 border border-current">
          {result.success ? 'PASSED' : 'FAILED'}
        </span>
      </div>

      {/* Individual Checks */}
      <div className="space-y-3">
        {result.checks.map((check) => (
          <VerificationStatus key={check.id} check={check} />
        ))}
      </div>
    </div>
  );
};
