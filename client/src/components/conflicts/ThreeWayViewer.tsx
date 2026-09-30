import React from 'react';
import Editor from '@monaco-editor/react';
import { Sparkles, GitBranch, ArrowRight, Layers } from 'lucide-react';
import { ConflictItem } from '../../types/conflict.js';

export interface ThreeWayViewerProps {
  conflict: ConflictItem;
}

export const ThreeWayViewer: React.FC<ThreeWayViewerProps> = ({ conflict }) => {
  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-lg overflow-hidden border border-[#30363d]">
      {/* 3-Pane Headers */}
      <div className="grid grid-cols-3 border-b border-[#30363d] bg-[#161b22] text-xs font-mono font-medium divide-x divide-[#30363d]">
        {/* Pane 1: Ours */}
        <div className="px-4 py-2.5 flex items-center justify-between text-[#58a6ff]">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="font-semibold">Target Branch (Ours)</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30">
            BASE / LOCAL
          </span>
        </div>

        {/* Pane 2: AI Proposed */}
        <div className="px-4 py-2.5 flex items-center justify-between text-[#a371f7] bg-[#1c182a]/40">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#a371f7]" />
            <span className="font-semibold">AI Harmonized Resolution</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#8957e5]/20 text-[#a371f7] border border-[#8957e5]/40">
            PROPOSED MERGE
          </span>
        </div>

        {/* Pane 3: Theirs */}
        <div className="px-4 py-2.5 flex items-center justify-between text-[#3fb950]">
          <div className="flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            <span className="font-semibold">Source Branch (Theirs)</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#238636]/10 text-[#3fb950] border border-[#238636]/30">
            INCOMING
          </span>
        </div>
      </div>

      {/* 3 Monaco Editor Panes */}
      <div className="flex-1 grid grid-cols-3 divide-x divide-[#30363d] overflow-hidden min-h-[420px]">
        {/* Ours Editor */}
        <div className="h-full w-full">
          <Editor
            height="100%"
            language={conflict.language}
            value={conflict.oursContent}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Proposed Editor */}
        <div className="h-full w-full bg-[#12101a]/30">
          <Editor
            height="100%"
            language={conflict.language}
            value={conflict.proposedResolution}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        </div>

        {/* Theirs Editor */}
        <div className="h-full w-full">
          <Editor
            height="100%"
            language={conflict.language}
            value={conflict.theirsContent}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
            }}
          />
        </div>
      </div>
    </div>
  );
};
