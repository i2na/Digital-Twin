import { NextRequest, NextResponse } from "next/server";

const token = process.env.NEXT_PUBLIC_SMARTTHINGS_TOKEN;
const deviceId = process.env.NEXT_PUBLIC_SMARTTHINGS_DEVICE_ID;

if (!token || !deviceId) {
  console.error("Missing SMARTTHINGS_TOKEN or SMARTTHINGS_DEVICE_ID");
}

export async function POST(req: NextRequest) {
  if (!token || !deviceId) {
    return NextResponse.json(
      { success: false, message: "Server not configured" },
      { status: 500 }
    );
  }

  let body: {
    switch: number; // 1 = 켬, 0 = 끔
    setpoint: number; // 희망 온도
    mode: string; // "cool" | "heat" | "dry" | "wind" | "aIComfort"
    fanMode: string; // "Auto" | "1" | "2" | ... | "max"
    optionalMode: string; // "off" | "energySaving" | "windFree" | "sleep" | "windFreeSleep" | "speed" | "smart" | "quiet" | "twoStep" | "comfort" | "dlightCool" | "dryComfort" | "cubePurify" | "longWind" | "motionIndirect" | "motionDirect"
  };
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json(
      { success: false, message: "Invalid JSON" },
      { status: 400 }
    );
  }

  const commands: any[] = [];

  // 1) 전원 on/off
  commands.push({
    component: "main",
    capability: "switch",
    command: body.switch === 1 ? "on" : "off",
    arguments: [],
  });

  // 2) 운전 모드 (냉방/난방/제습/송풍/AI 등)
  commands.push({
    component: "main",
    capability: "airConditionerMode",
    command: "setAirConditionerMode",
    arguments: [body.mode],
  });

  // 3) 팬 모드: setFanMode (대소문자 주의)
  //    user가 "auto"를 보냈다면 "Auto"로 변환, 숫자는 그대로 사용
  const fanArg = body.fanMode === "auto" ? "Auto" : body.fanMode; // "1", "2", "max" 등은 그대로
  commands.push({
    component: "main",
    capability: "airConditionerFanMode",
    command: "setFanMode",
    arguments: [fanArg],
  });

  // 4) 온도(냉방) 세트포인트
  commands.push({
    component: "main",
    capability: "thermostatCoolingSetpoint",
    command: "setCoolingSetpoint",
    arguments: [body.setpoint],
  });

  // 5) 부가 운전 모드 (custom.airConditionerOptionalMode)
  commands.push({
    component: "main",
    capability: "custom.airConditionerOptionalMode",
    command: "setAcOptionalMode",
    arguments: [body.optionalMode],
  });

  try {
    const res = await fetch(
      `https://api.smartthings.com/v1/devices/${deviceId}/commands`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commands }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("SmartThings API error:", text);
      return NextResponse.json(
        { success: false, message: text },
        { status: res.status }
      );
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("aircon control error:", e);
    return NextResponse.json(
      { success: false, message: e.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Method Not Allowed" },
    { status: 405 }
  );
}
