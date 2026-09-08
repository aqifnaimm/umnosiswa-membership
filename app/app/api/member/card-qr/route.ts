import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const membershipId = String(url.searchParams.get("membership_id") || "")
      .trim()
      .toUpperCase();

    if (!/^US\d{6}$/.test(membershipId)) {
      return NextResponse.json(
        { error: "ID keahlian tidak sah." },
        { status: 400 }
      );
    }

    const verifyUrl = `${url.origin}/verify/${membershipId}`;
    const qrService =
      `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=png&data=` +
      encodeURIComponent(verifyUrl);

    const response = await fetch(qrService, {
      headers: { "User-Agent": "UMNOSiswa-Membership-Portal/1.0" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("QR service tidak dapat diakses.");
    }

    const bytes = await response.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Content-Disposition": `inline; filename="QR-${membershipId}.png"`
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Gagal menjana QR." },
      { status: 500 }
    );
  }
}
