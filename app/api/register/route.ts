import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";

function auth(req:Request){const got=req.headers.get("x-admin-key");const expected=process.env.ADMIN_DASHBOARD_KEY;return !!expected&&got===expected}
function db(){const u=process.env.NEXT_PUBLIC_SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!u||!k)throw new Error("Supabase env belum lengkap.");return createClient(u,k)}

export async function GET(req:Request){
 if(!auth(req))return NextResponse.json({error:"Admin key tidak sah."},{status:401});
 try{const {data,error}=await db().from("membership_applications").select("*").order("created_at",{ascending:false});if(error)throw error;return NextResponse.json({members:data||[]})}
 catch(e:any){return NextResponse.json({error:e.message||"Gagal mendapatkan data."},{status:500})}
}
export async function PATCH(req:Request){
 if(!auth(req))return NextResponse.json({error:"Admin key tidak sah."},{status:401});
 try{const b=await req.json();if(!b.id||!["approved","rejected"].includes(b.status))return NextResponse.json({error:"Permintaan tidak sah."},{status:400});
 const {data,error}=await db().from("membership_applications").update({status:b.status}).eq("id",b.id).select("*").single();if(error)throw error;return NextResponse.json({ok:true,member:data})}
 catch(e:any){return NextResponse.json({error:e.message||"Gagal mengemaskini."},{status:500})}
}