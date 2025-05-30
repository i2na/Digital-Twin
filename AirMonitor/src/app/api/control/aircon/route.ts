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
    switch: number;
    setpoint: number;
    mode: string;
    fanMode: string;
    optionalMode: string;
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

  // power on/off
  commands.push({
    component: "main",
    capability: "switch",
    command: body.switch === 1 ? "on" : "off",
    arguments: [],
  });

  // temperature setpoint
  if (typeof body.setpoint === "number") {
    if (body.mode === "heat") {
      commands.push({
        component: "main",
        capability: "thermostatHeatingSetpoint",
        command: "setHeatingSetpoint",
        arguments: [body.setpoint],
      });
    } else {
      commands.push({
        component: "main",
        capability: "thermostatCoolingSetpoint",
        command: "setCoolingSetpoint",
        arguments: [body.setpoint],
      });
    }
  }

  // 운전 모드
  commands.push({
    component: "main",
    capability: "airConditionerMode",
    command: "setAirConditionerMode",
    arguments: [body.mode],
  });

  // 바람세기
  commands.push({
    component: "main",
    capability: "airConditionerFanMode",
    command: "setAirConditionerFanMode",
    arguments: [body.fanMode],
  });

  // 부가운전 모드
  commands.push({
    component: "main",
    capability: "supportedAcOptionalMode",
    command: "setSupportedAcOptionalMode",
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
