"use client";

import { useEffect, memo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Brush,
} from "recharts";
import { motion } from "framer-motion";
import { IoPeople } from "react-icons/io5";
import { FiChevronLeft } from "react-icons/fi";
import { useRoomStore } from "@/utils/useRoomStore";
import { RoomSelectDropdown } from "./RoomSelectDropdown";

interface Point {
  time: string;
  value: number;
}

interface RoomsHistory {
  [room: number]: { temperature: Point[]; humidity: Point[] };
}

export function RoomDetail({
  room,
  roomsHistory,
  onBack,
  onSelectRoom,
}: {
  room: number;
  roomsHistory: RoomsHistory;
  onBack: () => void;
  onSelectRoom: (room: number) => void;
}) {
  const latest = useRoomStore((state) => state.roomsLatest)[room];

  const historyData = roomsHistory[room] || { temperature: [], humidity: [] };
  const tempData = historyData.temperature;
  const humData = historyData.humidity;

  const roomKeys = Object.keys(useRoomStore.getState().roomsLatest);

  return (
    <div className="flex flex-col gap-[10px] flex-1">
      {/* 1) 상단: 뒤로 가기 버튼 + 방 선택 드롭다운 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 rounded-full p-1"
          aria-label="방 리스트로 돌아가기"
        >
          <FiChevronLeft size={24} />
        </button>
        <div className="bg-white rounded-lg p-3 shadow-block flex items-center justify-between w-full">
          <span className="text-[#787878] text-base font-medium">공간</span>
          <RoomSelectDropdown
            rooms={roomKeys}
            value={String(room)}
            onChange={(r) => onSelectRoom(Number(r))}
          />
        </div>
      </div>

      {/* 2) 현재 인원 카드 */}
      <div className="bg-white rounded-lg shadow-block p-3">
        <p className="text-[#828282] font-medium mb-2 text-base">
          공간 내 현재 인원
        </p>
        <div className="flex items-center justify-between">
          <IoPeople className="w-10 h-10 text-[#828282]" />
          <span className="text-lg text-gray-700">
            <span className="text-4xl font-bold text-gray-900 mr-3">
              {latest?.occupancy}
            </span>
            명
          </span>
        </div>
      </div>

      {/* 3) 온도 차트 카드 */}
      <motion.div
        key={`temp-chart-${room}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-lg shadow-block p-3"
      >
        <div className="w-full flex justify-between mb-2">
          <p className="text-[#828282] text-base">온도 (°C)</p>
          {tempData.length > 0
            ? `${tempData[tempData.length - 1].value.toFixed(1)}°C`
            : "-"}
        </div>
        <div className="h-36">
          <TempChart tempData={tempData} />
        </div>
      </motion.div>

      {/* 4) 습도 차트 카드 */}
      <motion.div
        key={`hum-chart-${room}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-lg shadow-block p-3 overflow-auto"
      >
        <div className="w-full flex justify-between mb-2">
          <p className="text-[#828282] text-base">습도 (%)</p>
          {humData.length > 0
            ? `${humData[humData.length - 1].value.toFixed(0)}%`
            : "-"}
        </div>
        <div className="h-36">
          <HumChart humData={humData} />
        </div>
      </motion.div>
    </div>
  );
}

const TempChart = memo(function TempChart({ tempData }: { tempData: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={tempData}
        margin={{ top: 8, right: 20, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.3} />
            <stop offset="80%" stopColor="#4F46E5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          horizontal
          vertical={false}
          stroke="#E5E7EB"
          opacity={0.3}
        />
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6B7280", fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={["dataMin - 1", "dataMax + 1"]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#4F46E5", fontSize: 10 }}
        />
        <Tooltip
          formatter={(v: number) => `${v.toFixed(1)}°C`}
          contentStyle={{
            background: "#fff",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: 8,
          }}
          labelStyle={{ fontSize: 12, color: "#374151" }}
        />
        {tempData.length > 20 && (
          <Brush
            dataKey="time"
            height={15}
            stroke="#8884d8"
            startIndex={Math.max(0, tempData.length - 120)}
            endIndex={tempData.length - 1}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke="none"
          fill="url(#tempGrad)"
          isAnimationActive
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#4F46E5"
          strokeWidth={1}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
          isAnimationActive
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

const HumChart = memo(function HumChart({ humData }: { humData: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={humData}
        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
      >
        <defs>
          <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.3} />
            <stop offset="80%" stopColor="#0EA5E9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          horizontal
          vertical={false}
          stroke="#E5E7EB"
          opacity={0.3}
        />
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6B7280", fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={["dataMin - 5", "dataMax + 5"]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#0EA5E9", fontSize: 10 }}
        />
        <Tooltip
          formatter={(v: number) => `${v.toFixed(0)}%`}
          contentStyle={{
            background: "#fff",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            borderRadius: 8,
          }}
          labelStyle={{ fontSize: 12, color: "#374151" }}
        />
        {humData.length > 20 && (
          <Brush
            dataKey="time"
            height={15}
            stroke="#0EA5E9"
            startIndex={Math.max(0, humData.length - 120)}
            endIndex={humData.length - 1}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke="none"
          fill="url(#humGrad)"
          isAnimationActive
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0EA5E9"
          strokeWidth={1}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
          isAnimationActive
          animationBegin={0}
          animationDuration={800}
          animationEasing="ease-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
});
