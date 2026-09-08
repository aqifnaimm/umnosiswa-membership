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
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    }),
    root: createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  };
}

export async function POST(req: Request) {
  try {
    const header = req.headers.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return NextResponse.json({ error: "Sesi pentadbir tidak sah." }, { status: 401 });
    }

    const body = await req.json();
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!currentPassword) {
      return NextResponse.json({ error: "Masukkan kata laluan semasa." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Kata laluan baharu mesti sekurang-kurangnya 8 aksara." }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ error: "Kata laluan baharu mesti berbeza daripada kata laluan semasa." }, { status: 400 });
    }

    const { auth, root } = clients();
    const { data: userData, error: userError } = await auth.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: "Sesi pentadbir tidak sah atau telah tamat." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await root
      .from("admin_users")
      .select("id,auth_user_id,email,username,role,is_active")
      .eq("auth_user_id", userData.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return NextResponse.json({ error: "Akaun pentadbir tidak aktif atau tidak ditemui." }, { status: 403 });
    }

    // Re-authenticate before changing the password. The Auth user's email is
    // the credential Supabase uses for password verification.
    const { error: verifyError } = await auth.auth.signInWithPassword({
      email: userData.user.email || profile.email,
      password: currentPassword
    });

    if (verifyError) {
      return NextResponse.json({ error: "Kata laluan semasa tidak betul." }, { status: 400 });
    }

    const { error: updateError } = await root.auth.admin.updateUserById(
      userData.user.id,
      { password: newPassword }
    );

    if (updateError) throw updateError;

    await root.from("admin_audit_log").insert({
      admin_user_id: profile.id,
      admin_email: profile.email,
      action: "change_own_password",
      metadata: { username: profile.username }
    });

    return NextResponse.json({ ok: true, message: "Kata laluan anda berjaya ditukar." });
  } catch (error: any) {
    console.error("Admin change password error:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menukar kata laluan." },
      { status: 500 }
    );
  }
}
