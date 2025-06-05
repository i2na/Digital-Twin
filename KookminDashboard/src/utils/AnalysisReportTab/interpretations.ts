/**
 * PPD(%) 상태 해석
 */
export function interpretPPD(ppd: number): string {
  if (ppd < 10) return "쾌적";
  if (ppd < 25) return "약간 불만";
  return "불만";
}

/**
 * DI (Discomfort Index) 상태 해석
 */
export function interpretDI(di: number): string {
  if (di < 65) return "매우 쾌적";
  if (di < 70) return "쾌적";
  if (di < 75) return "주의";
  if (di < 80) return "불쾌";
  return "매우 불쾌";
}

/**
 * HI (Heat Index) 상태 해석
 */
export function interpretHI(hi: number): string {
  if (hi < 27) return "시원함";
  if (hi < 32) return "약간 더움";
  if (hi < 41) return "매우 더움";
  return "위험";
}

/**
 * CLI (Cooling Load Index; kJ/kg) 상태 해석
 */
export function interpretCLI(cli: number): string {
  if (cli < 5) return "낮음";
  if (cli < 15) return "보통";
  return "높음";
}

/**
 * Cooling Power (kW) 상태 해석
 */
export function interpretCoolingPower(cp: number): string {
  if (cp < 1) return "낮음";
  if (cp < 3) return "보통";
  return "높음";
}
