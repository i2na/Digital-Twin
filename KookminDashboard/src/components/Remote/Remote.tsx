"use client";

import { useState, useEffect } from "react";
import { IoIosArrowForward, IoIosArrowBack } from "react-icons/io";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsFillStopCircleFill } from "react-icons/bs";
import { toast } from "react-hot-toast";
import { useAutoControl } from "@/utils/useAutoControl";

interface RemotePanelProps {
  onClose: () => void;
  autoOn: boolean;
  rest: number;
  stop: () => void;
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
  "1": "1단계",
  "2": "2단계",
  "3": "3단계",
  "4": "4단계",
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

export default function Remote({
  onClose,
  autoOn,
  rest,
  stop,
}: RemotePanelProps) {
  const {
    active: _unused,
    rest: _unusedRest,
    stopAuto: _unusedStop,
    autoPower,
    autoTemp,
    autoAcMode,
    autoFanMode,
    autoOptionalMode,
  } = useAutoControl();

  const [statusLoading, setStatusLoading] = useState(false);
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
    if (autoOn) {
      setStatusLoading(false);
      return;
    }

    setStatusLoading(true);
    fetch("/api/status/aircon")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
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
        toast.error("에어컨 상태 조회에 실패했습니다.");
      })
      .finally(() => {
        setStatusLoading(false);
      });
  }, [autoOn]);

  const handleApply = async () => {
    if (autoOn) return toast.error("자동 제어 중에는 수동 변경이 불가합니다.");

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

      toast.success(
        <div>
          <div
            style={{
              fontWeight: "bold",
              fontSize: "14px",
              marginBottom: "4px",
            }}
          >
            에어컨을 제어합니다.
          </div>
          <div
            style={{
              fontWeight: "900",
              fontSize: "11px",
              display: "flex",
              justifyContent: "center",
              gap: "2px",
            }}
          >
            <span>전원 {power ? "ON" : "OFF"} | </span>
            <span>온도 {temp}°C | </span>
            <span>모드 {acMode} | </span>
            <span>풍량 {fanMode} | </span>
            <span>부가 {optionalMode}</span>
          </div>
        </div>,
        {
          duration: 6000,
          style: {
            width: "600px",
            textAlign: "center",
            lineHeight: "1.6",
            padding: "6px",
            fontSize: "13px",
          },
        }
      );

      onClose();
    } catch (e) {
      console.error("aircon control error:", e);
      toast.error("수동 제어 명령 전송에 실패했습니다.");
    }
  };

  return (
    <>
      {/* 백드롭 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* 패널 */}
      <div
        className={`fixed z-50 right-4 bottom-[80px] w-[300px] p-2 flex flex-col rounded-xl glass-block
         ${statusLoading ? "opacity-80" : ""}`}
      >
        {statusLoading && (
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

        {/* 자동제어 바 */}
        {autoOn && <AutoControlBar stop={stop} rest={rest} />}

        <div className="p-2 flex flex-col gap-2 bg-white rounded-lg">
          {/* 전원 */}
          <div className="flex items-center justify-between bg-white rounded-md p-3 shadow-block">
            <span className="text-gray-700 font-medium">전원</span>
            <button
              onClick={() => {
                if (!autoOn) setPower((p) => !p);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition ${
                (autoOn ? autoPower : power)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-500"
              } ${autoOn ? "opacity-40 pointer-events-none" : ""}`}
              aria-label="전원 토글"
              disabled={autoOn}
            >
              {(autoOn ? autoPower : power) ? "⏻" : "⏼"}
            </button>
          </div>

          {/* 희망 온도 슬라이더 */}
          <div className="bg-white rounded-md p-3 shadow-block">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">희망온도</span>
              <span
                className={`text-2xl font-bold ${
                  autoOn ? "animate-pulse text-blue-600" : ""
                }`}
              >
                {autoOn ? autoTemp : temp}°C
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (!autoOn) setTemp((t) => Math.max(16, t - 1));
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 ${
                  autoOn ? "opacity-40 pointer-events-none" : ""
                }`}
                disabled={autoOn}
              >
                –
              </button>
              <input
                type="range"
                min={16}
                max={30}
                value={autoOn ? autoTemp : temp}
                onChange={(e) => {
                  if (!autoOn) setTemp(+e.target.value);
                }}
                className="flex-1 h-1 bg-gray-300 rounded-lg accent-blue-500"
                disabled={autoOn}
              />
              <button
                onClick={() => {
                  if (!autoOn) setTemp((t) => Math.min(30, t + 1));
                }}
                className={`w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 ${
                  autoOn ? "opacity-40 pointer-events-none" : ""
                }`}
                disabled={autoOn}
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
                  onClick={() => {
                    if (!autoOn) prev(acModeOptions, acMode, setAcMode);
                  }}
                  className={`pr-2 ${
                    autoOn ? "opacity-40 pointer-events-none" : ""
                  }`}
                  disabled={autoOn}
                >
                  <IoIosArrowBack />
                </button>
                <div
                  className={`text-lg font-semibold whitespace-nowrap ${
                    autoOn ? "animate-pulse text-blue-600" : ""
                  }`}
                >
                  {autoOn
                    ? acModeMap[autoAcMode as (typeof acModeOptions)[number]]
                    : acModeMap[acMode]}
                </div>
                <button
                  onClick={() => {
                    if (!autoOn) next(acModeOptions, acMode, setAcMode);
                  }}
                  className={`pl-2 ${
                    autoOn ? "opacity-40 pointer-events-none" : ""
                  }`}
                  disabled={autoOn}
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
                  onClick={() => {
                    if (!autoOn) prev(fanModeOptions, fanMode, setFanMode);
                  }}
                  className={`pr-2 ${
                    autoOn ? "opacity-40 pointer-events-none" : ""
                  }`}
                  disabled={autoOn}
                >
                  <IoIosArrowBack />
                </button>
                <div
                  className={`text-lg font-semibold whitespace-nowrap ${
                    autoOn ? "animate-pulse text-blue-600" : ""
                  }`}
                >
                  {autoOn
                    ? fanModeMap[autoFanMode as (typeof fanModeOptions)[number]]
                    : fanModeMap[fanMode]}
                </div>
                <button
                  onClick={() => {
                    if (!autoOn) next(fanModeOptions, fanMode, setFanMode);
                  }}
                  className={`pl-2 ${
                    autoOn ? "opacity-40 pointer-events-none" : ""
                  }`}
                  disabled={autoOn}
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
                  onClick={() => {
                    if (!autoOn)
                      prev(optionalModeOptions, optionalMode, setOptionalMode);
                  }}
                  className={`pl-2 ${
                    autoOn ? "opacity-40 pointer-events-none" : ""
                  }`}
                  disabled={autoOn}
                >
                  <IoIosArrowBack />
                </button>
                <div
                  className={`text-lg font-semibold whitespace-nowrap ${
                    autoOn ? "animate-pulse text-blue-600" : ""
                  }`}
                >
                  {autoOn
                    ? optionalModeMap[
                        autoOptionalMode as (typeof optionalModeOptions)[number]
                      ]
                    : optionalModeMap[optionalMode]}
                </div>
                <button
                  onClick={() => {
                    if (!autoOn)
                      next(optionalModeOptions, optionalMode, setOptionalMode);
                  }}
                  className={`pl-2 ${
                    autoOn ? "opacity-40 pointer-events-none" : ""
                  }`}
                  disabled={autoOn}
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
          className={`mt-2 py-2 bg-black text-white rounded-lg font-semibold ${
            autoOn ? "opacity-40 pointer-events-none" : ""
          }`}
        >
          적용하기
        </button>
      </div>
    </>
  );
}

// 자동제어 바 (AutoControlBar)
function AutoControlBar({ stop, rest }: { stop: () => void; rest: number }) {
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

      <div className="text-white font-medium text-sm">{formatTimer(rest)}</div>
      <BsFillStopCircleFill
        onClick={() => {
          toast.success("자동 제어가 중단되었습니다.");
          stop();
        }}
        className="text-white cursor-pointer w-5 h-5"
      />
    </div>
  );
}
