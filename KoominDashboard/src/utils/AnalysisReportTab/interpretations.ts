/**
 * PPD(%) 상태 해석
 *  • 0–10%: 쾌적
 *  • 10–25%: 약간 불만
 *  • ≥25%: 불만 (재조정 필요)
 */
export function interpretPPD(ppd: number): string {
  if (ppd < 10) return "쾌적";
  if (ppd < 25) return "약간 불만";
  return "불만 (재조정 필요)";
}

/**
 * DI (Discomfort Index) 상태 해석
 *  • < 68: 쾌적
 *  • 68–72: 주의
 *  • 72–75: 불쾌
 *  • ≥ 75: 매우 불쾌
 */
export function interpretDI(di: number): string {
  if (di < 68) return "쾌적";
  if (di < 72) return "주의";
  if (di < 75) return "불쾌";
  return "매우 불쾌";
}

/**
 * HI (Heat Index) 상태 해석
 *  • < 27°C: 시원함
 *  • 27–32°C: 약간 더움
 *  • 32–41°C: 매우 더움
 *  • ≥ 41°C: 위험
 */
export function interpretHI(hi: number): string {
  if (hi < 27) return "시원함";
  if (hi < 32) return "약간 더움";
  if (hi < 41) return "매우 더움";
  return "위험";
}

/**
 * CLI (Cooling Load Index; kJ/kg) 상태 해석
 *  • < 5: 낮음
 *  • 5–15: 보통
 *  • ≥ 15: 높음
 */
export function interpretCLI(cli: number): string {
  if (cli < 5) return "낮음";
  if (cli < 15) return "보통";
  return "높음";
}

/**
 * Cooling Power (kW) 상태 해석
 *  • < 1 kW: 낮음
 *  • 1–3 kW: 보통
 *  • ≥ 3 kW: 높음
 */
export function interpretCoolingPower(cp: number): string {
  if (cp < 1) return "낮음";
  if (cp < 3) return "보통";
  return "높음";
}
