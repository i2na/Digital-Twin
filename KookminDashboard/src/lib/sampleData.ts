export const FALLBACK_AIRCON = {
  temperature_AC_1: 22.7,
  humidity_AC_1: 46.1,
  switch_AC_1: 1,
  setpoint_AC_1: 24,
  mode_AC_1: "auto",
  fanMode_AC_1: "medium",
  supportedMode_AC_1: "auto",
  power_AC_1: 500,
  energy_AC_1: 640932,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface Point {
  time: string;
  value: number;
}

function generateRandomSeries(
  count: number,
  startHour: number,
  startMinute: number,
  base: number,
  variation: number
): Point[] {
  const pts: Point[] = [];
  let v = base;
  for (let i = 0; i < count; i++) {
    const totalMin = startHour * 60 + startMinute + i * 10;
    const hh = pad(Math.floor(totalMin / 60) % 24);
    const mm = pad(totalMin % 60);

    v += (Math.random() - 0.5) * variation;
    pts.push({ time: `${hh}:${mm}`, value: parseFloat(v.toFixed(1)) });
  }
  return pts;
}

export const FALLBACK_ROOMS = {
  rooms: {
    "513": { temperature: 22.7, humidity: 46.1, occupancy: 19 },
    "516": { temperature: 23.1, humidity: 50.2, occupancy: 12 },
    "524": { temperature: 21.9, humidity: 48.7, occupancy: 9 },
    "525": { temperature: 24.0, humidity: 46.5, occupancy: 14 },
  },
  history: {
    "513": {
      temperature: generateRandomSeries(70, 8, 0, 20, 3),
      humidity: generateRandomSeries(70, 8, 0, 60, 8),
    },
    "516": {
      temperature: generateRandomSeries(70, 8, 0, 21, 2.5),
      humidity: generateRandomSeries(70, 8, 0, 55, 7),
    },
    "524": {
      temperature: generateRandomSeries(70, 8, 0, 19, 4),
      humidity: generateRandomSeries(70, 8, 0, 50, 6),
    },
    "525": {
      temperature: generateRandomSeries(70, 8, 0, 23, 2),
      humidity: generateRandomSeries(70, 8, 0, 65, 9),
    },
  },
};
