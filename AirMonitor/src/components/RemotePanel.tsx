"use client";

import { useState, useEffect } from "react";
import { GiWindSlap } from "react-icons/gi";
import { FaSnowflake, FaWind } from "react-icons/fa";

interface RemotePanelProps {
  onClose: () => void;
}

export default function RemotePanel({ onClose }: RemotePanelProps) {
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [power, setPower] = useState(true);
  const [temp, setTemp] = useState(25);
  const [selectedDevice, setSelectedDevice] = useState(1);
  const [deviceStates, setDeviceStates] = useState([true, false, false, false]);
  const [windMode, setWindMode] = useState<"고정" | "무풍" | "정음">("고정");
  const [energySave, setEnergySave] = useState(false);

  useEffect(() => {
    fetch("/api/status/aircon")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        console.log("aircon status:", data);
      })
      .catch((err) => {
        console.error("aircon fetch error:", err);
      });
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="fixed z-50 right-[16px] bottom-[80px] w-[300px] bg-white/60 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 p-3 flex flex-col gap-2">
        <h3 className="text-center text-lg font-semibold text-[#828282] mb-2">
          에어컨 리모컨
        </h3>

        <div className="flex bg-white/50 p-[9px] gap-1 rounded-md">
          <button
            onClick={() => setMode("auto")}
            className={`flex-1 py-1 font-semibold text-center transition rounded-md ${
              mode === "auto"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-900"
            }`}
          >
            자동
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 py-1 font-semibold text-center transition rounded-md ${
              mode === "manual"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-900"
            }`}
          >
            수동
          </button>
        </div>

        <div className=" bg-white/40 p-[9px] rounded-md flex flex-col gap-2">
          <div className="bg-white rounded-md">
            <div className="flex justify-between items-center p-2 text-[#828282] mb-2">
              <span>기기</span>
              <span
                className="cursor-pointer"
                onClick={() => {
                  const allOn = deviceStates.every((v) => v);
                  setDeviceStates(deviceStates.map(() => !allOn));
                }}
              >
                전체선택
              </span>
            </div>
            <div className="flex gap-2 px-2 mb-1">
              {deviceStates.map((isOn, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedDevice(idx + 1);
                    setDeviceStates((ds) =>
                      ds.map((v, i) => (i === idx ? !v : v))
                    );
                  }}
                  className={`flex-1 py-2 rounded-md text-center font-semibold transition ${
                    selectedDevice === idx + 1
                      ? "bg-gray-900 text-white"
                      : "bg-[#DDDDDD] text-gray-600"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="flex gap-2 px-2 text-center text-sm text-gray-500">
              {deviceStates.map((isOn, idx) => (
                <span key={idx} className="flex-1">
                  {isOn ? "on" : "off"}
                </span>
              ))}
            </div>
          </div>

          <div className=" bg-white rounded-md p-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[#828282] font-medium">희망온도</span>
              <span className="text-2xl font-bold text-gray-900">{temp}°C</span>
            </div>
            <div className="flex items-center space-x-2 px-1">
              <button
                onClick={() => setTemp((t) => Math.max(16, t - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600"
              >
                –
              </button>
              <input
                type="range"
                min={16}
                max={30}
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                className="flex-1 h-1 bg-gray-300 rounded-lg accent-blue-500"
              />
              <button
                onClick={() => setTemp((t) => Math.min(30, t + 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* 모드 */}
            <button className="flex flex-col items-center justify-center p-4 bg-white rounded-md shadow text-[#828282]">
              <FaSnowflake className="text-blue-500 mb-1" size={24} />
              <span className="font-semibold">냉방</span>
            </button>
            {/* 바람세기 */}
            <button className="flex flex-col items-center justify-center p-4 bg-white rounded-md shadow text-[#828282]">
              <FaWind className="text-yellow-500 mb-1" size={24} />
              <span className="font-semibold">자돌풍</span>
            </button>
            {/* 바람방향 */}
            <button className="flex flex-col items-center justify-center p-4 bg-white rounded-md shadow text-[#828282]">
              <GiWindSlap className="text-gray-500 mb-1" size={24} />
              <span className="font-semibold">{windMode}</span>
            </button>
            {/* 토글 */}
            <div className="flex flex-col justify-around p-4 bg-white rounded-md shadow">
              <label className="flex items-center justify-between text-[#828282]">
                <span>무풍</span>
                <input
                  type="checkbox"
                  checked={windMode === "무풍"}
                  onChange={() =>
                    setWindMode((wd) => (wd === "무풍" ? "고정" : "무풍"))
                  }
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between text-[#828282]">
                <span>정음</span>
                <input
                  type="checkbox"
                  checked={windMode === "정음"}
                  onChange={() =>
                    setWindMode((wd) => (wd === "정음" ? "고정" : "정음"))
                  }
                  className="toggle"
                />
              </label>
              <label className="flex items-center justify-between text-[#828282]">
                <span>절전</span>
                <input
                  type="checkbox"
                  checked={energySave}
                  onChange={() => setEnergySave((es) => !es)}
                  className="toggle toggle-primary"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
