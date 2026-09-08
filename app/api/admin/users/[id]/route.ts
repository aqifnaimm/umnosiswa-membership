import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VALID_IPTS = ["UM", "UKM", "UMPSA", "UMK", "UNIMAP", "UNISZA", "USIM", "UNIKL", "UITM", "UTHM", "UPSI", "USM", "UPM", "UUM", "UTEM", "UMT", "UMS", "UIAM", "UTM"];

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anon || !secret) {
    throw new Error("Supabase environment variables belum lengkap.");
  }

  return {
    auth: createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false }
    }),
    root: createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  };
}

async function current(req: Request) {
  const h = req.headers.get("authorization") || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return null;

  const { auth, root } = clients();
  const { data } = await auth.auth.getUser(token);
  if (!data.user) return null;

  const { data: profile } = await root
    .from("admin_users")
    .select("*")
    .eq("auth_user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  return profile ? { ...profile, userId: data.user.id } : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const me = await current(req);

    if (!me || me.role !== "super_admin") {
      return NextResponse.json(
        { error: "Hanya Pentadbir Utama boleh mengubah pentadbir." },
        { status: 403 }
      );
    }

    const { root } = clients();

    const { data: target, error: targetError } = await root
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (targetError) throw targetError;
    if (!target) {
      return NextResponse.json({ error: "Pentadbir tidak ditemui." }, { status: 404 });
    }

    if (target.auth_user_id === me.userId) {
      return NextResponse.json(
        { error: "Anda tidak boleh mengubah peranan, status atau skop akaun sendiri di sini." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const patch: Record<string, unknown> = {};

    if (body.role !== undefined) {
      if (!["admin", "super_admin"].includes(body.role)) {
        return NextResponse.json({ error: "Peranan tidak sah." }, { status: 400 });
      }
      patch.role = body.role;
    }

    if (body.is_active !== undefined) {
      patch.is_active = Boolean(body.is_active);
    }

    if (body.ipt_scope !== undefined) {
      const scope = body.ipt_scope === null ? null : String(body.ipt_scope).trim().toUpperCase();
      if (scope !== null && !VALID_IPTS.includes(scope)) {
        return NextResponse.json({ error: "Skop IPT tidak sah." }, { status: 400 });
      }
      patch.ipt_scope = scope;
    }

    const nextRole = String(patch.role ?? target.role);
    const nextScope = patch.ipt_scope !== undefined ? patch.ipt_scope : target.ipt_scope;

    if (nextRole === "super_admin") {
      patch.ipt_scope = null;
    } else if (!nextScope || !VALID_IPTS.includes(String(nextScope))) {
      return NextResponse.json(
        { error: "Pentadbir IPT mesti mempunyai satu skop IPT yang sah." },
        { status: 400 }
      );
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Tiada perubahan." }, { status: 400 });
    }

    if (
      target.role === "super_admin" &&
      (patch.role === "admin" || patch.is_active === false)
    ) {
      const { count } = await root
        .from("admin_users")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin")
        .eq("is_active", true);

      if ((count || 0) <= 1) {
        return NextResponse.json(
          { error: "Sistem mesti mempunyai sekurang-kurangnya seorang Pentadbir Utama yang aktif." },
          { status: 400 }
        );
      }
    }

    const { data, error } = await root
      .from("admin_users")
      .update(patch)
      .eq("id", id)
      .select("id,auth_user_id,username,role,ipt_scope,is_active,created_at")
      .single();

    if (error) throw error;

    await root.from("admin_audit_log").insert({
      admin_user_id: me.userId,
      admin_email: me.email,
      action: "update_admin",
      metadata: {
        target_admin: target.username || target.email,
        changes: patch
      }
    });

    return NextResponse.json({ ok: true, admin: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gagal mengemas kini pentadbir." },
      { status: 500 }
    );
  }
}
