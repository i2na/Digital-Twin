import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

interface MetricsResponse {
  pmv: number;
  ppd: number;
}

export async function POST(request: Request) {
  try {
    const { ta, tr, rh, met, clo } = (await request.json()) as {
      ta: number;
      tr: number;
      rh: number;
      met: number;
      clo: number;
    };

    const scriptPath = path.join(process.cwd(), "scripts", "compute_ppd.py");
    const pythonProcess = spawn("python3", [
      scriptPath,
      JSON.stringify({ ta, tr, rh, met, clo }),
    ]);

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (chunk) => {
      stdoutData += chunk.toString();
    });
    pythonProcess.stderr.on("data", (chunk) => {
      stderrData += chunk.toString();
    });

    return await new Promise<NextResponse>((resolve) => {
      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error("Python 스크립트 stderr:", stderrData);
          return resolve(
            NextResponse.json(
              { error: "Python 계산 중 오류가 발생했습니다." },
              { status: 500 }
            )
          );
        }

        try {
          const parsed = JSON.parse(stdoutData) as MetricsResponse;
          return resolve(NextResponse.json(parsed));
        } catch (e) {
          console.error("JSON 파싱 오류:", e);
          return resolve(
            NextResponse.json(
              { error: "Python 출력 JSON 파싱 실패" },
              { status: 500 }
            )
          );
        }
      });
    });
  } catch (e) {
    console.error("API 라우트 내부 오류:", e);
    return NextResponse.json(
      { error: "Invalid request or server error" },
      { status: 400 }
    );
  }
}
