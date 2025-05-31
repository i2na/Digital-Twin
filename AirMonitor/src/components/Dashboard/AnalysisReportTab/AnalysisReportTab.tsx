"use client";

import { useState, useEffect, useMemo } from "react";
import { useRoomStore } from "@/lib/stores";
import { motion } from "framer-motion";

import { BouncingDots } from "./BouncingDots";
import { RoomSelectDropdown } from "../MonitoringTab/RoomSelectDropdown";

import {
  calculateDiscomfortIndex,
  calculateHeatIndex,
  calculateCoolingLoadIndex,
  calculateCoolingPower,
} from "@/utils/calculations";
import {
  interpretPPD,
  interpretDI,
  interpretHI,
  interpretCLI,
  interpretCoolingPower,
} from "@/utils/interpretations";

interface Metrics {
  pmv: number;
  ppd: number;
}

export function AnalysisReportTab() {
  const roomsLatest = useRoomStore((state) => state.roomsLatest);
  const globalSelectedRoom = useRoomStore((state) => state.selectedRoom);
  const setGlobalSelectedRoom = useRoomStore((state) => state.setSelectedRoom);

  const [loadingMetrics, setLoadingMetrics] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [errorMetrics, setErrorMetrics] = useState<string | null>(null);

  useEffect(() => {
    if (globalSelectedRoom === null) {
      const keys = Object.keys(roomsLatest);
      if (keys.length > 0) {
        setGlobalSelectedRoom(Number(keys[0]));
      }
    }
  }, [globalSelectedRoom, roomsLatest, setGlobalSelectedRoom]);

  useEffect(() => {
    if (globalSelectedRoom === null) return;
    if (!roomsLatest[globalSelectedRoom]) return;

    const { temperature: taVal, humidity: rhVal } =
      roomsLatest[globalSelectedRoom];
    const tr = taVal; // 교실 가정: 평균 복사 온도 ≈ 실내 공기 온도
    const met = 1.1; // 교실 가정: 활동 대사율
    const clo = 0.5; // 교실 가정: 의복 단열도

    setLoadingMetrics(true);
    setErrorMetrics(null);

    fetch("/api/compute-ppd", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ta: taVal, tr, rh: rhVal, met, clo }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API 오류: ${res.status}`);
        return res.json();
      })
      .then((data: Metrics) => {
        setMetrics(data);
      })
      .catch((err) => {
        console.error("Metrics API 오류:", err);
        setErrorMetrics("지표 계산 중 오류가 발생했습니다.");
        setMetrics(null);
      })
      .finally(() => {
        setLoadingMetrics(false);
      });
  }, [globalSelectedRoom, roomsLatest]);

  const { temperature: ta = 0, humidity: rh = 0 } = useMemo(() => {
    if (globalSelectedRoom === null) return { temperature: 0, humidity: 0 };
    const info = roomsLatest[globalSelectedRoom];
    return info || { temperature: 0, humidity: 0 };
  }, [globalSelectedRoom, roomsLatest]);

  const { discomfortIndex, heatIndex, coolingLoadIndex, coolingPowerKW } =
    useMemo(() => {
      const DI = calculateDiscomfortIndex(ta, rh);
      const HI = calculateHeatIndex(ta, rh);
      const CLI = calculateCoolingLoadIndex(ta, rh);
      const CP = calculateCoolingPower(CLI, 0.05);
      return {
        discomfortIndex: DI,
        heatIndex: HI,
        coolingLoadIndex: CLI,
        coolingPowerKW: CP,
      };
    }, [ta, rh]);

  if (globalSelectedRoom === null || !roomsLatest[globalSelectedRoom]) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
        방을 선택해주세요.
      </div>
    );
  }

  const roomNum = globalSelectedRoom;
  const { temperature: taVal, humidity: rhVal } = roomsLatest[roomNum];
  const { pmv = 0, ppd = 0 } = metrics || {};

  const ppdStatus = interpretPPD(ppd);
  const diStatus = interpretDI(discomfortIndex);
  const hiStatus = interpretHI(heatIndex);
  const cliStatus = interpretCLI(coolingLoadIndex);
  const cpStatus = interpretCoolingPower(coolingPowerKW);

  const roomKeys = Object.keys(roomsLatest);

  return (
    <div className="flex flex-col gap-3 overflow-auto">
      <div className="bg-white rounded-lg p-3 shadow flex items-center justify-between">
        <span className="text-[#787878] text-base font-medium">공간</span>
        <RoomSelectDropdown
          rooms={roomKeys}
          value={
            globalSelectedRoom !== null ? String(globalSelectedRoom) : null
          }
          onChange={(r) => {
            setGlobalSelectedRoom(Number(r));
          }}
        />
      </div>

      {/* 1) 현재 온도 / 습도 카드 */}
      <div className="bg-white rounded-lg shadow p-4 flex justify-between">
        <div>
          <p className="text-[#828282] text-base">현재 온도</p>
          <p className="text-3xl font-bold text-gray-900">
            {taVal.toFixed(1)}°C
          </p>
        </div>
        <div>
          <p className="text-[#828282] text-base">현재 습도</p>
          <p className="text-3xl font-bold text-gray-900">
            {rhVal.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 2) PPD 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-lg shadow p-4"
      >
        <div className="flex justify-between items-center mb-2">
          <p className="text-[#828282] text-base">PPD (불만 비율)</p>
          <div className="text-sm text-gray-500 flex items-center space-x-1">
            <span>PMV:</span>
            {loadingMetrics ? (
              <div className="flex items-center space-x-1">
                <BouncingDots />
              </div>
            ) : (
              <span>{pmv.toFixed(3)}</span>
            )}
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          {loadingMetrics ? (
            <div className="flex items-center space-x-1">
              <BouncingDots />
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold text-gray-900">
                {ppd.toFixed(1)}%
              </p>
              <p className="text-sm font-medium text-gray-600">({ppdStatus})</p>
            </>
          )}
        </div>

        <p className="mt-1 text-xs text-gray-500">
          • 0–10%: 쾌적
          <br />
          • 10–25%: 약간 불만
          <br />• ≥25%: 불만 (재조정 필요)
        </p>
      </motion.div>

      {/* 3) 불쾌 지수 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-lg shadow p-4"
      >
        <p className="text-[#828282] text-base mb-2">불쾌 지수 (DI)</p>
        <div className="flex items-baseline space-x-2">
          {loadingMetrics ? (
            <div className="flex items-center space-x-1">
              <BouncingDots />
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold text-gray-900">
                {discomfortIndex.toFixed(1)}
              </p>
              <p className="text-sm font-medium text-gray-600">({diStatus})</p>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          • &lt;68: 쾌적
          <br />
          • 68–72: 주의
          <br />
          • 72–75: 불쾌
          <br />• ≥75: 매우 불쾌
        </p>
      </motion.div>

      {/* 4) 체감 온도 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-lg shadow p-4"
      >
        <p className="text-[#828282] text-base mb-2">체감 온도 (HI)</p>
        <div className="flex items-baseline space-x-2">
          {loadingMetrics ? (
            <div className="flex items-center space-x-1">
              <BouncingDots />
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold text-gray-900">
                {heatIndex.toFixed(1)}°C
              </p>
              <p className="text-sm font-medium text-gray-600">({hiStatus})</p>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          • &lt;27°C: 시원함
          <br />
          • 27–32°C: 약간 더움
          <br />
          • 32–41°C: 매우 더움
          <br />• ≥41°C: 위험
        </p>
      </motion.div>

      {/* 5) 냉방 부하 지수 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-lg shadow p-4"
      >
        <p className="text-[#828282] text-base mb-2">냉방 부하 지수 (CLI)</p>
        <div className="flex items-baseline space-x-2">
          {loadingMetrics ? (
            <div className="flex items-center space-x-1">
              <BouncingDots />
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold text-gray-900">
                {coolingLoadIndex.toFixed(1)} kJ/kg
              </p>
              <p className="text-sm font-medium text-gray-600">({cliStatus})</p>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          • &lt;5: 낮음
          <br />
          • 5–15: 보통
          <br />• ≥15: 높음
        </p>
      </motion.div>

      {/* 6) 추정 냉방 전력 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-lg shadow p-4"
      >
        <p className="text-[#828282] text-base mb-2">추정 냉방 전력 (kW)</p>
        <div className="flex items-baseline space-x-2">
          {loadingMetrics ? (
            <div className="flex items-center space-x-1">
              <BouncingDots />
            </div>
          ) : (
            <>
              <p className="text-4xl font-bold text-gray-900">
                {coolingPowerKW.toFixed(2)} kW
              </p>
              <p className="text-sm font-medium text-gray-600">({cpStatus})</p>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          • &lt;1 kW: 낮음
          <br />
          • 1–3 kW: 보통
          <br />• ≥3 kW: 높음
        </p>
      </motion.div>

      {/* 7) 오류 메시지 */}
      {errorMetrics && (
        <div className="bg-red-100 text-red-700 rounded-lg p-3">
          {errorMetrics}
        </div>
      )}
    </div>
  );
}
