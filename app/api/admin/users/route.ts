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
      .select("id,auth_user_id,email,username,role,ipt_scope,is_active,created_at")
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
    const email=String(body.email||"").trim().toLowerCase();
    const password=String(body.password||"");
    const role=["admin","super_admin"].includes(body.role)?body.role:"admin";
    const requestedScope=String(body.ipt_scope||"").trim().toUpperCase();
    const iptScope=role==="super_admin"?null:requestedScope;

    if(!/^[a-z0-9._-]{3,32}$/.test(username))
      return NextResponse.json({
        error:"Nama pengguna mesti 3–32 aksara dan hanya boleh mengandungi huruf kecil, nombor, titik, garis bawah atau tanda sempang."
      },{status:400});

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json({error:"Sila masukkan alamat e-mel pentadbir yang sah."},{status:400});

    if(password.length<8)
      return NextResponse.json({error:"Kata laluan mesti sekurang-kurangnya 8 aksara."},{status:400});

    if(role==="admin" && !VALID_IPTS.includes(iptScope || ""))
      return NextResponse.json({error:"Sila pilih skop IPT yang sah untuk Pentadbir IPT."},{status:400});

    const {root}=clients();

    const {data:existingUsername,error:existingUsernameError}=await root
      .from("admin_users")
      .select("id")
      .ilike("username",username)
      .maybeSingle();

    if(existingUsernameError)throw existingUsernameError;
    if(existingUsername)
      return NextResponse.json({error:"Nama pengguna ini telah digunakan."},{status:409});

    const {data:existingEmail,error:existingEmailError}=await root
      .from("admin_users")
      .select("id")
      .ilike("email",email)
      .maybeSingle();

    if(existingEmailError)throw existingEmailError;
    if(existingEmail)
      return NextResponse.json({error:"E-mel pentadbir ini telah digunakan."},{status:409});

    // Kekalkan e-mel dalaman Supabase Auth supaya kaedah login berasaskan username sedia ada tidak berubah.
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
      email,
      username,
      role,
      ipt_scope:iptScope,
      is_active:true
    }).select("id,auth_user_id,email,username,role,ipt_scope,is_active,created_at").single();

    if(profileError){
      await root.auth.admin.deleteUser(created.user.id);
      createdAuthUserId=null;
      throw profileError;
    }

    await root.from("admin_audit_log").insert({
      admin_user_id:me.userId,
      admin_email:me.email,
      action:"create_admin",
      metadata:{created_admin_username:username,created_admin_email:email,role,ipt_scope:iptScope}
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


export async function PATCH(req:Request){
  try{
    const me=await current(req);

    if(!me||me.role!=="super_admin")
      return NextResponse.json(
        {error:"Hanya Pentadbir Utama boleh mengemas kini pentadbir."},
        {status:403}
      );

    const body=await req.json();
    const id=String(body.id||"").trim();

    if(!id)
      return NextResponse.json({error:"ID pentadbir diperlukan."},{status:400});

    const {root}=clients();

    const {data:target,error:targetError}=await root
      .from("admin_users")
      .select("id,auth_user_id,email,username,role,ipt_scope,is_active")
      .eq("id",id)
      .maybeSingle();

    if(targetError)throw targetError;
    if(!target)
      return NextResponse.json({error:"Pentadbir tidak ditemui."},{status:404});

    const patch:any={};

    if(body.username!==undefined){
      const username=String(body.username||"").trim().toLowerCase();
      if(!/^[a-z0-9._-]{3,32}$/.test(username))
        return NextResponse.json({
          error:"Nama pengguna mesti 3–32 aksara dan hanya boleh mengandungi huruf kecil, nombor, titik, garis bawah atau tanda sempang."
        },{status:400});

      const {data:duplicate,error:duplicateError}=await root
        .from("admin_users")
        .select("id")
        .ilike("username",username)
        .neq("id",id)
        .limit(1)
        .maybeSingle();

      if(duplicateError)throw duplicateError;
      if(duplicate)
        return NextResponse.json({error:"Nama pengguna ini telah digunakan."},{status:409});

      patch.username=username;
    }

    if(body.email!==undefined){
      const email=String(body.email||"").trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return NextResponse.json({error:"Sila masukkan alamat e-mel pentadbir yang sah."},{status:400});

      const {data:duplicate,error:duplicateError}=await root
        .from("admin_users")
        .select("id")
        .ilike("email",email)
        .neq("id",id)
        .limit(1)
        .maybeSingle();

      if(duplicateError)throw duplicateError;
      if(duplicate)
        return NextResponse.json({error:"E-mel pentadbir ini telah digunakan."},{status:409});

      patch.email=email;
    }

    if(body.role!==undefined){
      const role=String(body.role);
      if(!["admin","super_admin"].includes(role))
        return NextResponse.json({error:"Peranan pentadbir tidak sah."},{status:400});
      patch.role=role;
    }

    const nextRole=patch.role ?? target.role;

    if(body.ipt_scope!==undefined || patch.role!==undefined){
      const requestedScope=String(body.ipt_scope||"").trim().toUpperCase();

      if(nextRole==="admin"){
        if(!VALID_IPTS.includes(requestedScope))
          return NextResponse.json({error:"Sila pilih skop IPT yang sah untuk Pentadbir IPT."},{status:400});
        patch.ipt_scope=requestedScope;
      }else{
        patch.ipt_scope=null;
      }
    }

    if(body.is_active!==undefined){
      if(target.auth_user_id===me.userId && body.is_active===false)
        return NextResponse.json({error:"Anda tidak boleh menyahaktifkan akaun sendiri."},{status:400});
      patch.is_active=Boolean(body.is_active);
    }

    const password=body.password===undefined ? "" : String(body.password||"");
    if(password && password.length<8)
      return NextResponse.json({error:"Kata laluan baharu mesti sekurang-kurangnya 8 aksara."},{status:400});

    const finalUsername=patch.username ?? target.username;

    // Login sedia ada menggunakan e-mel dalaman yang dibina daripada username.
    // Jika username berubah, kemas kini Supabase Auth identifier juga.
    if(patch.username!==undefined || password){
      const authPatch:any={};

      if(patch.username!==undefined)
        authPatch.email=`${finalUsername}@admin.umnos.internal`;

      if(password)
        authPatch.password=password;

      const {error:authUpdateError}=await root.auth.admin.updateUserById(
        target.auth_user_id,
        authPatch
      );

      if(authUpdateError)throw authUpdateError;
    }

    const {data:updated,error:updateError}=await root
      .from("admin_users")
      .update(patch)
      .eq("id",id)
      .select("id,auth_user_id,email,username,role,ipt_scope,is_active,created_at")
      .single();

    if(updateError)throw updateError;

    const {error:auditError}=await root.from("admin_audit_log").insert({
      admin_user_id:me.userId,
      admin_email:me.email,
      action:"edit_admin",
      metadata:{
        edited_admin_id:target.id,
        before:{
          email:target.email,
          username:target.username,
          role:target.role,
          ipt_scope:target.ipt_scope,
          is_active:target.is_active
        },
        after:{
          email:updated.email,
          username:updated.username,
          role:updated.role,
          ipt_scope:updated.ipt_scope,
          is_active:updated.is_active
        },
        password_changed:Boolean(password)
      }
    });

    if(auditError)
      console.error("Ralat log audit sunting pentadbir:",auditError.message);

    return NextResponse.json({ok:true,admin:updated});
  }catch(e:any){
    return NextResponse.json(
      {error:e.message||"Gagal mengemas kini pentadbir."},
      {status:500}
    );
  }
}

export async function DELETE(req:Request){
  try{
    const me=await current(req);

    if(!me||me.role!=="super_admin")
      return NextResponse.json(
        {error:"Hanya Pentadbir Utama boleh membuang pentadbir."},
        {status:403}
      );

    const body=await req.json();
    const id=String(body.id||"").trim();

    if(!id)
      return NextResponse.json({error:"ID pentadbir diperlukan."},{status:400});

    const {root}=clients();

    const {data:target,error:targetError}=await root
      .from("admin_users")
      .select("id,auth_user_id,email,username,role,ipt_scope,is_active")
      .eq("id",id)
      .maybeSingle();

    if(targetError)throw targetError;
    if(!target)
      return NextResponse.json({error:"Pentadbir tidak ditemui."},{status:404});

    if(target.auth_user_id===me.userId)
      return NextResponse.json(
        {error:"Anda tidak boleh membuang akaun Pentadbir Utama yang sedang digunakan."},
        {status:400}
      );

    const {error:auditError}=await root.from("admin_audit_log").insert({
      admin_user_id:me.userId,
      admin_email:me.email,
      action:"delete_admin",
      metadata:{
        deleted_admin_id:target.id,
        deleted_auth_user_id:target.auth_user_id,
        deleted_admin_username:target.username,
        deleted_admin_email:target.email,
        role:target.role,
        ipt_scope:target.ipt_scope,
        was_active:target.is_active
      }
    });

    if(auditError)
      console.error("Ralat log audit buang pentadbir:",auditError.message);

    const {error:profileDeleteError}=await root
      .from("admin_users")
      .delete()
      .eq("id",target.id);

    if(profileDeleteError)throw profileDeleteError;

    const {error:authDeleteError}=await root.auth.admin.deleteUser(target.auth_user_id);

    if(authDeleteError){
      console.error("Profil admin dipadam tetapi Supabase Auth gagal dipadam:",authDeleteError.message);
      return NextResponse.json({
        ok:true,
        warning:"Profil pentadbir telah dibuang tetapi akaun Auth perlu disemak secara manual.",
        deleted:{id:target.id,username:target.username,email:target.email}
      });
    }

    return NextResponse.json({
      ok:true,
      deleted:{id:target.id,username:target.username,email:target.email}
    });
  }catch(e:any){
    return NextResponse.json(
      {error:e.message||"Gagal membuang pentadbir."},
      {status:500}
    );
  }
}

