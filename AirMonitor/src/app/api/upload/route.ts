import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (
      body.access_token &&
      body.fileName &&
      body.fileType &&
      !body.uploadKey
    ) {
      const { access_token, fileName, fileType } = body;
      const authHeader = { Authorization: `Bearer ${access_token}` };
      const baseUrl = "https://developer.api.autodesk.com/oss/v2";
      const bucketKey = `uploads-${Date.now()}`;

      const bucketRes = await fetch(`${baseUrl}/buckets`, {
        method: "POST",
        headers: {
          ...authHeader,
          "Content-Type": "application/json",
          "x-ads-region": "US",
        },
        body: JSON.stringify({ bucketKey, policyKey: "transient" }),
      });

      if (!bucketRes.ok && bucketRes.status !== 409) {
        const msg = await bucketRes.text();
        throw new Error(`Bucket creation failed: ${bucketRes.status} ${msg}`);
      }

      const signRes = await fetch(
        `${baseUrl}/buckets/${bucketKey}/objects/${encodeURIComponent(
          fileName
        )}/signeds3upload`,
        {
          method: "GET",
          headers: authHeader,
        }
      );

      if (!signRes.ok) {
        const msg = await signRes.text();
        throw new Error(`Signed URL request failed: ${signRes.status} ${msg}`);
      }

      const { uploadKey, urls } = await signRes.json();
      const signedUrl = urls?.[0];

      if (!uploadKey || !signedUrl) {
        throw new Error("Invalid signedS3upload response");
      }

      return NextResponse.json({
        signedUrl,
        uploadKey,
        bucketKey,
        fileName,
        fileType,
      });
    }

    if (
      body.uploadKey &&
      body.bucketKey &&
      body.fileName &&
      body.access_token
    ) {
      const { uploadKey, bucketKey, fileName, access_token } = body;
      const authHeader = { Authorization: `Bearer ${access_token}` };
      const baseUrl = "https://developer.api.autodesk.com/oss/v2";

      const finalizeRes = await fetch(
        `${baseUrl}/buckets/${bucketKey}/objects/${encodeURIComponent(
          fileName
        )}/signeds3upload`,
        {
          method: "POST",
          headers: {
            ...authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uploadKey }),
        }
      );

      if (!finalizeRes.ok) {
        const msg = await finalizeRes.text();
        throw new Error(`Finalize failed: ${finalizeRes.status} ${msg}`);
      }

      const urn = Buffer.from(
        `urn:adsk.objects:os.object:${bucketKey}/${fileName}`
      )
        .toString("base64")
        .replace(/=/g, "");

      return NextResponse.json({ urn });
    }

    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  } catch (err) {
    console.error("Upload route error:", err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
