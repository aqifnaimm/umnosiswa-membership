import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function rootClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secret) {
    throw new Error("Supabase environment variables belum lengkap.");
  }

  return createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();

    // Password is intentionally not checked here.
    // Supabase Auth verifies it on the client after this username lookup.
    if (!username || typeof body.password !== "string" || !body.password) {
      return NextResponse.json(
        { error: "Username atau kata laluan tidak sah." },
        { status: 400 }
      );
    }

    if (username.length > 64) {
      return NextResponse.json(
        { error: "Username atau kata laluan tidak sah." },
        { status: 400 }
      );
    }

    const root = rootClient();

    const { data, error } = await root
      .from("admin_users")
      .select("email")
      .ilike("username", username)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Ralat carian nama pengguna pentadbir:", error.message);
      return NextResponse.json(
        { error: "Tidak dapat memproses log masuk." },
        { status: 500 }
      );
    }

    if (!data?.email) {
      return NextResponse.json(
        { error: "Username atau kata laluan tidak sah." },
        { status: 401 }
      );
    }

    return NextResponse.json({ email: data.email });
  } catch (e: any) {
    console.error("Ralat log masuk pentadbir:", e?.message || e);
    return NextResponse.json(
      { error: "Tidak dapat memproses log masuk." },
      { status: 500 }
    );
  }
}
