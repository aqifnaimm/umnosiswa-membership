import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables belum lengkap.");
  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const umnoNo = String(body.umno_member_no || "").trim();
    const last4 = String(body.ic_last4 || "").replace(/\D/g, "");

    if (!umnoNo || last4.length !== 4) {
      return NextResponse.json({error:"Maklumat semakan tidak lengkap."},{status:400});
    }

    const { data, error } = await db()
      .from("membership_applications")
      .select("full_name,membership_id,ipt_name,ipt_zone,umno_division,status,ic_number")
      .eq("umno_member_no", umnoNo)
      .order("created_at", {ascending:false})
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({error:"Rekod keahlian tidak ditemui."},{status:404});

    const icDigits = String(data.ic_number || "").replace(/\D/g,"");
    if (!icDigits.endsWith(last4)) {
      return NextResponse.json({error:"Maklumat semakan tidak sepadan."},{status:404});
    }

    const { ic_number, ...safeMember } = data;
    return NextResponse.json({member:safeMember});
  } catch (e:any) {
    return NextResponse.json({error:e.message || "Gagal membuat semakan."},{status:500});
  }
}
