import React from "react";

export interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  hint,
  className = ""
}) => {
  return (
    <div
      className={[
        "rounded-2xl bg-[rgba(255,255,255,0.05)] px-4 py-3 text-slate-100 shadow-[0_30px_80px_rgba(0,0,0,.8)] ring-1 ring-white/10 min-w-[140px]",
        className
      ].join(" ")}
    >
      <div
        className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300/70"
        style={{ lineHeight: 1.2 }}
      >
        {label}
      </div>

      <div
        className="mt-1 text-2xl font-semibold text-white/95 leading-[1.1]"
        style={{
          fontVariantNumeric: "tabular-nums lining-nums"
        }}
      >
        {value}
      </div>

      {hint ? (
        <div
          className="mt-2 text-[11px] text-slate-400/80 leading-[1.4]"
          style={{ fontWeight: 400 }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
};
