import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  Edit3,
  X,
  HelpCircle,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  FileCode,
} from 'lucide-react';
import { ConflictItem } from '../../types/conflict.js';
import { ConfidenceBadge } from './ConfidenceBadge.js';
import { Button } from '../common/Button.js';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modifiedLines?: { start: number; end: number };
  changesCount?: number;
}

export interface AIAnalysisProps {
  conflict: ConflictItem;
  onAccept: () => void;
  onEditToggle: () => void;
  onReject: () => void;
  onMarkReview: () => void;
  isEditing: boolean;
  isProcessing: boolean;
  onRefineConflict?: (userPrompt: string) => Promise<any>;
  selectedChangeIndex?: number | null;
  onSelectChange?: (index: number) => void;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({
  conflict,
  onAccept,
  onEditToggle,
  onReject,
  onMarkReview,
  isEditing,
  isProcessing,
  onRefineConflict,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset chat when active conflict changes
  useEffect(() => {
    setMessages([
      {
        id: `welcome-${conflict._id}`,
        sender: 'assistant',
        text: `I'm your AI Merge Copilot for "${conflict.filePath}". Describe how you want to resolve this conflict .`,
        timestamp: 'Just now',
      },
    ]);
    setInput('');
  }, [conflict._id, conflict.filePath]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleResetChat = () => {
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        text: `Conversation reset. Enter your instructions below and I'll adapt the merge resolution in the editor.`,
        timestamp: 'Just now',
      },
    ]);
  };

  const handleSubmit = async (promptToSend?: string) => {
    const text = (promptToSend || input).trim();
    if (!text || isLoading || !onRefineConflict) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await onRefineConflict(text);
      const changesCount = result?.changes?.length || 0;
      const firstChange = result?.changes?.[0];

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text:
          result?.message ||
          `Successfully updated resolution to match: "${text}". Conflicted lines have been updated in the editor.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        changesCount,
        modifiedLines: firstChange?.lineStart
          ? { start: firstChange.lineStart, end: firstChange.lineEnd || firstChange.lineStart }
          : undefined,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Unable to update resolution: ${
          err.message || 'Please try again with more specific instructions.'
        }`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#161b22] border-l border-[#30363d] overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#30363d] bg-[#181d24] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8957e5]/30 to-[#a371f7]/10 text-[#a371f7] border border-[#8957e5]/40 flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-white">AI Merge Copilot</h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30">
                Live
              </span>
            </div>
            <p className="text-[10px] text-[#8b949e]">Prompt-driven conflict resolution</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Reset conversation"
            onClick={handleResetChat}
            className="p-1 rounded text-[#8b949e] hover:text-white hover:bg-[#30363d] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <ConfidenceBadge confidence={conflict.confidence} />
        </div>
      </div>

      {/* Target File Sub-header */}
      <div className="px-3.5 py-1.5 bg-[#0d1117] border-b border-[#30363d] flex items-center justify-between text-[11px] font-mono shrink-0">
        <div className="flex items-center gap-1.5 text-[#8b949e] truncate">
          <FileCode className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
          <span className="text-[#c9d1d9] truncate font-medium">{conflict.filePath}</span>
        </div>
        <span className="text-[10px] text-[#3fb950] shrink-0 font-medium">
          {conflict.status || 'PROPOSED'}
        </span>
      </div>

      {/* Scrollable Chat Message Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#0d1117]/60">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[#8957e5]/20 text-[#a371f7] border border-[#8957e5]/40 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed transition-all ${
                m.sender === 'user'
                  ? 'bg-gradient-to-r from-[#1f6feb] to-[#238636] text-white rounded-br-xs shadow-md'
                  : 'bg-[#161b22] text-[#c9d1d9] border border-[#30363d] rounded-bl-xs shadow-sm'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>

              {/* Status Banner when AI updates the resolution */}
              {m.sender === 'assistant' && m.modifiedLines && (
                <div className="mt-2.5 pt-2 border-t border-[#30363d] space-y-1">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#3fb950] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950] shrink-0" />
                    <span>
                      Editor Updated: Lines {m.modifiedLines.start}
                      {m.modifiedLines.end > m.modifiedLines.start ? `–${m.modifiedLines.end}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#8b949e]">
                    <ShieldCheck className="w-3 h-3 text-[#58a6ff] shrink-0" />
                    <span>Non-conflicted code 100% untouched</span>
                  </div>
                </div>
              )}

              <div
                className={`mt-1.5 text-[9px] text-right ${
                  m.sender === 'user' ? 'text-white/70' : 'text-[#8b949e]'
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-6 h-6 rounded-full bg-[#1f6feb]/30 text-[#58a6ff] border border-[#1f6feb]/50 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-2.5 items-center text-xs text-[#a371f7] p-2.5 bg-[#161b22] border border-[#8957e5]/40 rounded-xl w-fit animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-[#a371f7]" />
            <span>Resolving conflict according to your prompt...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Prompt Input Box */}
      <div className="p-3 bg-[#161b22] border-t border-[#30363d] shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              disabled={isLoading || !onRefineConflict}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Type your needs to customize resolution..."
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#a371f7] focus:ring-1 focus:ring-[#a371f7] text-[#c9d1d9] placeholder-[#8b949e] text-xs px-3 py-2 rounded-lg outline-hidden transition-all pr-12"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b949e] text-[9px] font-mono pointer-events-none">
              ↵
            </div>
          </div>

          <button
            type="button"
            disabled={isLoading || !input.trim() || !onRefineConflict}
            onClick={() => handleSubmit()}
            className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#8957e5] to-[#7928ca] hover:from-[#9e6af7] hover:to-[#8a3ffc] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Apply</span>
          </button>
        </div>

        {/* Strict Boundary Guarantee */}
        <div className="flex items-center justify-between text-[10px] text-[#8b949e]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#3fb950]" />
            Modifies conflict code only
          </span>
          <span className="text-[#a371f7]">Updates Editor</span>
        </div>
      </div>

      {/* Human In The Loop Action Bar */}
      <div className="p-3 border-t border-[#30363d] bg-[#181d24] space-y-2 shrink-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">
          Human Approval Required
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="success"
            size="sm"
            onClick={onAccept}
            loading={isProcessing}
            icon={<Check className="w-3.5 h-3.5" />}
          >
            Accept Resolution
          </Button>

          <Button
            variant={isEditing ? 'primary' : 'secondary'}
            size="sm"
            onClick={onEditToggle}
            icon={<Edit3 className="w-3.5 h-3.5" />}
          >
            {isEditing ? 'Close Editor' : 'Edit Resolution'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onMarkReview}
            icon={<HelpCircle className="w-3.5 h-3.5" />}
          >
            Needs Review
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={onReject}
            icon={<X className="w-3.5 h-3.5" />}
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
};
