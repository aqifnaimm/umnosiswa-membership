import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 60;

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { activeMembers: 0, institutions: 0 },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const { data, error } = await supabase
      .from("membership_applications")
      .select("ipt_name")
      .eq("status", "approved");

    if (error) throw error;

    const rows = data || [];

    const institutions = new Set(
      rows
        .map((row) => String(row.ipt_name || "").trim().toLowerCase())
        .filter(Boolean)
    ).size;

    return NextResponse.json(
      {
        activeMembers: rows.length,
        institutions
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
        }
      }
    );
  } catch {
    return NextResponse.json(
      { activeMembers: 0, institutions: 0 },
      { status: 500 }
    );
  }
}
