"use client";

import { useState, useEffect } from "react";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

interface RemotePanelProps {
  onClose: () => void;
}

const acModeOptions = ["cool", "heat", "dry", "wind", "aIComfort"] as const;
const acModeMap: Record<(typeof acModeOptions)[number], string> = {
  cool: "냉방",
  heat: "난방",
  dry: "제습",
  wind: "송풍",
  aIComfort: "AI 쾌적",
};

const fanModeOptions = ["auto", "1", "2", "3", "4", "max"] as const;
const fanModeMap: Record<(typeof fanModeOptions)[number], string> = {
  auto: "자동",
  "1": "약풍",
  "2": "미풍",
  "3": "중풍",
  "4": "강풍",
  max: "최대풍",
};

const optionalModeOptions = [
  "off",
  "sleep",
  "quiet",
  "smart",
  "windFree",
  "windFreeSleep",
] as const;
const optionalModeMap: Record<(typeof optionalModeOptions)[number], string> = {
  off: "꺼짐",
  sleep: "수면",
  quiet: "정음",
  smart: "스마트",
  windFree: "무풍 운전",
  windFreeSleep: "무풍 수면",
};

export default function Remote({ onClose }: RemotePanelProps) {
  const [loading, setLoading] = useState(true);
  const [power, setPower] = useState(false);
  const [temp, setTemp] = useState(25);
  const [acMode, setAcMode] = useState<(typeof acModeOptions)[number]>(
    acModeOptions[0]
  );
  const [fanMode, setFanMode] = useState<(typeof fanModeOptions)[number]>(
    fanModeOptions[0]
  );
  const [optionalMode, setOptionalMode] = useState<
    (typeof optionalModeOptions)[number]
  >(optionalModeOptions[0]);

  const prev = <T extends readonly string[]>(
    options: T,
    current: T[number],
    setter: (v: T[number]) => void
  ) => {
    const i = options.indexOf(current as any);
    setter(options[(i - 1 + options.length) % options.length]);
  };
  const next = <T extends readonly string[]>(
    options: T,
    current: T[number],
    setter: (v: T[number]) => void
  ) => {
    const i = options.indexOf(current as any);
    setter(options[(i + 1) % options.length]);
  };

  useEffect(() => {
    fetch("/api/status/aircon")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        setLoading(true);
        console.log("aircon status:", data);
        setPower(data.switch_AC_1 === 1 || data.switch_AC_1 === "on");
        setTemp(data.setpoint_AC_1 ?? temp);
        if (acModeOptions.includes(data.mode_AC_1)) {
          setAcMode(data.mode_AC_1);
        }
        if (fanModeOptions.includes(data.fanMode_AC_1)) {
          setFanMode(data.fanMode_AC_1);
        }
        if (optionalModeOptions.includes(data.supportedMode_AC_1)) {
          setOptionalMode(data.supportedMode_AC_1);
        }
      })
      .catch((err) => {
        console.error("aircon fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleApply = async () => {
    const body = {
      switch: power ? 1 : 0,
      setpoint: temp,
      mode: acMode,
      fanMode,
      optionalMode,
    };
    try {
      const res = await fetch("/api/control/aircon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("제어 명령이 성공적으로 전송되었습니다.");
      onClose();
    } catch (e) {
      console.error("aircon control error:", e);
      alert("제어 명령 전송에 실패했습니다.");
    }
  };

  return (
    <>
      {/* 백드롭 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* 패널 */}
      <div
        className={`fixed z-50 right-4 bottom-[80px] w-[300px] p-2 flex flex-col rounded-xl glass-block
         ${loading ? "opacity-60" : ""}`}
      >
        {loading && (
          <div className="absolute w-full h-full flex justify-center items-center">
            <AiOutlineLoading3Quarters
              className="animate-spin text-gray-500"
              size={32}
            />
          </div>
        )}
        <h3 className="text-center text-lg font-semibold text-gray-600">
          513호 - 드론 스튜디오
        </h3>
        <div className="h-[2px] bg-[#D9D9D9] mt-1" />
        <AutoControlBar />
        <div className="p-2 flex flex-col gap-2 bg-white rounded-lg">
          {/* 전원 */}
          <div className="flex items-center justify-between bg-white rounded-md p-3 shadow-block">
            <span className="text-gray-700 font-medium">전원</span>
            <button
              onClick={() => setPower((p) => !p)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition ${
                power ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-500"
              }`}
              aria-label="전원 토글"
            >
              {power ? "⏻" : "⏼"}
            </button>
          </div>

          {/* 희망 온도 슬라이더 */}
          <div className="bg-white rounded-md p-3 shadow-block">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">희망온도</span>
              <span className="text-2xl font-bold">{temp}°C</span>
            </div>
            <div className="flex items-center space-x-2">
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
                onChange={(e) => setTemp(+e.target.value)}
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
            {/* 운전 모드 */}
            <div className="bg-white rounded-md shadow-block p-3 flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1">모드</span>
              <div className="w-full flex justify-between">
                <button
                  onClick={() => prev(acModeOptions, acMode, setAcMode)}
                  className="pr-2"
                >
                  <IoIosArrowBack />
                </button>
                <div className="text-lg font-semibold whitespace-nowrap">
                  {acModeMap[acMode]}
                </div>
                <button
                  onClick={() => next(acModeOptions, acMode, setAcMode)}
                  className="pl-2"
                >
                  <IoIosArrowForward />
                </button>
              </div>
            </div>

            {/* 바람세기 */}
            <div className="bg-white rounded-md shadow-block p-3 flex flex-col items-center">
              <span className="text-sm text-gray-500 mb-1">바람세기</span>
              <div className="w-full flex justify-between">
                <button
                  onClick={() => prev(fanModeOptions, fanMode, setFanMode)}
                  className="pr-2"
                >
                  <IoIosArrowBack />
                </button>
                <div className="text-lg font-semibold whitespace-nowrap">
                  {fanModeMap[fanMode]}
                </div>
                <button
                  onClick={() => next(fanModeOptions, fanMode, setFanMode)}
                  className="pl-2"
                >
                  <IoIosArrowForward />
                </button>
              </div>
            </div>

            {/* 부가운전 */}
            <div className="col-span-2 bg-white rounded-md shadow-block p-3 flex flex-col">
              <span className="text-sm text-gray-500 mb-1">부가운전</span>
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    prev(optionalModeOptions, optionalMode, setOptionalMode)
                  }
                  className="pr-2"
                >
                  <IoIosArrowBack />
                </button>
                <div className="text-lg font-semibold whitespace-nowrap">
                  {optionalModeMap[optionalMode]}
                </div>
                <button
                  onClick={() =>
                    next(optionalModeOptions, optionalMode, setOptionalMode)
                  }
                  className="pl-2"
                >
                  <IoIosArrowForward />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 적용하기 버튼 */}
        <button
          onClick={handleApply}
          className="mt-2 py-2 bg-black text-white rounded-lg font-semibold"
        >
          적용하기
        </button>
      </div>
    </>
  );
}

function AutoControlBar() {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const formatTimer = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div
      className="
        w-full py-2 rounded-lg my-2
        bg-gradient-to-r from-[#323640] to-[#47B3FD]
        flex items-center justify-between
        px-4
      "
    >
      <div className="flex items-center gap-2 text-white font-medium">
        <AiOutlineLoading3Quarters className="animate-spin" size={20} />
        <span className="text-sm">기기 자동제어 중</span>
      </div>

      <div className="text-white font-medium text-sm">
        {formatTimer(secondsElapsed)}
      </div>
    </div>
  );
}
