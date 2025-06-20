import React from "react";
import { AnimatedValue } from "./AnimatedValue";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface CLIAndPowerCardProps {
  label: string;
  value: number;
  unit?: string;
  status: string;
  loading: boolean;
  legend: string[];
}

export function CLIAndPowerCard({
  label,
  value,
  unit = "",
  status,
  loading,
  legend,
}: CLIAndPowerCardProps) {
  const isCLI = label.includes("냉방 부하");
  const showWarning = isCLI ? value >= 15 : value >= 3;

  return (
    <div className="bg-white rounded-lg shadow-block p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          <p className="text-gray-800 text-base font-medium">{label}</p>
          {showWarning && (
            <HiOutlineExclamationCircle className="text-red-500 text-xl" />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <span className="text-gray-500 text-2xl">...</span>
        </div>
      ) : (
        <>
          <div className="flex flex-col">
            <p className="text-2xl font-bold text-gray-900">
              <AnimatedValue value={value} />
              {unit}
            </p>
            <p className="text-lg font-bold text-gray-700">({status})</p>
          </div>

          <div className="mt-2 text-[10px] text-[#8E8E8E] leading-relaxed text-end">
            {legend.map((line, idx) => (
              <React.Fragment key={idx}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
