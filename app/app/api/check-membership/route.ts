import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeIC(value: string) {
  return value.replace(/\D/g, "");
}

function studentStatus(month: number | null, year: number | null) {
  if (!year) return "active_student";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const graduationMonth = month && month >= 1 && month <= 12 ? month : 12;

  return year < currentYear ||
    (year === currentYear && graduationMonth < currentMonth)
    ? "alumni"
    : "active_student";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ic = normalizeIC(String(body.ic_number || ""));

    if (ic.length < 8 || ic.length > 14) {
      return NextResponse.json(
        { error: "Nombor kad pengenalan tidak sah." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !secret) {
      return NextResponse.json(
        { error: "Sistem semakan belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const root = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // ICs are stored normalized by the current registration API.
    // Only non-sensitive membership fields are returned to the browser.
    const { data, error } = await root
      .from("membership_applications")
      .select("full_name,membership_id,ipt_name,campus,ipt_zone,umno_division,status,graduation_month,graduation_year")
      .eq("ic_number", ic)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ found: false });
    }

    if (data.status === "approved") {
      return NextResponse.json({
        found: true,
        status: "approved",
        full_name: data.full_name,
        membership_id: data.membership_id,
        ipt_name: data.ipt_name,
        campus: data.campus,
        ipt_zone: data.ipt_zone,
        umno_division: data.umno_division,
        student_status: studentStatus(data.graduation_month, data.graduation_year)
      });
    }

    if (data.status === "pending") {
      return NextResponse.json({ found: true, status: "pending" });
    }

    return NextResponse.json({ found: true, status: "rejected" });
  } catch (e: any) {
    console.error("Ralat semakan keahlian:", e?.message || e);
    return NextResponse.json(
      { error: "Semakan keahlian tidak dapat dilakukan buat masa ini." },
      { status: 500 }
    );
  }
}
