// /api/status/aircon
export const AC_STREAM_ID = "AQAAADU5NjVlNjA0LTU4NjctNGIAAAAA";
export const AC_PROPERTIES: Record<string, string> = {
  temperature_AC_1: "z:Dw",
  humidity_AC_1: "z:EA",
  switch_AC_1: "z:11",
  setpoint_AC_1: "z:Dg",
  mode_AC_1: "z:22",
  fanMode_AC_1: "z:33",
  supportedMode_AC_1: "z:44",
  power_AC_1: "z:Ag",
  energy_AC_1: "z:Bw",
};

// /api/status/rooms
export const ROOM_STREAMS: Record<
  string,
  { streamId: string; tempProp: string; humProp: string }
> = {
  513: {
    streamId: "AQAAAGFmZjYzZmU2LWZiZmEtNGUAAAAA",
    tempProp: "z:Bg",
    humProp: "z:CQ",
  },
};
