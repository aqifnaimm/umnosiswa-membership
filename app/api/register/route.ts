import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeIC(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeUmnoNo(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

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
      "campus",
      "graduation_month",
      "graduation_year",
      "ipt_zone",
      "umno_division",
      "privacy_consent"
    ];

    for (const key of required) {
      const value = body[key];
      const missing =
        value === undefined ||
        value === null ||
        value === false ||
        (typeof value === "string" && value.trim() === "");

      if (missing) {
        return NextResponse.json(
          { error: `Medan ${key} diperlukan.` },
          { status: 400 }
        );
      }
    }

    if (!body.privacy_consent) {
      return NextResponse.json(
        { error: "Persetujuan Notis Privasi diperlukan." },
        { status: 400 }
      );
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

    // Server-side enforcement for System Settings.
    // This prevents direct POST requests from bypassing the public UI.
    const { data: systemSettings, error: settingsError } = await supabase
      .from("system_settings")
      .select("registration_open,maintenance_mode,maintenance_message")
      .eq("id", 1)
      .maybeSingle();

    if (settingsError) {
      console.error("Semakan tetapan pendaftaran gagal:", settingsError.message);
      return NextResponse.json(
        { error: "Tidak dapat menyemak status pendaftaran buat masa ini." },
        { status: 503 }
      );
    }

    if (systemSettings?.maintenance_mode) {
      return NextResponse.json(
        {
          error:
            systemSettings.maintenance_message ||
            "Sistem sedang diselenggara. Sila cuba sebentar lagi."
        },
        { status: 503 }
      );
    }

    if (systemSettings && systemSettings.registration_open === false) {
      return NextResponse.json(
        { error: "Pendaftaran keahlian sedang ditutup." },
        { status: 403 }
      );
    }

    const email = normalizeEmail(String(body.email));
    const icNumber = normalizeIC(String(body.ic_number));
    const umnoMemberNo = normalizeUmnoNo(String(body.umno_member_no));

    if (icNumber.length < 8) {
      return NextResponse.json(
        { error: "Nombor IC tidak sah." },
        { status: 400 }
      );
    }

    const graduationMonth = Number(body.graduation_month);

    if (!Number.isInteger(graduationMonth) || graduationMonth < 1 || graduationMonth > 12) {
      return NextResponse.json(
        { error: "Bulan tamat pengajian tidak sah." },
        { status: 400 }
      );
    }

    // Friendly duplicate checks before insert.
    const { data: emailMatch, error: emailCheckError } = await supabase
      .from("membership_applications")
      .select("id,status,membership_id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (emailCheckError) throw emailCheckError;

    if (emailMatch) {
      return NextResponse.json(
        {
          error:
            "Email ini telah digunakan untuk permohonan keahlian. Jika ini akaun anda, sila gunakan Portal Ahli atau hubungi pentadbir."
        },
        { status: 409 }
      );
    }

    const { data: umnoMatch, error: umnoCheckError } = await supabase
      .from("membership_applications")
      .select("id,status,membership_id")
      .eq("umno_member_no", umnoMemberNo)
      .limit(1)
      .maybeSingle();

    if (umnoCheckError) throw umnoCheckError;

    if (umnoMatch) {
      return NextResponse.json(
        {
          error:
            "Nombor Ahli UMNO ini telah mempunyai rekod keahlian UMNOSiswa."
        },
        { status: 409 }
      );
    }

    // IC is compared in normalized form so 010101-01-1234 and
    // 010101011234 are treated as the same IC.
    const { data: allIcs, error: icCheckError } = await supabase
      .from("membership_applications")
      .select("id,ic_number,status,membership_id");

    if (icCheckError) throw icCheckError;

    const icMatch = (allIcs || []).find(
      (row) => normalizeIC(String(row.ic_number || "")) === icNumber
    );

    if (icMatch) {
      return NextResponse.json(
        {
          error:
            "Nombor IC ini telah mempunyai rekod keahlian UMNOSiswa. Sila hubungi pentadbir jika anda percaya ini satu kesilapan."
        },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from("membership_applications")
      .insert({
        full_name: String(body.full_name).trim(),
        phone_number: String(body.phone_number).trim(),
        email,
        ic_number: icNumber,
        umno_member_no: umnoMemberNo,
        ipt_name: String(body.ipt_name).trim(),
        campus: String(body.campus).trim(),
        graduation_month: Number(body.graduation_month),
        graduation_year: Number(body.graduation_year),
        ipt_zone: String(body.ipt_zone).trim(),
        umno_division: String(body.umno_division).trim(),
        status: "pending"
      });

    if (error) {
      // Database unique constraints are the final protection against race conditions.
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Rekod yang sama telah wujud. Semak email, nombor IC atau nombor Ahli UMNO anda."
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Permintaan tidak sah." },
      { status: 400 }
    );
  }
}
