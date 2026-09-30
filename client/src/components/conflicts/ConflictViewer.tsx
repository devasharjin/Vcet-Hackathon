import React, { useState } from 'react';
import { Sparkles, Columns } from 'lucide-react';
import { ConflictItem } from '../../types/conflict.js';
import { DiffViewer } from './DiffViewer.js';
import { AIHighlightsViewer } from './AIHighlightsViewer.js';

export interface ConflictViewerProps {
  conflict: ConflictItem;
  isEditing?: boolean;
  onEditToggle?: () => void;
  onSaveModifiedResolution: (code: string) => Promise<void>;
  selectedChangeIndex?: number | null;
  onSelectChangeIndex?: (index: number) => void;
  onRefineConflict?: (userPrompt: string) => Promise<any>;
}

export const ConflictViewer: React.FC<ConflictViewerProps> = ({
  conflict,
  onSaveModifiedResolution,
  selectedChangeIndex,
  onSelectChangeIndex,
}) => {
  const [activeTab, setActiveTab] = useState<'resolution' | 'theirs_ours'>('resolution');

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0d1117]">
      {/* Top View Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d] shrink-0">
        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-lg border border-[#30363d]">
          {/* Tab 1: Proposed Resolution */}
          <button
            onClick={() => setActiveTab('resolution')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'resolution'
                ? 'bg-[#21262d] text-[#a371f7] shadow-xs'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#a371f7]" />
            Proposed Resolution
          </button>

          {/* Tab 2: Ours vs Theirs */}
          <button
            onClick={() => setActiveTab('theirs_ours')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'theirs_ours'
                ? 'bg-[#21262d] text-[#58a6ff] shadow-xs'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Ours vs Theirs
          </button>
        </div>

        <div className="text-xs text-[#8b949e] font-mono flex items-center gap-2">
          <span>Click anywhere in code to edit</span>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-hidden p-2">
        {activeTab === 'resolution' && (
          <AIHighlightsViewer
            conflict={conflict}
            selectedChangeIndex={selectedChangeIndex}
            onSelectChangeIndex={onSelectChangeIndex}
            onSaveModifiedResolution={onSaveModifiedResolution}
          />
        )}

        {activeTab === 'theirs_ours' && (
          <DiffViewer
            originalContent={conflict.oursContent}
            modifiedContent={conflict.theirsContent}
            language={conflict.language}
            originalTitle="Target Branch (Ours)"
            modifiedTitle="Source Branch (Theirs)"
          />
        )}
      </div>
    </div>
  );
};
