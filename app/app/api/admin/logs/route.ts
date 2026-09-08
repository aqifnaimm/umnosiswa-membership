import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function clients(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!anon||!secret)throw new Error("Supabase environment variables belum lengkap.");
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
  const {data,error}=await auth.auth.getUser(token);
  if(error||!data.user)return null;

  const {data:profile}=await root.from("admin_users")
    .select("email,role,is_active")
    .eq("auth_user_id",data.user.id)
    .eq("is_active",true)
    .maybeSingle();

  return profile?{userId:data.user.id,...profile}:null;
}

export async function GET(req:Request){
  try{
    const me=await current(req);
    if(!me)return NextResponse.json({error:"Akses pentadbir tidak sah."},{status:403});

    // Audit log is restricted to Super Admin because it exposes
    // security/accountability information about other admins.
    if(me.role!=="super_admin")
      return NextResponse.json({error:"Hanya Pentadbir Utama boleh melihat Log Audit."},{status:403});

    const {root}=clients();
    const {data,error}=await root.from("admin_audit_log")
      .select("id,admin_email,action,target_application_id,metadata,created_at")
      .order("created_at",{ascending:false})
      .limit(1000);

    if(error)throw error;

    return NextResponse.json({
      logs:data||[],
      me:{email:me.email,role:me.role}
    });
  }catch(e:any){
    return NextResponse.json({error:e.message||"Gagal mendapatkan audit log."},{status:500});
  }
}
