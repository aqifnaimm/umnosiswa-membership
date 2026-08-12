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
    .select("email,username,role,ipt_scope,is_active")
    .eq("auth_user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  return profile
    ? {
        email: profile.email,
        username: profile.username,
        role: profile.role,
        ipt_scope: profile.ipt_scope as string | null
      }
    : null;
}

export async function GET(req: Request) {
  try {
    const me = await current(req);

    if (!me) {
      return NextResponse.json({ error: "Akses pentadbir tidak sah." }, { status: 403 });
    }

    if (me.role === "admin" && !me.ipt_scope) {
      return NextResponse.json(
        { error: "Akaun pentadbir ini belum ditetapkan skop IPT. Hubungi Pentadbir Utama." },
        { status: 403 }
      );
    }

    const { root } = clients();

    let query = root
      .from("membership_applications")
      .select("id,full_name,ipt_name,ipt_zone,status,graduation_month,graduation_year,created_at")
      .order("created_at", { ascending: false });

    if (me.role === "admin") {
      query = query.eq("ipt_name", me.ipt_scope);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      members: data || [],
      admin: {
        email: me.email,
        username: me.username,
        role: me.role,
        ipt_scope: me.ipt_scope
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gagal mendapatkan analytics." },
      { status: 500 }
    );
  }
}
