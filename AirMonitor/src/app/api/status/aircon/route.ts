import { NextResponse, NextRequest } from "next/server";
import { FALLBACK_AIRCON } from "@/lib/sampleData";
import { AC_STREAM_ID, AC_PROPERTIES } from "@/lib/streamSetting";

const MODEL_URN = process.env.NEXT_PUBLIC_MODEL_URN as string;
const USE_TANDEM = process.env.NEXT_PUBLIC_TANDEM_ENABLED === "true";

async function fetchAllProperties(
  streamId: string,
  token: string
): Promise<Record<string, Record<string, number>>> {
  const res = await fetch(
    `https://tandem.autodesk.com/api/v1/timeseries/models/${MODEL_URN}/streams/${streamId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return {};
  return (await res.json()) as Record<string, Record<string, number>>;
}

export async function GET(req: NextRequest) {
  if (!USE_TANDEM) {
    return NextResponse.json(FALLBACK_AIRCON);
  }
  const token = req.cookies.get("tandem_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  if (!MODEL_URN) {
    return NextResponse.json({ error: "Missing URN" }, { status: 400 });
  }

  const allData = await fetchAllProperties(AC_STREAM_ID, token);
  const result: Record<string, number | null> = {};

  for (const [param, prop] of Object.entries(AC_PROPERTIES)) {
    const entries = allData[prop] || {};
    const times = Object.keys(entries)
      .map((ts) => Number(ts))
      .sort((a, b) => a - b);
    result[param] = times.length ? entries[times[times.length - 1]] : null;
  }

  return NextResponse.json(result);
}
