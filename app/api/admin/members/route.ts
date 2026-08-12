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
    .select("email,role,is_active")
    .eq("auth_user_id", data.user.id)
    .eq("is_active", true)
    .maybeSingle();

  return profile
    ? { userId: data.user.id, email: profile.email, role: profile.role }
    : null;
}

function normalizeIC(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeEmail(value: string) {
  return String(value || "").trim().toLowerCase();
}

function normalizeUmnoNo(value: string) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
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

    const { data, error } = await root
      .from("membership_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      members: data || [],
      me: { email: me.email, role: me.role }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gagal mendapatkan data ahli." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const me = await current(req);

    if (!me) {
      return NextResponse.json(
        { error: "Akses pentadbir tidak sah." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "ID rekod diperlukan." },
        { status: 400 }
      );
    }

    const patch = {
      full_name: String(body.full_name || "").trim(),
      phone_number: String(body.phone_number || "").trim(),
      email: normalizeEmail(body.email),
      ic_number: normalizeIC(body.ic_number),
      umno_member_no: normalizeUmnoNo(body.umno_member_no),
      ipt_name: String(body.ipt_name || "").trim(),
      graduation_month: body.graduation_month ? Number(body.graduation_month) : null,
      graduation_year: Number(body.graduation_year),
      ipt_zone: String(body.ipt_zone || "").trim(),
      umno_division: String(body.umno_division || "").trim()
    };

    if (
      patch.graduation_month !== null &&
      (!Number.isInteger(patch.graduation_month) ||
        patch.graduation_month < 1 ||
        patch.graduation_month > 12)
    ) {
      return NextResponse.json(
        { error: "Bulan tamat pengajian tidak sah." },
        { status: 400 }
      );
    }

    if (
      !patch.full_name ||
      !patch.phone_number ||
      !patch.email ||
      !patch.ic_number ||
      !patch.umno_member_no ||
      !patch.ipt_name ||
      !patch.graduation_year ||
      !patch.ipt_zone ||
      !patch.umno_division
    ) {
      return NextResponse.json(
        { error: "Semua medan ahli mesti diisi." },
        { status: 400 }
      );
    }

    const { root } = clients();

    const { data: before, error: beforeError } = await root
      .from("membership_applications")
      .select("*")
      .eq("id", body.id)
      .maybeSingle();

    if (beforeError) throw beforeError;

    if (!before) {
      return NextResponse.json(
        { error: "Rekod ahli tidak ditemui." },
        { status: 404 }
      );
    }

    const { data, error } = await root
      .from("membership_applications")
      .update(patch)
      .eq("id", body.id)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Data bertindih dengan rekod lain. Semak email, No. IC atau No. Ahli UMNO."
          },
          { status: 409 }
        );
      }

      throw error;
    }

    await root.from("admin_audit_log").insert({
      admin_user_id: me.userId,
      admin_email: me.email,
      action: "edit_member",
      target_application_id: body.id,
      metadata: {
        membership_id: data.membership_id,
        member_name: data.full_name,
        before: {
          full_name: before.full_name,
          phone_number: before.phone_number,
          email: before.email,
          ic_number: before.ic_number,
          umno_member_no: before.umno_member_no,
          ipt_name: before.ipt_name,
          graduation_month: before.graduation_month,
          graduation_year: before.graduation_year,
          ipt_zone: before.ipt_zone,
          umno_division: before.umno_division
        },
        after: patch
      }
    });

    return NextResponse.json({
      ok: true,
      member: data
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gagal mengemaskini data ahli." },
      { status: 500 }
    );
  }
}
