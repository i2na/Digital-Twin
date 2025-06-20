import React from "react";
import { Gauge } from "./Gauge";
import { AnimatedValue } from "./AnimatedValue";
import { interpretDI } from "@/utils/AnalysisReportTab/interpretations";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface DICardProps {
  di: number;
  loading: boolean;
}

export function DICard({ di, loading }: DICardProps) {
  const status = interpretDI(di);
  const showWarning = di >= 75;

  let gaugeColor = "#4FC3F7";

  if (di < 65) gaugeColor = "#4FC3F7";
  else if (di < 70) gaugeColor = "#4DD0E1";
  else if (di < 75) gaugeColor = "#81C784";
  else if (di < 80) gaugeColor = "#FFB74D";
  else gaugeColor = "#E57373";

  return (
    <div className="bg-white rounded-lg shadow-block p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          <p className="text-gray-800 text-base font-medium">불쾌지수 (DI)</p>
          {showWarning && (
            <HiOutlineExclamationCircle className="text-red-500 text-xl" />
          )}
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="relative flex-shrink-0">
          <Gauge percent={Math.min(Math.max(di, 0), 100)} color={gaugeColor} />

          <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none">
            {!loading && (
              <>
                <p className="text-[17px] font-bold text-gray-900">{status}</p>
                <p className="text-[15px] text-gray-700">
                  <AnimatedValue value={di} />
                </p>
              </>
            )}
          </div>
        </div>

        <div className="text-[10px] text-[#8E8E8E] leading-relaxed text-start">
          ~64: 매우 쾌적
          <br />
          65~69: 쾌적
          <br />
          70~74: 주의
          <br />
          75~79: 불쾌
          <br />
          80~: 매우 불쾌
        </div>
      </div>
    </div>
  );
}
