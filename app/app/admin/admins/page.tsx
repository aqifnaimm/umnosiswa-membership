"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const IPTS = ["UM", "UKM", "UMPSA", "UMK", "UNIMAP", "UNISZA", "USIM", "UNIKL", "UITM", "UTHM", "UPSI", "USM", "UPM", "UUM", "UTEM", "UMT", "UMS", "UIAM"];

type Admin = {
  id: string;
  auth_user_id: string;
  email: string;
  username: string | null;
  role: "super_admin" | "admin";
  ipt_scope: string | null;
  is_active: boolean;
  created_at: string;
};

export default function AdminManagementPage() {
  const [admins,setAdmins]=useState<Admin[]>([]);
  const [me,setMe]=useState<any>(null);
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [role,setRole]=useState<"admin"|"super_admin">("admin");
  const [iptScope,setIptScope]=useState("UIAM");
  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState<Admin|null>(null);
  const [editUsername,setEditUsername]=useState("");
  const [editEmail,setEditEmail]=useState("");
  const [editPassword,setEditPassword]=useState("");
  const [editRole,setEditRole]=useState<"admin"|"super_admin">("admin");
  const [editIptScope,setEditIptScope]=useState("UIAM");

  async function token(){
    const {data}=await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function load(){
    setLoading(true); setMsg("");
    const t=await token();
    if(!t){window.location.href="/admin";return;}
    const r=await fetch("/api/admin/users",{headers:{Authorization:`Bearer ${t}`}});
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Akses tidak dibenarkan.");setLoading(false);return;}
    setAdmins(d.admins||[]); setMe(d.me); setLoading(false);
  }

  useEffect(()=>{load()},[]);

  async function createAdmin(){
    const cleanEmail=email.trim().toLowerCase();
    if(!username.trim() || !cleanEmail || password.length<8) {
      setMsg("Masukkan nama pengguna, e-mel pentadbir dan kata laluan sekurang-kurangnya 8 aksara.");
      return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setMsg("Masukkan alamat e-mel pentadbir yang sah.");
      return;
    }
    setLoading(true); setMsg("");
    const t=await token();
    const r=await fetch("/api/admin/users",{
      method:"POST",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},
      body:JSON.stringify({
        username:username.trim().toLowerCase(),
        email:cleanEmail,
        password,
        role,
        ipt_scope: role==="admin" ? iptScope : null
      })
    });
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Gagal menambah pentadbir.");setLoading(false);return;}
    setUsername("");setEmail("");setPassword("");setRole("admin");setIptScope("UIAM");
    setMsg("Pentadbir baharu berjaya ditambah.");
    await load();
  }

  async function deleteAdmin(a: Admin){
    if(me?.role!=="super_admin") return;

    if(a.auth_user_id===me?.userId){
      setMsg("Anda tidak boleh membuang akaun Pentadbir Utama yang sedang digunakan.");
      return;
    }

    const label=a.username || a.email || "pentadbir ini";
    if(!confirm(`Anda pasti mahu membuang ${label}?\n\nAkaun pentadbir ini akan dipadam dan tindakan ini tidak boleh dibatalkan.`)) return;

    setLoading(true); setMsg("");
    const t=await token();

    try{
      const r=await fetch("/api/admin/users",{
        method:"DELETE",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},
        body:JSON.stringify({id:a.id})
      });
      const d=await r.json();
      if(!r.ok){
        setMsg(d.error||"Gagal membuang pentadbir.");
        setLoading(false);
        return;
      }
      setMsg(`Pentadbir ${label} berjaya dibuang.`);
      await load();
    }catch{
      setMsg("Tidak dapat membuang pentadbir.");
      setLoading(false);
    }
  }

  async function updateAdmin(id:string, patch:any){
    setLoading(true);setMsg("");
    const t=await token();
    const r=await fetch("/api/admin/users",{
      method:"PATCH",
      headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},
      body:JSON.stringify({id,...patch})
    });
    const d=await r.json();
    if(!r.ok){setMsg(d.error||"Gagal mengemas kini pentadbir.");setLoading(false);return;}
    setMsg("Pentadbir berjaya dikemas kini.");
    await load();
  }

  function openEditAdmin(a:Admin){
    setEditing(a);
    setEditUsername(a.username||"");
    setEditEmail(a.email||"");
    setEditPassword("");
    setEditRole(a.role);
    setEditIptScope(a.ipt_scope||"UIAM");
    setMsg("");
  }

  async function saveAdminDetails(){
    if(!editing)return;

    const cleanUsername=editUsername.trim().toLowerCase();
    const cleanEmail=editEmail.trim().toLowerCase();

    if(!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)){
      setMsg("Nama pengguna mesti 3–32 aksara dan hanya boleh mengandungi huruf kecil, nombor, titik, garis bawah atau tanda sempang.");
      return;
    }

    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)){
      setMsg("Masukkan alamat e-mel pentadbir yang sah.");
      return;
    }

    if(editPassword && editPassword.length<8){
      setMsg("Kata laluan baharu mesti sekurang-kurangnya 8 aksara.");
      return;
    }

    if(editRole==="admin" && !editIptScope){
      setMsg("Sila pilih IPT untuk Pentadbir IPT.");
      return;
    }

    await updateAdmin(editing.id,{
      username:cleanUsername,
      email:cleanEmail,
      password:editPassword||undefined,
      role:editRole,
      ipt_scope:editRole==="admin"?editIptScope:null
    });

    setEditing(null);
    setEditPassword("");
  }

  return <main className="admin-manage-shell">
    <div className="admin-manage-wrap">
      <div className="admin-manage-nav">
        <div>
          <span>UMNOSISWA MALAYSIA</span>
          <h1>Pengurusan Pentadbir</h1>
          <p>Tambah pentadbir, tetapkan peranan, skop IPT dan aktifkan atau nyahaktifkan akaun.</p>
        </div>
        <Link href="/admin">← Papan Pemuka</Link>
      </div>

      {msg && <div className="admin-manage-msg">{msg}</div>}

      {me?.role==="super_admin" && <section className="admin-create-box">
        <div>
          <span className="admin-manage-kicker">PENTADBIR UTAMA</span>
          <h2>Tambah Pentadbir Baharu</h2>
        </div>
        <div className="admin-create-grid">
          <input type="text" placeholder="Nama pengguna pentadbir" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username"/>
          <input type="email" placeholder="E-mel pentadbir" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/>
          <input type="password" placeholder="Kata laluan sementara" value={password} onChange={e=>setPassword(e.target.value)}/>
          <select value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="admin">Pentadbir IPT</option>
            <option value="super_admin">Pentadbir Utama</option>
          </select>
          {role==="admin" ? (
            <select value={iptScope} onChange={e=>setIptScope(e.target.value)}>
              {IPTS.map(ipt=><option key={ipt} value={ipt}>{ipt}</option>)}
            </select>
          ) : (
            <input value="Semua IPT" disabled aria-label="Skop Pentadbir Utama" />
          )}
          <button onClick={createAdmin} disabled={loading}>Tambah Pentadbir</button>
        </div>
      </section>}

      <section className="admin-list-box">
        <div className="admin-list-head">
          <div><span className="admin-manage-kicker">AKAUN PENTADBIR</span><h2>Senarai Pentadbir</h2></div>
          <strong>{admins.length} akaun</strong>
        </div>

        <div className="admin-manage-table-wrap">
          <table className="admin-manage-table">
            <thead><tr><th>Nama Pengguna</th><th>E-mel</th><th>Peranan</th><th>Skop IPT</th><th>Status</th><th>Dicipta</th><th>Tindakan</th></tr></thead>
            <tbody>
              {admins.map(a=><tr key={a.id}>
                <td><strong>{a.username || "—"}</strong>{a.auth_user_id===me?.userId&&<small> Akaun anda</small>}</td>
                <td>{a.email || "—"}</td>
                <td><span className={`admin-role-chip ${a.role}`}>{a.role==="super_admin"?"Pentadbir Utama":"Pentadbir IPT"}</span></td>
                <td>
                  {a.role==="super_admin" ? (
                    <strong>Semua IPT</strong>
                  ) : me?.role==="super_admin" ? (
                    <select
                      value={a.ipt_scope || ""}
                      disabled={a.auth_user_id===me.userId || loading}
                      onChange={e=>updateAdmin(a.id,{ipt_scope:e.target.value})}
                    >
                      <option value="" disabled>Pilih IPT</option>
                      {IPTS.map(ipt=><option key={ipt} value={ipt}>{ipt}</option>)}
                    </select>
                  ) : (
                    <strong>{a.ipt_scope || "Belum ditetapkan"}</strong>
                  )}
                </td>
                <td><span className={`admin-account-status ${a.is_active?"on":"off"}`}>{a.is_active?"Aktif":"Tidak Aktif"}</span></td>
                <td>{new Date(a.created_at).toLocaleDateString("ms-MY")}</td>
                <td>
                  {me?.role==="super_admin" ? <div className="admin-manage-actions">
                    <select value={a.role} disabled={a.auth_user_id===me.userId || loading}
                      onChange={e=>{
                        const nextRole=e.target.value as "admin"|"super_admin";
                        if(nextRole==="admin" && !a.ipt_scope){
                          setMsg("Untuk tukar Pentadbir Utama kepada Pentadbir IPT, tetapkan skop IPT melalui API atau cipta Pentadbir IPT baharu.");
                          return;
                        }
                        updateAdmin(a.id,{role:nextRole});
                      }}>
                      <option value="admin">Pentadbir</option>
                      <option value="super_admin">Pentadbir Utama</option>
                    </select>
                    <button
                      disabled={loading}
                      onClick={()=>openEditAdmin(a)}>
                      Edit
                    </button>
                    <button
                      disabled={a.auth_user_id===me.userId || loading}
                      onClick={()=>updateAdmin(a.id,{is_active:!a.is_active})}>
                      {a.is_active?"Nyahaktif":"Aktifkan"}
                    </button>
                    <button
                      disabled={a.auth_user_id===me.userId || loading}
                      onClick={()=>deleteAdmin(a)}
                      style={{
                        border:"1px solid #fecaca",
                        background:"#fff1f2",
                        color:"#b91c1c",
                        fontWeight:700
                      }}>
                      Buang
                    </button>
                  </div> : "—"}
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    {editing && (
      <div
        style={{
          position:"fixed",inset:0,background:"rgba(3,12,28,.62)",
          display:"flex",alignItems:"center",justifyContent:"center",
          padding:20,zIndex:9999
        }}
        onMouseDown={()=>setEditing(null)}
      >
        <div
          style={{
            width:"min(620px,100%)",background:"#fff",borderRadius:18,
            padding:24,boxShadow:"0 24px 80px rgba(0,0,0,.28)"
          }}
          onMouseDown={e=>e.stopPropagation()}
        >
          <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",marginBottom:18}}>
            <div>
              <span className="admin-manage-kicker">SUNTING PENTADBIR</span>
              <h2 style={{margin:"6px 0 0"}}>{editing.username || editing.email}</h2>
            </div>
            <button onClick={()=>setEditing(null)} style={{fontSize:20}}>×</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:14}}>
            <label style={{display:"grid",gap:6}}>
              Nama Pengguna
              <input value={editUsername} onChange={e=>setEditUsername(e.target.value)} />
            </label>

            <label style={{display:"grid",gap:6}}>
              E-mel Pentadbir
              <input type="email" value={editEmail} onChange={e=>setEditEmail(e.target.value)} />
            </label>

            <label style={{display:"grid",gap:6}}>
              Kata Laluan Baharu
              <input
                type="password"
                value={editPassword}
                onChange={e=>setEditPassword(e.target.value)}
                placeholder="Kosongkan jika tidak mahu tukar"
              />
            </label>

            <label style={{display:"grid",gap:6}}>
              Peranan
              <select value={editRole} onChange={e=>setEditRole(e.target.value as "admin"|"super_admin")}>
                <option value="admin">Pentadbir IPT</option>
                <option value="super_admin">Pentadbir Utama</option>
              </select>
            </label>

            <label style={{display:"grid",gap:6,gridColumn:"1 / -1"}}>
              Skop IPT
              {editRole==="admin" ? (
                <select value={editIptScope} onChange={e=>setEditIptScope(e.target.value)}>
                  {IPTS.map(ipt=><option key={ipt} value={ipt}>{ipt}</option>)}
                </select>
              ) : (
                <input value="Semua IPT" disabled />
              )}
            </label>
          </div>

          <p style={{fontSize:12,opacity:.68,lineHeight:1.6,margin:"16px 0"}}>
            Kosongkan ruangan kata laluan jika anda tidak mahu menukarnya.
          </p>

          <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
            <button onClick={()=>setEditing(null)} disabled={loading}>Batal</button>
            <button onClick={saveAdminDetails} disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    )}
  </main>
}
