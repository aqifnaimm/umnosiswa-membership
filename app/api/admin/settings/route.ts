import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  const { data, error } = await auth.auth.getUser(token);

  if (error || !data.user) return null;

  const { data: profile } = await root
    .from("admin_users")
    .select("email,username,role,is_active")
    .eq("auth_user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  return profile
    ? {
        userId: data.user.id,
        email: profile.email,
        username: profile.username,
        role: profile.role
      }
    : null;
}

const defaults = {
  org_name: "UMNOSiswa Malaysia",
  motto: "BERSATU • BERSETIA • BERKHIDMAT",
  registration_open: true,
  maintenance_mode: false,
  maintenance_message: "Sistem sedang diselenggara. Sila cuba sebentar lagi."
};

async function getSettings(root: any) {
  const { data, error } = await root
    .from("system_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;

  return data || defaults;
}

export async function GET(req: Request) {
  try {
    const me = await current(req);

    if (!me) {
      return NextResponse.json(
        { error: "Akses pentadbir tidak sah." },
        { status: 403 }
      );
    }

    const { root } = clients();
    const settings = await getSettings(root);

    return NextResponse.json({
      settings,
      me: {
        username: me.username,
        role: me.role
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gagal mendapatkan tetapan." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const me = await current(req);

    if (!me || me.role !== "super_admin") {
      return NextResponse.json(
        { error: "Hanya Pentadbir Utama boleh mengubah tetapan sistem." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const patch = {
      id: 1,
      org_name: String(body.org_name || "").trim(),
      motto: String(body.motto || "").trim(),
      registration_open: Boolean(body.registration_open),
      maintenance_mode: Boolean(body.maintenance_mode),
      maintenance_message: String(body.maintenance_message || "").trim(),
      updated_by: me.userId,
      updated_at: new Date().toISOString()
    };

    if (!patch.org_name || !patch.motto) {
      return NextResponse.json(
        { error: "Nama organisasi dan motto mesti diisi." },
        { status: 400 }
      );
    }

    if (patch.org_name.length > 120 || patch.motto.length > 200) {
      return NextResponse.json(
        { error: "Nama organisasi atau motto terlalu panjang." },
        { status: 400 }
      );
    }

    const { root } = clients();

    const before = await getSettings(root);

    const { data, error } = await root
      .from("system_settings")
      .upsert(patch, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;

    await root.from("admin_audit_log").insert({
      admin_user_id: me.userId,
      admin_email: me.email,
      action: "update_system_settings",
      metadata: {
        before: {
          org_name: before.org_name,
          motto: before.motto,
          registration_open: before.registration_open,
          maintenance_mode: before.maintenance_mode,
          maintenance_message: before.maintenance_message
        },
        after: {
          org_name: data.org_name,
          motto: data.motto,
          registration_open: data.registration_open,
          maintenance_mode: data.maintenance_mode,
          maintenance_message: data.maintenance_message
        }
      }
    });

    return NextResponse.json({
      ok: true,
      settings: data
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gagal menyimpan tetapan." },
      { status: 500 }
    );
  }
}
