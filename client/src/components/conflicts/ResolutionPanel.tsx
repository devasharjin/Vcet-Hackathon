import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Save, Check, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button.js';
import { ConflictItem } from '../../types/conflict.js';

export interface ResolutionPanelProps {
  conflict: ConflictItem;
  onSaveModifiedResolution: (code: string) => Promise<void>;
  onCancel: () => void;
  onRefineConflict?: (userPrompt: string) => Promise<any>;
}

export const ResolutionPanel: React.FC<ResolutionPanelProps> = ({
  conflict,
  onSaveModifiedResolution,
  onCancel,
  onRefineConflict,
}) => {
  const [code, setCode] = useState(conflict.proposedResolution);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCode(conflict.proposedResolution);
  }, [conflict.proposedResolution]);

  const handleResetToAI = () => {
    setCode(conflict.proposedResolution);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveModifiedResolution(code);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChatRefine = async (userPrompt: string) => {
    if (!onRefineConflict) return;
    const result = await onRefineConflict(userPrompt);
    if (result?.mergedCode) {
      setCode(result.mergedCode);
    }
    return result;
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-lg overflow-hidden border border-[#30363d]">
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-[#c9d1d9]">
            Editing Resolution: {conflict.filePath}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30 font-mono">
            {conflict.language}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToAI}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reset to AI Proposal
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            variant="success"
            size="sm"
            loading={isSaving}
            onClick={handleSave}
            icon={<Save className="w-3.5 h-3.5" />}
          >
            Save & Approve
          </Button>
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div className="flex-1 w-full h-full min-h-[350px]">
        <Editor
          height="100%"
          language={conflict.language}
          value={code}
          onChange={(val) => setCode(val || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>
    </div>
  );
};

