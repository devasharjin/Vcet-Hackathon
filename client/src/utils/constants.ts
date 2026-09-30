export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const CONFLICT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  IMPORT_CONFLICT: { label: 'Import Conflict', color: 'text-amber-400 bg-amber-400/10 border-amber-500/30' },
  LOGIC_CONFLICT: { label: 'Logic Conflict', color: 'text-purple-400 bg-purple-400/10 border-purple-500/30' },
  FUNCTION_CONFLICT: { label: 'Function Conflict', color: 'text-blue-400 bg-blue-400/10 border-blue-500/30' },
  VARIABLE_CONFLICT: { label: 'Variable Conflict', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-500/30' },
  API_CONTRACT_CONFLICT: { label: 'API Contract', color: 'text-rose-400 bg-rose-400/10 border-rose-500/30' },
  DEPENDENCY_CONFLICT: { label: 'Dependency', color: 'text-orange-400 bg-orange-400/10 border-orange-500/30' },
  CONFIG_CONFLICT: { label: 'Configuration', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30' },
  FORMATTING_CONFLICT: { label: 'Formatting', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/30' },
  UNKNOWN: { label: 'Conflict', color: 'text-slate-400 bg-slate-400/10 border-slate-500/30' },
};
