import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error("Supabase environment variables belum lengkap.");
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

function normalizeUsername(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = normalizeUsername(body.username);

    if (!username) {
      return NextResponse.json(
        { error: "Nama pengguna diperlukan." },
        { status: 400 }
      );
    }

    const root = clients();
    const { data: admin, error } = await root
      .from("admin_users")
      .select("auth_user_id,email,username,role,is_active")
      .ilike("username", username)
      .maybeSingle();

    if (error) {
      console.error("Forgot password lookup error:", error.message);
      return NextResponse.json(
        { error: "Tidak dapat menyemak akaun pentadbir." },
        { status: 500 }
      );
    }

    // Only active IPT admins can request self-service password recovery.
    // Keep the response generic so the endpoint does not reveal whether a
    // particular username exists.
    if (!admin || !admin.is_active || admin.role !== "admin" || !admin.auth_user_id || !admin.email) {
      return NextResponse.json({
        ok: true,
        message: "Jika akaun Pentadbir IPT aktif dan mempunyai e-mel yang sah, pautan tetapan semula telah dihantar."
      });
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.umnosiswa.my").replace(/\/$/, "");
    const redirectTo = `${siteUrl}/admin/reset-password`;

    const { data: linkData, error: linkError } = await root.auth.admin.generateLink({
      type: "recovery",
      email: admin.email,
      options: { redirectTo }
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Generate recovery link error:", linkError?.message || "No action link returned");
      return NextResponse.json(
        { error: "Tidak dapat menjana pautan tetapan semula kata laluan. Pastikan URL reset password telah dibenarkan dalam Supabase Auth." },
        { status: 500 }
      );
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      throw new Error("RESEND_API_KEY belum ditetapkan.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "UMNOSiswa Malaysia <keahlian@umnosiswa.my>",
        to: [admin.email],
        reply_to: "mahasiswaumno@gmail.com",
        subject: "Tetapan Semula Kata Laluan Admin UMNOSiswa Malaysia",
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:620px;margin:auto">
            <h2 style="margin-bottom:8px">Tetapan Semula Kata Laluan</h2>
            <p>Assalamualaikum dan salam sejahtera,</p>
            <p>Kami menerima permintaan untuk menetapkan semula kata laluan akaun Pentadbir IPT UMNOSiswa Malaysia.</p>
            <p style="margin:28px 0"><a href="${linkData.properties.action_link}" style="display:inline-block;background:#e51b23;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700">Tetapkan Kata Laluan Baharu</a></p>
            <p>Pautan ini adalah untuk akaun <strong>${admin.email}</strong> dan hanya boleh digunakan untuk proses pemulihan kata laluan.</p>
            <p>Jika anda tidak meminta tetapan semula kata laluan, abaikan e-mel ini.</p>
            <p style="margin-top:28px">UMNOSiswa Malaysia<br/>BERSATU • BERSETIA • BERKHIDMAT</p>
          </div>
        `,
        text: `Tetapan semula kata laluan UMNOSiswa Malaysia. Buka pautan ini untuk menetapkan kata laluan baharu: ${linkData.properties.action_link}`
      })
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend forgot password error:", detail);
      return NextResponse.json(
        { error: "Pautan berjaya dijana tetapi e-mel tidak dapat dihantar buat masa ini." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Pautan tetapan semula kata laluan telah dihantar ke e-mel pentadbir."
    });
  } catch (error: any) {
    console.error("Admin forgot password error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal memproses permintaan tetapan semula kata laluan." },
      { status: 500 }
    );
  }
}
