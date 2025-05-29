import { NextResponse, NextRequest } from "next/server";
import { FALLBACK } from "@/lib/sampleData";

type Metric = "temperature" | "humidity" | "occupancy";

const ROOMS = [512, 513, 514, 515];

export async function GET(req: NextRequest) {
  const useTandem = process.env.TANDEM_ENABLED === "true";
  if (!useTandem) {
    return NextResponse.json(FALLBACK);
  }

  const tokenCookie = req.cookies.get("tandem_token");
  const modelUrn = localStorage.getItem("model_urn");
  if (!tokenCookie) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  if (!modelUrn) {
    return NextResponse.json({ error: "Missing URN" }, { status: 400 });
  }
  const token = tokenCookie.value;

  const listRes = await fetch(
    `https://tandem.autodesk.com/api/v1/timeseries/models/${modelUrn}/streams`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) {
    console.error("stream list failed:", await listRes.text());
    return NextResponse.error();
  }
  const streamsList: Array<{ id: string; name?: string }> =
    await listRes.json();

  const latest: Record<number, Record<Metric, number>> = {};
  const history: Record<
    number,
    {
      temperature: Array<{ time: string; value: number }>;
      humidity: Array<{ time: string; value: number }>;
    }
  > = {};

  ROOMS.forEach((r) => {
    latest[r] = { temperature: 0, humidity: 0, occupancy: 0 };
    history[r] = { temperature: [], humidity: [] };
  });

  for (const s of streamsList) {
    if (!s.name) continue;
    const m = s.name.match(/^(temperature|humidity|occupancy)_(\d+)$/);
    if (!m) continue;
    const [, metric, roomStr] = m;
    const room = Number(roomStr);
    if (!ROOMS.includes(room)) continue;

    const { times, values } = await fetchAllPoints(s.id, token, modelUrn);
    const lastIndex = values.length - 1;
    if (lastIndex >= 0) {
      latest[room][metric as Metric] = values[lastIndex];
    }
    if (metric === "temperature" || metric === "humidity") {
      history[room][metric].push(
        ...times.map((t, i) => ({
          time: new Date(t).toLocaleTimeString("ko-KR"),
          value: values[i],
        }))
      );
    }
  }

  return NextResponse.json({ rooms: latest, history });
}

async function fetchAllPoints(
  streamId: string,
  token: string,
  modelUrn: string
): Promise<{ times: number[]; values: number[] }> {
  const res = await fetch(
    `https://tandem.autodesk.com/api/v1/timeseries/models/${modelUrn}/streams/${streamId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    console.error(`fetchAllPoints failed (${streamId}):`, await res.text());
    return { times: [], values: [] };
  }
  const data = (await res.json()) as Record<string, Record<string, number>>;
  const key = Object.keys(data)[0] || "";
  const entries = data[key] || {};
  const times = Object.keys(entries)
    .map((ts) => Number(ts))
    .sort((a, b) => a - b);
  const values = times.map((t) => entries[t]);
  return { times, values };
}
