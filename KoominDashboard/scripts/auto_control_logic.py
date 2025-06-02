"""
에어컨 자동 제어 알고리즘
────────────────────────────────────────
• 입력
    T               : 실내 공기 온도(°C)
    RH              : 상대습도(%)
    state_now(dict) : 현재 에어컨 상태
        ├─ power         (bool)  ― 전원 on/off
        ├─ setpoint      (float) ― 희망온도(°C)
        ├─ mode          (str)   ― "cool" | "dry" | "wind" | …
        ├─ fanMode       (str)   ― "auto" | "1" | … | "max"
        └─ optionalMode  (str)   ― "off" 등

• 출력(dict)  ― 리모컨 API(body) 그대로 넘길 수 있음
        switch        : 1/0
        setpoint      : 희망온도
        mode          : "cool" | "dry"
        fanMode       : "auto" … "max"
        optionalMode  : 항상 "off"
        dryHours      : 제습 예상 시간(h, UI 참고용·0이면 생략 가능)
────────────────────────────────────────
"""

from __future__ import annotations
import math
from typing import Dict

#  불쾌지수 및 편미분
def di(T: float, RH: float) -> float:
    """불쾌지수 산출"""
    return 0.81 * T + 0.01 * RH * (0.99 * T - 14.3) + 46.3


def ddi_dT(RH: float) -> float:
    """DI를 온도 1 °C 내렸을 때 줄어드는 양"""
    return 0.81 + 0.0099 * RH


def ddi_dRH(T: float) -> float:
    """DI를 습도 1 %RH 내렸을 때 줄어드는 양"""
    return max(0.01 * (0.99 * T - 14.3), 1e-6)   # 0 나누기 방지


#  메인 결정 함수
def auto_control(
    T: float,
    RH: float,
    state_now: Dict[str, object] | None = None,
) -> Dict[str, object] | None:
    """
    DI가 ‘불쾌(≥72)’ 이상일 때만 제어 신호 반환.
    그 외에는 None(개입 필요 없음) 반환.
    """
    state_now = state_now or {}
    PWR   = bool(state_now.get("power", True))
    SETPT = float(state_now.get("setpoint", T))

    DI_now      = di(T, RH)
    DI_target   = 67.0          # 쾌적 상한
    THR_START   = 72.0          # 제어 트리거(‘불쾌’부터)
    T_min       = 22.0          # 희망온도 하한
    RH_rate     = 5.0           # 제습 1 h당 %RH 감소 경험계수

    # ─ 1. 개입 필요 여부 ─────────────────────
    if DI_now < THR_START:
        return "skip"             # ‘주의’(71 이하)면 그냥 둠

    # ─ 2. 필요한 DI 감소량 ───────────────────
    delta_DI = DI_now - DI_target

    # ─ 3. 온도 쪽으로 먼저 → ΔT ──────────────
    dTunit  = ddi_dT(RH)
    ΔT_need = delta_DI / dTunit

    ΔT_max  = max(0.0, T - T_min)
    ΔT      = min(ΔT_need, ΔT_max)

    T_set   = round(max(T_min, SETPT - ΔT))   # 새 희망온도 (정수 °C)

    # ─ 4. 남은 DI → 제습시간(ΔRH) ────────────
    remain_DI  = delta_DI - ΔT * dTunit
    if remain_DI <= 0:
        mode     = "cool"
        dry_hours = 0
    else:
        dRHunit  = ddi_dRH(T)
        ΔRH_need = remain_DI / dRHunit
        dry_hours = math.ceil(ΔRH_need / RH_rate)
        mode     = "dry"

    # ─ 5. 팬세기 간단 매핑 ───────────────────
    if   ΔT >= 3:  fan = "max"
    elif ΔT >= 2:  fan = "4"
    elif ΔT >= 1:  fan = "3"
    else:          fan = "auto"

    # ─ 6. 결과 리턴 ───────────────────────────
    duration = dry_hours * 3600 if dry_hours > 0 else 900

    return {
        "switch": 1 if PWR else 1,
        "setpoint": T_set,
        "mode": mode,
        "fanMode": fan,
        "optionalMode": "off",
        "duration": duration
    }

if __name__ == "__main__":
    import sys, json

    try:
        args = json.loads(sys.argv[1])
        T = args["T"]
        RH = args["RH"]
        state_now = args.get("state_now", {})
        result = auto_control(T, RH, state_now)
        print(json.dumps(result, ensure_ascii=False))
    except Exception as e:
        sys.stderr.write(f"{e}")
        sys.exit(1)