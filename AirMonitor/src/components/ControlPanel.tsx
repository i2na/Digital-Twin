"use client";

import { useState, useRef, useEffect, memo } from "react";
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
import { PiBuildingApartmentFill, PiSidebarSimple } from "react-icons/pi";
import { IoPeople } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiChevronLeft } from "react-icons/fi";

interface Point {
  time: string;
  value: number;
}
interface RoomLatest {
  temperature: number;
  humidity: number;
  occupancy: number;
}
interface RoomsLatest {
  [room: number]: RoomLatest;
}
interface RoomsHistory {
  [room: number]: { temperature: Point[]; humidity: Point[] };
}

// ── 실시간 방 리스트 컴포넌트 ──
function RoomList({
  roomsLatest,
  onSelect,
}: {
  roomsLatest: RoomsLatest;
  onSelect: (room: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="text-[#878787] font-bold text-lg ml-1">공간별 상태</div>
      {Object.entries(roomsLatest).map(([room, info]) => (
        <button
          key={room}
          onClick={() => onSelect(Number(room))}
          className="bg-white rounded-xl p-4 shadow flex flex-col items-start hover:bg-gray-50 transition"
        >
          <div className="text-[#969696] text-lg font-semibold mb-2">
            {room}호
          </div>
          <div className="flex justify-between w-full">
            <div className="flex items-end gap-1">
              <span className="text-[#222] font-medium text-base">온도</span>
              <span className="text-black font-bold text-lg ml-1">
                {info.temperature}°C
              </span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-[#222] font-medium text-base">습도</span>
              <span className="text-black font-bold text-lg ml-1">
                {info.humidity}%
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── 실시간 방 상세 컴포넌트 ──
function RoomDetail({
  room,
  roomsLatest,
  roomsHistory,
  tab,
  onBack,
  onSelectRoom,
}: {
  room: number;
  roomsLatest: RoomsLatest;
  roomsHistory: RoomsHistory;
  tab: string;
  onBack: () => void;
  onSelectRoom: (room: number) => void;
}) {
  const latest = roomsLatest[room];
  const historyData = roomsHistory[room] || { temperature: [], humidity: [] };
  const tempData = historyData.temperature;
  const humData = historyData.humidity;

  return (
    <div className="flex flex-col gap-3 flex-1">
      {/* 방 선택/뒤로가기 영역 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-900 rounded-full p-1"
          aria-label="방 리스트로 돌아가기"
        >
          <FiChevronLeft size={24} />
        </button>
        <div className="bg-white rounded-lg p-3 shadow flex items-center justify-between w-full">
          <span className="text-[#787878] text-base font-medium">공간</span>
          <CustomRoomSelect
            rooms={Object.keys(roomsLatest)}
            value={String(room)}
            onChange={(r) => onSelectRoom(Number(r))}
          />
        </div>
      </div>
      {/* 인원 */}
      <div className="bg-white rounded-lg shadow p-3">
        <p className="text-[#828282] font-medium mb-2 text-base">
          공간 내 현재인원
        </p>
        <div className="flex items-center justify-between">
          <IoPeople className="w-10 h-10 text-[#828282]" />
          <span className="text-lg text-gray-700">
            <span className="text-4xl font-bold text-gray-900 mr-3">
              {latest?.occupancy ?? 0}
            </span>
            명
          </span>
        </div>
      </div>
      {/* 온도 차트 */}
      <motion.div
        key={`temp-chart-${room}-${tab}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-lg shadow p-3"
      >
        <div className="w-full flex justify-between mb-2">
          <p className="text-[#828282] text-base ">온도 (°C)</p>
          {tempData.length > 0
            ? `${tempData[tempData.length - 1].value}°C`
            : "-"}
        </div>
        <div className="h-36">
          <TempChart tempData={tempData} />
        </div>
      </motion.div>
      {/* 습도 차트 */}
      <motion.div
        key={`hum-chart-${room}-${tab}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white rounded-lg shadow p-3 overflow-auto"
      >
        <div className="w-full flex justify-between mb-2">
          <p className="text-[#828282] text-base ">습도 (%)</p>
          {humData.length > 0 ? `${humData[humData.length - 1].value}%` : "-"}
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
            startIndex={tempData.length - 40}
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

// 습도 차트도 같은 패턴
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
            startIndex={humData.length - 40}
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

// ── 지난 통계 컴포넌트 ──
function StatsTab() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
      🚧 지난 통계 기능 준비 중입니다.
    </div>
  );
}

// ── 알림 컴포넌트 ──
function AlertTab() {
  return (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
      🚧 알림 기능 준비 중입니다.
    </div>
  );
}

// ── ControlPanel 메인 ──
export default function ControlPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const tabs = ["실시간", "지난 통계", "알림"] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]>("실시간");
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [roomsLatest, setRoomsLatest] = useState<RoomsLatest>({});
  const [roomsHistory, setRoomsHistory] = useState<RoomsHistory>({});

  // 데이터 폴링
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status/rooms");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setRoomsLatest(data.rooms);
        setRoomsHistory(data.history);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStatus();
    const iv = setInterval(fetchStatus, 60000);
    return () => clearInterval(iv);
  }, []);

  // 탭별 내용
  let TabContent;
  if (tab === "실시간") {
    TabContent = (
      <AnimatePresence mode="wait">
        {selectedRoom == null ? (
          <motion.div
            key="room-list"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <RoomList roomsLatest={roomsLatest} onSelect={setSelectedRoom} />
          </motion.div>
        ) : (
          <motion.div
            key={`room-detail-${selectedRoom}`}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <RoomDetail
              room={selectedRoom}
              roomsLatest={roomsLatest}
              roomsHistory={roomsHistory}
              tab={tab}
              onBack={() => setSelectedRoom(null)}
              onSelectRoom={setSelectedRoom}
            />
          </motion.div>
        )}
      </AnimatePresence>
    );
  } else if (tab === "지난 통계") {
    TabContent = <StatsTab />;
  } else {
    TabContent = <AlertTab />;
  }

  return (
    <div className="absolute top-0 left-0 z-20 h-screen p-[16px] pointer-events-none">
      <div className="pointer-events-auto w-[360px] max-h-full flex flex-col bg-white/50 backdrop-blur-md border border-white/50 rounded-xl shadow-2xl overflow-hidden">
        {/* ── 헤더 (고정) ── */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3">
            <PiBuildingApartmentFill className="w-11 h-11 text-white bg-[#FF9D26] p-2 rounded-xl" />
            <div className="w-[3px] h-7 bg-[#DDDDDD] rounded-md" />
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
              style={{ overflow: "hidden" }}
              className="flex flex-col p-3"
            >
              {/* 탭 */}
              <div className="flex space-x-2 mb-4">
                {tabs.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTab(t);
                      if (t !== "실시간") setSelectedRoom(null);
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

function CustomRoomSelect({
  rooms,
  value,
  onChange,
}: {
  rooms: string[];
  value: string;
  onChange: (room: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center bg-transparent text-lg font-bold text-black cursor-pointer focus:outline-none"
      >
        {value}호
        <FiChevronDown className="ml-3 text-gray-400" />
      </button>
      {open && (
        <div className="absolute z-10 top-[32px] mt-2 right-[-12px] w-[96px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-fadein">
          {rooms.map((r) => (
            <button
              key={r}
              className={`w-full text-left px-4 py-2 text-base hover:bg-gray-100 ${
                r === value ? "bg-gray-100 font-semibold" : ""
              }`}
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
            >
              {r}호
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
