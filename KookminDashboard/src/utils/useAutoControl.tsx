"use client";

import { create } from "zustand";
import { toast } from "react-hot-toast";

export interface AutoCmd {
  switch: 1 | 0;
  setpoint: number;
  mode: string;
  fanMode: string;
  optionalMode: string;
  duration: number; // sec
}

type AutoRemoteState = {
  // RemotePanel 열림/닫힘
  open: boolean;
  openPanel: () => void;
  closePanel: () => void;

  // 자동제어 상태
  active: boolean;
  rest: number;
  timerId: number | null;

  // 자동제어 시각값들
  autoPower: boolean;
  autoTemp: number;
  autoAcMode: string;
  autoFanMode: string;
  autoOptionalMode: string;

  // 자동제어 시작/중단
  startAuto: (T: number, RH: number, setpoint: number) => Promise<void>;
  stopAuto: () => Promise<void>;
};

export const useAutoControl = create<AutoRemoteState>((set, get) => ({
  // RemotePanel 열림/닫힘
  open: false,
  openPanel: () => set({ open: true }),
  closePanel: () => set({ open: false }),

  // 자동제어 상태 초기값
  active: false,
  rest: 0,
  timerId: null,

  // 자동제어 시각값들 초기값
  autoPower: false,
  autoTemp: 0,
  autoAcMode: "cool",
  autoFanMode: "auto",
  autoOptionalMode: "off",

  // 자동제어 시작
  startAuto: async (T, RH, setpoint) => {
    // 1) active = true
    set({ active: true });

    // 2) 현재 상태 조회
    const statusRes = await fetch("/api/status/aircon");
    if (!statusRes.ok) {
      console.error("autoControl: 상태 조회 실패");
      set({ active: false });
      return;
    }
    const statusData = await statusRes.json();
    const currentState = {
      power: statusData.switch_AC_1 === 1 || statusData.switch_AC_1 === "on",
      setpoint: statusData.setpoint_AC_1 ?? setpoint,
      mode: statusData.mode_AC_1,
      fanMode: statusData.fanMode_AC_1,
      optionalMode: statusData.supportedMode_AC_1,
    };

    // 3) 자동 제어 API 호출
    const res = await fetch("/api/control/aircon/auto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ T, RH, state_now: currentState }),
    });
    const cmd: AutoCmd | "skip" = await res.json();
    if (cmd === "skip") {
      set({ active: false });
      toast("자동 제어가 필요하지 않습니다.", { icon: "ℹ️" });
      return;
    }

    // 4) 실제 제어 명령
    const controlRes = await fetch("/api/control/aircon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cmd),
    });
    if (!controlRes.ok) {
      toast.error("자동 제어 명령 전송에 실패했습니다.");
      set({ active: false });
      return;
    }

    // 5) “자동제어 토스트” 띄우기
    toast.success(
      <div>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "16px",
            marginBottom: "4px",
          }}
        >
          에어컨을 제어합니다.
        </div>
        <div
          style={{
            fontWeight: "900",
            display: "flex",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <span>온도 {cmd.setpoint}°C | </span>
          <span>모드 {cmd.mode} | </span>
          <span>풍량 {cmd.fanMode} | </span>
          <span>부가 {cmd.optionalMode}</span>
        </div>
      </div>,
      {
        duration: 6000,
        style: {
          width: "400px",
          textAlign: "center",
          lineHeight: "1.6",
          padding: "8px",
          fontSize: "14px",
        },
      }
    );

    // 6) 반환된 값들로 상태 세팅
    set({
      autoPower: cmd.switch === 1,
      autoTemp: cmd.setpoint,
      autoAcMode: cmd.mode,
      autoFanMode: cmd.fanMode,
      autoOptionalMode: cmd.optionalMode,
      rest: cmd.duration,
      active: true,
    });

    // 7) 패널 강제 오픈
    get().openPanel();

    // 8) 기존 타이머가 있으면 클리어
    const prevId = get().timerId;
    if (prevId !== null) {
      clearInterval(prevId);
    }

    // 9) setInterval로 남은 시간 감소
    const id = window.setInterval(() => {
      const { rest: currentRest } = get();
      if (currentRest <= 1) {
        get().stopAuto();
      } else {
        set({ rest: currentRest - 1 });
      }
    }, 1000);

    set({ timerId: id });
  },

  // 자동제어 중단
  stopAuto: async () => {
    const prevId = get().timerId;
    if (prevId !== null) {
      clearInterval(prevId);
      set({ timerId: null });
    }
    set({ active: false, rest: 0 });
    await fetch("/api/status/aircon");
    toast.success("자동 제어가 종료되었습니다.");
  },
}));
