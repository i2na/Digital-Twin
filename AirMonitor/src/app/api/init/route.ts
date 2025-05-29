import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  try {
    // 1. 토큰 발급
    const authRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/twolegged`,
      { method: "GET" }
    );
    if (!authRes.ok) throw new Error("토큰 발급 실패");
    const tokenData = await authRes.json();

    // 2. RVT 파일 읽기
    const filePath = path.join(process.cwd(), "public", "model3.rvt");
    const fileStat = fs.statSync(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    // 3. Forge Upload 시작
    const uploadRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: tokenData.access_token,
          fileName: "model3.rvt",
          fileType: "application/octet-stream",
        }),
      }
    );
    if (!uploadRes.ok) {
      const msg = await uploadRes.text();
      throw new Error(`업로드 실패: ${uploadRes.status} ${msg}`);
    }
    const { signedUrl, uploadKey, bucketKey, fileName, fileType } =
      await uploadRes.json();

    // 4. S3 PUT
    const putRes = await fetch(signedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": fileType,
        "Content-Length": String(fileStat.size),
      },
      body: fileBuffer,
    });
    if (!putRes.ok) {
      const msg = await putRes.text();
      throw new Error(`파일 업로드 실패: ${putRes.status} ${msg}`);
    }

    // 5. finalize
    await new Promise((r) => setTimeout(r, 1000));
    const finalizeRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/upload`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadKey,
          bucketKey,
          fileName,
          access_token: tokenData.access_token,
        }),
      }
    );
    if (!finalizeRes.ok) {
      const text = await finalizeRes.text();
      throw new Error(`Finalize 실패: ${finalizeRes.status} ${text}`);
    }
    const { urn } = await finalizeRes.json();

    // 6. 번역 요청
    const translateRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/translate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urn, access_token: tokenData.access_token }),
      }
    );
    if (!translateRes.ok) {
      const msg = await translateRes.text();
      throw new Error(`번역 요청 실패: ${translateRes.status} ${msg}`);
    }

    // 7. 번역 완료 대기
    while (true) {
      await new Promise((r) => setTimeout(r, 3000));
      const progRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/translate/${urn}/progress?accessToken=${tokenData.access_token}`
      );
      const { status } = await progRes.json();
      if (status === "success") break;
      if (status === "failed") throw new Error("번역 실패");
    }

    // 8. 쿠키에 token 저장
    const res = NextResponse.json({ success: true, urn });

    res.cookies.set("tandem_token", tokenData.access_token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: tokenData.expires_in,
    });

    return res;
  } catch (err) {
    console.error("INIT API ERROR:", err);
    return NextResponse.json(
      { error: "초기화 실패", message: String(err) },
      { status: 500 }
    );
  }
}
