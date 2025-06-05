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
  const showWarning = di >= 72;

  let gaugeColor = "#00F0FF";

  if (di < 65) gaugeColor = "#00F0FF";
  else if (di < 70) gaugeColor = "#00FFA3";
  else if (di < 75) gaugeColor = "#FFD700";
  else if (di < 80) gaugeColor = "#FF6F61";
  else gaugeColor = "#FF3D00";

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
                <p className="text-[20px] font-bold text-gray-900">{status}</p>
                <p className="text-[15px] text-gray-700">
                  <AnimatedValue value={di} />
                </p>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-[#8E8E8E] leading-relaxed text-start">
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
