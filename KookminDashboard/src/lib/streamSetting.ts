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
  yesterday_energy_AC_1: "z:Fw",
};

// /api/status/rooms
export const ROOM_STREAMS: Record<
  string,
  {
    streamId: string;
    occupancyStreamId?: string;
    tempProp: string;
    humProp: string;
    occupancyProp?: string;
  }
> = {
  513: {
    streamId: "AQAAADZmZGEyZTYxLTFmNTUtNDgAAAAA",
    occupancyStreamId: "AQAAADg3ZmQwY2RkLTNkZDUtNDUAAAAA",
    tempProp: "z:DQ",
    humProp: "z:Cg",
    occupancyProp: "z:BA",
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
