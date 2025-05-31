import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

interface MetricsResponse {
  pmv: number;
  ppd: number;
  mold_flag: 0 | 1;
  ti: number;
}

// POST 요청으로 JSON 바디: { ta, tr, rh, met, clo } 를 받아 Python 스크립트에 전달
export async function POST(request: Request) {
  try {
    // 1. 클라이언트가 보낸 JSON 데이터를 파싱
    const { ta, tr, rh, met, clo } = (await request.json()) as {
      ta: number;
      tr: number;
      rh: number;
      met: number;
      clo: number;
    };

    // 2. Python 스크립트 경로
    const scriptPath = path.join(process.cwd(), "scripts", "compute_ppd.py");

    // 3. Python 프로세스 실행
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

    // 4. Python 종료 시점에 결과 처리
    return await new Promise<NextResponse>((resolve, reject) => {
      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error("Python 스크립트 오류:", stderrData);
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
