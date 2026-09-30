import React from 'react';
import { DiffEditor } from '@monaco-editor/react';

export interface DiffViewerProps {
  originalContent: string;
  modifiedContent: string;
  language?: string;
  originalTitle?: string;
  modifiedTitle?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalContent,
  modifiedContent,
  language = 'typescript',
  originalTitle = 'Original (Target Branch)',
  modifiedTitle = 'Proposed Resolution',
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-lg overflow-hidden border border-[#30363d]">
      {/* Pane headers */}
      <div className="grid grid-cols-2 border-b border-[#30363d] bg-[#161b22] text-xs font-mono font-medium">
        <div className="px-4 py-2 text-[#f85149] border-r border-[#30363d] flex items-center justify-between">
          <span>{originalTitle}</span>
          <span className="text-[10px] text-[#8b949e]">BEFORE / OURS</span>
        </div>
        <div className="px-4 py-2 text-[#3fb950] flex items-center justify-between">
          <span>{modifiedTitle}</span>
          <span className="text-[10px] text-[#8b949e]">PROPOSED / MERGED</span>
        </div>
      </div>

      {/* Monaco Diff Editor */}
      <div className="flex-1 w-full h-full min-h-[400px]">
        <DiffEditor
          height="100%"
          language={language}
          original={originalContent}
          modified={modifiedContent}
          theme="vs-dark"
          options={{
            readOnly: true,
            renderSideBySide: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            diffWordWrap: 'off',
            renderIndicators: true,
            originalEditable: false,
          }}
        />
      </div>
    </div>
  );
};
