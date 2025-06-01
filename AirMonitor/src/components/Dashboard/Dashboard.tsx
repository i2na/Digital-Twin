"use client";

import { useState, useEffect } from "react";
import { PiBuildingApartmentFill, PiSidebarSimple } from "react-icons/pi";
import { LuThermometerSun } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import { MonitoringTab } from "@/components/Dashboard/MonitoringTab/MonitoringTab";
import { AnalysisReportTab } from "@/components/Dashboard/AnalysisReportTab/AnalysisReportTab";
import { AlertTab } from "@/components/Dashboard/AlertTab/AlertTab";
import { useRoomStore } from "@/utils/stores";
import { ROOM_DBIDS } from "@/lib/modelData";

export default function Dashboard() {
  const [collapsed, setCollapsed] = useState(false);
  const tabs = ["모니터링", "분석 리포트", "알림"] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]>("모니터링");

  // const setRoomPpd = useRoomStore((state) => state.setRoomPpd);
  // const setSelectedRoom = useRoomStore((state) => state.setSelectedRoom);

  // useEffect(() => {
  //   if (tab === "히스토리") {
  //     setSelectedRoom(null);

  //     const demoPpdValues: Record<number, number> = {
  //       513: 35,
  //       515: 72,
  //       516: 48,
  //     };
  //     Object.entries(demoPpdValues).forEach(([roomStr, ppd]) => {
  //       setRoomPpd(Number(roomStr), ppd);
  //     });
  //   } else {
  //     Object.keys(ROOM_DBIDS).forEach((roomStr) => {
  //       setRoomPpd(Number(roomStr), 0);
  //     });
  //   }
  // }, [tab, setRoomPpd, setSelectedRoom]);

  let TabContent;
  if (tab === "모니터링") {
    TabContent = <MonitoringTab />;
  } else if (tab === "분석 리포트") {
    TabContent = <AnalysisReportTab />;
  } else {
    TabContent = <AlertTab />;
  }

  return (
    <div className="absolute top-0 left-0 z-20 h-screen p-[16px] pointer-events-none">
      <div className="pointer-events-auto w-[340px] max-h-full flex flex-col rounded-xl p-3 glass-block">
        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between mb-[14px]">
          <div className="flex items-center space-x-3">
            <LuThermometerSun className="w-11 h-11 text-white bg-gradient-to-t from-[#74c4fa] to-[#24A7FF]  p-2 rounded-xl" />
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

        {/* ── 본문 ── */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="body"
              layout
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "100vh", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="flex flex-col"
            >
              {/* 탭 */}
              <div className="flex space-x-2 mb-4">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(t);
                    }}
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
              {/* 탭별 내용 */}
              {TabContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
