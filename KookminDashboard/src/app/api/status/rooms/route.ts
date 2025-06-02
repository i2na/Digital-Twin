import { NextResponse, NextRequest } from "next/server";
import { FALLBACK_ROOMS } from "@/lib/sampleData";
import { ROOM_STREAMS } from "@/lib/streamSetting";

const MODEL_URN = process.env.NEXT_PUBLIC_MODEL_URN as string;
const USE_TANDEM = process.env.NEXT_PUBLIC_TANDEM_ENABLED === "true";

async function fetchAllPoints(
  streamId: string,
  property: string,
  token: string
): Promise<{ times: number[]; values: number[] }> {
  const res = await fetch(
    `https://tandem.autodesk.com/api/v1/timeseries/models/${MODEL_URN}/streams/${streamId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return { times: [], values: [] };
  const data = (await res.json()) as Record<string, Record<string, number>>;

  const entries = data[property] || {};
  const times = Object.keys(entries)
    .map((ts) => Number(ts))
    .sort((a, b) => a - b);
  const values = times.map((t) => entries[t]);
  return { times, values };
}

export async function GET(req: NextRequest) {
  if (!USE_TANDEM) {
    return NextResponse.json(FALLBACK_ROOMS);
  }
  const token = req.cookies.get("tandem_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  if (!MODEL_URN) {
    return NextResponse.json({ error: "Missing URN" }, { status: 400 });
  }

  const roomsLatest: Record<
    string,
    { temperature: number | null; humidity: number | null; occupancy?: number }
  > = {};
  const roomsHistory: Record<
    string,
    {
      temperature: Array<{ time: string; value: number }>;
      humidity: Array<{ time: string; value: number }>;
    }
  > = {};

  for (const [room, { streamId, tempProp, humProp }] of Object.entries(
    ROOM_STREAMS
  )) {
    const { times: tTimes, values: tVals } = await fetchAllPoints(
      streamId,
      tempProp,
      token
    );
    const { times: hTimes, values: hVals } = await fetchAllPoints(
      streamId,
      humProp,
      token
    );

    roomsLatest[room] = {
      temperature: tVals.length ? tVals[tVals.length - 1] : null,
      humidity: hVals.length ? hVals[hVals.length - 1] : null,
    };

    roomsHistory[room] = {
      temperature: tTimes.map((ts, i) => ({
        time: new Date(ts).toLocaleTimeString("ko-KR", {
          timeZone: "Asia/Seoul",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: tVals[i],
      })),
      humidity: hTimes.map((ts, i) => ({
        time: new Date(ts).toLocaleTimeString("ko-KR", {
          timeZone: "Asia/Seoul",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: hVals[i],
      })),
    };
  }

  return NextResponse.json({ rooms: roomsLatest, history: roomsHistory });
}
