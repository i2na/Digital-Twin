"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRoomStore } from "@/utils/useRoomStore";
import { RoomSelectDropdown } from "../MonitoringTab/RoomSelectDropdown";
import { useAutoControl } from "@/utils/useAutoControl";

import {
  calculateDiscomfortIndex,
  calculateHeatIndex,
  calculateCoolingLoadIndex,
  calculateCoolingPower,
} from "@/utils/AnalysisReportTab/calculations";

import {
  interpretHI,
  interpretCLI,
  interpretCoolingPower,
} from "@/utils/AnalysisReportTab/interpretations";

import { PPDCard } from "./PPDCard";
import { DICard } from "./DICard";
import { CLIAndPowerCard } from "./CLIAndPowerCard";

interface Metrics {
  pmv: number;
  ppd: number;
}

export function AnalysisReportTab() {
  const roomsLatest = useRoomStore((state) => state.roomsLatest);
  const selectedRoom = useRoomStore((state) => state.selectedRoom);
  const setSelectedRoom = useRoomStore((state) => state.setSelectedRoom);

  const [loadingPPD, setLoadingPPD] = useState<boolean>(false);
  const [ppdMetrics, setPpdMetrics] = useState<Metrics | null>(null);
  const [errorPPD, setErrorPPD] = useState<string | null>(null);

  const { startAuto } = useAutoControl();
  const { openPanel } = useAutoControl();

  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (selectedRoom === null) {
      const keys = Object.keys(roomsLatest);
      if (keys.length > 0) {
        setSelectedRoom(Number(keys[0]));
      }
    }
  }, [selectedRoom, roomsLatest, setSelectedRoom]);

  const { ta, rh } = useMemo(() => {
    if (selectedRoom === null) return { ta: 0, rh: 0 };
    const info = roomsLatest[selectedRoom];
    return info
      ? { ta: info.temperature, rh: info.humidity }
      : { ta: 0, rh: 0 };
  }, [selectedRoom, roomsLatest]);

  useEffect(() => {
    if (selectedRoom === null) return;
    if (!roomsLatest[selectedRoom]) return;

    const tr = ta;
    const met = 1.1;
    const clo = 0.5;

    setLoadingPPD(true);
    setErrorPPD(null);
    setPpdMetrics(null);

    fetch("/api/compute-ppd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ta, tr, rh, met, clo }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then((data: Metrics) => {
        setPpdMetrics(data);
      })
      .catch((err) => {
        console.error("PPD API 오류:", err);
        setErrorPPD("PPD 계산 중 오류가 발생했습니다.");
      })
      .finally(() => {
        setLoadingPPD(false);
      });
  }, [selectedRoom, ta, rh, roomsLatest]);

  const discomfortIndex = useMemo(
    () => calculateDiscomfortIndex(ta, rh),
    [ta, rh]
  );
  const heatIndex = useMemo(() => calculateHeatIndex(ta, rh), [ta, rh]);
  const coolingLoadIndex = useMemo(
    () => calculateCoolingLoadIndex(ta, rh),
    [ta, rh]
  );
  const coolingPowerKW = useMemo(
    () => calculateCoolingPower(coolingLoadIndex, 0.05),
    [coolingLoadIndex]
  );

  useEffect(() => {
    // DI가 72 이상일 때, 아직 자동 시작이 안 된 상태라면 한 번만 실행
    if (discomfortIndex >= 75 && !hasAutoStarted.current) {
      openPanel();
      startAuto(ta, rh, 24);
      hasAutoStarted.current = true;
    }
    // // DI가 72 미만으로 내려가면 다시 re-allow
    // if (discomfortIndex < 72) {
    //   hasAutoStarted.current = false;
    // }
  }, [discomfortIndex, ta, rh]);

  const hiStatus = interpretHI(heatIndex);
  const cliStatus = interpretCLI(coolingLoadIndex);
  const cpStatus = interpretCoolingPower(coolingPowerKW);

  const roomKeys = Object.keys(roomsLatest);

  if (selectedRoom === null || !roomsLatest[selectedRoom]) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
        방을 선택해주세요.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="bg-white rounded-lg p-3 shadow-block flex items-center justify-between">
        <span className="text-[#787878] text-base font-medium">공간</span>
        <RoomSelectDropdown
          rooms={roomKeys}
          value={String(selectedRoom)}
          onChange={(r) => setSelectedRoom(Number(r))}
        />
      </div>

      <div className="bg-white rounded-lg shadow-block p-4">
        <div className="flex justify-between">
          <div className="flex-1">
            <p className="text-[#828282] text-base">현재 온도</p>
            <p className="text-2xl font-bold text-gray-900">
              {ta.toFixed(1)}°C
            </p>
          </div>
          <div className="border-l border-gray-200 mx-4" />
          <div className="flex-1">
            <p className="text-[#828282] text-base">현재 습도</p>
            <p className="text-2xl font-bold text-gray-900">{rh.toFixed(1)}%</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-[#828282] text-base">체감 온도 (HI)</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-gray-900">
              {heatIndex.toFixed(1)}°C
            </p>
            <p className="ml-2 text-sm font-medium text-gray-600">
              ({hiStatus})
            </p>
          </div>
        </div>
      </div>

      <PPDCard
        ppd={ppdMetrics?.ppd ?? 0}
        pmv={ppdMetrics?.pmv ?? 0}
        loading={loadingPPD}
      />
      {errorPPD && (
        <div className="bg-red-100 text-red-700 rounded-lg p-3 text-sm">
          {errorPPD}
        </div>
      )}

      <DICard di={discomfortIndex} loading={false} />

      <div className="grid grid-cols-2 gap-[10px]">
        <CLIAndPowerCard
          label="냉방 부하 지수"
          value={coolingLoadIndex}
          unit=" kJ/kg"
          status={cliStatus}
          loading={false}
          legend={["~4: 낮음", "5~15: 보통", "15~: 높음"]}
        />
        <CLIAndPowerCard
          label="추정 냉방 전력"
          value={coolingPowerKW}
          unit=" kW"
          status={cpStatus}
          loading={false}
          legend={["~1 kW: 낮음", "1~3 kW: 보통", "3 kW~: 높음"]}
        />
      </div>
    </div>
  );
}
