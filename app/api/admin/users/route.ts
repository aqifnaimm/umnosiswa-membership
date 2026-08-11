import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    if(!me)return NextResponse.json({error:"Akses tidak sah."},{status:403});
    const {root}=clients();
    const {data,error}=await root.from("admin_users")
      .select("id,auth_user_id,email,role,is_active,created_at").order("created_at");
    if(error)throw error;
    return NextResponse.json({admins:data||[],me:{userId:me.userId,email:me.email,role:me.role}});
  }catch(e:any){return NextResponse.json({error:e.message||"Gagal."},{status:500})}
}

export async function POST(req:Request){
  try{
    const me=await current(req);
    if(!me||me.role!=="super_admin")
      return NextResponse.json({error:"Hanya Super Admin boleh tambah admin."},{status:403});

    const body=await req.json();
    const email=String(body.email||"").trim().toLowerCase();
    const password=String(body.password||"");
    const role=["admin","super_admin"].includes(body.role)?body.role:"admin";

    if(!email||password.length<8)
      return NextResponse.json({error:"Email atau kata laluan tidak sah."},{status:400});

    const {root}=clients();
    const {data:created,error:createError}=await root.auth.admin.createUser({
      email,password,email_confirm:true
    });
    if(createError)throw createError;

    const {data:profile,error:profileError}=await root.from("admin_users").insert({
      auth_user_id:created.user.id,email,role,is_active:true
    }).select().single();

    if(profileError){
      await root.auth.admin.deleteUser(created.user.id);
      throw profileError;
    }

    await root.from("admin_audit_log").insert({
      admin_user_id:me.userId,admin_email:me.email,action:"create_admin",
      metadata:{created_admin_email:email,role}
    });

    return NextResponse.json({ok:true,admin:profile});
  }catch(e:any){return NextResponse.json({error:e.message||"Gagal tambah admin."},{status:500})}
}
