import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  CornerDownLeft,
  Wand2,
  RotateCcw,
} from 'lucide-react';
import { ConflictItem } from '../../types/conflict.js';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  modifiedLines?: { start: number; end: number };
  changesCount?: number;
}

export interface ConflictChatbotProps {
  conflict: ConflictItem;
  onRefineConflict: (userPrompt: string) => Promise<any>;
}

export const ConflictChatbot: React.FC<ConflictChatbotProps> = ({
  conflict,
  onRefineConflict,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I can customize this resolution to your exact needs. Describe how you want to resolve the conflict (e.g. "Keep target validation but use source discount logic"). I will modify ONLY the conflicted code, keeping the rest of the file 100% untouched.`,
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Reset or re-greet when selected conflict changes
  useEffect(() => {
    setMessages([
      {
        id: `welcome-${conflict._id}`,
        sender: 'assistant',
        text: `Ready to assist with ${conflict.filePath}. Enter your instructions below and I'll accurately update the code in the editor while keeping all other code strictly intact.`,
        timestamp: 'Just now',
      },
    ]);
  }, [conflict._id, conflict.filePath]);

  const handleSubmit = async (promptToSend?: string) => {
    const text = (promptToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsOpen(true);

    try {
      const result = await onRefineConflict(text);
      const changesCount = result?.changes?.length || 0;
      const firstChange = result?.changes?.[0];

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: result?.message || `Successfully adapted resolution to your prompt: "${text}". Conflicted lines have been updated in the editor.`,
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
        text: `Sorry, I encountered an issue updating the code: ${err.message || 'Please try again with different instructions.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPills = [
    'Keep target validation + add source parameter',
    'Prefer source logic, but preserve target error handling',
    'Combine both sequentially with clear comments',
    'Keep our return contract, port their helper additions',
  ];

  return (
    <div className="bg-[#161b22] border-t border-[#30363d] flex flex-col shrink-0 transition-all duration-200">
      {/* Header bar / Collapsible toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-[#21262d]/60 select-none"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#8957e5]/20 text-[#a371f7] border border-[#8957e5]/40 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            AI Merge Copilot
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-[#3fb950]/10 text-[#3fb950] border border-[#3fb950]/30 font-mono">
              Live Prompting
            </span>
          </span>
          <span className="text-[11px] text-[#8b949e] hidden sm:inline">
            — Instruct AI to customize resolution (modifies only conflicted code)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8b949e]">
          <span className="text-[11px]">
            {isOpen ? 'Minimize chat' : 'Expand conversation'}
          </span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Chat Messages Container */}
      {isOpen && (
        <div className="h-56 overflow-y-auto px-4 py-3 space-y-3 bg-[#0d1117]/80 border-t border-[#30363d]/60">
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
                className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#1f6feb] text-white rounded-br-none shadow-sm'
                    : 'bg-[#161b22] text-[#c9d1d9] border border-[#30363d] rounded-bl-none shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>

                {m.sender === 'assistant' && m.modifiedLines && (
                  <div className="mt-2 pt-2 border-t border-[#30363d] flex items-center gap-2 font-mono text-[10px] text-[#3fb950]">
                    <CheckCircle2 className="w-3 h-3 text-[#3fb950]" />
                    <span>
                      Updated Editor: Lines {m.modifiedLines.start}
                      {m.modifiedLines.end > m.modifiedLines.start ? `-${m.modifiedLines.end}` : ''}
                    </span>
                    <span className="text-[#8b949e]">•</span>
                    <span className="text-[#58a6ff]">Other code unchanged</span>
                  </div>
                )}

                <div
                  className={`mt-1 text-[9px] text-right ${
                    m.sender === 'user' ? 'text-blue-200' : 'text-[#8b949e]'
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

          {isLoading && (
            <div className="flex gap-2.5 items-center text-xs text-[#a371f7] p-2 bg-[#161b22] border border-[#8957e5]/30 rounded-lg w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>AI is reconciling conflict according to your prompt...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Quick Prompt Suggestions (shown when input is focused or empty) */}
      <div className="px-4 py-1.5 bg-[#12161f] border-t border-[#30363d]/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] uppercase font-semibold text-[#8b949e] shrink-0 font-mono">
          Quick Needs:
        </span>
        {quickPills.map((pill, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isLoading}
            onClick={() => handleSubmit(pill)}
            className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#161b22] hover:bg-[#21262d] text-[#c9d1d9] hover:text-white border border-[#30363d] hover:border-[#58a6ff]/40 shrink-0 transition-colors"
          >
            {pill}
          </button>
        ))}
      </div>

      {/* Input Box & Submit Action */}
      <div className="p-3 bg-[#161b22] flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            disabled={isLoading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Type your needs (e.g. 'Keep target validation, use source discount logic, and log warning')..."
            className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#a371f7] focus:ring-1 focus:ring-[#a371f7] text-[#c9d1d9] placeholder-[#8b949e] text-xs px-3.5 py-2.5 rounded-md outline-hidden transition-all pr-20"
          />

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-[#8b949e] text-[10px] font-mono">
            <span className="border border-[#30363d] px-1.5 py-0.5 rounded bg-[#161b22]">
              ↵ Enter
            </span>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading || !input.trim()}
          onClick={() => handleSubmit()}
          className="px-3.5 py-2.5 rounded-md bg-[#8957e5] hover:bg-[#9e6af7] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Apply to Code</span>
        </button>
      </div>

      {/* Accuracy Guarantee Sub-bar */}
      <div className="px-4 py-1 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between text-[10px] text-[#8b949e] font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-[#3fb950]" />
          <span>Strict Boundary: Changes are scoped solely to conflicting code. All other code remains untouched.</span>
        </div>
        <div className="flex items-center gap-1 text-[#a371f7]">
          <Wand2 className="w-3 h-3" />
          <span>Auto-updates Monaco Editor</span>
        </div>
      </div>
    </div>
  );
};
