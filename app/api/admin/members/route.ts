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
        userId: data.user.id,
        email: profile.email,
        username: profile.username,
        role: profile.role,
        ipt_scope: profile.ipt_scope as string | null
      }
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

const NATIONAL_POSITIONS = [
  "Presiden",
  "Timbalan Presiden",
  "Setiausaha Agung",
  "Bendahari Kehormat",
  "Ketua Penerangan",
  "Ketua Siswi"
];

const IPT_POSITIONS = [
  "Pengerusi IPT",
  "Timbalan Pengerusi IPT",
  "Setiausaha IPT",
  "Bendahari IPT",
  "Ketua Penerangan IPT",
  "AJK IPT",
  "Ahli IPT"
];

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
      .select("*")
      .order("created_at", { ascending: false });

    if (me.role === "admin") {
      query = query.eq("ipt_name", me.ipt_scope);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      members: data || [],
      me: {
        email: me.email,
        username: me.username,
        role: me.role,
        ipt_scope: me.ipt_scope
      }
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
      return NextResponse.json({ error: "Akses pentadbir tidak sah." }, { status: 403 });
    }

    if (me.role === "admin" && !me.ipt_scope) {
      return NextResponse.json(
        { error: "Akaun pentadbir ini belum ditetapkan skop IPT. Hubungi Pentadbir Utama." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: "ID rekod diperlukan." }, { status: 400 });
    }

    const patch = {
      full_name: String(body.full_name || "").trim(),
      phone_number: String(body.phone_number || "").trim(),
      email: normalizeEmail(body.email),
      ic_number: normalizeIC(body.ic_number),
      umno_member_no: normalizeUmnoNo(body.umno_member_no),
      ipt_name: String(body.ipt_name || "").trim().toUpperCase(),
      campus: String(body.campus || "").trim(),
      graduation_month: body.graduation_month ? Number(body.graduation_month) : null,
      graduation_year: Number(body.graduation_year),
      ipt_zone: String(body.ipt_zone || "").trim(),
      umno_division: String(body.umno_division || "").trim(),
      position_level: String(body.position_level || "ipt").trim().toLowerCase(),
      member_position: String(body.member_position || "Ahli IPT").trim()
    };

    if (
      patch.graduation_month !== null &&
      (!Number.isInteger(patch.graduation_month) ||
        patch.graduation_month < 1 ||
        patch.graduation_month > 12)
    ) {
      return NextResponse.json({ error: "Bulan tamat pengajian tidak sah." }, { status: 400 });
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
      return NextResponse.json({ error: "Semua medan ahli mesti diisi." }, { status: 400 });
    }

    if (!["nasional", "ipt"].includes(patch.position_level)) {
      return NextResponse.json({ error: "Peringkat jawatan tidak sah." }, { status: 400 });
    }

    const validPositions =
      patch.position_level === "nasional" ? NATIONAL_POSITIONS : IPT_POSITIONS;

    if (!validPositions.includes(patch.member_position)) {
      return NextResponse.json({ error: "Jawatan ahli tidak sah." }, { status: 400 });
    }

    // Jawatan Nasional hanya boleh ditetapkan oleh Pentadbir Utama.
    if (me.role === "admin" && patch.position_level === "nasional") {
      return NextResponse.json(
        { error: "Hanya Pentadbir Utama boleh menetapkan Jawatan Nasional." },
        { status: 403 }
      );
    }

    if (me.role === "admin" && patch.ipt_name !== me.ipt_scope) {
      return NextResponse.json(
        { error: `Pentadbir ${me.ipt_scope} tidak boleh memindahkan ahli ke IPT lain.` },
        { status: 403 }
      );
    }

    const { root } = clients();

    let beforeQuery = root
      .from("membership_applications")
      .select("*")
      .eq("id", body.id);

    if (me.role === "admin") {
      beforeQuery = beforeQuery.eq("ipt_name", me.ipt_scope);
    }

    const { data: before, error: beforeError } = await beforeQuery.maybeSingle();
    if (beforeError) throw beforeError;

    if (!before) {
      return NextResponse.json(
        { error: "Rekod ahli tidak ditemui dalam skop IPT anda." },
        { status: 404 }
      );
    }

    let updateQuery = root
      .from("membership_applications")
      .update(patch)
      .eq("id", body.id);

    if (me.role === "admin") {
      updateQuery = updateQuery.eq("ipt_name", me.ipt_scope);
    }

    const { data, error } = await updateQuery.select("*").single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Data bertindih dengan rekod lain. Semak email, No. IC atau No. Ahli UMNO." },
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
        admin_scope: me.role === "super_admin" ? "ALL" : me.ipt_scope,
        before: {
          full_name: before.full_name,
          phone_number: before.phone_number,
          email: before.email,
          ic_number: before.ic_number,
          umno_member_no: before.umno_member_no,
          ipt_name: before.ipt_name,
          campus: before.campus,
          graduation_month: before.graduation_month,
          graduation_year: before.graduation_year,
          ipt_zone: before.ipt_zone,
          umno_division: before.umno_division,
          position_level: before.position_level,
          member_position: before.member_position
        },
        after: patch
      }
    });

    return NextResponse.json({ ok: true, member: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gagal mengemaskini data ahli." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const me = await current(req);

    if (!me) {
      return NextResponse.json({ error: "Akses pentadbir tidak sah." }, { status: 403 });
    }

    if (me.role !== "super_admin") {
      return NextResponse.json(
        { error: "Hanya Pentadbir Utama boleh membuang rekod ahli." },
        { status: 403 }
      );
    }

    const body = await req.json();

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "ID rekod diperlukan." }, { status: 400 });
    }

    const { root } = clients();

    const { data: member, error: memberError } = await root
      .from("membership_applications")
      .select("*")
      .eq("id", body.id)
      .maybeSingle();

    if (memberError) throw memberError;

    if (!member) {
      return NextResponse.json({ error: "Rekod ahli tidak ditemui." }, { status: 404 });
    }

    const { error: deleteError } = await root
      .from("membership_applications")
      .delete()
      .eq("id", body.id);

    if (deleteError) throw deleteError;

    const { error: auditError } = await root.from("admin_audit_log").insert({
      admin_user_id: me.userId,
      admin_email: me.email,
      action: "delete_member",
      target_application_id: null,
      metadata: {
        deleted_application_id: member.id,
        membership_id: member.membership_id,
        member_name: member.full_name,
        email: member.email,
        phone_number: member.phone_number,
        ic_number: member.ic_number,
        umno_member_no: member.umno_member_no,
        ipt_name: member.ipt_name,
        campus: member.campus ?? null,
        graduation_month: member.graduation_month,
        graduation_year: member.graduation_year,
        ipt_zone: member.ipt_zone,
        umno_division: member.umno_division,
        position_level: member.position_level,
        member_position: member.member_position,
        status: member.status,
        deleted_by_role: me.role
      }
    });

    if (auditError) {
      console.error("Ralat log audit buang ahli:", auditError.message);
    }

    return NextResponse.json({
      ok: true,
      deleted: {
        id: member.id,
        full_name: member.full_name,
        membership_id: member.membership_id
      }
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Gagal membuang rekod ahli." },
      { status: 500 }
    );
  }
}

