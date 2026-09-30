import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react';

export interface ConfidenceBadgeProps {
  confidence: number;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ confidence }) => {
  const isHigh = confidence >= 90;
  const isMedium = confidence >= 70 && confidence < 90;
  const isLow = confidence < 70;

  let colorClasses = 'bg-[#f85149]/15 text-[#f85149] border-[#f85149]/40';
  let label = 'Low Confidence';
  let icon = <AlertTriangle className="w-3.5 h-3.5" />;

  if (isHigh) {
    colorClasses = 'bg-[#238636]/15 text-[#3fb950] border-[#238636]/40';
    label = 'High Confidence';
    icon = <CheckCircle className="w-3.5 h-3.5" />;
  } else if (isMedium) {
    colorClasses = 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/40';
    label = 'Medium Confidence';
    icon = <Sparkles className="w-3.5 h-3.5" />;
  }

  return (
    <div className="flex flex-col gap-1">
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold ${colorClasses}`}
      >
        {icon}
        <span>AI Confidence: {confidence}%</span>
        <span className="text-[10px] font-sans font-normal opacity-85">({label})</span>
      </div>
      <p className="text-[10px] text-[#8b949e]">
        Confidence is an AI-generated estimate. Human approval is required.
      </p>
    </div>
  );
};
