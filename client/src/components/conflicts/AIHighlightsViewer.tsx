import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  Sparkles,
  ShieldCheck,
  FileCode,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react';
import { ConflictItem } from '../../types/conflict.js';
import { Button } from '../common/Button.js';

export interface AIHighlightsViewerProps {
  conflict: ConflictItem;
  onSaveModifiedResolution?: (code: string) => Promise<void>;
  selectedChangeIndex?: number | null;
  onSelectChangeIndex?: (index: number) => void;
  onOpenEditor?: () => void;
}

/**
 * Computes 1-based line numbers in modified text that differ from original text
 */
function computeDiffLines(original: string, modified: string): number[] {
  if (!original && !modified) return [];
  if (!original) {
    return Array.from({ length: modified.split(/\r?\n/).length }, (_, i) => i + 1);
  }

  const orig = original.split(/\r?\n/);
  const mod = modified.split(/\r?\n/);
  const m = orig.length;
  const n = mod.length;

  if (m * n > 250000) {
    const origSet = new Set(orig);
    const changed: number[] = [];
    mod.forEach((line, idx) => {
      if (!origSet.has(line)) changed.push(idx + 1);
    });
    return changed;
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (orig[i] === mod[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const matchedInMod = new Set<number>();
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (orig[i - 1] === mod[j - 1]) {
      matchedInMod.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  const changedLineNumbers: number[] = [];
  for (let lineIdx = 0; lineIdx < n; lineIdx++) {
    if (!matchedInMod.has(lineIdx)) {
      changedLineNumbers.push(lineIdx + 1);
    }
  }
  return changedLineNumbers;
}

export const AIHighlightsViewer: React.FC<AIHighlightsViewerProps> = ({
  conflict,
  onSaveModifiedResolution,
}) => {
  const [code, setCode] = useState(conflict.proposedResolution);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  // Sync internal code state when conflict or AI proposal updates
  useEffect(() => {
    setCode(conflict.proposedResolution);
    setIsSavedRecently(false);
  }, [conflict.proposedResolution, conflict._id]);

  const hasUnsavedChanges = code !== conflict.proposedResolution;

  // Calculate all AI changed line numbers (combining conflict.aiExplanation.changes and diff lines)
  const aiChangedLines = useMemo(() => {
    const lineSet = new Set<number>();

    // 1. From AI structured explanation changes
    const explanationChanges = conflict.aiExplanation?.changes || [];
    explanationChanges.forEach((ch) => {
      const start = ch.lineStart && ch.lineStart > 0 ? ch.lineStart : 1;
      const end = ch.lineEnd && ch.lineEnd >= start ? ch.lineEnd : start;
      for (let l = start; l <= end; l++) {
        lineSet.add(l);
      }
    });

    // 2. From diff against target branch (oursContent)
    const diffLines = computeDiffLines(conflict.oursContent, code);
    diffLines.forEach((l) => lineSet.add(l));

    return Array.from(lineSet).sort((a, b) => a - b);
  }, [conflict.aiExplanation?.changes, conflict.oursContent, code]);

  // Apply visual highlights onto the Monaco editor
  const applyDecorations = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    if (aiChangedLines.length === 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const newDecorations = aiChangedLines.map((lineNum) => ({
      range: new monaco.Range(lineNum, 1, lineNum, 1),
      options: {
        isWholeLine: true,
        className: 'ai-change-line-highlight',
        glyphMarginClassName: 'ai-change-glyph',
        overviewRuler: {
          color: 'rgba(163, 113, 247, 0.85)',
          position: monaco.editor.OverviewRulerLane.Full,
        },
        hoverMessage: {
          value: `✨ **AI Changed Code** (Line ${lineNum})\nThis line contains the synthesized resolution for the merge conflict.`,
        },
      },
    }));

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [aiChangedLines]);

  // Trigger decorations when code, aiChangedLines, or editor changes
  useEffect(() => {
    applyDecorations();
  }, [applyDecorations]);

  const handleSave = async () => {
    if (!onSaveModifiedResolution || isSaving) return;
    setIsSaving(true);
    try {
      await onSaveModifiedResolution(code);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToAI = () => {
    setCode(conflict.proposedResolution);
  };

  // Jump to first changed line
  const handleJumpToChange = (lineNum?: number) => {
    const target = lineNum || aiChangedLines[0];
    if (target && editorRef.current) {
      editorRef.current.revealLineInCenter(target);
      editorRef.current.setPosition({ lineNumber: target, column: 1 });
      editorRef.current.focus();
    }
  };

  // Handle Monaco editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add Ctrl+S / Cmd+S shortcut to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    applyDecorations();

    // Auto-scroll to first AI-changed line if present
    if (aiChangedLines.length > 0) {
      setTimeout(() => {
        editor.revealLineInCenter(aiChangedLines[0]);
      }, 100);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] rounded-lg overflow-hidden border border-[#30363d]">
      {/* Top Header Bar */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#8957e5]/15 border border-[#8957e5]/30 text-xs font-semibold text-[#a371f7]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Proposed Resolution</span>
          </div>

          <span className="text-xs text-[#8b949e] font-mono flex items-center gap-1">
            <FileCode className="w-3 h-3 text-[#58a6ff]" />
            {conflict.filePath}
          </span>

          {/* AI Changed Lines Pill Indicator */}
          {aiChangedLines.length > 0 && (
            <button
              type="button"
              onClick={() => handleJumpToChange()}
              title="Click to jump to AI modified lines"
              className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#8957e5]/15 hover:bg-[#8957e5]/25 text-[#a371f7] border border-[#8957e5]/35 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#a371f7] animate-pulse" />
              <span>
                AI Changes: {aiChangedLines.length === 1 ? `Line ${aiChangedLines[0]}` : `Lines ${aiChangedLines[0]}–${aiChangedLines[aiChangedLines.length - 1]}`}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#d29922] bg-[#d29922]/10 border border-[#d29922]/30 px-2 py-0.5 rounded">
                Unsaved Edits
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetToAI}
                icon={<RotateCcw className="w-3 h-3" />}
              >
                Reset to AI
              </Button>
              <Button
                variant="success"
                size="sm"
                loading={isSaving}
                onClick={handleSave}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Edits
              </Button>
            </div>
          ) : isSavedRecently ? (
            <span className="text-[11px] font-mono text-[#3fb950] bg-[#3fb950]/10 border border-[#3fb950]/30 px-2.5 py-1 rounded flex items-center gap-1">
              <Check className="w-3 h-3" />
              Changes Saved
            </span>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#8b949e]">
                {conflict.language}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Monaco Code Editor with Live AI Change Highlighting */}
      <div className="flex-1 w-full h-full min-h-[420px] relative">
        <Editor
          height="100%"
          language={conflict.language}
          value={code}
          onChange={(val) => setCode(val || '')}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            readOnly: false,
            glyphMargin: true,
            minimap: { enabled: true },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
          }}
        />
      </div>

      {/* Footer Info Bar */}
      <div className="px-4 py-1.5 bg-[#161b22] border-t border-[#30363d] flex items-center justify-between text-[11px] text-[#8b949e] shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[#a371f7]">
            <ShieldCheck className="w-3.5 h-3.5" />
            Syntactically Harmonized
          </span>
          {aiChangedLines.length > 0 && (
            <>
              <span>•</span>
              <span className="text-[#a371f7]">
                Highlighted lines mark AI synthesized resolution
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[#8b949e]">
          <span>Directly edit code above • Press <kbd className="px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#c9d1d9]">Ctrl+S</kbd> to save</span>
        </div>
      </div>
    </div>
  );
};
