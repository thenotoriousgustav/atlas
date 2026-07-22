import React from 'react';

export interface HeaderStatItem {
  label: string;
  value: string;
  subtext?: string;
  highlight?: boolean;
}

interface LedgerPageHeaderCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  stats?: HeaderStatItem[];
}

export function LedgerPageHeaderCard({
  title,
  description,
  icon,
  action,
  stats,
}: LedgerPageHeaderCardProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#EAEAEA] bg-white p-5 rounded-none shadow-2xs">
      {/* Title & Description */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-[#111111]">{icon}</span>}
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#111111]">
            {title}
          </h2>
        </div>
        <p className="text-xs text-[#787774] font-sans">
          {description}
        </p>
      </div>

      {/* Combined Stats & Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-[#EAEAEA] pt-3 md:pt-0 md:pl-4">
            {stats.map((st, idx) => (
              <div key={idx} className="flex flex-col">
                <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#787774]">
                  {st.label}
                </span>
                <span
                  className={`font-mono text-sm font-bold ${
                    st.highlight ? 'text-[#346538]' : 'text-[#111111]'
                  }`}
                >
                  {st.value}
                  {st.subtext && (
                    <span className="text-xs font-normal text-[#787774]"> {st.subtext}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
