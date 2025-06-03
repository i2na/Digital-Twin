import { NextResponse, NextRequest } from "next/server";
import { FALLBACK_AIRCON } from "@/lib/sampleData";
import { AC_STREAM_ID, AC_PROPERTIES } from "@/lib/streamSetting";

const MODEL_URN = process.env.NEXT_PUBLIC_MODEL_URN as string;
const USE_TANDEM = process.env.NEXT_PUBLIC_TANDEM_ENABLED === "true";

const SWITCH_MAP: Record<number, string> = {
  2: "on",
  3: "off",
};

const MODE_MAP: Record<number, string> = {
  2: "heat",
  3: "wind",
  7: "aIComfort",
  5: "cool",
  6: "dry",
};

const FAN_MODE_MAP: Record<number, string> = {
  2: "auto",
  3: "1",
  4: "2",
  5: "3",
  6: "4",
  7: "max",
};

const SUP_MODE_MAP: Record<number, string> = {
  2: "windFree",
  3: "windFreeSleep",
  4: "sleep",
  5: "quiet",
  6: "smart",
  7: "off",
};

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
  const numericResult: Record<string, number | null> = {};

  for (const [paramName, propCode] of Object.entries(AC_PROPERTIES)) {
    const entries = allData[propCode] || {};
    const times = Object.keys(entries)
      .map((t) => Number(t))
      .sort((a, b) => a - b);

    numericResult[paramName] = times.length
      ? entries[times[times.length - 1]]
      : null;
  }

  const mappedResult: Record<string, string | number | null> = {};

  for (const [paramName, rawValue] of Object.entries(numericResult)) {
    if (rawValue === null) {
      mappedResult[paramName] = null;
      continue;
    }

    if (paramName.startsWith("switch_")) {
      mappedResult[paramName] = SWITCH_MAP[rawValue as number] ?? null;
    } else if (paramName.startsWith("mode_")) {
      mappedResult[paramName] = MODE_MAP[rawValue as number] ?? null;
    } else if (paramName.startsWith("fanMode_")) {
      mappedResult[paramName] = FAN_MODE_MAP[rawValue as number] ?? null;
    } else if (paramName.startsWith("supMode_")) {
      mappedResult[paramName] = SUP_MODE_MAP[rawValue as number] ?? null;
    } else {
      mappedResult[paramName] = rawValue;
    }
  }

  console.log("numericResult:", numericResult);
  console.log("mappedResult:", mappedResult);

  return NextResponse.json(mappedResult);
}
