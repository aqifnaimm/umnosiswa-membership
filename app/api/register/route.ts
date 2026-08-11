import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const required = [
      "full_name",
      "phone_number",
      "email",
      "ic_number",
      "umno_member_no",
      "ipt_name",
      "graduation_year",
      "ipt_zone",
      "umno_division"
    ];

    for (const key of required) {
      if (!body[key]) {
        return NextResponse.json(
          { error: `Medan ${key} diperlukan.` },
          { status: 400 }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Supabase belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { error } = await supabase
      .from("membership_applications")
      .insert({
        full_name: body.full_name,
        phone_number: body.phone_number,
        email: body.email.toLowerCase(),
        ic_number: body.ic_number,
        umno_member_no: body.umno_member_no,
        ipt_name: body.ipt_name,
        graduation_year: Number(body.graduation_year),
        ipt_zone: body.ipt_zone,
        umno_division: body.umno_division,
        status: "pending"
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Permintaan tidak sah." },
      { status: 400 }
    );
  }
}
