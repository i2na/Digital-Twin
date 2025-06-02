import React from "react";
import { AnimatedValue } from "./AnimatedValue";

interface ValueCardProps {
  label: string;
  value: number;
  unit?: string;
  status: string;
  loading: boolean;
  legend: string[];
}

export function ValueCard({
  label,
  value,
  unit = "",
  status,
  loading,
  legend,
}: ValueCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-[#828282] text-base mb-2">{label}</p>
      <div className="flex items-baseline space-x-2">
        {!loading && (
          <>
            <p className="text-4xl font-bold text-gray-900">
              <AnimatedValue value={value} />
              {unit}
            </p>
            <p className="text-sm font-medium text-gray-600">({status})</p>
          </>
        )}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {legend.map((line, idx) => (
          <React.Fragment key={idx}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}
