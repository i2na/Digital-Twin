import React, { useEffect, useRef, useState } from "react";
import { useRoomStore } from "@/utils/useRoomStore";

export function RoomList() {
  const roomsLatest = useRoomStore((state) => state.roomsLatest);
  const setSelectedRoom = useRoomStore((state) => state.setSelectedRoom);

  // 순시 전력 (W)
  const [power513, setPower513] = useState(0);
  // 현재 누적 에너지 (Wh)
  const [totalEnergy513, setTotalEnergy513] = useState(0);
  // 전날 자정까지 누적 에너지 (Wh) — API에서 받는 값이라고 가정
  const [yesterdayEnergy513, setYesterdayEnergy513] = useState<number | null>(
    null
  );

  // 화면에 보이는지 여부 (애니메이션용)
  const [isVisible, setIsVisible] = useState(true);
  const room513WrapperRef = useRef<HTMLDivElement>(null);

  // true → 더미 모드, false → 실제 API
  const USE_DUMMY = true;

  useEffect(() => {
    // IntersectionObserver 세팅
    const wrapper = room513WrapperRef.current;
    if (!wrapper) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(wrapper);

    const rect = wrapper.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (USE_DUMMY) {
      // 더미 모드: 1초마다 랜덤 값 할당 (코드 이해용; 배포 시 false로 두세요)
      const iv = setInterval(() => {
        const now = Date.now();
        const simulatedPower = Math.random() * 2000; // W
        setPower513(simulatedPower);

        const simulatedTotalEnergy = Math.random() * 50000; // Wh
        setTotalEnergy513(simulatedTotalEnergy);

        // 전날 에너지도 24시간 전 랜덤치로 가정
        setYesterdayEnergy513(simulatedTotalEnergy - Math.random() * 8000);
      }, 1000);
      return () => clearInterval(iv);
    }

    let mounted = true;
    const updateData = () => {
      fetch("/api/status/aircon")
        .then((res) => res.json())
        .then((data) => {
          if (!mounted) return;

          // API에서 넘어오는 순간 전력(W)
          const instantPowerW =
            typeof data.power_AC_1 === "number" ? data.power_AC_1 : 0;
          setPower513(instantPowerW);

          // API에서 넘어오는 누적 에너지(Wh)
          const totalEnergyWh =
            typeof data.energy_AC_1 === "number" ? data.energy_AC_1 : 0;
          setTotalEnergy513(totalEnergyWh);

          // API에서 넘어오는 전날 자정까지 누적 에너지(Wh) 가정
          const yestEnergy =
            typeof data.yesterday_energy_AC_1 === "number"
              ? data.yesterday_energy_AC_1
              : null;
          setYesterdayEnergy513(yestEnergy);
        })
        .catch(() => {
          // 에러 시 무시
        });
    };

    // 첫 호출
    updateData();
    // 1분마다 업데이트
    const iv = setInterval(updateData, 60000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  // --- 시각화 계산 ---
  const maxPower = 2000; // W
  // 실시간 전력 백분율
  const instantPercent = Math.min(power513 / maxPower, 1) * 100;

  // 전날 대비 에너지 증가량 (Wh)
  const energyIncreaseWh =
    yesterdayEnergy513 !== null
      ? Math.max(totalEnergy513 - yesterdayEnergy513, 0)
      : 0;
  // 하루 최대 Wh 기준: 2kW × 24h = 48 kWh = 48,000 Wh
  const maxDailyWh = maxPower * 24;
  const increasePercent =
    yesterdayEnergy513 !== null
      ? Math.min(energyIncreaseWh / maxDailyWh, 1) * 100
      : 0;

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="text-[#6C6C6C] font-semibold text-lg ml-1">
        공간별 상태
      </div>
      {Object.entries(roomsLatest).map(([room, info]) => (
        <button
          key={room}
          onClick={() => setSelectedRoom(Number(room))}
          className="bg-white rounded-lg p-[10px] shadow-block flex flex-col items-start hover:bg-gray-50 transition-all duration-150"
        >
          <div className="text-white bg-[#4F4F52] text-[14px] px-[11px] py-[1.5px] rounded-md font-semibold mb-3">
            {room}호
          </div>
          <div className="flex justify-start w-full gap-7 px-[8.5px]">
            <div className="flex items-center gap-2">
              <span className="text-[#222] font-medium text-base">온도</span>
              <div className="h-[13px] w-[1px] bg-[#CDCECE]" />
              <span className="text-black font-bold text-lg">
                {info.temperature}°C
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#222] font-medium text-base">습도</span>
              <div className="h-[13px] w-[1px] bg-[#CDCECE]" />
              <span className="text-black font-bold text-lg">
                {info.humidity}%
              </span>
            </div>
          </div>

          {room === "513" && (
            <div
              ref={room513WrapperRef}
              className="mt-4 w-full flex flex-col gap-4 px-[8.5px]"
            >
              {/* 1) 현재 실시간 전력 사용률 */}
              <div className="w-full flex flex-col">
                <div className="flex justify-start items-center mb-1 px-1 gap-2">
                  <span className="text-[#222] font-medium text-base">
                    현재 실시간 전력
                  </span>
                  <div className="h-[13px] w-[1px] bg-[#CDCECE]" />
                  <span className="text-[#0097FF] font-bold text-lg">
                    {power513.toFixed(0)} <span className="text-black">W</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-[97%] h-2 bg-[#DCE5EA] rounded overflow-hidden m-auto">
                    <div
                      className="h-2 rounded transition-all duration-500 ease-out"
                      style={{
                        width: isVisible ? `${instantPercent}%` : "0%",
                        background:
                          "linear-gradient(90deg, #FF8C00 0%, #FFD54F 100%)",
                      }}
                    />
                  </div>
                  <span className="ml-2 text-[#b9c1c6] font-medium text-[10px] whitespace-nowrap">
                    {(maxPower / 1000).toFixed(1)} kW
                  </span>
                </div>
              </div>

              {/* 2) 누적 에너지 (숫자만 표시) */}
              <div className="flex justify-between items-center px-1">
                <span className="text-[#222] font-medium text-base">
                  총 누적 에너지
                </span>
                <span className="text-[#0097FF] font-bold text-lg">
                  {totalEnergy513.toFixed(0)}{" "}
                  <span className="text-black">Wh</span>
                </span>
              </div>

              {/* 3) 전날 대비 에너지 증가량 (API에서 값이 없거나 0이면 숨김) */}
              {yesterdayEnergy513 !== null && yesterdayEnergy513 > 0 && (
                <div className="w-full flex flex-col">
                  <div className="flex justify-start items-center mb-1 px-1 gap-2">
                    <span className="text-[#222] font-medium text-base">
                      전날 대비 증가량
                    </span>
                    <div className="h-[13px] w-[1px] bg-[#CDCECE]" />
                    <span className="text-[#0097FF] font-bold text-lg">
                      {energyIncreaseWh.toFixed(0)}{" "}
                      <span className="text-black">Wh</span>
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-[97%] h-2 bg-[#DCE5EA] rounded overflow-hidden m-auto">
                      <div
                        className="h-2 rounded transition-all duration-1000 ease-out"
                        style={{
                          width: isVisible ? `${increasePercent}%` : "0%",
                          background:
                            "linear-gradient(90deg, #0088E4 0%, #47B3FD 100%)",
                        }}
                      />
                    </div>
                    <span className="ml-2 text-[#b9c1c6] font-medium text-[10px] whitespace-nowrap">
                      {Math.round(maxDailyWh)} Wh
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
