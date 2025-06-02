"use client";

import { useState } from "react";
import { PiSidebarSimple } from "react-icons/pi";
import { LuThermometerSun } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { MonitoringTab } from "@/components/Dashboard/MonitoringTab/MonitoringTab";
import { AnalysisReportTab } from "@/components/Dashboard/AnalysisReportTab/AnalysisReportTab";
import { AlertTab } from "@/components/Dashboard/AlertTab/AlertTab";

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const tabs = ["모니터링", "분석 리포트", "알림"] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]>("모니터링");

  let TabContent: React.ReactNode;
  if (tab === "모니터링") {
    TabContent = <MonitoringTab />;
  } else if (tab === "분석 리포트") {
    TabContent = <AnalysisReportTab />;
  } else {
    TabContent = <AlertTab />;
  }

  return (
    <div className="absolute top-0 left-0 z-20 h-screen pointer-events-none p-4">
      <motion.div
        initial={{ height: "100%" }}
        animate={{ height: collapsed ? "63.75px" : "100%" }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="pointer-events-auto w-[340px] flex flex-col rounded-xl glass-block overflow-hidden"
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3">
            <LuThermometerSun className="w-11 h-11 text-white bg-gradient-to-t from-[#74c4fa] to-[#24A7FF] p-2 rounded-xl" />
            <div className="w-[2px] h-7 bg-[#DDDDDD] rounded-md" />
            <h1 className="text-xl font-semibold">국민대 미래관 5층</h1>
          </div>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <PiSidebarSimple className="w-7 h-7 text-[#787878]" />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="flex flex-col flex-1 overflow-hidden p-2"
            >
              <div className="flex space-x-2 mb-4 flex-shrink-0 px-[5px]">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-1 text-center font-semibold rounded-md transition ${
                      tab === t
                        ? "bg-black text-white"
                        : "bg-[#DDDDDD] text-[#787878]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-auto p-[5px] no-scrollbar">
                {TabContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
