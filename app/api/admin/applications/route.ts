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

    if (!body.id || !["approved","rejected"].includes(body.status)) {
      return NextResponse.json({ error: "Permintaan tidak sah." }, { status: 400 });
    }

    const { adminClient } = clients();

    const { data, error } = await adminClient
      .from("membership_applications")
      .update({ status: body.status })
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) throw error;

    await adminClient.from("admin_audit_log").insert({
      admin_user_id: admin.userId,
      admin_email: admin.email,
      action: body.status === "approved" ? "approve_member" : "reject_member",
      target_application_id: body.id,
      metadata: {
        membership_id: data.membership_id,
        member_name: data.full_name
      }
    });

    return NextResponse.json({ ok: true, member: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Gagal mengemaskini." }, { status: 500 });
  }
}
