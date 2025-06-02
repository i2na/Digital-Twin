import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req: Request) {
  try {
    const { T, RH, state_now } = (await req.json()) as {
      T: number;
      RH: number;
      state_now: {
        power: boolean;
        setpoint: number;
        mode: string;
        fanMode: string;
        optionalMode: string;
      };
    };
    const script = path.join(process.cwd(), "scripts", "auto_control_logic.py");
    const py = spawn("python3", [script, JSON.stringify({ T, RH, state_now })]);

    let out = "",
      err = "";
    py.stdout.on("data", (d) => (out += d));
    py.stderr.on("data", (d) => (err += d));

    return await new Promise<NextResponse>((res) => {
      py.on("close", (code) => {
        if (code !== 0) {
          console.error(err);
          return res(
            NextResponse.json({ error: "python error" }, { status: 500 })
          );
        }
        const parsed = JSON.parse(out);
        return res(NextResponse.json(parsed));
      });
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
