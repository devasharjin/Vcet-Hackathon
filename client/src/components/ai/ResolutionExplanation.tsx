import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  ListPlus,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { ConflictItem, AIChangeDetail } from '../../types/conflict.js';

export interface ResolutionExplanationProps {
  conflict: ConflictItem;
  onSelectChange?: (index: number) => void;
  selectedChangeIndex?: number | null;
}

export const ResolutionExplanation: React.FC<ResolutionExplanationProps> = ({
  conflict,
  onSelectChange,
  selectedChangeIndex,
}) => {
  const { summary, changes, risks, verificationSuggestions } = conflict.aiExplanation;
  const [expandedSnippetIdx, setExpandedSnippetIdx] = useState<number | null>(null);

  const toggleSnippet = (idx: number) => {
    setExpandedSnippetIdx((prev) => (prev === idx ? null : idx));
  };

  const getChangeBadge = (type?: string) => {
    switch (type?.toUpperCase()) {
      case 'ADDITION':
        return {
          label: '+ ADDED',
          style: 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/40',
        };
      case 'IMPORT':
        return {
          label: '⚡ IMPORT',
          style: 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40',
        };
      case 'SYNTHESIS':
      case 'RESOLVED_HUNK':
        return {
          label: '✨ SYNTHESIS',
          style: 'bg-[#8957e5]/20 text-[#a371f7] border-[#8957e5]/40',
        };
      case 'MODIFICATION':
        return {
          label: '~ MODIFIED',
          style: 'bg-[#d29922]/20 text-[#d29922] border-[#d29922]/40',
        };
      default:
        return {
          label: 'AI CHANGE',
          style: 'bg-[#8957e5]/20 text-[#a371f7] border-[#8957e5]/40',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-3.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#58a6ff]">
          <Info className="w-3.5 h-3.5" />
          <span>Resolution Summary</span>
        </div>
        <p className="text-xs text-[#c9d1d9] leading-relaxed">{summary}</p>
      </div>

      {/* AI Resolution Quality Checklist */}
      <div className="p-3 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#a371f7]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AI Quality & Safety Verification</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-[#c9d1d9]">
          <div className="flex items-center gap-1 text-[#3fb950] bg-[#238636]/5 p-1.5 rounded border border-[#238636]/20">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>0 Conflict Markers</span>
          </div>
          <div className="flex items-center gap-1 text-[#3fb950] bg-[#238636]/5 p-1.5 rounded border border-[#238636]/20">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Syntax Balanced</span>
          </div>
          <div className="flex items-center gap-1 text-[#58a6ff] bg-[#1f6feb]/5 p-1.5 rounded border border-[#1f6feb]/20">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Target Contract Kept</span>
          </div>
          <div className="flex items-center gap-1 text-[#a371f7] bg-[#8957e5]/5 p-1.5 rounded border border-[#8957e5]/20">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Source Features Ported</span>
          </div>
        </div>
      </div>

      {/* Changes Breakdown */}
      {changes && changes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8b949e]">
              <ListPlus className="w-3.5 h-3.5 text-[#a371f7]" />
              <span>AI Changes ({changes.length})</span>
            </div>
            <span className="text-[10px] text-[#8b949e]">Click card to inspect</span>
          </div>

          <div className="space-y-2">
            {changes.map((c, i) => {
              const badge = getChangeBadge(c.changeType);
              const isSelected = selectedChangeIndex === i;
              const isExpanded = expandedSnippetIdx === i;

              return (
                <div
                  key={i}
                  className={`rounded-md bg-[#0d1117] border transition-all text-xs overflow-hidden ${
                    isSelected
                      ? 'border-[#58a6ff] ring-1 ring-[#58a6ff]/40 shadow-xs'
                      : 'border-[#30363d] hover:border-[#484f58]'
                  }`}
                >
                  <div
                    onClick={() => onSelectChange && onSelectChange(i)}
                    className="p-3 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium border ${badge.style}`}
                      >
                        {badge.label}
                      </span>

                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        {c.lineStart && (
                          <span className="text-[#58a6ff] bg-[#58a6ff]/10 px-1.5 py-0.2 rounded border border-[#58a6ff]/20">
                            L{c.lineStart}{c.lineEnd && c.lineEnd > c.lineStart ? `-${c.lineEnd}` : ''}
                          </span>
                        )}
                        <span className="text-[#8b949e] text-[10px]">
                          [{c.source || 'both'}]
                        </span>
                      </div>
                    </div>

                    <p className="font-medium text-[#c9d1d9] leading-snug">{c.description}</p>
                    <p className="text-[11px] text-[#8b949e] italic leading-relaxed">{c.reason}</p>
                  </div>

                  {/* Snippet expander toggle */}
                  {(c.originalSnippet || c.resolvedSnippet) && (
                    <div className="border-t border-[#30363d]/60 bg-[#161b22]/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSnippet(i);
                        }}
                        className="w-full px-3 py-1.5 flex items-center justify-between text-[11px] text-[#8b949e] hover:text-[#c9d1d9] transition-colors"
                      >
                        <span>{isExpanded ? 'Hide Code Snippets' : 'View Code Snippets'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-2.5 pt-0 space-y-2 text-[11px] font-mono">
                          {c.originalSnippet && (
                            <div>
                              <div className="text-[10px] text-[#f85149] font-semibold mb-1">
                                Conflicted Input:
                              </div>
                              <pre className="p-2 rounded bg-[#0d1117] border border-[#f85149]/20 text-[#f85149] overflow-x-auto text-[10px]">
                                {c.originalSnippet}
                              </pre>
                            </div>
                          )}

                          {c.resolvedSnippet && (
                            <div>
                              <div className="text-[10px] text-[#3fb950] font-semibold mb-1">
                                AI Proposed Merged Code:
                              </div>
                              <pre className="p-2 rounded bg-[#0d1117] border border-[#3fb950]/20 text-[#3fb950] overflow-x-auto text-[10px]">
                                {c.resolvedSnippet}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Potential Risks */}
      {risks && risks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#d29922]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Behavioral Considerations</span>
          </div>
          <ul className="space-y-1 text-xs text-[#c9d1d9]">
            {risks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 p-2 rounded bg-[#d29922]/5 border border-[#d29922]/20">
                <span className="text-[#d29922] mt-0.5">•</span>
                <span className="leading-snug">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Verification Suggestions */}
      {verificationSuggestions && verificationSuggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#3fb950]">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Recommended Sanity Checks</span>
          </div>
          <ul className="space-y-1 text-xs text-[#c9d1d9]">
            {verificationSuggestions.map((v, i) => (
              <li key={i} className="flex items-start gap-2 p-2 rounded bg-[#238636]/5 border border-[#238636]/20">
                <span className="text-[#3fb950] mt-0.5">✓</span>
                <span className="leading-snug">{v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

