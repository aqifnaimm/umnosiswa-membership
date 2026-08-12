import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !secret) throw new Error("Supabase environment variables belum lengkap.");

  return {
    authClient: createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    }),
    adminClient: createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  };
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) return null;

  const { authClient, adminClient } = clients();
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: admin, error: adminError } = await adminClient
    .from("admin_users")
    .select("email,username,role,ipt_scope,is_active")
    .eq("auth_user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !admin) return null;

  return {
    userId: data.user.id,
    email: admin.email,
    username: admin.username,
    role: admin.role,
    ipt_scope: admin.ipt_scope as string | null
  };
}

function scopeError(admin: any) {
  return admin.role === "admin" && !admin.ipt_scope
    ? NextResponse.json(
        { error: "Akaun pentadbir ini belum ditetapkan skop IPT. Hubungi Pentadbir Utama." },
        { status: 403 }
      )
    : null;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendApprovalEmail(member: any) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum ditetapkan.");
  }

  const email = String(member.email || "").trim();
  if (!email) {
    throw new Error("Ahli tiada alamat e-mel.");
  }

  const fullName = escapeHtml(member.full_name);
  const membershipId = escapeHtml(member.membership_id || "-");
  const iptName = escapeHtml(member.ipt_name || "-");
  const portalUrl = "https://www.umnosiswa.my/portal";

  const html = `
    <!doctype html>
    <html lang="ms">
      <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#18202a;">
        <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e7e9ee;">
            <div style="background:#071b3a;padding:28px 32px;text-align:center;">
              <div style="font-size:13px;letter-spacing:2px;font-weight:700;color:#ffffff;">
                UMNOSISWA MALAYSIA
              </div>
              <div style="margin-top:8px;font-size:12px;color:#c8d4e6;">
                BERSATU • BERSETIA • BERKHIDMAT
              </div>
            </div>

            <div style="padding:34px 32px;">
              <p style="margin:0 0 18px;font-size:16px;">Assalamualaikum ${fullName},</p>

              <h1 style="margin:0 0 16px;font-size:25px;line-height:1.3;color:#071b3a;">
                Tahniah! Keahlian anda telah diluluskan.
              </h1>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#4b5563;">
                Permohonan keahlian UMNOSiswa Malaysia anda telah diluluskan.
                Anda kini boleh mengakses Portal Ahli dan Kad Keahlian Digital anda.
              </p>

              <div style="background:#f7f8fa;border-radius:14px;padding:20px;margin-bottom:26px;">
                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">
                  ID Keahlian UMNOSiswa
                </div>
                <div style="font-size:28px;font-weight:800;color:#071b3a;margin-top:6px;">
                  ${membershipId}
                </div>
                <div style="font-size:13px;color:#6b7280;margin-top:10px;">
                  IPT: ${iptName}
                </div>
              </div>

              <div style="text-align:center;margin:28px 0;">
                <a
                  href="${portalUrl}"
                  style="display:inline-block;background:#b5121b;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;"
                >
                  Akses Portal Ahli
                </a>
              </div>

              <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:#6b7280;">
                Untuk log masuk, gunakan ID Keahlian UMNOSiswa anda bersama 4 digit terakhir nombor kad pengenalan.
              </p>
            </div>

            <div style="padding:20px 32px;background:#f7f8fa;border-top:1px solid #eceff3;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#7b8492;text-align:center;">
                E-mel ini dihantar secara automatik oleh Portal Keahlian UMNOSiswa Malaysia.
              </p>
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
      "Idempotency-Key": `approval-${member.id}-${member.membership_id || "member"}`
    },
    body: JSON.stringify({
      from: "UMNOSiswa Malaysia <keahlian@umnosiswa.my>",
      to: [email],
      reply_to: "mahasiswaumno@gmail.com",
      subject: "Tahniah! Keahlian UMNOSiswa Anda Telah Diluluskan",
      html
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result?.message ||
      result?.error ||
      `Resend gagal menghantar e-mel (${response.status}).`
    );
  }

  return result;
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: "Akses pentadbir tidak sah." }, { status: 403 });

    const missingScope = scopeError(admin);
    if (missingScope) return missingScope;

    const { adminClient } = clients();

    let query = adminClient
      .from("membership_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (admin.role === "admin") {
      query = query.eq("ipt_name", admin.ipt_scope);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ members: data || [], admin });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal mendapatkan data." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: "Akses pentadbir tidak sah." }, { status: 403 });

    const missingScope = scopeError(admin);
    if (missingScope) return missingScope;

    const body = await req.json();
    const status = body.status;

    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string" && id)
      : body.id
        ? [body.id]
        : [];

    if (!ids.length || !["approved","rejected"].includes(status)) {
      return NextResponse.json({ error: "Permintaan tidak sah." }, { status: 400 });
    }

    if (ids.length > 100) {
      return NextResponse.json(
        { error: "Maksimum 100 permohonan untuk satu tindakan pukal." },
        { status: 400 }
      );
    }

    const { adminClient } = clients();

    let pendingQuery = adminClient
      .from("membership_applications")
      .select("id,full_name,email,membership_id,status,ipt_name")
      .in("id", ids)
      .eq("status", "pending");

    if (admin.role === "admin") {
      pendingQuery = pendingQuery.eq("ipt_name", admin.ipt_scope);
    }

    const { data: pendingRows, error: pendingError } = await pendingQuery;
    if (pendingError) throw pendingError;

    if (!pendingRows?.length) {
      return NextResponse.json(
        { error: "Tiada permohonan dalam semakan yang sah dipilih dalam skop IPT anda." },
        { status: 400 }
      );
    }

    const validIds = pendingRows.map(row => row.id);

    let updateQuery = adminClient
      .from("membership_applications")
      .update({ status })
      .in("id", validIds)
      .eq("status", "pending");

    if (admin.role === "admin") {
      updateQuery = updateQuery.eq("ipt_name", admin.ipt_scope);
    }

    const { data, error } = await updateQuery.select("*");
    if (error) throw error;

    const updated = data || [];

    if (updated.length) {
      const auditRows = updated.map(member => ({
        admin_user_id: admin.userId,
        admin_email: admin.email,
        action: status === "approved" ? "approve_member" : "reject_member",
        target_application_id: member.id,
        metadata: {
          membership_id: member.membership_id,
          member_name: member.full_name,
          ipt_name: member.ipt_name,
          admin_scope: admin.role === "super_admin" ? "ALL" : admin.ipt_scope,
          bulk: ids.length > 1
        }
      }));

      const { error: auditError } = await adminClient
        .from("admin_audit_log")
        .insert(auditRows);

      if (auditError) console.error("Ralat log audit pukal:", auditError.message);
    }

    let emailSent = 0;
    let emailFailed = 0;

    if (status === "approved" && updated.length) {
      const emailResults = await Promise.allSettled(
        updated.map(member => sendApprovalEmail(member))
      );

      emailResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          emailSent += 1;
        } else {
          emailFailed += 1;
          console.error(
            `E-mel kelulusan gagal untuk ${updated[index]?.email || updated[index]?.id}:`,
            result.reason instanceof Error ? result.reason.message : result.reason
          );
        }
      });
    }

    return NextResponse.json({
      ok: true,
      updated: updated.length,
      members: updated,
      member: ids.length === 1 ? updated[0] || null : undefined,
      skipped: ids.length - updated.length,
      email_notifications:
        status === "approved"
          ? { sent: emailSent, failed: emailFailed }
          : undefined
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal mengemaskini." }, { status: 500 });
  }
}
