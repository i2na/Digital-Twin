/**
 * 1) 불쾌 지수 (Discomfort Index; DI)
 *    DI = 0.81·T + 0.01·RH·(0.99·T − 14.3) + 46.3
 */
export function calculateDiscomfortIndex(t: number, rh: number): number {
  return 0.81 * t + 0.01 * rh * (0.99 * t - 14.3) + 46.3;
}

/**
 * 2) 체감 온도 (Heat Index; HI) - NOAA 근사식
 *    ↳ HIbase < T 이면 T 반환
 */
export function calculateHeatIndex(t: number, rh: number): number {
  const T = t;
  const R = rh;
  const HIbase =
    -8.784695 +
    1.61139411 * T +
    2.338549 * R +
    -0.14611605 * T * R +
    -0.012308094 * T * T +
    -0.016424828 * R * R +
    0.002211732 * T * T * R +
    0.00072546 * T * R * R +
    -0.000003582 * T * T * R * R;
  return HIbase < T ? T : HIbase;
}

/**
 * 3) 공기 엔탈피 (h; kJ/kg 건공기)
 *    p_v = (RH/100)·6.1078·10^(7.5·T/(T+237.3))   (단위: hPa)
 *    W   = 0.622·p_v / (P - p_v)                 (kg_water/kg_dry air)
 *    h   = 1.006·T + W·(2501 + 1.86·T)            (kJ/kg)
 */
export function calculateEnthalpy(t: number, rh: number): number {
  const p_v = (rh / 100) * 6.1078 * Math.pow(10, (7.5 * t) / (t + 237.3)); // hPa
  const P = 1013.25; // hPa (표준 대기압)
  const W = (0.622 * p_v) / (P - p_v);
  return 1.006 * t + W * (2501 + 1.86 * t);
}

/**
 * 4) 냉방 부하 지수 (Cooling Load Index; CLI)
 *    = max(0, h(indoor) - h(baseline))
 *    baseline: 24°C, 50%RH 환경의 엔탈피
 */
export function calculateCoolingLoadIndex(t: number, rh: number): number {
  const hIndoor = calculateEnthalpy(t, rh);
  const hBaseline = calculateEnthalpy(24, 50);
  return Math.max(0, hIndoor - hBaseline);
}

/**
 * 5) 추정 냉방 전력 (Cooling Power; kW)
 *    = CLI(kJ/kg) × assumedMassFlow(kg/s)    (→ kJ/s = kW)
 */
export function calculateCoolingPower(
  cli: number,
  assumedMassFlow: number = 0.05
): number {
  return cli * assumedMassFlow;
}
