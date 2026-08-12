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


function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function maskIC(value: unknown) {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length >= 4 ? `******-**-${digits.slice(-4)}` : "****";
}

async function notifyAdminsOfNewApplication(
  supabase: any,
  application: any
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum ditetapkan.");
  }

  const { data: admins, error: adminError } = await supabase
    .from("admin_users")
    .select("email,role,ipt_scope,is_active")
    .eq("is_active", true);

  if (adminError) throw adminError;

  const applicantIpt = String(application.ipt_name || "").trim().toUpperCase();

  const recipients = Array.from(
    new Set(
      (admins || [])
        .filter((admin: any) => {
          if (!admin.email) return false;
          return (
            admin.role === "admin" &&
            String(admin.ipt_scope || "").trim().toUpperCase() === applicantIpt
          );
        })
        .map((admin: any) => String(admin.email).trim().toLowerCase())
        .filter(Boolean)
    )
  ) as string[];

  if (!recipients.length) {
    throw new Error(`Tiada pentadbir aktif ditemui untuk IPT ${applicantIpt}.`);
  }

  const adminUrl = "https://www.umnosiswa.my/admin";
  const fullName = escapeHtml(application.full_name);
  const email = escapeHtml(application.email);
  const phone = escapeHtml(application.phone_number);
  const ipt = escapeHtml(application.ipt_name);
  const campus = escapeHtml(application.campus);
  const umnoNo = escapeHtml(application.umno_member_no);
  const zone = escapeHtml(application.ipt_zone);
  const division = escapeHtml(application.umno_division);
  const graduationMonth = escapeHtml(application.graduation_month);
  const graduationYear = escapeHtml(application.graduation_year);
  const icMasked = escapeHtml(maskIC(application.ic_number));

  const html = `
    <!doctype html>
    <html lang="ms">
      <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#18202a;">
        <div style="max-width:680px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e7e9ee;">
            <div style="background:#071b3a;padding:28px 32px;text-align:center;">
              <div style="font-size:13px;letter-spacing:2px;font-weight:700;color:#ffffff;">UMNOSISWA MALAYSIA</div>
              <div style="margin-top:8px;font-size:12px;color:#c8d4e6;">PERMOHONAN KEAHLIAN BAHARU</div>
            </div>
            <div style="padding:34px 32px;">
              <h1 style="margin:0 0 14px;font-size:25px;line-height:1.3;color:#071b3a;">Permohonan baharu memerlukan semakan</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4b5563;">
                Satu permohonan keahlian UMNOSiswa Malaysia telah diterima dan kini berstatus Dalam Semakan.
              </p>
              <div style="background:#f7f8fa;border-radius:14px;padding:20px;">
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <tr><td style="padding:7px 0;color:#6b7280;width:38%;">Nama</td><td style="padding:7px 0;font-weight:700;">${fullName}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">IPT</td><td style="padding:7px 0;">${ipt}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Kampus</td><td style="padding:7px 0;">${campus}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Zon IPT</td><td style="padding:7px 0;">${zone}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">No. Ahli UMNO</td><td style="padding:7px 0;">${umnoNo}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">IC</td><td style="padding:7px 0;">${icMasked}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">E-mel</td><td style="padding:7px 0;">${email}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Telefon</td><td style="padding:7px 0;">${phone}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Bahagian UMNO</td><td style="padding:7px 0;">${division}</td></tr>
                  <tr><td style="padding:7px 0;color:#6b7280;">Tamat Pengajian</td><td style="padding:7px 0;">Bulan ${graduationMonth}, ${graduationYear}</td></tr>
                </table>
              </div>
              <div style="text-align:center;margin:28px 0 10px;">
                <a href="${adminUrl}" style="display:inline-block;background:#b5121b;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;">Semak Permohonan</a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `new-application/${application.id}`
    },
    body: JSON.stringify({
      from: "UMNOSiswa Malaysia <keahlian@umnosiswa.my>",
      to: recipients,
      reply_to: "mahasiswaumno@gmail.com",
      subject: `Permohonan Baharu UMNOSiswa — ${application.full_name} (${application.ipt_name})`,
      html
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.message || result?.error || `Resend gagal menghantar notifikasi (${response.status}).`);
  }
  return { result, recipients };
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

    const { data: application, error } = await supabase
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
      })
      .select("*")
      .single();

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

    let adminNotification = { sent: false, recipients: [] as string[] };

    try {
      const notification = await notifyAdminsOfNewApplication(supabase, application);
      adminNotification = { sent: true, recipients: notification.recipients };
    } catch (notificationError: any) {
      console.error("Notifikasi permohonan baharu gagal:", notificationError?.message || notificationError);
    }

    return NextResponse.json({ ok: true, admin_notification: adminNotification });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Permintaan tidak sah." },
      { status: 400 }
    );
  }
}
