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
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }),
    root: createClient(url, secret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();

    if (!username) {
      return NextResponse.json(
        { error: "Nama pengguna diperlukan." },
        { status: 400 }
      );
    }

    const { root } = clients();

    // The admin creation flow stores the Supabase Auth email as:
    // username@admin.umnos.internal. We resolve the username here and
    // return that Auth email to the client, which then signs in with the
    // password supplied by the admin.
    const { data: admin, error } = await root
      .from("admin_users")
      .select("auth_user_id,email,username,is_active,role,ipt_scope")
      .ilike("username", username)
      .maybeSingle();

    if (error) {
      console.error("Admin login lookup error:", error.message);
      return NextResponse.json(
        { error: "Tidak dapat menyemak akaun pentadbir." },
        { status: 500 }
      );
    }

    if (!admin || !admin.is_active || !admin.auth_user_id) {
      return NextResponse.json(
        { error: "Nama pengguna atau kata laluan tidak sah." },
        { status: 401 }
      );
    }

    // Never expose the password or service-role credentials. The browser
    // uses this email only for Supabase Auth sign-in with the password it
    // already has from the login form.
    return NextResponse.json({
      ok: true,
      email: admin.email,
      username: admin.username,
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal log masuk pentadbir." },
      { status: 500 }
    );
  }
}
