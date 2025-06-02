import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { urn, access_token } = await request.json();

    if (!urn || !access_token) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    const job = {
      input: { urn },
      output: {
        formats: [{ type: "svf", views: ["2d", "3d"] }],
      },
    };

    const res = await fetch(
      "https://developer.api.autodesk.com/modelderivative/v2/designdata/job",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(job),
      }
    );

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`Translate request failed: ${res.status} ${msg}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Translate API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
