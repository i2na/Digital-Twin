import React from "react";
import { Gauge } from "./Gauge";
import { AnimatedValue } from "./AnimatedValue";
import { interpretPPD } from "@/utils/AnalysisReportTab/interpretations";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { motion } from "framer-motion";

interface PPDCardProps {
  ppd: number;
  pmv: number;
  loading: boolean;
}

export function PPDCard({ ppd, pmv, loading }: PPDCardProps) {
  const status = interpretPPD(ppd);
  const showWarning = ppd >= 25;

  let gaugeColor = "#24A7FF";
  if (ppd < 10) gaugeColor = "#24A7FF";
  else if (ppd < 25) gaugeColor = "#FFA508";
  else gaugeColor = "#FF952B";

  const blinkTransition = {
    duration: 1.2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };

  return (
    <div className="bg-white rounded-lg shadow-block p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          <p className="text-gray-800 text-base font-medium">
            PPD (쾌적도 불만 비율)
          </p>
          {showWarning && (
            <HiOutlineExclamationCircle className="text-red-500 text-xl" />
          )}
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div className="relative flex-shrink-0">
          <Gauge
            percent={Math.min(Math.max(ppd, 0), 100)}
            color={gaugeColor}
            loading={loading}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none">
            {loading ? (
              <motion.div
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={blinkTransition}
                className="text-center"
              >
                <p className="text-xl font-bold text-gray-900">분석 중</p>
                <p className="text-lg text-gray-700">-</p>
              </motion.div>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">{status}</p>
                <p className="text-lg text-gray-700">
                  <AnimatedValue value={ppd} suffix="%" />
                </p>
              </>
            )}
          </div>
        </div>

        <div className="text-xs text-[#8E8E8E] leading-relaxed text-start">
          0~10%: 쾌적
          <br />
          10~24%: 약간 불만
          <br />
          25%~: 불만
        </div>
      </div>
    </div>
  );
}
