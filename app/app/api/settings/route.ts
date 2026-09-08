import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const defaults = {
  org_name: "UMNOSiswa Malaysia",
  motto: "BERSATU • BERSETIA • BERKHIDMAT",
  registration_open: true,
  maintenance_mode: false,
  maintenance_message: "Sistem sedang diselenggara. Sila cuba sebentar lagi."
};

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !secret) return NextResponse.json(defaults);

    const root = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data, error } = await root
      .from("system_settings")
      .select("org_name,motto,registration_open,maintenance_mode,maintenance_message")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return NextResponse.json(defaults);

    return NextResponse.json({ ...defaults, ...data });
  } catch {
    return NextResponse.json(defaults);
  }
}
