import React, { useEffect, useRef, useState } from "react";
import { useRoomStore } from "@/utils/useRoomStore";

export function RoomList() {
  const roomsLatest = useRoomStore((state) => state.roomsLatest);
  const setSelectedRoom = useRoomStore((state) => state.setSelectedRoom);

  // 순시 전력 (W)
  const [power513, setPower513] = useState(0);
  // 구간 평균 전력 (kW)
  const [energyRate513, setEnergyRate513] = useState(0);

  // 이전 누적 에너지(Wh) 저장
  const prevEnergyRef = useRef<number>(100000);
  // 이전 타임스탬프(ms) 저장
  const prevTimeRef = useRef<number>(Date.now());

  // 화면에 보이는지 여부
  const [isVisible, setIsVisible] = useState(true);
  const room513WrapperRef = useRef<HTMLDivElement>(null);

  // true → 더미, false → 실제 API
  const USE_DUMMY = true;

  useEffect(() => {
    if (USE_DUMMY) {
      // 더미 데이터: 1초마다 임의 전력 생성, 구간 평균 전력 계산
      const iv = setInterval(() => {
        const now = Date.now();
        const simulatedPower = Math.random() * 2000;
        setPower513(simulatedPower);

        const deltaTimeSec = (now - prevTimeRef.current) / 1000;
        const deltaEnergyWh = (simulatedPower * deltaTimeSec) / 3600;
        const newTotalEnergy = prevEnergyRef.current + deltaEnergyWh;

        let avgKW = 0;
        if (deltaTimeSec > 0) {
          avgKW = (deltaEnergyWh / deltaTimeSec) * (3600 / 1000);
        }
        setEnergyRate513(avgKW);

        prevEnergyRef.current = newTotalEnergy;
        prevTimeRef.current = now;
      }, 1000);

      return () => clearInterval(iv);
    } else {
      // 실제 API: 1분마다 power_AC_1, energy_AC_1 가져와 구간 평균 전력 계산
      let mounted = true;
      const updateData = () => {
        const now = Date.now();
        fetch("/api/status/aircon")
          .then((res) => res.json())
          .then((data) => {
            if (!mounted) return;
            const powerFromApi =
              typeof data.power_AC_1 === "number" ? data.power_AC_1 : 0;
            const totalEnergy =
              typeof data.energy_AC_1 === "number" ? data.energy_AC_1 : 0;

            setPower513(powerFromApi);

            if (prevTimeRef.current) {
              const deltaEnergyWh = totalEnergy - prevEnergyRef.current;
              const deltaTimeSec = (now - prevTimeRef.current) / 1000;

              if (deltaEnergyWh >= 0 && deltaTimeSec > 0) {
                const avgKW = (deltaEnergyWh * 3600) / (deltaTimeSec * 1000);
                setEnergyRate513(avgKW);
              }
            }

            prevEnergyRef.current = totalEnergy;
            prevTimeRef.current = now;
          })
          .catch(() => {});
      };

      updateData();
      const iv = setInterval(updateData, 60000);
      return () => {
        mounted = false;
        clearInterval(iv);
      };
    }
  }, [USE_DUMMY]);

  useEffect(() => {
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

    // 초기 렌더 시 보이는지 확인
    const rect = wrapper.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
    }

    return () => observer.disconnect();
  }, []);

  // 최대값 설정
  const maxPower = 2000; // W → 2.0 kW
  const maxPowerKW = maxPower / 1000;
  const maxDailyEstimate = maxPowerKW * 24; // 48 kWh

  const avgPowerPercent = Math.min(energyRate513 / maxPowerKW, 1) * 100;
  const dailyEstimate = energyRate513 * 24; // kWh
  const dailyPercent = Math.min(dailyEstimate / maxDailyEstimate, 1) * 100;

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
              {/* 최근 평균 전력 */}
              <div className="w-full flex flex-col">
                <div className="flex justify-start items-center mb-1 px-1 gap-2">
                  <span className="text-[#222] font-medium text-base">
                    최근 평균 전력
                  </span>
                  <div className="h-[13px] w-[1px] bg-[#CDCECE]" />
                  <span className="text-[#0097FF] font-bold text-lg">
                    {energyRate513.toFixed(2)}{" "}
                    <span className="text-black">kW</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-[97%] h-2 bg-[#DCE5EA] rounded overflow-hidden m-auto">
                    <div
                      className="h-2 rounded transition-all duration-1000 ease-out"
                      style={{
                        width: isVisible ? `${avgPowerPercent}%` : "0%",
                        background:
                          "linear-gradient(90deg, #0088E4 0%, #47B3FD 100%)",
                      }}
                    />
                  </div>
                  <span className="ml-2 text-[#b9c1c6] font-medium text-[10px] whitespace-nowrap">
                    {maxPowerKW.toFixed(1)} kW
                  </span>
                </div>
              </div>

              {/* 예상 일일 전력량 */}
              <div className="w-full flex flex-col">
                <div className="flex justify-start items-center mb-1 px-1 gap-2">
                  <span className="text-[#222] font-medium text-base">
                    예상 일일 전력량
                  </span>
                  <div className="h-[13px] w-[1px] bg-[#CDCECE]" />
                  <span className="text-[#0097FF] font-bold text-lg">
                    {dailyEstimate.toFixed(2)}{" "}
                    <span className="text-black">kWh</span>
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-[97%] h-2 bg-[#DCE5EA] rounded overflow-hidden m-auto">
                    <div
                      className="h-2 rounded transition-all duration-1000 ease-out"
                      style={{
                        width: isVisible ? `${dailyPercent}%` : "0%",
                        background:
                          "linear-gradient(90deg, #0088E4 0%, #47B3FD 100%)",
                      }}
                    />
                  </div>
                  <span className="ml-2 text-[#b9c1c6] font-medium text-[10px] whitespace-nowrap">
                    {maxDailyEstimate.toFixed(0)} kWh
                  </span>
                </div>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
