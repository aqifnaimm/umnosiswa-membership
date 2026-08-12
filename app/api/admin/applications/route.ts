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
    .select("email,role,is_active")
    .eq("auth_user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError || !admin) return null;

  return {
    userId: data.user.id,
    email: admin.email,
    role: admin.role
  };
}

export async function GET(req: Request) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: "Akses pentadbir tidak sah." }, { status: 403 });

    const { adminClient } = clients();
    const { data, error } = await adminClient
      .from("membership_applications")
      .select("*")
      .order("created_at", { ascending: false });

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

    // Only pending applications can be approved/rejected from this workflow.
    const { data: pendingRows, error: pendingError } = await adminClient
      .from("membership_applications")
      .select("id,full_name,membership_id,status")
      .in("id", ids)
      .eq("status", "pending");

    if (pendingError) throw pendingError;

    if (!pendingRows?.length) {
      return NextResponse.json(
        { error: "Tiada permohonan pending yang sah dipilih." },
        { status: 400 }
      );
    }

    const validIds = pendingRows.map(row => row.id);

    const { data, error } = await adminClient
      .from("membership_applications")
      .update({ status })
      .in("id", validIds)
      .eq("status", "pending")
      .select("*");

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
          bulk: ids.length > 1
        }
      }));

      const { error: auditError } = await adminClient
        .from("admin_audit_log")
        .insert(auditRows);

      if (auditError) {
        console.error("Bulk audit log error:", auditError.message);
      }
    }

    return NextResponse.json({
      ok: true,
      updated: updated.length,
      members: updated,
      member: ids.length === 1 ? updated[0] || null : undefined,
      skipped: ids.length - updated.length
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal mengemaskini." }, { status: 500 });
  }
}
