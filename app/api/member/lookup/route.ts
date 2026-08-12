import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables belum lengkap.");
  }

  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const membershipId = String(body.membership_id || "")
      .trim()
      .toUpperCase();

    const last4 = String(body.ic_last4 || "")
      .replace(/\D/g, "");

    if (!/^US\d{6}$/.test(membershipId) || last4.length !== 4) {
      return NextResponse.json(
        { error: "ID UMNOSiswa atau 4 digit IC tidak sah." },
        { status: 400 }
      );
    }

    const { data, error } = await db()
      .from("membership_applications")
      .select("full_name,membership_id,ipt_name,graduation_month,graduation_year,ipt_zone,umno_division,status,ic_number")
      .eq("membership_id", membershipId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Rekod keahlian tidak ditemui." },
        { status: 404 }
      );
    }

    const icDigits = String(data.ic_number || "").replace(/\D/g, "");

    if (!icDigits.endsWith(last4)) {
      return NextResponse.json(
        { error: "ID UMNOSiswa atau maklumat IC tidak sepadan." },
        { status: 404 }
      );
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const graduationYear = Number(data.graduation_year);
    const graduationMonth = data.graduation_month
      ? Number(data.graduation_month)
      : 12;

    const studentStatus =
      graduationYear < currentYear ||
      (graduationYear === currentYear && graduationMonth < currentMonth)
        ? "alumni"
        : "active_student";

    const { ic_number, ...safeMember } = data;

    return NextResponse.json({
      member: {
        ...safeMember,
        student_status: studentStatus
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gagal membuat semakan." },
      { status: 500 }
    );
  }
}
