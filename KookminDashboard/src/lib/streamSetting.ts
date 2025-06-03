// /api/status/aircon
export const AC_STREAM_ID = "AQAAADU5NjVlNjA0LTU4NjctNGIAAAAA";
export const AC_PROPERTIES: Record<string, string> = {
  temperature_AC_1: "z:Dw",
  humidity_AC_1: "z:EA",
  switch_AC_1: "z:Cw",
  setpoint_AC_1: "z:Dg",
  mode_AC_1: "z:AQ",
  fanMode_AC_1: "z:DA",
  supportedMode_AC_1: "z:CA",
  power_AC_1: "z:Ag",
  energy_AC_1: "z:Bw",
};

// /api/status/rooms
export const ROOM_STREAMS: Record<
  string,
  { streamId: string; tempProp: string; humProp: string }
> = {
  513: {
    streamId: "AQAAADZmZGEyZTYxLTFmNTUtNDgAAAAA",
    tempProp: "z:DQ",
    humProp: "z:Cg",
  },
  516: {
    streamId: "AQAAAGRlMjc2NzlmLWYyOWUtNDYAAAAA",
    tempProp: "z:Eg",
    humProp: "z:FA",
  },
  524: {
    streamId: "AQAAADY0Y2VjOWM4LWM4MzItNDAAAAAA",
    tempProp: "z:Fg",
    humProp: "z:FQ",
  },
  525: {
    streamId: "AQAAADliODE1NjFiLTFiYWQtNGUAAAAA",
    tempProp: "z:EQ",
    humProp: "z:Ew",
  },
};
