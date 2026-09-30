import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GitBranch,
  GitMerge,
  ShieldCheck,
  History,
  Sparkles,
  Terminal,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/repository', label: 'Repository', icon: <GitBranch className="w-4 h-4" /> },
    { to: '/conflicts', label: 'Conflict Resolver', icon: <GitMerge className="w-4 h-4" /> },
    { to: '/verification', label: 'Verification', icon: <ShieldCheck className="w-4 h-4" /> },
    { to: '/history', label: 'Merge History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col shrink-0 select-none">
      {/* Brand */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-[#30363d] bg-[#181d24]">
        <div className="w-9 h-9 rounded-lg bg-linear-to-br from-[#58a6ff] to-[#a371f7] flex items-center justify-center shadow-md shadow-[#58a6ff]/20">
          <GitMerge className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-white font-mono">MergeMind</span>
            <span className="text-[10px] px-1.5 py-0.2 font-semibold uppercase tracking-wider rounded bg-[#58a6ff]/20 text-[#58a6ff] border border-[#58a6ff]/30">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-[#8b949e]">Intelligent Conflict Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8b949e]">
          Workflows
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#21262d] text-[#58a6ff] border border-[#30363d] shadow-xs'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]/50'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Engine Status Callout */}
      <div className="p-4 m-3 rounded-xl border border-[#30363d] bg-[#0d1117]/80">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#a371f7]" />
          <span className="text-xs font-semibold text-[#c9d1d9]">Gemini 1.5 Engine</span>
        </div>
        <p className="text-[11px] text-[#8b949e] leading-relaxed">
          Analyzes branch intent, synthesizes safe code, and requires human approval.
        </p>
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-[#30363d] bg-[#181d24] flex items-center justify-between text-xs text-[#8b949e]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
          <span className="font-mono text-[11px]">Git CLI Ready</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <Terminal className="w-3.5 h-3.5" />
          <span>Local</span>
        </div>
      </div>
    </aside>
  );
};
