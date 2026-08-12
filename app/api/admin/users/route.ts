import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VALID_IPTS = ["UM", "UKM", "UMPSA", "UMK", "UNIMAP", "UNISZA", "USIM", "UNIKL", "UITM", "UTHM", "UPSI", "USM", "UPM", "UUM", "UTEM", "UMT", "UMS", "UIAM"];

function clients(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!secret) throw new Error("Supabase environment variables belum lengkap.");
  return {
    auth:createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}}),
    root:createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}})
  };
}

async function current(req:Request){
  const h=req.headers.get("authorization")||"";
  const token=h.startsWith("Bearer ")?h.slice(7):"";
  if(!token)return null;
  const {auth,root}=clients();
  const {data}=await auth.auth.getUser(token);
  if(!data.user)return null;
  const {data:profile}=await root.from("admin_users").select("*")
    .eq("auth_user_id",data.user.id).eq("is_active",true).maybeSingle();
  return profile?{...profile,userId:data.user.id}:null;
}

export async function GET(req:Request){
  try{
    const me=await current(req);
    if(!me||me.role!=="super_admin")
      return NextResponse.json({error:"Hanya Pentadbir Utama boleh melihat pengurusan pentadbir."},{status:403});

    const {root}=clients();
    const {data,error}=await root.from("admin_users")
      .select("id,auth_user_id,username,role,ipt_scope,is_active,created_at")
      .order("created_at");
    if(error)throw error;

    return NextResponse.json({
      admins:data||[],
      me:{userId:me.userId,username:me.username,role:me.role,ipt_scope:me.ipt_scope||null}
    });
  }catch(e:any){
    return NextResponse.json({error:e.message||"Gagal."},{status:500})
  }
}

export async function POST(req:Request){
  let createdAuthUserId: string | null = null;

  try{
    const me=await current(req);
    if(!me||me.role!=="super_admin")
      return NextResponse.json({error:"Hanya Pentadbir Utama boleh menambah pentadbir."},{status:403});

    const body=await req.json();
    const username=String(body.username||"").trim().toLowerCase();
    const password=String(body.password||"");
    const role=["admin","super_admin"].includes(body.role)?body.role:"admin";
    const requestedScope=String(body.ipt_scope||"").trim().toUpperCase();
    const iptScope=role==="super_admin"?null:requestedScope;

    if(!/^[a-z0-9._-]{3,32}$/.test(username))
      return NextResponse.json({
        error:"Nama pengguna mesti 3–32 aksara dan hanya boleh mengandungi huruf kecil, nombor, titik, garis bawah atau tanda sempang."
      },{status:400});

    if(password.length<8)
      return NextResponse.json({error:"Kata laluan mesti sekurang-kurangnya 8 aksara."},{status:400});

    if(role==="admin" && !VALID_IPTS.includes(iptScope || ""))
      return NextResponse.json({error:"Sila pilih skop IPT yang sah untuk Pentadbir IPT."},{status:400});

    const {root}=clients();

    const {data:existing,error:existingError}=await root
      .from("admin_users")
      .select("id")
      .ilike("username",username)
      .maybeSingle();

    if(existingError)throw existingError;
    if(existing)
      return NextResponse.json({error:"Nama pengguna ini telah digunakan."},{status:409});

    const internalEmail=`${username}@admin.umnos.internal`;

    const {data:created,error:createError}=await root.auth.admin.createUser({
      email:internalEmail,
      password,
      email_confirm:true
    });

    if(createError){
      if(String(createError.message||"").toLowerCase().includes("already"))
        return NextResponse.json({error:"Nama pengguna ini telah digunakan."},{status:409});
      throw createError;
    }

    createdAuthUserId=created.user.id;

    const {data:profile,error:profileError}=await root.from("admin_users").insert({
      auth_user_id:created.user.id,
      email:internalEmail,
      username,
      role,
      ipt_scope:iptScope,
      is_active:true
    }).select("id,auth_user_id,username,role,ipt_scope,is_active,created_at").single();

    if(profileError){
      await root.auth.admin.deleteUser(created.user.id);
      createdAuthUserId=null;
      throw profileError;
    }

    await root.from("admin_audit_log").insert({
      admin_user_id:me.userId,
      admin_email:me.email,
      action:"create_admin",
      metadata:{created_admin_username:username,role,ipt_scope:iptScope}
    });

    return NextResponse.json({ok:true,admin:profile});
  }catch(e:any){
    if(createdAuthUserId){
      try{
        const {root}=clients();
        const {data:profile}=await root.from("admin_users")
          .select("id").eq("auth_user_id",createdAuthUserId).maybeSingle();
        if(!profile) await root.auth.admin.deleteUser(createdAuthUserId);
      }catch{}
    }
    return NextResponse.json({error:e.message||"Gagal menambah pentadbir."},{status:500})
  }
}
