import React from 'react';
import { GitBranch } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <GitBranch className="w-12 h-12 text-[#8b949e]" />,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center border border-dashed border-[#30363d] rounded-xl bg-[#161b22]/40">
      <div className="p-3 bg-[#21262d] rounded-xl mb-4 border border-[#30363d]">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-[#c9d1d9] mb-1">{title}</h3>
      <p className="text-sm text-[#8b949e] max-w-md mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
